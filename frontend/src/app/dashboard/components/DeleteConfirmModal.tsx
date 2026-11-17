// src/app/dashboard/components/DeleteConfirmModal.tsx
"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { MenuItem } from "@typings/menu";
import { useState, useEffect } from "react";

interface DeleteConfirmModalProps {
  item: MenuItem;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function DeleteConfirmModal({
  item,
  onConfirm,
  onClose
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, deleting]);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !deleting && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        aria-busy={deleting}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-danger-wash dark:bg-danger-wash/25 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} className="text-danger" />
          </div>
          <div>
            <h2
              id="delete-confirm-title"
              className="text-base font-bold text-content-main"
            >
              Delete Menu Item
            </h2>
            <p className="text-sm text-content-muted mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>
        <p className="text-sm text-content-subtle mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-content-main">{item.name}</span>?
          It will be permanently removed from the menu.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 text-content-subtle rounded-xl font-semibold text-sm enabled:hover:bg-surface-card-hover transition-all disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 bg-danger-action enabled:hover:bg-danger-action-hover text-feedback-on rounded-xl font-semibold text-sm shadow-lg shadow-danger-action/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            {deleting ? "Deleting" : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
