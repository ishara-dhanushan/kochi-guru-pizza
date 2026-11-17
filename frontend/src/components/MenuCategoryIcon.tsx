// src/components/MenuCategoryIcon.tsx
import type { ComponentType } from "react";
import {
  Pizza,
  Sandwich,
  Popcorn,
  Citrus,
  Milk,
  GlassWater,
  CupSoda,
  CirclePlus,
  type LucideProps
} from "lucide-react";
import type { MenuCategory } from "@typings/menu";
import PastaIcon from "@components/icons/PastaIcon";
import BurgerIcon from "@components/icons/BurgerIcon";

// Common properties accepted by Lucide and custom icons.
type IconProps = Pick<LucideProps, "size" | "className" | "aria-hidden">;

// Shared mapping of Lucide and custom SVG icons.
const CATEGORY_ICONS: Record<MenuCategory, ComponentType<IconProps>> = {
  pizza: Pizza,
  pasta: PastaIcon,
  bun: BurgerIcon,
  sandwich: Sandwich,
  snack: Popcorn,
  fresh_juice: Citrus,
  milkshake: Milk,
  mojito: GlassWater,
  soft_drinks: CupSoda,
  add_on: CirclePlus
};

interface MenuCategoryIconProps extends Pick<
  LucideProps,
  "size" | "className"
> {
  category: MenuCategory;
}

export default function MenuCategoryIcon({
  category,
  size = 24,
  className
}: MenuCategoryIconProps) {
  // Select the icon associated with the menu category.
  const Icon = CATEGORY_ICONS[category];

  return <Icon size={size} className={className} aria-hidden="true" />;
}
