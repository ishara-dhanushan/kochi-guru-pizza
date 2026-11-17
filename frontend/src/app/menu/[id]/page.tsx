// src/app/menu/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { MenuItem } from "@typings/menu";
import { httpServerClient } from "@lib/httpServerClient";
import ItemImage from "./components/ItemImage";
import ItemMeta from "./components/ItemMeta";
import ItemPricing from "./components/ItemPricing";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchItem(id: string): Promise<MenuItem | null> {
  try {
    return await httpServerClient<MenuItem>(`/menu/${id}`, {
      next: { revalidate: 60 }
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) return { title: "Item Not Found" };
  return {
    title: `${item.name} — Kochi Guru Pizza`,
    description: item.longDescription ?? item.description ?? undefined
  };
}

export default async function MenuItemDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await fetchItem(id);

  if (!item) notFound();

  return (
    <>
      <Header />

      <main className="pb-32 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Back to menu — always at the top */}
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-semibold text-content-muted hover:text-brand transition-colors group mb-10"
          >
            <ArrowLeft
              size={15}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Menu
          </Link>

          {/* Two-column layout on md+, stacked on mobile */}
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-stretch">
            {/* Left — image, sticky on desktop, vertically centered in available space */}
            <div className="md:sticky md:top-10 flex items-center">
              <ItemImage
                images={item.images}
                alt={item.name}
                category={item.category}
              />
            </div>

            {/* Right — all textual content */}
            <div className="flex flex-col gap-8">
              {/* Name, badges, short + long description */}
              <ItemMeta item={item} />

              {/* Divider */}
              <div className="h-px bg-divider-subtle" />

              {/* Pricing */}
              <ItemPricing item={item} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
