// src/components/Footer.tsx
import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface-inverse text-content-on-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              Kochi Guru Pizza
            </h3>
            <p className="text-content-on-dark-muted">
              Authentic Italian wood-fired pizza crafted with passion in
              Walasmulla.
            </p>
          </div>
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-content-on-dark-muted">
              <li>
                <Link
                  href="/menu"
                  className="hover:text-brand-inverse transition"
                >
                  Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-brand-inverse transition"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-brand-inverse transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-content-on-dark-muted">
              <li>Walasmulla, Sri Lanka</li>
              <li>Phone: +94 77 077 6848</li>
              <li>Email: info@kochigurupizza.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-divider-inverse mt-8 pt-8 text-center text-content-on-dark-muted">
          <p>
            &copy; {new Date().getFullYear()} Kochi Guru Pizza. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
