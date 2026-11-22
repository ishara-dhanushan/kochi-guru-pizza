// src/config/passport.ts
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "@models/User";
import config from "@config/index";

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.JWT_SECRET as string
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.id).select("-password");
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL as string
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value || "";
          const name = profile.displayName;
          const picture = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email provided by Google"), false);
          }

          // Check if user exists by email
          let user = await User.findOne({ email });

          if (user) {
            // User exists - merge accounts if needed
            if (user.authProvider === "local") {
              user.googleId = googleId;
              user.authProvider = "both";
              user.emailVerified = true;
              if (!user.profilePicture && picture) {
                user.profilePicture = picture;
              }
              await user.save();
            } else {
              // Update profile picture if changed
              if (picture && user.profilePicture !== picture) {
                user.profilePicture = picture;
                await user.save();
              }
            }
          } else {
            // New user
            user = await User.create({
              name,
              email,
              password: "OAuth",
              authProvider: "google",
              googleId,
              emailVerified: true,
              profilePicture: picture
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, false);
        }
      }
    )
  );
}

export default passport;
