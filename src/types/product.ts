/**
 * EYECAP — Shared Product Types
 *
 * Single source of truth for product-related types
 * used across the storefront.
 */

export interface ProductImage {
  url: string;
  alt?: string | null;
}

export interface ProductVariant {
  id: string;
  name: string;
  colorHex: string;
  colorName: string;
}

export interface ProductInventory {
  available: number;
  lowStockThreshold: number;
}

export interface ProductModel3D {
  url?: string | null;
  modelUrl?: string | null;
  posterUrl?: string | null;
  thumbnailUrl?: string | null;

  /**
   * Allows future 3D configuration without breaking
   * the shared product type.
   */
  [key: string]: unknown;
}

export interface Product {
  id: string;
  name: string;
  slug: string;

  headline?: string | null;

  basePrice: number;
  comparePrice?: number | null;

  frameShape: string;
  frameMaterial: string;

  rating: number;
  reviewCount: number;

  isFeatured?: boolean;
  isNew?: boolean;

  images: ProductImage[];

  variants?: ProductVariant[];

  model3d?: ProductModel3D | null;

  inventory?: ProductInventory | null;
}

export type ProductCardProduct = Product;