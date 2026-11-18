// src/components/QuantityControl.tsx
"use client";

import { Minus, Plus } from "lucide-react";

interface QuantityControlProps {
  quantity: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  label?: string;
}

export default function QuantityControl({
  quantity,
  onChange,
  disabled = false,
  label = "item"
}: QuantityControlProps) {
  return (
    <div className="inline-flex items-center rounded-xl border border-divider-control bg-surface-inset overflow-hidden">
      <button
        type="button"
        aria-label={`Decrease ${label} quantity`}
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className="flex items-center justify-center w-10 h-10 text-content-main hover:bg-surface-control-hover hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-content-main"
      >
        <Minus size={16} />
      </button>

      <span
        aria-live="polite"
        className="min-w-10 px-2 text-center text-sm font-semibold text-content-main tabular-nums"
      >
        {quantity}
      </span>

      <button
        type="button"
        aria-label={`Increase ${label} quantity`}
        disabled={disabled || !Number.isSafeInteger(quantity + 1)}
        onClick={() => onChange(quantity + 1)}
        className="flex items-center justify-center w-10 h-10 text-content-main hover:bg-surface-control-hover hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-content-main"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
