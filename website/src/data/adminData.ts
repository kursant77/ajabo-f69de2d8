import type { Order } from "./deliveryData";

// Demo admin credentials
export const ADMIN_CREDENTIALS = {
  username: "kursant410@gmail.com",
  password: "asadbek3723",
  displayName: "Admin Usta",
};

// Extended order type for admin
export interface AdminOrder extends Order {
  totalPrice: number;
  deliveryPerson?: string;
  paymentMethod?: "click" | "payme" | "paynet" | "uzum" | "cash";
}

// Mock orders with price for admin panel
export const adminMockOrders: AdminOrder[] = [
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
    totalPrice: 44000,
    deliveryPerson: "Sardor Yusupov",
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
    totalPrice: 35000,
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
    rawCreatedAt: new Date(),
    orderType: "delivery",
    totalPrice: 84000,
    deliveryPerson: "Sardor Yusupov",
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
    rawCreatedAt: new Date(),
    orderType: "delivery",
    totalPrice: 96000,
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
    rawCreatedAt: new Date(),
    orderType: "delivery",
    totalPrice: 90000,
    deliveryPerson: "Sardor Yusupov",
  },
];

// Sales statistics mock data
export const salesStats = {
  today: {
    orders: 12,
    revenue: 520000,
    delivered: 8,
    pending: 4,
  },
  week: {
    orders: 78,
    revenue: 3450000,
    delivered: 65,
    pending: 13,
  },
  month: {
    orders: 342,
    revenue: 14580000,
    delivered: 320,
    pending: 22,
  },
};

// Daily sales data for chart
export const dailySalesData = [
  { name: "Dush", orders: 12, revenue: 520000 },
  { name: "Sesh", orders: 15, revenue: 680000 },
  { name: "Chor", orders: 18, revenue: 790000 },
  { name: "Pay", orders: 14, revenue: 610000 },
  { name: "Jum", orders: 22, revenue: 950000 },
  { name: "Shan", orders: 28, revenue: 1200000 },
  { name: "Yak", orders: 20, revenue: 850000 },
];

// Top selling products
export const topProducts = [
  { name: "Cappuccino", sold: 45, revenue: 990000 },
  { name: "Club Sendvich", sold: 32, revenue: 1120000 },
  { name: "Latte", sold: 38, revenue: 912000 },
  { name: "Tiramisu", sold: 25, revenue: 700000 },
  { name: "Nonushta to'plami", sold: 18, revenue: 810000 },
];

// Delivery personnel
export const deliveryPersonnel = [
  { id: "1", name: "Sardor Yusupov", deliveries: 45, active: true },
  { id: "2", name: "Anvar Toshev", deliveries: 38, active: true },
  { id: "3", name: "Bekzod Rahimov", deliveries: 32, active: false },
];
