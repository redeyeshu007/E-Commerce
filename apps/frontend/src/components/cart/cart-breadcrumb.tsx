"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface CartBreadcrumbProps {
  className?: string;
}

/**
 * CartBreadcrumb Component — PERALAGAE
 * Renders Home > Shop > Cart semantic navigation
 */
export function CartBreadcrumb({ className = "" }: CartBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-xs tracking-wider uppercase text-[#777777] ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2">
        <li className="flex items-center">
          <Link
            href="/"
            className="hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            Home
          </Link>
        </li>
        <li className="flex items-center text-[#999999]" aria-hidden="true">
          <ChevronRight className="h-3 w-3 stroke-[1.5]" />
        </li>
        <li className="flex items-center">
          <Link
            href="/shop"
            className="hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            Shop
          </Link>
        </li>
        <li className="flex items-center text-[#999999]" aria-hidden="true">
          <ChevronRight className="h-3 w-3 stroke-[1.5]" />
        </li>
        <li className="flex items-center font-medium text-[#111111]" aria-current="page">
          <span>Cart</span>
        </li>
      </ol>
    </nav>
  );
}
