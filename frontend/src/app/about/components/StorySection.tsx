// src/app/about/components/StorySection.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

const stats = [
  { value: "8+", label: "Pizza Varieties" },
  { value: "100%", label: "Fresh Ingredients" },
  { value: "4+", label: "Drink Categories" },
  { value: "523+", label: "Happy Customers" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function StorySection() {
  return (
    <section className="py-20 md:py-24 bg-surface transition-smooth overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="gpu-fix"
          >
            <span className="inline-block text-brand font-semibold text-sm uppercase tracking-widest mb-3">
              Our Story
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-6">
              Crafted with Passion,{" "}
              <span className="text-brand">Served with Love</span>
            </h2>
            <div className="space-y-4 text-content-muted text-lg leading-relaxed">
              <p>
                Kochi Guru Pizza was born from a simple dream — to bring
                authentic Italian-style pizza to the people of Walasmulla.
                Nestled in the basement of the Cargills Food City Building on
                Beliatta Road, we have become the go-to spot for families,
                friends, and pizza lovers of all ages.
              </p>
              <p>
                Every pizza we craft starts with hand-selected ingredients, a
                slow-fermented dough, and house-made sauces. From our signature
                Kochchi Pizza loaded with local flavors to the indulgent
                Supreme, there is something on our menu for everyone.
              </p>
              <p>
                Beyond pizza, we serve fresh pasta, burgers, hotdogs,
                sandwiches, and a vibrant selection of fresh fruit juices and
                milkshakes — perfect for a complete dining experience.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="grid grid-cols-2 gap-6 gpu-fix"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={cardVariants}
                className="bg-surface-card rounded-xl shadow-md border border-divider-card p-6 text-center transition-smooth gpu-fix"
              >
                <div className="font-heading text-4xl font-bold text-brand mb-2">
                  {stat.value}
                </div>
                <div className="text-content-muted font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
