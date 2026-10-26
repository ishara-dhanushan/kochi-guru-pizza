// src/models/MenuItem.ts
import mongoose, { Schema, Document } from "mongoose";

export type MenuCategory =
  | "pizza"
  | "pasta"
  | "bun"
  | "sandwich"
  | "snack"
  | "fresh_juice"
  | "milkshake"
  | "mojito"
  | "soft_drinks"
  | "add_on";

export type PizzaSize = "small" | "medium" | "large";

export interface IPriceVariant {
  size: PizzaSize;
  price: number;
}

export interface IMenuItem extends Document {
  name: string;
  description?: string;
  longDescription?: string;
  category: MenuCategory;
  // For items with size variants (e.g. pizza, pizza add-ons)
  variants?: IPriceVariant[];
  // For flat-priced items
  price?: number;
  isAvailable: boolean;
  images: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PriceVariantSchema = new Schema<IPriceVariant>(
  {
    size: {
      type: String,
      enum: ["small", "medium", "large"],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    longDescription: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: [
        "pizza",
        "pasta",
        "bun",
        "sandwich",
        "snack",
        "fresh_juice",
        "milkshake",
        "mojito",
        "soft_drinks",
        "add_on"
      ],
      required: true
    },
    variants: {
      type: [PriceVariantSchema],
      default: undefined
    },
    price: {
      type: Number,
      min: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    images: {
      type: [String],
      default: [],
      required: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

MenuItemSchema.index({ category: 1, sortOrder: 1, createdAt: 1 });
MenuItemSchema.index({
  isAvailable: 1,
  category: 1,
  sortOrder: 1,
  createdAt: 1
});
MenuItemSchema.index({ images: 1 });

const MenuItem = mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);

export default MenuItem;
