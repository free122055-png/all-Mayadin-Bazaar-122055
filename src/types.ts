export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'blocked';
  phoneNumber?: string;
  photoURL?: string;
  passwordHash?: string;
  passwordSalt?: string;
  passwordUpdatedAt?: number;
  isPhoneVerified?: boolean;
  otpState?: 'OTP_PENDING' | 'OTP_VERIFIED' | 'OTP_EXPIRED' | 'OTP_FAILED';
  phoneVerifiedAt?: number;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  district: string;
  area: string;
  fullAddress: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  icon?: string;
  image?: string;
  parentId?: string | null; // For subcategories
  order: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "500g", "1kg"
  price: number;
  discountPrice?: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  description: string;
  descriptionBn: string;
  categoryId: string;
  subCategoryId?: string;
  images: string[];
  basePrice: number;
  discountPrice?: number;
  discountPercentage?: number;
  variants: ProductVariant[];
  sizes?: string[];
  colors?: string[];
  unit: string; // kg, gm, ltr, pcs
  stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock';
  isBestSelling: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  specifications: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  selectedSize?: string;
  selectedColor?: string;
  weight?: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
}

export interface OrderStatus {
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
  updatedAt: number;
  note?: string;
}

export interface DeliveryInfo {
  provider: 'steadfast' | 'redx' | 'pathao' | 'none';
  status: 'not_created' | 'created' | 'pickup_pending' | 'picked_up' | 'in_transit' | 'delivered' | 'returned' | 'failed' | 'cancelled';
  trackingId?: string;
  consignmentId?: string;
  courierCharge?: number;
  codFee?: number;
  merchantReceivable?: number;
  lastUpdated?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  codAmount: number;
  shippingAddress: Address;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  internalStatus: 'placed' | 'confirmed' | 'processing' | 'cancelled' | 'completed';
  deliveryInfo: DeliveryInfo;
  statusHistory: OrderStatus[];
  createdAt: number;
  updatedAt: number;
}

export interface Banner {
  id: string;
  image: string;
  title?: string;
  link?: string;
  order: number;
}

export interface DeliveryChargeConfig {
  area: string;
  charge: number;
  estimatedDays: string;
  freeDeliveryThreshold?: number;
}
