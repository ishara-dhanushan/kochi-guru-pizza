// src/models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  authProvider: "local" | "google" | "both";
  googleId?: string;
  role: "admin" | "staff" | "customer";
  phone?: string;
  profilePicture?: string;
  emailVerified: boolean;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "both"],
      default: "local"
    },
    googleId: {
      type: String
    },
    role: {
      type: String,
      enum: ["admin", "staff", "customer"],
      default: "customer"
    },
    phone: {
      type: String,
      default: null
    },
    profilePicture: {
      type: String,
      default: null
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    refreshTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Indexes
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
