export interface Order {
  id: string;
  productName: string;
  quantity: number;
  customerName: string;
  phoneNumber: string;
  status: "pending" | "ready" | "on_way" | "delivered" | "pending_payment";
  address: string;
  createdAt: string;
  totalPrice?: number;
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
  },
  {
    id: "3",
    productName: "Tiramisu",
    quantity: 3,
    customerName: "Bobur Aliyev",
    phoneNumber: "+998 93 345 67 89",
    status: "delivered",
    address: "Mirzo Ulug'bek tumani, 78-uy",
    createdAt: "09:15",
  },
  {
    id: "4",
    productName: "Latte",
    quantity: 4,
    customerName: "Malika Tosheva",
    phoneNumber: "+998 94 456 78 90",
    status: "pending",
    address: "Sergeli tumani, 23-uy",
    createdAt: "11:00",
  },
  {
    id: "5",
    productName: "Nonushta to'plami",
    quantity: 2,
    customerName: "Jasur Qodirov",
    phoneNumber: "+998 95 567 89 01",
    status: "delivered",
    address: "Yakkasaroy tumani, 56-uy",
    createdAt: "08:30",
  },
];

// Demo credentials for delivery login
export const DEMO_CREDENTIALS = {
  username: "dastavkachi",
  password: "demo123",
  displayName: "Sardor Yusupov",
};
