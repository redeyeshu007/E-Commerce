export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  imageAlt?: string | null;
  description?: string | null;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  imageUrl: string;
  imageAlt?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  imageUrl?: string;
  imageAlt?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}
