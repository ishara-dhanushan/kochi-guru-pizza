// src/components/HomeComponents/PromotionsSection.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

type PromotionSlide = {
  imageUrl: string;
  tag: string;
  title: string;
  subtitle: string;
  discount: string;
  expires: string;
  badge: string;
};

const promotionSlides: PromotionSlide[] = [
  {
    imageUrl: "/assets/images/offers/independence-day-offer.jpg",
    tag: "Independence Day",
    title: "Celebrate Big",
    subtitle:
      "2 Large Pizzas + 2 Drinks — one unbeatable price for the nation's big day!",
    discount: "40% OFF",
    expires: "Today Only",
    badge: "LIMITED"
  },
  {
    imageUrl: "/assets/images/offers/offer-1.jpg",
    tag: "Tonight Only",
    title: "Late Night Feast",
    subtitle:
      "Free cheese roll with any large pizza ordered after 9PM. Hot & tasty, quick delivery!",
    discount: "FREE SIDES",
    expires: "11:59 PM",
    badge: "HOT"
  },
  {
    imageUrl: "/assets/images/offers/offer-2.jpg",
    tag: "Exclusive Deal",
    title: "Members Special",
    subtitle:
      "Only available at Kochi Guru Pizza. Flash savings on your favourite combos.",
    discount: "SAVE BIG",
    expires: "This Week",
    badge: "EXCLUSIVE"
  }
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <span className="text-5xl">🍕</span>
      <p className="font-heading text-content-subtle text-base text-center">
        No active offers right now
      </p>
      <p className="font-mono text-content-faint text-xs text-center tracking-wider">
        Check back soon — deals drop every week
      </p>
    </div>
  );
}

function OfferCard({ slide }: { slide: PromotionSlide }) {
  return (
    <div className="relative w-full h-full">
      <div className="pointer-events-none absolute inset-0">
        {/* Light */}
        <div
          className="absolute inset-0 opacity-100 dark:opacity-0"
          style={{
            background:
              "radial-gradient(900px 420px at 20% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.00) 60%)"
          }}
        />
        {/* Dark */}
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100"
          style={{
            background:
              "radial-gradient(900px 420px at 20% 50%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.00) 62%)"
          }}
        />
      </div>
      <div className="relative grid grid-cols-12 h-full">
        {/* LEFT CONTENT */}
        <div className="col-span-12 md:col-span-5 flex items-center order-2 md:order-1">
          <div className="w-full px-6 sm:px-10 md:px-14 lg:px-20 py-6 md:py-10">
            {/* Top chips row */}
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <span className="font-mono text-[0.6rem] font-black tracking-[0.18em] px-3 py-1 rounded bg-brand text-brand-on">
                {slide.badge}
              </span>
              <span className="font-mono text-[0.65rem] font-semibold tracking-wider uppercase text-brand">
                {slide.tag}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-heading text-content-main text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3">
              {slide.title}
            </h3>

            {/* Subtitle */}
            <p className="text-content-muted text-sm md:text-[0.95rem] leading-relaxed mb-4 md:mb-7 max-w-120">
              {slide.subtitle}
            </p>

            {/* Discount */}
            <div className="font-heading text-4xl md:text-5xl font-extrabold leading-none text-brand mb-3 md:mb-4">
              {slide.discount}
            </div>

            {/* Expiry */}
            <div className="flex items-center gap-2 mb-5 md:mb-8">
              <span className="inline-block w-2 h-2 rounded-full bg-success shadow-[0_0_6px_var(--success)] shadow-success/90" />
              <span className="font-mono text-[0.75rem] text-content-muted tracking-wider">
                Expires: {slide.expires}
              </span>
            </div>

            {/* Button */}
            <a
              href="tel:0770776848"
              className="inline-flex items-center gap-2 w-fit px-6 md:px-7 py-2.5 md:py-3 rounded-lg font-bold text-[0.9rem] tracking-wider transition-colors bg-brand hover:bg-brand-hover text-brand-on"
            >
              ORDER NOW →
            </a>
          </div>
        </div>

        {/* RIGHT FLYER */}
        <div className="col-span-12 md:col-span-7 flex items-center justify-center md:justify-end p-4 md:p-6 order-1 md:order-2">
          {promotionSlides.map((s, index) => (
            <Image
              key={s.imageUrl}
              src={s.imageUrl}
              alt={s.title}
              width={1200}
              height={800}
              draggable={false}
              className={`w-full h-auto object-contain md:object-center select-none rounded-lg max-h-64 sm:max-h-80 md:max-h-120 ${
                s.imageUrl === slide.imageUrl ? "block" : "hidden"
              }`}
              priority={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PromotionsSection() {
  const slides = promotionSlides;
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(0);
  const isFadingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);

  // ResizeObserver — tracks the inner content height and updates the outer container
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCardHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback((next: number) => {
    if (isFadingRef.current) return;

    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    activeRef.current = next;
    setActive(next);
    setFading(true);
    isFadingRef.current = true;

    fadeTimerRef.current = setTimeout(() => {
      setVisible(next);
      setFading(false);
      isFadingRef.current = false;
      fadeTimerRef.current = null;
    }, 300);
  }, []);

  const startAuto = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length === 0) return;
    timerRef.current = setInterval(() => {
      const next = (activeRef.current + 1) % slides.length;
      goTo(next);
    }, 4500);
  }, [slides.length, goTo]);

  useEffect(() => {
    startAuto();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [startAuto]);

  const handleClick = (i: number) => {
    goTo(i);
    startAuto();
  };

  const activeSlide = slides[visible];

  return (
    <section className="py-20 md:py-24 bg-surface transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 gpu-fix"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-4">
            Special Offers
          </h2>
          <p className="text-lg text-content-muted max-w-2xl mx-auto mb-6">
            Don&apos;t miss out on our exclusive deals and limited-time
            promotions
          </p>
        </motion.div>

        {/* MAIN CARD */}
        <motion.div
          className="group bg-surface-card rounded-xl shadow-md hover:shadow-xl transition-smooth overflow-hidden border border-divider-card gpu-fix"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {/* Outer container animates height smoothly via measured inner content */}
          <div
            style={{
              height: cardHeight !== undefined ? cardHeight : undefined,
              minHeight: "450px",
              transition: "height 300ms ease-in-out"
            }}
          >
            {/* Inner div — measured by ResizeObserver */}
            <div ref={contentRef} className="w-full md:min-h-112.5">
              {slides.length === 0 || !activeSlide ? (
                <EmptyState />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    opacity: fading ? 0 : 1,
                    transition: "opacity 300ms ease-in-out"
                  }}
                >
                  <OfferCard slide={activeSlide} />
                </div>
              )}
            </div>
          </div>

          {/* Dots — matching testimonials style */}
          {slides.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  aria-label={`Go to offer ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    active === i
                      ? "bg-brand w-6"
                      : "bg-indicator-inactive w-1.5 hover:bg-brand-subtle"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
