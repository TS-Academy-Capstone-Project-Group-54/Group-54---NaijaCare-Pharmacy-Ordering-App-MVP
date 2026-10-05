export type Medicine = {
  id: string;
  name: string;
  genericName: string;
  description: string;
  categoryId: string | null;
  categoryName?: string | null;
  price: string | number;
  quantityInStock: number;
  dosage: string;
  manufacturer: string;
  image: string | null;
  expiryDate: string;
  requiresPrescription: boolean;
  isAvailable: boolean;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
};