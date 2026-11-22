// src/controllers/authController.ts
import { Request, Response } from "express";
import User, { IUser } from "@models/User";
import { hashPassword, comparePassword } from "@utils/passwordUtils";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import config from "@config/index";

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId: string): string => {
  if (!config.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  const options: SignOptions = {
    // @ts-expect-error - jsonwebtoken type definitions are incorrect for string expiresIn
    expiresIn: config.JWT_EXPIRES_IN
  };
  return jwt.sign({ id: userId }, config.JWT_SECRET as Secret, options);
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId: string): string => {
  if (!config.REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET is not defined");
  }
  const options: SignOptions = {
    // @ts-expect-error - jsonwebtoken type definitions are incorrect for string expiresIn
    expiresIn: config.REFRESH_TOKEN_EXPIRES_IN
  };
  return jwt.sign(
    { id: userId },
    config.REFRESH_TOKEN_SECRET as Secret,
    options
  );
};

/**
 * Atomically store or rotate a refresh token while enforcing
 * the maximum active sessions limit.
 */
const storeRefreshToken = async (
  userId: string,
  newRefreshToken: string,
  oldRefreshToken?: string
): Promise<boolean> => {
  // Remove the old token during rotation and avoid duplicate tokens.
  const tokensToRemove = oldRefreshToken
    ? [oldRefreshToken, newRefreshToken]
    : [newRefreshToken];

  const result = await User.updateOne(
    {
      _id: userId,
      ...(oldRefreshToken ? { refreshTokens: oldRefreshToken } : {})
    },
    [
      {
        $set: {
          refreshTokens: {
            $slice: [
              {
                $concatArrays: [
                  {
                    $filter: {
                      input: { $ifNull: ["$refreshTokens", []] },
                      as: "token",
                      cond: {
                        $not: [
                          {
                            $in: ["$$token", tokensToRemove]
                          }
                        ]
                      }
                    }
                  },
                  [newRefreshToken]
                ]
              },
              -config.MAX_ACTIVE_SESSIONS
            ]
          }
        }
      }
    ],
    { updatePipeline: true }
  );

  return result.matchedCount > 0;
};

/**
 * Register a new user with email and password
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "local",
      emailVerified: false
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Store refresh token in database and enforce max sessions limit.
    const tokenStored = await storeRefreshToken(
      user._id.toString(),
      refreshToken
    );

    if (!tokenStored) {
      throw new Error("User not found while storing refresh token");
    }

    // Return user without password
    const userResponse: Partial<IUser> = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.status(201).json({
      user: userResponse,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
};

/**
 * Login user with email and password
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user is OAuth-only
    if (user.password === "OAuth") {
      return res.status(400).json({
        error: "This account uses Google Sign-In. Please continue with Google."
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Store refresh token in database and enforce max sessions limit.
    const tokenStored = await storeRefreshToken(
      user._id.toString(),
      refreshToken
    );

    if (!tokenStored) {
      throw new Error("User not found while storing refresh token");
    }

    // Return user without password
    const userResponse: Partial<IUser> = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.status(200).json({
      user: userResponse,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!config.REFRESH_TOKEN_SECRET) {
      throw new Error("REFRESH_TOKEN_SECRET is not defined");
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      config.REFRESH_TOKEN_SECRET as string
    ) as { id: string };

    // Generate new tokens
    const newAccessToken = generateAccessToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);

    // Rotate the refresh token atomically
    const tokenRotated = await storeRefreshToken(
      decoded.id,
      newRefreshToken,
      refreshToken
    );

    // Reject invalid or revoked refresh tokens
    if (!tokenRotated) {
      return res.status(401).json({
        error: "Invalid refresh token"
      });
    }

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    // Handle JWT verification errors
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: "Invalid or expired refresh token"
      });
    }

    // Handle unexpected server errors
    console.error("Refresh token error:", error);

    res.status(500).json({
      error: "Server error during token refresh"
    });
  }
};

/**
 * Logout user (invalidate refresh token)
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { refreshToken } = req.body;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (refreshToken) {
      // Remove specific refresh token
      await User.findByIdAndUpdate(user._id, {
        $pull: { refreshTokens: refreshToken }
      });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if error, we want the client to clear local tokens
    res.status(200).json({ message: "Logged out" });
  }
};

/**
 * Handle Google OAuth callback
 */
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;

    if (!user) {
      return res.redirect(
        `${config.FRONTEND_URL}/auth/callback?error=auth_failed`
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Store refresh token in database and enforce max sessions limit.
    const tokenStored = await storeRefreshToken(
      user._id.toString(),
      refreshToken
    );

    if (!tokenStored) {
      throw new Error("User not found while storing refresh token");
    }

    // Redirect to frontend with tokens
    res.redirect(
      `${config.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${config.FRONTEND_URL}/auth/callback?error=auth_failed`);
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Return user without password
    const userResponse: Partial<IUser> = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.status(200).json(userResponse);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
