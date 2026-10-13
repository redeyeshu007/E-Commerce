import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getAdjacentProducts,
  SHOP_PRODUCTS,
} from "@/services/product-service";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { brandConfig } from "@/config/brand";

interface ShopProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ShopProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: `Jewellery Item Not Found | ${brandConfig.name}`,
    };
  }

  return {
    title: `${product.name} | ${brandConfig.name}`,
    description:
      product.description ||
      `Discover the handcrafted ${product.name} at ${brandConfig.name}.`,
    openGraph: {
      title: `${product.name} | ${brandConfig.name}`,
      description: product.description,
      images: [{ url: product.image.src, alt: product.name }],
    },
  };
}

export const instant = false;

function ShopProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse" aria-hidden="true">
      <div className="h-4 w-48 bg-neutral-200 mb-8 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
        <div className="lg:col-span-7 aspect-square bg-neutral-100 rounded" />
        <div className="lg:col-span-5 space-y-4">
          <div className="h-8 w-3/4 bg-neutral-200 rounded" />
          <div className="h-4 w-1/3 bg-neutral-200 rounded" />
          <div className="h-6 w-1/4 bg-neutral-200 rounded" />
          <div className="h-16 w-full bg-neutral-100 rounded" />
        </div>
      </div>
    </div>
  );
}

async function ShopProductContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const { prev, next } = getAdjacentProducts(product);

  return (
    <ProductDetailView
      product={product}
      prevProduct={prev}
      nextProduct={next}
    />
  );
}

export default function ShopProductDetailPage({
  params,
}: ShopProductPageProps) {
  return (
    <React.Suspense fallback={<ShopProductDetailSkeleton />}>
      <ShopProductContent paramsPromise={params} />
    </React.Suspense>
  );
}

export function generateStaticParams() {
  return SHOP_PRODUCTS.map((prod) => ({
    slug: prod.slug,
  }));
}
