// src/app/about/components/OurValues.tsx
"use client";

import React from "react";
import { Heart, Sprout, Users, Award } from "lucide-react";
import { motion } from "framer-motion";
import ScrollAnimatedList from "@components/ScrollAnimatedList";
import ScrollAnimatedItem from "@components/ScrollAnimatedItem";

const values = [
  {
    icon: <Heart className="w-7 h-7" />,
    title: "Made with Love",
    description:
      "Every dish that leaves our kitchen carries the same passion that inspired us to open our doors. We never cut corners — because you deserve better.",
    accent: "from-rose-400 to-rose-600"
  },
  {
    icon: <Sprout className="w-7 h-7" />,
    title: "Fresh Ingredients",
    description:
      "We source locally and season-consciously. No frozen shortcuts — just hand-picked produce, house-made sauces, and slow-fermented dough every single day.",
    accent: "from-green-400 to-green-600"
  },
  {
    icon: <Users className="w-7 h-7" />,
    title: "Community First",
    description:
      "Kochi Guru Pizza was built for Walasmulla. We are proud to be a gathering place for families, friends, and first dates — a little corner of warmth in our town.",
    accent: "from-orange-400 to-orange-600"
  },
  {
    icon: <Award className="w-7 h-7" />,
    title: "Uncompromising Quality",
    description:
      "From our wood-fired oven to your table, every step is held to the same standard. If it does not taste perfect to us, it will not reach you.",
    accent: "from-amber-400 to-amber-600"
  }
];

export default function OurValues() {
  return (
    <section className="py-20 md:py-24 bg-surface-alternate/30 dark:bg-surface-alternate transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 gpu-fix"
        >
          <span className="inline-block text-brand font-semibold text-sm uppercase tracking-widest mb-3">
            What We Stand For
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-4">
            Our Values
          </h2>
          <p className="text-lg text-content-muted max-w-2xl mx-auto">
            These are not just words on a wall — they are the principles baked
            into everything we do.
          </p>
        </motion.div>

        <ScrollAnimatedList className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value) => (
            <ScrollAnimatedItem key={value.title} className="h-full">
              <motion.div
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group flex gap-5 bg-surface-card rounded-2xl shadow-md hover:shadow-xl transition-smooth border border-divider-card p-7 gpu-fix h-full"
              >
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br ${value.accent} text-brand-on shrink-0 group-hover:scale-110 transition-transform shadow-md`}
                >
                  {value.icon}
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold text-content-main mb-2">
                    {value.title}
                  </h3>
                  <p className="text-content-muted leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            </ScrollAnimatedItem>
          ))}
        </ScrollAnimatedList>
      </div>
    </section>
  );
}
