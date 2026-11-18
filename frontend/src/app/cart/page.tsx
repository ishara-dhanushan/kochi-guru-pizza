// src/app/cart/page.tsx
import type { Metadata } from "next";
import Header from "@components/Header";
import Footer from "@components/Footer";
import CartContent from "./components/CartContent";

export const metadata: Metadata = {
  title: "Shopping Cart — Kochi Guru Pizza",
  description: "Review the items in your Kochi Guru Pizza shopping cart.",
  robots: {
    index: false,
    follow: true
  }
};

export default function CartPage() {
  return (
    <>
      <Header />
      <CartContent />
      <Footer />
    </>
  );
}
