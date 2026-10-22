export interface MaterialItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  productCount: number;
}

export interface MaterialCardConfig {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  imageUrl: string;
  imageAlt?: string | null;
  materialId?: string | null;
  material?: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  } | null;
  order: number;
  isActive: boolean;
}

export interface MaterialSectionConfig {
  id: string;
  heading: string;
  version: number;
  updatedAt?: string;
  updatedBy?: string | null;
  cards: MaterialCardConfig[];
}

export interface MaterialSectionHistoryItem {
  id: string;
  version: number;
  heading: string;
  cards: MaterialCardConfig[];
  description?: string | null;
  createdAt: string;
  createdBy?: string | null;
}
