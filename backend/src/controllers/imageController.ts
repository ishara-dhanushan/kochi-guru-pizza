import { Request, Response } from "express";
import {
  uploadToR2,
  deleteFromR2,
  reconcileStorage
} from "@services/r2Service";
import MenuItem from "@models/MenuItem";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const url = await uploadToR2(req.file);
    res.status(200).json({ url });
  } catch (error: unknown) {
    console.error("Upload failed:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res
        .status(400)
        .json({ message: "A valid URL string is required" });
    }

    // Remove from R2 storage
    await deleteFromR2(url);

    // Sync with MongoDB: Remove URL from all menu items
    await MenuItem.updateMany({ images: url }, { $pull: { images: url } });

    res.status(200).json({
      message: "File deleted successfully and synchronized with database"
    });
  } catch (error: unknown) {
    console.error("Failed to delete image:", error);
    res.status(500).json({ message: "Deletion failed" });
  }
};

export const reconcileImages = async (req: Request, res: Response) => {
  try {
    const dryRun = req.body?.dryRun ?? true;
    const result = await reconcileStorage(Boolean(dryRun));
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error("Reconciliation failed:", error);
    res.status(500).json({ message: "Reconciliation failed" });
  }
};
