import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import MenuItem, { IMenuItem } from "@models/MenuItem";
import config from "@config/index";
import dotenv from "dotenv";

dotenv.config();

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${config.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.R2_ACCESS_KEY_ID,
    secretAccessKey: config.R2_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = config.R2_BUCKET_NAME;
const PUBLIC_DOMAIN = config.R2_PUBLIC_DOMAIN;

export const uploadToR2 = async (file: Express.Multer.File) => {
  const now = new Date();
  const slTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const timestamp = slTime
    .toISOString()
    .replace(/T/, "_")
    .replace(/\..+/, "")
    .replace(/[-:]/g, "");

  const MIME_MAP: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };
  const extension = MIME_MAP[file.mimetype] || "jpg";
  const fileName = `uploads/menu_image_${timestamp}.${extension}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );

  return `${PUBLIC_DOMAIN}/${fileName}`;
};

export const deleteFromR2 = async (url: string) => {
  if (!url.startsWith(PUBLIC_DOMAIN)) {
    throw new Error("Invalid image URL: Domain mismatch");
  }

  const key = url.replace(`${PUBLIC_DOMAIN}/`, "");

  if (!key.startsWith("uploads/")) {
    throw new Error("Invalid image path: Access denied to this directory");
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    })
  );

  return { success: true };
};

export const reconcileStorage = async (dryRun: boolean = false) => {
  const bucketKeys: string[] = [];
  let continuationToken: string | undefined;
  let listedObjects;

  do {
    listedObjects = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken
      })
    );

    const keys = listedObjects.Contents?.map((obj) => obj.Key) || [];
    bucketKeys.push(...keys.filter((key): key is string => !!key));
    continuationToken = listedObjects.NextContinuationToken;
  } while (listedObjects.IsTruncated);
  const menuItems = (await MenuItem.find()) as IMenuItem[];

  const activeImages = new Set<string>();
  menuItems.forEach((item: IMenuItem) => {
    if (item.images && Array.isArray(item.images)) {
      item.images.forEach((imgUrl) => {
        const key = imgUrl.replace(`${PUBLIC_DOMAIN}/`, "");
        activeImages.add(key);
      });
    }
  });

  const orphanedKeys = bucketKeys.filter((key) => !activeImages.has(key));
  const deletedCount: string[] = [];

  if (!dryRun) {
    for (const key of orphanedKeys) {
      if (!key) continue;
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key
        })
      );
      deletedCount.push(key);
    }
  }

  return {
    orphanedCount: orphanedKeys.length,
    deletedCount: deletedCount.length,
    orphanedFiles: dryRun ? orphanedKeys : deletedCount,
    dryRun
  };
};
