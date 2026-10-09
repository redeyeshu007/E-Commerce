"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import Link from "next/link";
import { X, ChevronDown, Check } from "lucide-react";
import type { NavigationConfig } from "@/config/navigation";

export interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  config: NavigationConfig;
}

const DEFAULT_LANGUAGES = ["English", "Français", "Deutsch", "Español", "Hindi"];
const DEFAULT_CURRENCIES = ["$ Dollar (US)", "₹ Rupees (INR)", "€ Euro (EUR)", "£ Pound (GBP)"];

/**
 * Mobile Navigation Drawer.
 *
 * Faithfully reproduces the Alukas & Co mobile reference drawer:
 * - Top Header: Brand Wordmark (e.g. JAVIX) + Close 'X' button with light neutral background.
 * - Tabs Bar: 'MENU' and 'CATEGORIES' with solid black indicator underline for active tab.
 * - Tab 1 (MENU): Home v1 (accordion), Shop, Product, Pages (accordion), Blog (accordion), Buy Theme!
 * - Tab 2 (CATEGORIES): New Products, Today On Sale, Special Offer!, Necklaces, Rings, Bracelets, Earnings, Charm & Dangles, Watches, Gift Ideas.
 * - Bottom Footer: Border-top with English ⌵ and $ Dollar (US) ⌵ dropdown selectors.
 */
export function MobileNavigation({ isOpen, onClose, config }: MobileNavigationProps) {
  const [activeTab, setActiveTab] = useState<"menu" | "categories">("menu");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    config.utility.language || "English",
  );
  const [selectedCurrency, setSelectedCurrency] = useState<string>("$ Dollar (US)");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle escape key to dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isLangOpen) {
          setIsLangOpen(false);
          return;
        }
        if (isCurrencyOpen) {
          setIsCurrencyOpen(false);
          return;
        }
        onClose();
      }
    },
    [isOpen, isLangOpen, isCurrencyOpen, onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Click outside listener for dropdown popups
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };

    if (isLangOpen || isCurrencyOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isLangOpen, isCurrencyOpen]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const menuItems = config.mobileMenu ?? [
    {
      id: "home-v1",
      label: "Home v1",
      href: "/",
      hasDropdown: true,
      subItems: [
        { id: "home-1", label: "Home v1", href: "/" },
        { id: "home-2", label: "Home v2", href: "/" },
        { id: "home-3", label: "Home v3", href: "/" },
      ],
    },
    { id: "shop", label: "Shop", href: "/shop" },
    { id: "product", label: "Product", href: "/product" },
    {
      id: "pages",
      label: "Pages",
      hasDropdown: true,
      subItems: [
        { id: "about", label: "About Us", href: "/about" },
        { id: "contact", label: "Contact Us", href: "/contact" },
        { id: "store-location", label: "Store Location", href: "/store-location" },
        { id: "faq", label: "FAQ", href: "/faq" },
      ],
    },
    {
      id: "blog",
      label: "Blog",
      hasDropdown: true,
      subItems: [
        { id: "blog-grid", label: "Blog Grid", href: "/blog" },
        { id: "blog-standard", label: "Blog Standard", href: "/blog" },
        { id: "single-post", label: "Single Post", href: "/blog" },
      ],
    },
    { id: "buy-theme", label: "Buy Theme!", href: "/shop" },
  ];

  const categories = config.categories ?? [
    { id: "new-products", label: "New Products", href: "/shop?filter=new" },
    { id: "today-on-sale", label: "Today On Sale", href: "/shop?filter=sale" },
    { id: "special-offer", label: "Special Offer!", href: "/shop?filter=special" },
    { id: "necklaces", label: "Necklaces", href: "/category/necklaces" },
    { id: "rings", label: "Rings", href: "/category/rings" },
    { id: "bracelets", label: "Bracelets", href: "/category/bracelets" },
    { id: "earrings", label: "Earnings", href: "/category/earrings" },
    { id: "charm-dangles", label: "Charm & Dangles", href: "/category/charms" },
    { id: "watches", label: "Watches", href: "/category/watches" },
    { id: "gift-ideas", label: "Gift Ideas", href: "/category/gifts" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 flex lg:hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative flex h-full w-[85vw] max-w-[340px] flex-col bg-white shadow-2xl transition-transform duration-300 motion-reduce:transition-none">
        {/* 1. Top Header inside drawer: Brand + Close Icon */}
        <div className="flex h-14 sm:h-16 flex-none items-center justify-between border-b border-[#E5E5E5] bg-[#F7F7F7] px-6">
          <span className="font-sans text-xl sm:text-2xl font-normal tracking-[0.18em] text-[#111111] uppercase">
            {config.brand.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#222222] transition-colors hover:bg-neutral-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <X className="h-5 w-5 stroke-[1.25]" aria-hidden="true" />
          </button>
        </div>

        {/* 2. Tabs Bar: MENU | CATEGORIES */}
        <div
          role="tablist"
          aria-label="Mobile Menu Categories"
          className="flex flex-none items-center gap-8 border-b border-[#E5E5E5] bg-white px-6"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "menu"}
            aria-controls="mobile-tab-panel"
            onClick={() => setActiveTab("menu")}
            className={`relative py-3.5 text-[13px] sm:text-sm font-semibold tracking-wider uppercase transition-colors focus-visible:outline-none ${
              activeTab === "menu"
                ? "border-b-2 border-black text-[#111111] -mb-[1px]"
                : "border-b-2 border-transparent text-[#767676] hover:text-[#111111] -mb-[1px]"
            }`}
          >
            Menu
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "categories"}
            aria-controls="mobile-tab-panel"
            onClick={() => setActiveTab("categories")}
            className={`relative py-3.5 text-[13px] sm:text-sm font-semibold tracking-wider uppercase transition-colors focus-visible:outline-none ${
              activeTab === "categories"
                ? "border-b-2 border-black text-[#111111] -mb-[1px]"
                : "border-b-2 border-transparent text-[#767676] hover:text-[#111111] -mb-[1px]"
            }`}
          >
            Categories
          </button>
        </div>

        {/* 3. Tab Content Area (Scrollable) */}
        <div id="mobile-tab-panel" className="flex-1 overflow-y-auto px-6 py-3">
          {activeTab === "menu" ? (
            <nav aria-label="Mobile Menu Navigation">
              <ul className="space-y-1" role="list">
                {menuItems.map((item) => {
                  const isExpanded = !!expandedItems[item.id];
                  if (item.hasDropdown && item.subItems && item.subItems.length > 0) {
                    return (
                      <li key={item.id} className="border-b border-transparent">
                        <div className="flex items-center justify-between py-2.5">
                          <Link
                            href={item.href || "#"}
                            onClick={onClose}
                            className="text-[15px] font-medium tracking-wide text-[#111111] transition-colors hover:text-black"
                          >
                            {item.label}
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            aria-expanded={isExpanded}
                            aria-label={`Toggle ${item.label} submenu`}
                            className="flex h-8 w-8 items-center justify-center text-[#777777] transition-colors hover:text-black"
                          >
                            <ChevronDown
                              className={`h-4 w-4 stroke-[1.5] transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                        {isExpanded && (
                          <ul className="ml-2 mb-2 space-y-2.5 border-l border-neutral-200 py-1 pl-4">
                            {item.subItems.map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  href={sub.href}
                                  onClick={onClose}
                                  className="block text-sm text-[#555555] transition-colors hover:text-black"
                                >
                                  {sub.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href || "#"}
                        onClick={onClose}
                        className="block py-2.5 text-[15px] font-medium tracking-wide text-[#111111] transition-colors hover:text-black"
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : (
            <nav aria-label="Mobile Categories Navigation">
              <ul className="space-y-1" role="list">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={cat.href}
                      onClick={onClose}
                      className="block py-2.5 text-[15px] font-medium tracking-wide text-[#111111] transition-colors hover:text-black"
                    >
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        {/* 4. Bottom Footer Bar: English ⌵ & $ Dollar (US) ⌵ */}
        <div className="relative flex-none border-t border-[#E5E5E5] bg-white px-6 py-4">
          <div className="flex items-center justify-between text-sm text-[#222222]">
            {/* Language Dropdown Selector */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => {
                  setIsLangOpen(!isLangOpen);
                  setIsCurrencyOpen(false);
                }}
                aria-expanded={isLangOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-1.5 py-1 text-sm font-normal text-[#222222] transition-colors hover:text-black focus-visible:outline-none"
              >
                <span>{selectedLanguage}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 stroke-[1.5] text-[#666666] transition-transform duration-200 ${
                    isLangOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isLangOpen && (
                <div
                  role="listbox"
                  className="absolute bottom-full left-0 z-30 mb-2 w-36 rounded-md border border-[#E5E5E5] bg-white py-1 shadow-lg"
                >
                  {DEFAULT_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      role="option"
                      aria-selected={selectedLanguage === lang}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setIsLangOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-[#222222] hover:bg-neutral-100"
                    >
                      <span>{lang}</span>
                      {selectedLanguage === lang && (
                        <Check className="h-3.5 w-3.5 stroke-[2] text-black" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency Dropdown Selector */}
            <div className="relative" ref={currencyRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCurrencyOpen(!isCurrencyOpen);
                  setIsLangOpen(false);
                }}
                aria-expanded={isCurrencyOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-1.5 py-1 text-sm font-normal text-[#222222] transition-colors hover:text-black focus-visible:outline-none"
              >
                <span>{selectedCurrency}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 stroke-[1.5] text-[#666666] transition-transform duration-200 ${
                    isCurrencyOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isCurrencyOpen && (
                <div
                  role="listbox"
                  className="absolute bottom-full right-0 z-30 mb-2 w-44 rounded-md border border-[#E5E5E5] bg-white py-1 shadow-lg"
                >
                  {DEFAULT_CURRENCIES.map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      role="option"
                      aria-selected={selectedCurrency === curr}
                      onClick={() => {
                        setSelectedCurrency(curr);
                        setIsCurrencyOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-[#222222] hover:bg-neutral-100"
                    >
                      <span>{curr}</span>
                      {selectedCurrency === curr && (
                        <Check className="h-3.5 w-3.5 stroke-[2] text-black" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
