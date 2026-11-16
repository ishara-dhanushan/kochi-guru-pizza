// src/app/menu/[id]/components/ItemImage.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MenuCategory } from "@typings/menu";

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

interface ItemImageProps {
  images: string[];
  alt: string;
  category: MenuCategory;
}

export default function ItemImage({ images, alt, category }: ItemImageProps) {
  const hasMultipleImages = images.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: hasMultipleImages
    },
    hasMultipleImages
      ? [
          Autoplay({
            delay: 5000,
            stopOnInteraction: false
          })
        ]
      : []
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
    }
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) {
        emblaApi.scrollTo(index);
      }
    },
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (images.length === 0) {
    return (
      <div className="flex h-85 w-full flex-col items-center justify-center gap-3 sm:h-100 lg:h-115">
        <span className="text-8xl opacity-20">{CATEGORY_ICONS[category]}</span>

        <span className="text-xs font-medium tracking-widest text-content-muted uppercase">
          No image available
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Fixed height carousel to contain portrait images */}
      <div className="relative h-85 w-full sm:h-100 lg:h-115">
        {/* Embla carousel viewport */}
        <div ref={emblaRef} className="h-full w-full overflow-hidden">
          <div className="flex h-full">
            {images.map((src, index) => (
              <div
                key={src}
                className="flex h-full min-w-0 flex-[0_0_100%] items-center justify-center"
              >
                {/* Natural aspect ratio without `fill`, respecting max dimensions and rounded corners */}
                <Image
                  src={src}
                  alt={`${alt} - image ${index + 1}`}
                  width={0}
                  height={0}
                  sizes="(max-width: 767px) 100vw, 50vw"
                  className="h-auto max-h-full w-auto max-w-full rounded-xl object-contain"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>

        {hasMultipleImages && (
          <>
            {/* Previous image button */}
            <button
              type="button"
              onClick={scrollPrev}
              className="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full! bg-black/35 p-2.5 backdrop-blur-sm transition-smooth hover:bg-black/55"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-content-on-dark" />
            </button>

            {/* Next image button */}
            <button
              type="button"
              onClick={scrollNext}
              className="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full! bg-black/35 p-2.5 backdrop-blur-sm transition-smooth hover:bg-black/55"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-content-on-dark" />
            </button>
          </>
        )}
      </div>

      {hasMultipleImages && (
        /* Fixed-height navigation area for consistent dot positioning */
        <div className="flex h-10 items-center justify-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? "w-8 bg-brand"
                  : "w-2 bg-indicator-inactive hover:bg-brand-subtle"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
