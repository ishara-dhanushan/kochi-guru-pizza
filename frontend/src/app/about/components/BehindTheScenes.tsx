// src/app/about/components/BehindTheScenes.tsx
"use client";

import React from "react";
import { Flame, Clock, Sparkles, Wheat } from "lucide-react";
import { motion } from "framer-motion";
import ScrollAnimatedList from "@components/ScrollAnimatedList";
import ScrollAnimatedItem from "@components/ScrollAnimatedItem";

const steps = [
  {
    icon: <Wheat className="w-6 h-6" />,
    step: "01",
    title: "The Dough",
    description:
      "Our dough is prepared fresh every morning using a slow-fermentation process — giving it that signature airy chew and golden crust."
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    step: "02",
    title: "The Sauce",
    description:
      "House-made from scratch. No jars, no shortcuts. Our tomato base is seasoned and simmered in-house to a rich, balanced depth of flavour."
  },
  {
    icon: <Flame className="w-6 h-6" />,
    step: "03",
    title: "The Oven",
    description:
      "Our wood-fired oven reaches temperatures that no conventional oven can match — creating that unmistakable char, crunch, and smoky aroma."
  },
  {
    icon: <Clock className="w-6 h-6" />,
    step: "04",
    title: "The Timing",
    description:
      "Each pizza is monitored through its bake. We rotate, watch, and pull at exactly the right moment — because perfection has its own clock."
  }
];

export default function BehindTheScenes() {
  return (
    <section className="py-20 md:py-24 bg-surface-alternate/30 dark:bg-surface-alternate transition-colors overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="gpu-fix"
          >
            <span className="inline-block text-brand font-semibold text-sm uppercase tracking-widest mb-3">
              Our Process
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-5">
              Behind Every <span className="text-brand">Perfect Slice</span>
            </h2>
            <p className="text-lg text-content-muted leading-relaxed mb-10">
              The best pizzas are not accidents — they are the result of
              deliberate craft, quality ingredients, and a kitchen that takes
              pride in every step. Here is how our process works.
            </p>

            <ScrollAnimatedList className="space-y-6">
              {steps.map((step) => (
                <ScrollAnimatedItem
                  key={step.step}
                  direction="left"
                  className="flex gap-4 group gpu-fix"
                >
                  {/* Step number + icon */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blob-gradient text-brand-on shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      {step.icon}
                    </div>
                    {/* Connector line */}
                    <div className="w-px flex-1 bg-brand-decoration dark:bg-brand-decoration/40 mt-2 min-h-5 last:hidden" />
                  </div>
                  {/* Content */}
                  <div className="pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-brand tracking-widest">
                        STEP {step.step}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-content-main mb-1">
                      {step.title}
                    </h3>
                    <p className="text-content-muted leading-relaxed text-sm">
                      {step.description}
                    </p>
                  </div>
                </ScrollAnimatedItem>
              ))}
            </ScrollAnimatedList>
          </motion.div>

          {/* Right — Visual placeholder grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-4 gpu-fix"
          >
            {/* Large top-left tile */}
            <div className="col-span-2 rounded-2xl overflow-hidden bg-linear-to-br from-orange-500 via-orange-600 to-red-600 aspect-video flex items-center justify-center shadow-xl">
              <div className="text-center text-brand-on px-6">
                <Flame className="w-14 h-14 mx-auto mb-3 opacity-90" />
                <p className="font-heading text-xl font-bold">
                  Wood-Fired Oven
                </p>
                <p className="text-brand-on/80 text-sm mt-1">
                  Where the magic happens
                </p>
              </div>
            </div>

            {/* Bottom left */}
            <div className="rounded-2xl overflow-hidden bg-linear-to-br from-amber-400 to-orange-500 aspect-square flex items-center justify-center shadow-md">
              <div className="text-center text-brand-on px-4">
                <Wheat className="w-10 h-10 mx-auto mb-2 opacity-90" />
                <p className="font-heading text-base font-bold">Fresh Dough</p>
                <p className="text-brand-on/80 text-xs mt-0.5">Daily</p>
              </div>
            </div>

            {/* Bottom right */}
            <div className="rounded-2xl overflow-hidden bg-linear-to-br from-rose-400 to-orange-500 aspect-square flex items-center justify-center shadow-md">
              <div className="text-center text-brand-on px-4">
                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-90" />
                <p className="font-heading text-base font-bold">House Sauce</p>
                <p className="text-brand-on/80 text-xs mt-0.5">
                  Made from scratch
                </p>
              </div>
            </div>

            <p className="col-span-2 text-center text-xs text-content-faint -mt-1">
              Replace tiles above with real kitchen photos for best results
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
