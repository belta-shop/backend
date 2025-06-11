import { Document, Schema } from "mongoose";

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
  offer?: {
    offer: Schema.Types.ObjectId;
    quantityPurchased: number;
    disabled: boolean;
  };
  brand: Schema.Types.ObjectId;
  labels: Schema.Types.ObjectId[];
  tags: Schema.Types.ObjectId[];
  quantity: number;
  disabled: boolean;
  minPrice: number;
}
