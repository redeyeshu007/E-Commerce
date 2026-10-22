export interface InstagramImageItem {
  id: string;
  imageUrl: string;
  altText?: string | null;
  postUrl?: string | null;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InstagramSectionConfig {
  id: string;
  heading: string;
  handle: string;
  profileUrl: string | null;
  isActive: boolean;
  version: number;
  updatedAt?: string;
  updatedBy?: string | null;
  images: InstagramImageItem[];
}

export interface InstagramHistoryItem {
  id: string;
  version: number;
  heading: string;
  handle: string;
  profileUrl: string | null;
  isActive: boolean;
  imagesCount: number;
  description?: string | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface UpdateInstagramSectionPayload {
  heading?: string;
  handle?: string;
  profileUrl?: string | null;
  isActive?: boolean;
  images?: Array<{
    id?: string;
    imageUrl: string;
    altText?: string | null;
    postUrl?: string | null;
    order?: number;
    isActive?: boolean;
  }>;
}
