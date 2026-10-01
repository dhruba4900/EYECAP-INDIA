export type Role = "CUSTOMER" | "ADMIN" | "DELIVERY_PARTNER";

export type OrderStatus =
  | "ORDER_PLACED"
  | "PAYMENT_CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED";

export type DeliveryStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "ONLINE" | "COD";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface ProductVariantItem {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  size: string;
  sku: string;
  priceAdjustment: number;
  imageUrl?: string | null;
  availableStock?: number;
}

export interface ProductModel3DData {
  modelUrl?: string | null;
  posterUrl: string;
  modelType: string;
  lensColor: string;
  frameColor: string;
  metalness: number;
  roughness: number;
  transmission: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  headline?: string | null;
  description: string;
  basePrice: number;
  comparePrice?: number | null;
  sku: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  isFeatured: boolean;
  isNew: boolean;
  isPublished: boolean;
  frameShape: string;
  frameMaterial: string;
  lensMaterial: string;
  lensWidthMm: number;
  bridgeWidthMm: number;
  templeLengthMm: number;
  totalWeightG: number;
  genderStyle: string;
  rating: number;
  reviewCount: number;
  variants: ProductVariantItem[];
  images: { id: string; url: string; alt?: string | null; isPrimary: boolean }[];
  model3d?: ProductModel3DData | null;
  inventory?: {
    available: number;
    reserved: number;
    sold: number;
    lowStockThreshold: number;
  } | null;
}

export interface CartItemData {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  slug?: string;
  variantName?: string | null;
  colorHex?: string | null;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
  availableStock: number;
}

export interface CartSummary {
  items: CartItemData[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  appliedCoupon?: string | null;
}

export interface OrderItemData {
  id: string;
  productId: string;
  productName: string;
  variantName?: string | null;
  colorHex?: string | null;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  total: number;
  couponCode?: string | null;
  notes?: string | null;
  deliveryOtp?: string;
  shippingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    apartment?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  items: OrderItemData[];
  delivery?: {
    id: string;
    partnerId?: string | null;
    partnerName?: string;
    partnerPhone?: string;
    status: DeliveryStatus;
    customerOtp?: string;
    otpVerified: boolean;
    assignedAt?: string | null;
    acceptedAt?: string | null;
    pickedUpAt?: string | null;
    outForDeliveryAt?: string | null;
    deliveredAt?: string | null;
    failedReason?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}
