// src/app/contact/components/SocialConnect.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import ScrollAnimatedList from "@components/ScrollAnimatedList";
import ScrollAnimatedItem from "@components/ScrollAnimatedItem";

// SVG icons for social platforms
const FacebookIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const socials = [
  {
    name: "Facebook",
    handle: "@KochiGuruPizza",
    description: "Follow for daily specials and updates",
    icon: <FacebookIcon />,
    href: "https://facebook.com/KochiGuruPizza",
    gradient: "bg-linear-to-br from-blue-500 to-blue-700",
    hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-900/10",
    hoverBorder: "hover:border-blue-200 dark:hover:border-blue-800"
  },
  {
    name: "Instagram",
    handle: "@kochigurupizza",
    description: "See our pizzas before you taste them",
    icon: <InstagramIcon />,
    href: "https://instagram.com/kochigurupizza",
    gradient: "bg-linear-to-br from-pink-500 to-orange-500",
    hoverBg: "hover:bg-pink-50 dark:hover:bg-pink-900/10",
    hoverBorder: "hover:border-pink-200 dark:hover:border-pink-800"
  },
  {
    name: "WhatsApp",
    handle: "077 077 6848",
    description: "Message us directly for quick replies",
    icon: <WhatsAppIcon />,
    href: "https://wa.me/94770776848",
    gradient: "bg-linear-to-br from-green-500 to-green-600",
    hoverBg: "hover:bg-green-50 dark:hover:bg-green-900/10",
    hoverBorder: "hover:border-green-200 dark:hover:border-green-800"
  },
  {
    name: "Phone",
    handle: "077 077 6848",
    description: "Call us during opening hours",
    icon: <Phone className="w-6 h-6" />,
    href: "tel:0770776848",
    gradient: "bg-blob-gradient",
    hoverBg: "hover:bg-brand-wash dark:hover:bg-brand-wash/10",
    hoverBorder: "hover:border-brand/30"
  }
];

export default function SocialConnect() {
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
            Stay Connected
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-4">
            Find Us Online
          </h2>
          <p className="text-lg text-content-muted max-w-2xl mx-auto">
            Follow our journey, get daily specials, and reach us on the platform
            that works best for you.
          </p>
        </motion.div>

        <ScrollAnimatedList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {socials.map((social) => (
            <ScrollAnimatedItem key={social.name} className="h-full">
              <motion.a
                href={social.href}
                target={social.name !== "Phone" ? "_blank" : undefined}
                rel={
                  social.name !== "Phone" ? "noopener noreferrer" : undefined
                }
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group flex flex-col items-center text-center bg-surface-card rounded-2xl shadow-md border border-divider-card p-7 transition-smooth hover:shadow-xl ${social.hoverBg} ${social.hoverBorder} gpu-fix h-full`}
              >
                <div
                  className={`flex items-center justify-center w-16 h-16 rounded-2xl ${social.gradient} text-brand-on mb-5 shadow-md group-hover:scale-110 transition-transform`}
                >
                  {social.icon}
                </div>
                <h3 className="font-heading text-lg font-bold text-content-main mb-1">
                  {social.name}
                </h3>
                <p className="text-brand font-semibold text-sm mb-2">
                  {social.handle}
                </p>
                <p className="text-content-muted text-sm leading-relaxed">
                  {social.description}
                </p>
              </motion.a>
            </ScrollAnimatedItem>
          ))}
        </ScrollAnimatedList>
      </div>
    </section>
  );
}
