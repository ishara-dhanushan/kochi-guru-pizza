// src/app/orders/page.tsx
import type { Metadata } from "next";
import Header from "@components/Header";
import Footer from "@components/Footer";
import OrdersContent from "./components/OrdersContent";

export const metadata: Metadata = {
  title: "My Orders — Kochi Guru Pizza",
  description: "Review your previous orders and their current statuses.",
  robots: {
    index: false,
    follow: false
  }
};

export default function OrdersPage() {
  return (
    <>
      <Header />
      <OrdersContent />
      <Footer />
    </>
  );
}
