export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  origin?: string | null;
  _count?: { products: number };
}

export interface Variant {
  id: string;
  label: string;
  priceInr: number;
  stock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  origin?: string | null;
  badge?: string | null;
  imageUrl?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string;
  category: Category;
  variants: Variant[];
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  nameSnapshot: string;
  labelSnapshot: string;
  priceInr: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  notes?: string | null;
  status: string;
  paymentMethod: string;
  subtotalInr: number;
  shippingInr: number;
  totalInr: number;
  items: OrderItem[];
  createdAt: string;
}

export interface CartLine {
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  variantId: string;
  variantLabel: string;
  priceInr: number;
  quantity: number;
  maxStock: number;
}
