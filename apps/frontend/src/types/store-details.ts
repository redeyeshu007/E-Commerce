export interface StoreDetailsData {
  id: string;
  phone: string;
  address: string;
  email: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface UpdateStoreDetailsPayload {
  phone: string;
  address: string;
  email: string;
}
