import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refresh_token: refreshToken });
          const { access_token, refresh_token, user: userData } = res.data;
          localStorage.setItem("token", access_token);
          localStorage.setItem("refresh_token", refresh_token);
          localStorage.setItem("user", JSON.stringify(userData));
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          if (typeof window !== "undefined") {
            const isLoginPage = window.location.pathname === "/login" || window.location.pathname === "/register";
            if (!isLoginPage) window.location.href = "/login";
          }
        }
      } else {
        if (typeof window !== "undefined") {
          const isLoginPage = window.location.pathname === "/login" || window.location.pathname === "/register";
          if (!isLoginPage) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }
        }
      }
    }
    if (error.response?.status === 403) {
      const detail = error.response?.data?.detail;
      if (detail === "licence_expired" || detail?.includes("désactivé")) {
        if (typeof window !== "undefined") {
          const isActivatePage = window.location.pathname === "/activate";
          const isLoginPage = window.location.pathname === "/login" || window.location.pathname === "/register";
          if (!isActivatePage && !isLoginPage) {
            window.location.href = "/activate";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string | null;
  subscription_plan: string;
  wizard_completed: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  sku: string | null;
  price_cfa: number;
  cost_price_cfa: number;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  barcode: string | null;
  image_url: string | null;
  images?: { id: string; url: string; alt_text: string | null; is_primary: boolean }[];
  is_online: boolean;
  is_active: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  tenant_id: string;
  name: string;
  name_wo: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string | null;
  whatsapp_number: string | null;
  nickname: string | null;
  total_credit_cfa: number;
  notes: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_cfa: number;
  total_cfa: number;
}

export interface Sale {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  total_cfa: number;
  payment_method: string;
  payment_reference: string | null;
  is_credit: boolean;
  created_at: string;
  items: SaleItem[];
}

export interface DashboardSummary {
  inventory: {
    total_products: number;
    total_stock_value_cfa: number;
    low_stock_count: number;
    low_stock_products: { id: string; name: string; stock: number; threshold: number }[];
  };
  revenue: {
    total_sales: number;
    total_revenue_cfa: number;
    cash_cfa: number;
    wave_cfa: number;
    credit_cfa: number;
  };
  credit?: {
    total_outstanding_cfa: number;
    total_debtors: number;
  };
}

export interface WeeklyDay {
  date: string;
  day: string;
  sales: number;
  revenue: number;
}
