export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

export type SessionPayload = {
  userId: string;
  email: string;
  role: "customer" | "admin";
  fullName: string;
};

export type CartItem = {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  image: string;
  availableStock: number;
};

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Ready for Delivery"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentStatus = "Pending" | "Paid" | "Failed";

export type OrderItem = {
  id: string;
  orderId: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
};

export type OrderSummary = {
  id: string;
  customerId?: string;
  customerName?: string | null;
  customerEmail?: string | null;
  totalAmount: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
};

export type OrderDetails = OrderSummary & {
  deliveryAddress: string;
  phoneNumber: string;
  items: OrderItem[];
};

export type AdminOrdersResponse = {
  items: OrderSummary[];
  stats: {
    totalOrders: number;
    pending: number;
    processing: number;
    completed: number;
  };
};
