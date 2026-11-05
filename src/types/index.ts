export type UserRole = 'admin' | 'gerente' | 'caixa' | 'cozinha' | 'atendente';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Table {
  id: string;
  number: string;
  name: string;
  token: string;
  active: boolean;
  qrCodeDataUrl?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  icon?: string;
  active: boolean;
}

export interface OptionItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  minChoices: number;
  maxChoices: number;
  options: OptionItem[];
}

export interface RecipeItem {
  inventoryItemId: string;
  quantity: number;
  unit: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  description: string;
  price: number;
  cost?: number;
  image: string;
  additionalImages?: string[];
  available: boolean;
  isFeatured?: boolean;
  stockQuantity: number;
  minStock: number;
  estimatedMinutes?: number;
  optionGroupIds: string[];
  recipe?: RecipeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  quantity: number;
  selectedOptions: OrderItemOption[];
  notes?: string;
  totalItemPrice: number;
}

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao_maquininha';

export type PaymentStatus = 
  | 'aguardando_pagamento' 
  | 'comprovante_em_analise' 
  | 'pagamento_aprovado' 
  | 'pagamento_recusado' 
  | 'pago_no_caixa';

export type PrepStatus = 
  | 'aguardando_confirmacao' 
  | 'confirmado' 
  | 'em_preparacao' 
  | 'pronto' 
  | 'entregue' 
  | 'cancelado';

export interface PaymentProof {
  fileDataUrl: string;
  uploadedAt: string;
  status: 'em_analise' | 'aprovado' | 'rejeitado';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface OrderHistoryItem {
  timestamp: string;
  action: string;
  actor: string;
  details?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableId: string;
  tableNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashChangeFor?: number;
  paymentStatus: PaymentStatus;
  prepStatus: PrepStatus;
  paymentProof?: PaymentProof;
  clientToken: string;
  history: OrderHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string; // un, kg, g, l, ml, pct
  currentStock: number;
  minStock: number;
  unitCost: number;
  supplier?: string;
  category: 'ingrediente' | 'bebida' | 'embalagem' | 'outros';
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  type: 'entrada' | 'saida_manual' | 'venda_automatica' | 'ajuste_inventario';
  quantity: number;
  reason?: string;
  cost?: number;
  orderId?: string;
  userName: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'ingredientes' | 'bebidas' | 'embalagens' | 'limpeza' | 'outros';
  amount: number;
  date: string;
  notes?: string;
  registeredBy: string;
  createdAt: string;
}

export interface CashClosing {
  id: string;
  date: string;
  initialBalance: number;
  totalPixConfirmed: number;
  totalCashReceived: number;
  totalCardReceived: number;
  totalExpenses: number;
  calculatedBalance: number;
  actualCashCounted: number;
  difference: number;
  closedBy: string;
  notes?: string;
  createdAt: string;
}

export interface AppSettings {
  lanchoneteName: string;
  churchName: string;
  logoUrl: string;
  welcomeMessage: string;
  isOpen: boolean;
  openingHours: string;
  address: string;
  contactPhone: string;
  pixKey: string;
  pixKeyType: string;
  pixReceiverName: string;
  pixBankName: string;
  enableSoundAlerts: boolean;
  allowCashChange: boolean;
  serviceFeePercent: number;
  primaryColor: string;
  estimatedPrepTimeMinutes: number;
  kitchenInstructions: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details?: string;
}
