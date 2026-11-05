import {
  AppSettings,
  Table,
  Category,
  OptionGroup,
  Product,
  Order,
  InventoryItem,
  InventoryMovement,
  Expense,
  CashClosing,
  User,
  PrepStatus,
  PaymentStatus,
} from '../types/index.ts';

const TOKEN_KEY = 'ibplanches_auth_token';

export const api = {
  // Auth Token helpers
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Erro na requisição ao servidor');
    }

    return data as T;
  },

  /* Public API */
  async getPublicConfig(): Promise<{ settings: AppSettings; tables: Table[] }> {
    return this.request('/public/config');
  },

  async getTable(identifier: string): Promise<Table> {
    return this.request(`/public/tables/${encodeURIComponent(identifier)}`);
  },

  async getPublicMenu(): Promise<{
    categories: Category[];
    products: Product[];
    optionGroups: OptionGroup[];
  }> {
    return this.request('/public/menu');
  },

  async createOrder(orderData: {
    tableId: string;
    tableNumber: string;
    customerName?: string;
    customerPhone?: string;
    items: Array<{
      productId: string;
      quantity: number;
      selectedOptions?: Array<{ groupId: string; optionId: string }>;
      notes?: string;
    }>;
    paymentMethod: 'pix' | 'dinheiro' | 'cartao_maquininha';
    cashChangeFor?: number;
  }): Promise<Order> {
    return this.request('/public/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async getOrder(orderId: string, clientToken: string): Promise<Order> {
    return this.request(`/public/orders/${orderId}?token=${encodeURIComponent(clientToken)}`);
  },

  async uploadPaymentProof(orderId: string, clientToken: string, fileDataUrl: string): Promise<Order> {
    return this.request(`/public/orders/${orderId}/payment-proof`, {
      method: 'POST',
      body: JSON.stringify({ token: clientToken, fileDataUrl }),
    });
  },

  /* Auth */
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return this.request('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  },

  /* Admin */
  async getDashboard(period: 'today' | 'week' | 'month' | 'all' = 'today'): Promise<any> {
    return this.request(`/admin/dashboard?period=${period}`);
  },

  async getOrders(): Promise<Order[]> {
    return this.request('/admin/orders');
  },

  async updatePrepStatus(orderId: string, prepStatus: PrepStatus, notes?: string): Promise<Order> {
    return this.request(`/admin/orders/${orderId}/prep-status`, {
      method: 'PATCH',
      body: JSON.stringify({ prepStatus, notes }),
    });
  },

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus, notes?: string): Promise<Order> {
    return this.request(`/admin/orders/${orderId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus, notes }),
    });
  },

  async proofDecision(orderId: string, decision: 'aprovado' | 'rejeitado', rejectionReason?: string): Promise<Order> {
    return this.request(`/admin/orders/${orderId}/proof-decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, rejectionReason }),
    });
  },

  async getKitchenOrders(): Promise<Order[]> {
    return this.request('/admin/kitchen');
  },

  // Products
  async getProducts(): Promise<Product[]> {
    return this.request('/admin/products');
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.request(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async deleteProduct(id: string): Promise<void> {
    return this.request(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request('/admin/categories');
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    return this.request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    return this.request(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cat),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    return this.request(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Option Groups
  async getOptionGroups(): Promise<OptionGroup[]> {
    return this.request('/admin/option-groups');
  },

  async createOptionGroup(group: Partial<OptionGroup>): Promise<OptionGroup> {
    return this.request('/admin/option-groups', {
      method: 'POST',
      body: JSON.stringify(group),
    });
  },

  async updateOptionGroup(id: string, group: Partial<OptionGroup>): Promise<OptionGroup> {
    return this.request(`/admin/option-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(group),
    });
  },

  async deleteOptionGroup(id: string): Promise<void> {
    return this.request(`/admin/option-groups/${id}`, {
      method: 'DELETE',
    });
  },

  // Tables
  async getTables(): Promise<Table[]> {
    return this.request('/admin/tables');
  },

  async createTable(table: { number: string; name: string }): Promise<Table> {
    return this.request('/admin/tables', {
      method: 'POST',
      body: JSON.stringify(table),
    });
  },

  async updateTable(id: string, table: Partial<Table>): Promise<Table> {
    return this.request(`/admin/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(table),
    });
  },

  async deleteTable(id: string): Promise<void> {
    return this.request(`/admin/tables/${id}`, {
      method: 'DELETE',
    });
  },

  async regenerateTableQr(id: string): Promise<Table> {
    return this.request(`/admin/tables/${id}/regenerate-qr`, {
      method: 'POST',
    });
  },

  // Inventory
  async getInventory(): Promise<{ items: InventoryItem[]; movements: InventoryMovement[] }> {
    return this.request('/admin/inventory');
  },

  async createInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.request('/admin/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async recordStockMovement(
    itemId: string,
    movement: { type: string; quantity: number; reason?: string; cost?: number }
  ): Promise<any> {
    return this.request(`/admin/inventory/${itemId}/movement`, {
      method: 'POST',
      body: JSON.stringify(movement),
    });
  },

  // Expenses & Cash
  async getExpenses(): Promise<Expense[]> {
    return this.request('/admin/expenses');
  },

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    return this.request('/admin/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  async deleteExpense(id: string): Promise<void> {
    return this.request(`/admin/expenses/${id}`, { method: 'DELETE' });
  },

  async getCashClosings(): Promise<CashClosing[]> {
    return this.request('/admin/cash-closings');
  },

  async createCashClosing(closing: {
    initialBalance: number;
    actualCashCounted: number;
    notes?: string;
  }): Promise<CashClosing> {
    return this.request('/admin/cash-closings', {
      method: 'POST',
      body: JSON.stringify(closing),
    });
  },

  // Users
  async getUsers(): Promise<User[]> {
    return this.request('/admin/users');
  },

  async createUser(user: any): Promise<User> {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  async updateUser(id: string, user: any): Promise<User> {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },

  async deleteUser(id: string): Promise<void> {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    return this.request('/admin/settings');
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Backup, Restore & Reset DB
  async restoreBackup(backupData: any): Promise<any> {
    return this.request('/admin/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ backupData }),
    });
  },

  async resetDatabase(): Promise<any> {
    return this.request('/admin/db/reset', {
      method: 'POST',
    });
  },

  // Expenses CRUD
  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    return this.request(`/admin/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  },

  // Cash Closings CRUD
  async updateCashClosing(id: string, closing: Partial<CashClosing>): Promise<CashClosing> {
    return this.request(`/admin/cash-closings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(closing),
    });
  },

  async deleteCashClosing(id: string): Promise<void> {
    return this.request(`/admin/cash-closings/${id}`, {
      method: 'DELETE',
    });
  },

  // Inventory Items & Movements CRUD
  async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.request(`/admin/inventory/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  async deleteInventoryItem(id: string): Promise<void> {
    return this.request(`/admin/inventory/items/${id}`, {
      method: 'DELETE',
    });
  },

  async deleteInventoryMovement(id: string): Promise<void> {
    return this.request(`/admin/inventory/movements/${id}`, {
      method: 'DELETE',
    });
  },

  // Orders & Payments CRUD
  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    return this.request(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  async deleteOrder(id: string): Promise<void> {
    return this.request(`/admin/orders/${id}`, {
      method: 'DELETE',
    });
  },
};

