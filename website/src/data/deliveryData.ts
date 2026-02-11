export interface Order {
  id: string;
  productName: string;
  quantity: number;
  customerName: string;
  phoneNumber: string;
  status: "pending" | "ready" | "on_way" | "delivered" | "pending_payment";
  address: string;
  createdAt: string;
  rawCreatedAt: Date;
  totalPrice?: number;
  orderType: "delivery" | "takeaway" | "preorder";
  telegramUserId?: number | null;
  paymentMethod?: "click" | "payme" | "paynet" | "uzum" | "cash";
  deliveryPerson?: string;
}

export const mockOrders: Order[] = [
  {
    id: "1",
    productName: "Cappuccino",
    quantity: 2,
    customerName: "Aziz Karimov",
    phoneNumber: "+998 90 123 45 67",
    status: "pending",
    address: "Yunusobod tumani, 12-uy",
    createdAt: "10:30",
    rawCreatedAt: new Date(),
    orderType: "delivery",
  },
  {
    id: "2",
    productName: "Club Sendvich",
    quantity: 1,
    customerName: "Nilufar Rahimova",
    phoneNumber: "+998 91 234 56 78",
    status: "pending",
    address: "Chilonzor tumani, 45-uy",
    createdAt: "10:45",
    rawCreatedAt: new Date(),
    orderType: "delivery",
  },
];

// Demo credentials for delivery login
export const DEMO_CREDENTIALS = {
  username: "dastavkachi",
  password: "demo123",
  displayName: "Sardor Yusupov",
};
