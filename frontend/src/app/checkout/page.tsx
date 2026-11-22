// src/app/checkout/page.tsx
import type { Metadata } from "next";
import Header from "@components/Header";
import Footer from "@components/Footer";
import CheckoutContent from "./components/CheckoutContent";

export const metadata: Metadata = {
  title: "Checkout — Kochi Guru Pizza",
  description: "Review your order and complete checkout.",
  robots: {
    index: false,
    follow: false
  }
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <CheckoutContent />
      <Footer />
    </>
  );
}
