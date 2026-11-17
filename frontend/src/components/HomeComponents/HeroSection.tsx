// src/components/HomeComponents/HeroSection.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type HeroSlide = {
  imageUrl: string;
  heading: string;
  subtitle: string;
};

const heroSlides: HeroSlide[] = [
  {
    imageUrl: "/assets/images/hero-section/IMG-20251206-WA0006.jpg",
    heading: "Authentic Italian Wood-Fired Pizza",
    subtitle: "Crafted with passion in the heart of Walasmulla"
  },
  {
    imageUrl: "/assets/images/hero-section/IMG-20251206-WA0011.jpg",
    heading: "Fresh Ingredients, Bold Flavors",
    subtitle: "Experience the taste of tradition"
  },
  {
    imageUrl: "/assets/images/hero-section/IMG_7055.jpg",
    heading: "Your Neighborhood Pizza Destination",
    subtitle: "Where every slice tells a story"
  },
  {
    imageUrl: "/assets/images/hero-section/IMG_7306.jpg",
    heading: "Deliciousness Delivered Daily",
    subtitle: "Hot from our oven to your table"
  }
];

export default function HeroSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
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

  return (
    <section className="relative w-full h-[90vh] overflow-hidden">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className="embla__slide relative flex-[0_0_100%] min-w-0 embla-performance"
            >
              {/* Image */}
              <div className="relative w-full h-[90vh]">
                <Image
                  src={slide.imageUrl}
                  alt={slide.heading}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
              </div>

              {/* Text overlay */}
              <AnimatePresence mode="wait">
                {selectedIndex === index && (
                  <motion.div
                    key={`overlay-${index}`}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 md:px-8"
                  >
                    <div className="overflow-hidden">
                      <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.8,
                          ease: [0.16, 1, 0.3, 1],
                          delay: 0.2
                        }}
                        className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg gpu-fix"
                      >
                        {slide.heading}
                      </motion.h1>
                    </div>

                    <motion.p
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        duration: 0.8,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.4
                      }}
                      className="text-lg md:text-2xl text-white/90 max-w-2xl drop-shadow-md gpu-fix"
                    >
                      {slide.subtitle}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full! bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-smooth hidden lg:block"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full! bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-smooth hidden lg:block"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex
                ? "bg-white w-8"
                : "bg-white/50 w-2 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
