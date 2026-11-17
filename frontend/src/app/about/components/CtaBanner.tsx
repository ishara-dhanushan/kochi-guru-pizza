// src/app/about/components/CtaBanner.tsx
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CtaBanner() {
  return (
    <section className="py-20 bg-surface-alternate/30 dark:bg-surface-alternate transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="bg-hero-brand-gradient rounded-2xl p-12 text-center relative overflow-hidden gpu-fix"
        >
          <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[80%] bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[80%] bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-on mb-4">
              Ready to Taste the Difference?
            </h2>
            <p className="text-xl text-brand-on/90 mb-8 max-w-xl mx-auto">
              Order online or visit us at the Cargills Food City Building,
              Walasmulla.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/menu"
                className="px-8 py-3.5 bg-surface-on-brand text-brand-on-light font-bold rounded-xl hover:bg-surface-on-brand-hover transition shadow-lg"
              >
                Browse Menu
              </Link>
              <a
                href="tel:0770776848"
                className="px-8 py-3.5 bg-white/20 backdrop-blur-sm text-brand-on font-bold rounded-xl hover:bg-white/30 transition border border-white/30"
              >
                Call Us Now
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
