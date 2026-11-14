// src/app/contact/components/HeroBanner.tsx
"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroBanner() {
  return (
    <section className="relative w-full py-28 md:py-36 overflow-hidden bg-hero-brand-gradient">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-highlight/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-highlight/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="gpu-fix"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-highlight/20 text-brand-on text-sm font-medium mb-6 backdrop-blur-sm">
            <MessageCircle className="w-4 h-4" />
            We&apos;d love to hear from you
          </div>
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-brand-on mb-6 drop-shadow-lg">
            Get in Touch
          </h1>
          <p className="text-xl md:text-2xl text-brand-on/90 max-w-2xl mx-auto drop-shadow-md">
            Whether it&apos;s a question, a catering enquiry, or just to say
            hello — we are always happy to hear from you.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
