// src/controllers/menuController.ts
import { Request, Response } from "express";
import MenuItem from "@models/MenuItem";

/**
 * GET /v1/menu
 * Public — list all menu items, optionally filtered by category or availability
 */
export const listMenuItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category, isAvailable } = req.query;

    const filter: Record<string, unknown> = {};

    if (category) {
      filter.category = category;
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable;
    }

    const items = await MenuItem.find(filter).sort({
      category: 1,
      sortOrder: 1,
      createdAt: 1
    });

    res.json({ items });
  } catch (error) {
    console.error("listMenuItems error:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
};

/**
 * GET /v1/menu/:id
 * Public — get a single menu item
 */
export const getMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error("getMenuItem error:", error);
    res.status(500).json({ error: "Failed to fetch menu item" });
  }
};

/**
 * POST /v1/menu
 * Protected — admin or staff only
 */
export const createMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      description,
      longDescription,
      category,
      variants,
      price,
      isAvailable,
      images,
      sortOrder
    } = req.body;

    const item = new MenuItem({
      name,
      description,
      longDescription,
      category,
      variants,
      price,
      isAvailable: isAvailable ?? true,
      images,
      sortOrder: sortOrder ?? 0
    });

    await item.save();

    res.status(201).json(item);
  } catch (error) {
    console.error("createMenuItem error:", error);
    res.status(500).json({ error: "Failed to create menu item" });
  }
};

/**
 * PUT /v1/menu/:id
 * Protected — admin or staff only
 */
export const updateMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }

    const allowedFields = [
      "name",
      "description",
      "longDescription",
      "category",
      "variants",
      "price",
      "isAvailable",
      "images",
      "sortOrder"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item.set(field, req.body[field]);
      }
    });

    // Clean up stale pricing fields if category changed
    if (req.body.category) {
      const variantCategories = ["pizza", "add_on"];
      const isVariantCategory = variantCategories.includes(req.body.category);

      if (isVariantCategory) {
        // Switching to variant category: only clear flat price if new variants are provided
        if (req.body.variants !== undefined) {
          item.price = undefined;
        }
      } else {
        // Switching to non-variant category: only clear variants if new price is provided
        if (req.body.price !== undefined) {
          item.variants = [];
        }
      }
    }

    await item.save();

    res.json(item);
  } catch (error) {
    console.error("updateMenuItem error:", error);
    res.status(500).json({ error: "Failed to update menu item" });
  }
};

/**
 * DELETE /v1/menu/:id
 * Protected — admin only
 */
export const deleteMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);

    if (!item) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("deleteMenuItem error:", error);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
};
