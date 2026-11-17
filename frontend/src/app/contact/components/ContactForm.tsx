// src/app/contact/components/ContactForm.tsx
"use client";

import React, { useState } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FormState = "idle" | "submitting" | "success" | "error";

interface FormData {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

const subjects = [
  "General Enquiry",
  "Catering & Events",
  "Feedback",
  "Order Issue",
  "Other"
];

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: ""
  });
  const [formState, setFormState] = useState<FormState>("idle");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("submitting");

    // Simulate submission — replace with your actual API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // On success:
    setFormState("success");
    setFormData({ name: "", phone: "", email: "", subject: "", message: "" });
  };

  const inputBase =
    "w-full px-4 py-3 rounded-xl border bg-surface-inset text-content-main placeholder-content-muted transition-smooth outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand";

  const inputBorder = "border-divider-control hover:border-brand/60";

  return (
    <section className="py-20 md:py-24 bg-surface transition-colors overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — Intro */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="gpu-fix"
          >
            <span className="inline-block text-brand font-semibold text-sm uppercase tracking-widest mb-3">
              Send Us a Message
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-5">
              We Are <span className="text-brand">Listening</span>
            </h2>
            <p className="text-lg text-content-muted leading-relaxed mb-8">
              Have a special request, want to book for a group, or need help
              with an order? Fill in the form and we will get back to you as
              soon as we can — usually within a few hours during opening hours.
            </p>

            {/* Response time note */}
            <div className="flex items-start gap-4 p-5 bg-brand-wash dark:bg-brand-wash/25 rounded-xl border border-brand-decoration dark:border-brand-decoration/30">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blob-gradient text-brand-on shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-content-main mb-1">
                  Quick Response Guarantee
                </p>
                <p className="text-sm text-content-muted">
                  We aim to respond to all messages within 2 hours during
                  opening hours (10 AM – 10 PM, every day).
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="gpu-fix"
          >
            <div className="bg-surface-card rounded-2xl shadow-md border border-divider-card p-8">
              <AnimatePresence mode="wait">
                {formState === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center text-center py-12 gpu-fix"
                  >
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-success-wash dark:bg-success-wash/20 mb-6">
                      <CheckCircle className="w-10 h-10 text-success" />
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-content-main mb-3">
                      Message Sent!
                    </h3>
                    <p className="text-content-muted mb-8">
                      Thanks for reaching out. We will get back to you within 2
                      hours during opening hours.
                    </p>
                    <button
                      onClick={() => setFormState("idle")}
                      className="px-6 py-3 bg-brand-btn text-brand-on font-semibold rounded-xl hover:bg-brand-btn-hover transition-all shadow-md"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5 gpu-fix"
                  >
                    {/* Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-content-subtle mb-1.5">
                          Full Name <span className="text-brand">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          required
                          className={`${inputBase} ${inputBorder}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-content-subtle mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="077 000 0000"
                          className={`${inputBase} ${inputBorder}`}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-content-subtle mb-1.5">
                        Email Address <span className="text-brand">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                        className={`${inputBase} ${inputBorder}`}
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-semibold text-content-subtle mb-1.5">
                        Subject <span className="text-brand">*</span>
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className={`${inputBase} ${inputBorder}`}
                      >
                        <option value="" disabled>
                          Select a subject
                        </option>
                        {subjects.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-semibold text-content-subtle mb-1.5">
                        Message <span className="text-brand">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help..."
                        required
                        rows={5}
                        className={`${inputBase} ${inputBorder} resize-none`}
                      />
                    </div>

                    {/* Error state */}
                    {formState === "error" && (
                      <div className="flex items-center gap-2 text-danger text-sm bg-danger-wash dark:bg-danger-wash/25 rounded-xl px-4 py-3 border border-danger-border">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Something went wrong. Please try again or call us
                        directly.
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={formState === "submitting"}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-btn text-brand-on font-bold rounded-xl hover:bg-brand-btn-hover shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {formState === "submitting" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
