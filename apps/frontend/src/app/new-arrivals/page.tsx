import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { brandConfig } from "@/config/brand";
import { SHOP_PRODUCTS } from "@/services/product-service";
import { formatInr } from "@/lib/utils";

export const metadata: Metadata = {
  title: `New Arrivals | ${brandConfig.name}`,
  description:
    "Explore the latest luxury arrivals in fine jewellery from PERALAGAE. Handcrafted 18k solid gold necklaces, solitaire rings, and certified diamond pieces.",
};

export default function NewArrivalsPage() {
  // Display newly launched products
  const newArrivals = SHOP_PRODUCTS.filter((p) => p.isNew);
  const displayProducts = newArrivals.length > 0 ? newArrivals : SHOP_PRODUCTS.slice(0, 8);

  return (
    <main className="w-full min-h-screen bg-white">
      {/* 1. Header Banner */}
      <section className="relative w-full bg-[#FAF9F5] border-b border-[#EBEBEB] py-12 md:py-16 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex items-center justify-center space-x-2 text-xs uppercase tracking-[0.1em] text-[#777777]">
              <li>
                <Link href="/" className="transition-colors hover:text-black">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#111111] font-medium" aria-current="page">
                New Arrivals
              </li>
            </ol>
          </nav>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#111111]">
            New Arrivals
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#666666] max-w-xl mx-auto font-light">
            Discover our newest handcrafted fine jewellery creations, sculpted in pure 18k gold and luminous natural diamonds.
          </p>
        </div>
      </section>

      {/* 2. Product Showcase Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex items-center justify-between pb-6 border-b border-[#EBEBEB] mb-8">
          <span className="text-xs uppercase tracking-widest text-[#777777]">
            Showing {displayProducts.length} New Creations
          </span>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-widest font-medium text-[#C5A572] hover:text-[#111111] transition-colors"
          >
            View Entire Catalogue &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {displayProducts.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col bg-white border border-[#EBEBEB] rounded-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square w-full bg-[#F7F7F7] overflow-hidden">
                <Link href={`/shop`} className="block w-full h-full">
                  <Image
                    src={product.image.src}
                    alt={product.image.alt || product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                <span className="absolute top-2.5 left-2.5 bg-[#C5A572] text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-sm">
                  NEW
                </span>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <span className="text-[10px] uppercase tracking-wider text-[#888888] mb-1">
                  {product.category}
                </span>
                <Link
                  href="/shop"
                  className="text-sm font-medium text-[#111111] group-hover:text-[#C5A572] transition-colors line-clamp-1"
                >
                  {product.name}
                </Link>
                <div className="mt-2 text-sm font-semibold text-[#111111]">
                  {formatInr(product.priceInr)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
