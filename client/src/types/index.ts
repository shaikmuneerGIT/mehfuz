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
  paymentStatus?: string | null;
  paymentRef?: string | null;
  subtotalInr: number;
  shippingInr: number;
  totalInr: number;
  items: OrderItem[];
  createdAt: string;
}

export interface StockReceiptItem {
  id: string;
  variantId: string;
  labelSnapshot: string;
  quantity: number;
}

export interface StockReceipt {
  id: string;
  productId: string;
  productName: string;
  supplierName?: string | null;
  notes?: string | null;
  totalCostInr: number;
  receivedAt: string;
  items: StockReceiptItem[];
}

export interface Expense {
  id: string;
  title: string;
  category?: string | null;
  notes?: string | null;
  amountInr: number;
  incurredAt: string;
}

export interface CartLine {
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  imageUrl?: string | null;
  variantId: string;
  variantLabel: string;
  priceInr: number;
  quantity: number;
  maxStock: number;
}
