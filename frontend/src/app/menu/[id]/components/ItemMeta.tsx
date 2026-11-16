// src/app/menu/[id]/components/ItemMeta.tsx
import { MenuItem, CATEGORY_LABELS } from "@typings/menu";

const CATEGORY_ICONS: Record<string, string> = {
  pizza: "🍕",
  pasta: "🍝",
  bun: "🍔",
  sandwich: "🥪",
  snack: "🍟",
  fresh_juice: "🥤",
  milkshake: "🥛",
  mojito: "🍹",
  soft_drinks: "🧃",
  add_on: "✨"
};

interface ItemMetaProps {
  item: MenuItem;
}

export default function ItemMeta({ item }: ItemMetaProps) {
  return (
    <div className="space-y-5">
      {/* Category + availability row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-brand/10 text-brand">
          <span>{CATEGORY_ICONS[item.category]}</span>
          {CATEGORY_LABELS[item.category]}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            item.isAvailable
              ? "bg-success-wash dark:bg-success-wash/20 text-success"
              : "bg-danger-wash dark:bg-danger-wash/20 text-danger"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.isAvailable ? "bg-success" : "bg-danger"
            }`}
          />
          {item.isAvailable ? "Available" : "Unavailable"}
        </span>
      </div>

      {/* Name */}
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-content-main leading-tight">
        {item.name}
      </h1>

      {/* Short description */}
      {item.description && (
        <p className="text-base text-content-muted leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Long description — shown immediately after short description */}
      {item.longDescription && (
        <div className="pt-1 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
            About this item
          </p>
          <p className="text-sm text-content-subtle leading-loose whitespace-pre-line">
            {item.longDescription}
          </p>
        </div>
      )}
    </div>
  );
}
