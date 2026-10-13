"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, ProductImage } from "@/types/product";
import { ImageLightboxModal } from "./image-lightbox-modal";

export interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const images: ProductImage[] =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const activeImage = images[activeIndex] || images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      aria-label="Product Image Gallery"
      className="flex flex-col-reverse lg:flex-row items-start gap-3 sm:gap-4 w-full"
    >
      {/* Vertical Thumbnails (Desktop: left, Mobile: horizontal row) */}
      {images.length > 1 && (
        <div
          role="tablist"
          aria-label="Product image thumbnails"
          className="flex lg:flex-col gap-2.5 sm:gap-3 overflow-x-auto lg:overflow-y-auto w-full lg:w-[72px] flex-none py-1 lg:py-0 scrollbar-none"
        >
          {images.map((img, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={`${img.src}-${idx}`}
                role="tab"
                id={`gallery-thumb-${idx}`}
                aria-selected={isSelected}
                aria-controls="gallery-main-image"
                aria-label={`Thumbnail ${idx + 1} of ${images.length}: ${img.alt || product.name}`}
                onClick={() => setActiveIndex(idx)}
                className={`group relative aspect-square w-16 sm:w-[68px] lg:w-[72px] flex-none overflow-hidden bg-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black ${
                  isSelected
                    ? "border border-black"
                    : "border-0 border-transparent hover:opacity-80"
                }`}
              >
                <Image
                  src={img.src}
                  alt={img.alt || `Product thumbnail view ${idx + 1}`}
                  fill
                  sizes="72px"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Large Product Image (Zero borders, zero grey padding, pure white background) */}
      <div
        id="gallery-main-image"
        role="tabpanel"
        aria-labelledby={`gallery-thumb-${activeIndex}`}
        className="relative flex-1 w-full aspect-square sm:aspect-[4/4] overflow-hidden bg-white border-0 border-none shadow-none"
      >
        {/* Status Badges Matching Reference */}
        <div className="absolute top-3.5 left-3.5 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
          {product.isHot && (
            <span
              data-testid="pdp-badge-hot"
              className="bg-[#E53935] text-white text-[10px] sm:text-[11px] font-bold tracking-wider px-2 py-0.5 uppercase select-none"
            >
              HOT
            </span>
          )}
          {!product.isHot && product.isNew && (
            <span
              data-testid="pdp-badge-new"
              className="bg-[#111111] text-white text-[10px] sm:text-[11px] font-bold tracking-wider px-2 py-0.5 uppercase select-none"
            >
              NEW
            </span>
          )}
          {product.compareAtPriceInr && product.compareAtPriceInr > product.priceInr && (
            <span
              data-testid="pdp-badge-sale"
              className="bg-[#C5A572] text-white text-[10px] sm:text-[11px] font-bold tracking-wider px-2 py-0.5 uppercase select-none"
            >
              SALE
            </span>
          )}
        </div>

        {/* Lightbox / Zoom Trigger Button */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          aria-label="Enlarge product image"
          title="Click to view full-screen image"
          className="group absolute top-3.5 right-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#444444] shadow-sm border border-[#EBEBEB] transition-colors duration-200 hover:bg-[#111111] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        >
          <Maximize2 className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>

        {/* Main Image with Zoom Cursor (Edge-to-edge object-cover, zero padding, zero grey frame) */}
        <div
          onClick={() => setIsLightboxOpen(true)}
          className="relative w-full h-full cursor-zoom-in"
          title="Click to enlarge"
        >
          <Image
            src={activeImage.src}
            alt={activeImage.alt || product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 680px"
            className="object-cover transition-transform duration-300 ease-out hover:scale-105"
            priority
          />
        </div>

        {/* Previous & Next Image Arrows matching reference screenshot */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 z-10 p-1 text-[#888888] hover:text-[#111111] transition-colors focus-visible:outline-none select-none"
            >
              <ChevronLeft className="h-6 w-6 stroke-[1.2]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 z-10 p-1 text-[#888888] hover:text-[#111111] transition-colors focus-visible:outline-none select-none"
            >
              <ChevronRight className="h-6 w-6 stroke-[1.2]" />
            </button>
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        currentIndex={activeIndex}
        onSelectIndex={setActiveIndex}
        productName={product.name}
      />
    </section>
  );
}
