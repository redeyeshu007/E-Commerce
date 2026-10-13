"use client";

import React, { useMemo } from "react";
import type { Product } from "@/types/product";
import { getRelatedProducts } from "@/services/recommendation-service";
import { ProductCard } from "@/components/home/product-card";

export interface RelatedProductsProps {
  currentProduct: Product;
  limit?: number;
}

export function RelatedProducts({
  currentProduct,
  limit = 4,
}: RelatedProductsProps) {
  const related = useMemo(
    () => getRelatedProducts(currentProduct, { limit }),
    [currentProduct, limit]
  );

  if (related.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Related Products"
      className="mt-14 sm:mt-20 mb-14 sm:mb-20 w-full"
    >
      {/* Section Header: Centred heading with flanking horizontal lines matching New Collection */}
      <div className="flex flex-col items-center justify-center text-center mb-7 sm:mb-12 lg:mb-14">
        <div className="flex items-center justify-center w-full gap-3 sm:gap-6">
          <span
            className="h-[1px] w-8 sm:w-20 lg:w-28 bg-[#D8D8D8]"
            aria-hidden="true"
          />
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-normal tracking-[-0.01em] text-[#111111] leading-[1.2] px-2 text-center font-jost">
            Related Products
          </h2>
          <span
            className="h-[1px] w-8 sm:w-20 lg:w-28 bg-[#D8D8D8]"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* 4-Item Responsive Grid matching New Collection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
        {related.map((prod) => (
          <ProductCard
            key={prod.id}
            product={prod}
            dataTestId={`related-product-${prod.id}`}
          />
        ))}
      </div>
    </section>
  );
}

