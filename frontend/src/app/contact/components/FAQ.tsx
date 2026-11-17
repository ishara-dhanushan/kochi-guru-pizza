// src/app/contact/components/FAQ.tsx
"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "Do you offer home delivery?",
    answer:
      "Currently we operate as a dine-in and takeaway restaurant. You are welcome to call us on 077 077 6848 to place a takeaway order and collect it from our location at the Cargills Food City Building, Walasmulla."
  },
  {
    question: "Can I book a table for a group or event?",
    answer:
      "Absolutely! We welcome group bookings and special celebrations. Please call us or send us a message through the contact form above and we will do our best to accommodate your party."
  },
  {
    question: "Do you offer catering services?",
    answer:
      "Yes — we offer catering for events, gatherings, and office orders. Get in touch via our contact form or call us directly to discuss your requirements and we will put together a custom menu for you."
  },
  {
    question: "What are your opening hours?",
    answer:
      "We are open every day of the week from 10:00 AM to 10:00 PM — including weekends and public holidays. Come hungry!"
  },
  {
    question: "Do you have vegetarian or customisable pizza options?",
    answer:
      "Yes! Several of our pizzas can be customised to suit vegetarian preferences. Speak to our team when you visit or when placing your order and we will be happy to help."
  },
  {
    question: "Where exactly are you located?",
    answer:
      "We are on the Basement Floor of the Cargills Food City Building, Beliatta Road, Walasmulla 82220. Use the map on this page or click 'Get Directions' to navigate straight to us."
  }
];

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-divider-card rounded-xl overflow-hidden bg-surface-card shadow-sm hover:shadow-md transition-smooth">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-heading font-semibold text-content-main text-base leading-snug">
          {question}
        </span>
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all ${
            isOpen
              ? "bg-brand text-brand-on rotate-180"
              : "bg-surface-inset text-content-muted"
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" as const }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5">
              <div className="h-px bg-divider-standard mb-4" />
              <p className="text-content-muted leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 md:py-24 bg-surface transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 gpu-fix"
        >
          <span className="inline-block text-brand font-semibold text-sm uppercase tracking-widest mb-3">
            Common Questions
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-4">
            Frequently Asked
          </h2>
          <p className="text-lg text-content-muted">
            Everything you need to know before your visit or order.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.5 }}
          className="space-y-3 gpu-fix"
        >
          {faqs.map((faq, index) => (
            <FaqItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => toggle(index)}
            />
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center text-sm text-content-faint mt-10 gpu-fix"
        >
          Still have a question?{" "}
          <a
            href="tel:0770776848"
            className="text-brand font-semibold hover:underline"
          >
            Give us a call
          </a>{" "}
          or use the contact form above.
        </motion.p>
      </div>
    </section>
  );
}
