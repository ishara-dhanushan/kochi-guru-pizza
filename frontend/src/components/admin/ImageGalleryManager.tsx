"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { X, Upload, ArrowUpCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { httpClient } from "@/lib/httpClient";

interface ImageGalleryManagerProps {
  initialImages: string[];
  onChange: (images: string[]) => void;
}

export default function ImageGalleryManager({
  initialImages,
  onChange
}: ImageGalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [imageToDelete, setImageToDelete] = useState<{
    url: string;
    index: number;
  } | null>(null);

  // Prevent duplicate deletion requests and dismissal during deletion.
  const deletingRef = useRef(false);
  const deleteDialogOpenRef = useRef(false);

  // Close the image deletion confirmation modal.
  const closeDeleteDialog = useCallback(() => {
    // Do not allow dismissal while the deletion request is in progress.
    if (deletingRef.current) return;
    deleteDialogOpenRef.current = false;

    setIsDeleteDialogOpen(false);
    setImageToDelete(null);
  }, []);

  // Close the modal when the Escape key is pressed.
  useEffect(() => {
    if (!isDeleteDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDeleteDialog();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDeleteDialogOpen, closeDeleteDialog]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      try {
        const uploadedUrls: string[] = [];

        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const response = await httpClient<{ url: string }>("/images", {
            method: "POST",
            body: formData
          });

          if (response && response.url) {
            uploadedUrls.push(response.url);
          }
        }

        onChange([...initialImages, ...uploadedUrls]);
        toast.success(`Uploaded ${uploadedUrls.length} image(s)`);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to upload images";
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [initialImages, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": ["image/jpeg", "image/png", "image/webp"] },
    disabled: uploading
  });

  const confirmDelete = async () => {
    if (!imageToDelete || deletingRef.current || !deleteDialogOpenRef.current) {
      return;
    }

    // Lock the deletion operation and display the loading state.
    deletingRef.current = true;
    setDeleting(true);

    try {
      await httpClient<{ message: string }>("/images", {
        method: "DELETE",
        body: JSON.stringify({ url: imageToDelete.url })
      });

      const newImages = [...initialImages];
      newImages.splice(imageToDelete.index, 1);

      onChange(newImages);
      toast.success("Image removed");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to remove image";

      toast.error(message);
    } finally {
      // Release the deletion lock before closing the modal.
      deletingRef.current = false;
      setDeleting(false);
      closeDeleteDialog();
    }
  };

  const setPrimary = (index: number) => {
    if (index === 0) return;
    const newImages = [...initialImages];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    onChange(newImages);
  };

  return (
    <>
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`group border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-brand bg-brand-wash dark:bg-brand-wash/20"
              : "border-divider-standard hover:border-brand-muted"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload
              className="text-content-faint group-hover:text-brand transition-colors"
              size={32}
            />
            <p className="text-sm text-content-muted">
              {uploading
                ? "Uploading..."
                : "Drag & drop images here, or click to select"}
            </p>
            <p className="text-xs text-content-muted">
              JPEG, PNG, WebP (Max 5MB)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {initialImages.map((url, index) => (
            <div
              key={url}
              className="relative group aspect-square rounded-xl overflow-hidden border border-divider-standard bg-surface-inset"
            >
              <Image
                src={url}
                alt="Upload preview"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                className="object-cover"
              />

              {index === 0 && (
                <div className="absolute top-2 left-2 bg-brand text-brand-on text-[10px] font-bold px-2 py-0.5 rounded-full">
                  PRIMARY
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-all"
                    title="Set as primary"
                  >
                    <ArrowUpCircle size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (deletingRef.current) return;

                    deleteDialogOpenRef.current = true;
                    setImageToDelete({ url, index });
                    setIsDeleteDialogOpen(true);
                  }}
                  className="p-2 bg-danger-action/80 hover:bg-danger-action-hover text-feedback-on rounded-lg backdrop-blur-sm transition-all"
                  title="Remove image"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}

          {initialImages.length === 0 && !uploading && (
            <div className="col-span-full py-12 text-center text-content-muted text-sm italic">
              No images uploaded yet
            </div>
          )}
        </div>
      </div>

      {/* Delete Image Confirmation Modal */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: "none" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeDeleteDialog();
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-image-title"
              aria-busy={deleting}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-surface-card rounded-2xl p-6 max-w-sm w-full shadow-xl border border-divider-standard"
            >
              <h3
                id="delete-image-title"
                className="text-lg font-bold text-content-main mb-2"
              >
                Delete Image?
              </h3>

              <p className="text-sm text-content-muted mb-6">
                Are you sure you want to remove this image? This action is
                permanent and cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-content-subtle enabled:hover:bg-surface-card-hover rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-danger-action enabled:hover:bg-danger-action-hover text-feedback-on rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  <span>{deleting ? "Deleting..." : "Delete Permanently"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
