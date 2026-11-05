import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderItem, PaymentMethod } from '../types/index.ts';
import { api } from '../services/api.ts';

interface TableInfo {
  id: string;
  number: string;
  name: string;
  token?: string;
}

interface CartContextType {
  items: OrderItem[];
  table: TableInfo | null;
  setTable: (table: TableInfo | null) => void;
  addItem: (item: Omit<OrderItem, 'totalItemPrice'>) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  cashChangeFor: string;
  setCashChangeFor: (val: string) => void;
  activeOrderId: string | null;
  activeOrderToken: string | null;
  setActiveOrder: (orderId: string | null, clientToken: string | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isTrackingOpen: boolean;
  setIsTrackingOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ibplanches_cart_items';
const TABLE_STORAGE_KEY = 'ibplanches_table';
const ACTIVE_ORDER_KEY = 'ibplanches_active_order';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [table, setTableState] = useState<TableInfo | null>(() => {
    try {
      const saved = localStorage.getItem(TABLE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerName, setCustomerName] = useState(() => localStorage.getItem('ibp_cust_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('ibp_cust_phone') || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cashChangeFor, setCashChangeFor] = useState('');

  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_ORDER_KEY);
      return saved ? JSON.parse(saved).orderId : null;
    } catch {
      return null;
    }
  });

  const [activeOrderToken, setActiveOrderToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_ORDER_KEY);
      return saved ? JSON.parse(saved).clientToken : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed saving cart', e);
    }
  }, [items]);

  // Sync customer details
  useEffect(() => {
    localStorage.setItem('ibp_cust_name', customerName);
  }, [customerName]);

  useEffect(() => {
    localStorage.setItem('ibp_cust_phone', customerPhone);
  }, [customerPhone]);

  // Detect table from URL parameters (?mesa=01&token=table_01_xyz)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mesaParam = urlParams.get('mesa');
    const tokenParam = urlParams.get('token');

    if (mesaParam || tokenParam) {
      const identifier = tokenParam || mesaParam || '';
      api.getTable(identifier)
        .then((tbl) => {
          const tInfo: TableInfo = {
            id: tbl.id,
            number: tbl.number,
            name: tbl.name,
            token: tbl.token,
          };
          setTableState(tInfo);
          localStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(tInfo));
        })
        .catch((err) => {
          console.warn('Table validation failed from URL:', err);
        });
    }
  }, []);

  const setTable = (t: TableInfo | null) => {
    setTableState(t);
    if (t) {
      localStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(t));
    } else {
      localStorage.removeItem(TABLE_STORAGE_KEY);
    }
  };

  const setActiveOrder = (orderId: string | null, clientToken: string | null) => {
    setActiveOrderId(orderId);
    setActiveOrderToken(clientToken);
    if (orderId && clientToken) {
      localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify({ orderId, clientToken }));
    } else {
      localStorage.removeItem(ACTIVE_ORDER_KEY);
    }
  };

  const addItem = (itemData: Omit<OrderItem, 'totalItemPrice'>) => {
    // Calculate total price for options + base
    const optionsTotal = itemData.selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
    const unitWithOpts = itemData.unitPrice + optionsTotal;
    const totalItemPrice = unitWithOpts * itemData.quantity;

    // Check if identical item (same product, same options, same notes) is already in cart
    const existingIndex = items.findIndex((it) => {
      if (it.productId !== itemData.productId) return false;
      if ((it.notes || '') !== (itemData.notes || '')) return false;
      if (it.selectedOptions.length !== itemData.selectedOptions.length) return false;
      const sortedA = [...it.selectedOptions].map((o) => o.optionId).sort().join(',');
      const sortedB = [...itemData.selectedOptions].map((o) => o.optionId).sort().join(',');
      return sortedA === sortedB;
    });

    if (existingIndex > -1) {
      const updated = [...items];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + itemData.quantity;
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalItemPrice: unitWithOpts * newQty,
      };
      setItems(updated);
    } else {
      setItems([...items, { ...itemData, totalItemPrice }]);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    const updated = [...items];
    const it = updated[index];
    const optionsTotal = it.selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
    const unitWithOpts = it.unitPrice + optionsTotal;
    updated[index] = {
      ...it,
      quantity,
      totalItemPrice: unitWithOpts * quantity,
    };
    setItems(updated);
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((acc, it) => acc + it.totalItemPrice, 0);
  const total = subtotal;

  return (
    <CartContext.Provider
      value={{
        items,
        table,
        setTable,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        total,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        paymentMethod,
        setPaymentMethod,
        cashChangeFor,
        setCashChangeFor,
        activeOrderId,
        activeOrderToken,
        setActiveOrder,
        isCartOpen,
        setIsCartOpen,
        isTrackingOpen,
        setIsTrackingOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
