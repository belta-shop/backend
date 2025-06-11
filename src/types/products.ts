import { Document, Types } from "mongoose";

export interface IProduct extends Document {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  coverList: string[];
  rating: number;
  reviews: number;
  viewsCount: number;
  ordersCount: number;
  purchaseCount: number;
  returnCount: number;
  offer?: Types.ObjectId;
  brand?: Types.ObjectId;
  subcategory?: Types.ObjectId;
  labels: Types.ObjectId[];
  tags: Types.ObjectId[];
  quantity: number;
  disabled: boolean;
  minPrice: number;
  price: number;
  finalPrice: number;
  employeeReadOnly: boolean;
}

export interface IOffer extends Document {
  nameAr?: string;
  nameEn?: string;
  product: Types.ObjectId;
  offerQuantity: number;
  maxPerClient: number;
  quantityPurchased: number;
  disabled: boolean;
  type: "percent" | "fixed";
  value: number;
  employeeReadOnly: boolean;
  calculateDiscountedPrice(originalPrice: number): number;
  isValid(): boolean;
  calculateFinalPrice(originalPrice: number, minPrice: number): number;
}
