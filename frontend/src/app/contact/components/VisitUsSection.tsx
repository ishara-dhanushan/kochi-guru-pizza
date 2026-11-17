// src/app/contact/components/VisitUsSection.tsx
"use client";

import React from "react";
import { MapPin, Phone, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function VisitUsSection() {
  return (
    <section className="py-20 md:py-24 bg-surface transition-colors overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 gpu-fix"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-4">
            Visit Us Today
          </h2>
          <p className="text-lg text-content-muted max-w-2xl mx-auto">
            Find us at the Cargills Food City Building in Walasmulla
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-4 gpu-fix"
          >
            <div className="group bg-surface-card rounded-xl shadow-md border border-divider-card p-5 flex gap-4 hover:shadow-xl transition-smooth">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blob-gradient text-brand-on shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading font-semibold text-content-main mb-1">
                  Address
                </p>
                <p className="text-content-muted text-sm leading-relaxed">
                  Basement Floor, Cargills Food City Building,
                  <br />
                  Beliatta Road, Walasmulla 82220
                </p>
              </div>
            </div>

            <div className="group bg-surface-card rounded-xl shadow-md border border-divider-card p-5 flex gap-4 hover:shadow-xl transition-smooth">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blob-gradient text-brand-on shrink-0 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading font-semibold text-content-main mb-1">
                  Phone
                </p>
                <a
                  href="tel:0770776848"
                  className="text-brand font-semibold hover:text-brand-hover transition text-lg"
                >
                  077 077 6848
                </a>
              </div>
            </div>

            <div className="group bg-surface-card rounded-xl shadow-md border border-divider-card p-5 flex gap-4 hover:shadow-xl transition-smooth">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blob-gradient text-brand-on shrink-0 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading font-semibold text-content-main mb-2">
                  Opening Hours
                </p>
                <div className="space-y-1 text-sm text-content-muted">
                  <div className="flex justify-between gap-6">
                    <span>Monday – Friday</span>
                    <span className="font-medium text-content-main">
                      10:00 AM – 10:00 PM
                    </span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>Saturday – Sunday</span>
                    <span className="font-medium text-content-main">
                      10:00 AM – 10:00 PM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="https://maps.app.goo.gl/czRAX7EGLcJKBBxD7"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-btn text-brand-on font-bold rounded-xl hover:bg-brand-btn-hover shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all"
            >
              <MapPin className="w-4 h-4" />
              Get Directions
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 gpu-fix"
          >
            <div className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-smooth border border-divider-card h-105">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.8!2d80.6973356!3d6.150403!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae14bf48d6f7b07%3A0xfe7cb83da3e3b9da!2sKochi%20Guru%20Pizza!5e0!3m2!1sen!2slk!4v1740000000000!5m2!1sen!2slk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kochi Guru Pizza Location"
              />
            </div>
            <p className="text-center text-sm text-content-muted mt-3">
              Basement Floor, Cargills Food City Building, Walasmulla
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
