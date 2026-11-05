import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { db, verifyPassword, hashPassword } from './db.ts';
import { UserRole, PrepStatus } from '../src/types/index.ts';

export const apiRouter = express.Router();

// Active sessions memory store
const sessions = new Map<string, { userId: string; email: string; role: UserRole; name: string }>();

// Auth Middleware helper
export function requireAuth(allowedRoles?: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autorizado. Faça login primeiro.' });
    }
    const token = authHeader.split(' ')[1];
    const session = sessions.get(token);
    if (!session) {
      return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
    }

    if (allowedRoles && !allowedRoles.includes(session.role) && session.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado para o seu nível de permissão.' });
    }

    (req as any).user = session;
    next();
  };
}

/* ==========================================================================
   PUBLIC CLIENT ENDPOINTS
   ========================================================================== */

// Public Config (settings + active tables list)
apiRouter.get('/public/config', (req, res) => {
  res.json(db.getPublicConfig());
});

// Validate Table by Token or Number
apiRouter.get('/public/tables/:identifier', (req, res) => {
  const table = db.getTableByTokenOrNumber(req.params.identifier);
  if (!table) {
    return res.status(404).json({ error: 'Mesa não encontrada ou inativa.' });
  }
  res.json({
    id: table.id,
    number: table.number,
    name: table.name,
    token: table.token,
    active: table.active,
  });
});

// Public Menu (active categories, products, option groups)
apiRouter.get('/public/menu', (req, res) => {
  res.json(db.getPublicMenu());
});

// Create Order (Client)
apiRouter.post('/public/orders', (req, res) => {
  try {
    const { tableId, tableNumber, customerName, customerPhone, items, paymentMethod, cashChangeFor } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'O carrinho está vazio.' });
    }

    const state = db.getState();
    if (!state.settings.isOpen) {
      return res.status(400).json({ error: 'A lanchonete está fechada para novos pedidos no momento.' });
    }

    // Validate table if provided
    let finalTableNumber = tableNumber || 'Balcão';
    let finalTableId = tableId || 'tbl-balcao';

    if (tableId && tableId !== 'tbl-balcao') {
      const table = state.tables.find((t) => t.id === tableId && t.active);
      if (!table) {
        return res.status(400).json({ error: 'Mesa selecionada é inválida ou inativa.' });
      }
      finalTableNumber = table.number;
      finalTableId = table.id;
    }

    const order = db.createOrder({
      tableId: finalTableId,
      tableNumber: finalTableNumber,
      customerName,
      customerPhone,
      items,
      paymentMethod,
      cashChangeFor: cashChangeFor ? Number(cashChangeFor) : undefined,
    });

    res.status(201).json(order);
  } catch (err: any) {
    console.error('Error placing order:', err);
    res.status(400).json({ error: err.message || 'Erro ao processar pedido.' });
  }
});

// Client Order Tracking
apiRouter.get('/public/orders/:id', (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Token de acesso ao pedido não informado.' });
  }

  const order = db.getOrderByClientToken(req.params.id, token);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado ou acesso não autorizado.' });
  }

  res.json(order);
});

// Client Upload Payment Proof
apiRouter.post('/public/orders/:id/payment-proof', (req, res) => {
  try {
    const { token, fileDataUrl } = req.body;
    if (!token || !fileDataUrl) {
      return res.status(400).json({ error: 'Token e arquivo de comprovante são obrigatórios.' });
    }

    const updatedOrder = db.uploadPaymentProof(req.params.id, token, fileDataUrl);
    res.json(updatedOrder);
  } catch (err: any) {
    console.error('Error uploading proof:', err);
    res.status(400).json({ error: err.message || 'Erro ao enviar comprovante.' });
  }
});

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const state = db.getState();
  const user = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || !user.active) {
    return res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo.' });
  }

  const valid = verifyPassword(password, user.passwordHash, user.salt);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  sessions.set(sessionToken, sessionData);

  db.addAuditLog(user.name, 'Login', 'Painel Administrativo', `Usuário conectou com perfil ${user.role}`);

  res.json({
    token: sessionToken,
    user: sessionData,
  });
});

apiRouter.get('/auth/me', requireAuth(), (req, res) => {
  res.json({ user: (req as any).user });
});

apiRouter.post('/auth/logout', requireAuth(), (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    sessions.delete(token);
  }
  res.json({ success: true });
});

/* ==========================================================================
   ADMINISTRATIVE ENDPOINTS
   ========================================================================== */

// Dashboard Metrics
apiRouter.get('/admin/dashboard', requireAuth(), (req, res) => {
  const state = db.getState();
  const { period } = req.query; // 'today', 'week', 'month', 'all'

  const now = new Date();
  let filterDate = new Date(0);

  if (period === 'today') {
    filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const filteredOrders = state.orders.filter((o) => new Date(o.createdAt) >= filterDate);

  const totalOrders = filteredOrders.length;
  const grossRevenue = filteredOrders.reduce((sum, o) => sum + (o.prepStatus !== 'cancelado' ? o.total : 0), 0);

  const confirmedPayments = filteredOrders
    .filter((o) => o.paymentStatus === 'pagamento_aprovado' || o.paymentStatus === 'pago_no_caixa')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingPayments = filteredOrders
    .filter((o) => o.paymentStatus === 'aguardando_pagamento' || o.paymentStatus === 'comprovante_em_analise')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingProofsCount = filteredOrders.filter(
    (o) => o.paymentProof && o.paymentProof.status === 'em_analise'
  ).length;

  const ordersInPrep = filteredOrders.filter((o) => o.prepStatus === 'em_preparacao').length;
  const ordersReady = filteredOrders.filter((o) => o.prepStatus === 'pronto').length;
  const ordersWaiting = filteredOrders.filter((o) => o.prepStatus === 'aguardando_confirmacao').length;

  const deliveredOrders = filteredOrders.filter((o) => o.prepStatus === 'entregue');
  const deliveredOrdersCount = deliveredOrders.length;

  const deliveredAndPaidOrders = filteredOrders.filter(
    (o) => o.prepStatus === 'entregue' && (o.paymentStatus === 'pagamento_aprovado' || o.paymentStatus === 'pago_no_caixa')
  );
  const deliveredAndPaidCount = deliveredAndPaidOrders.length;
  const deliveredAndPaidTotal = deliveredAndPaidOrders.reduce((sum, o) => sum + o.total, 0);

  // Breakdown by payment method
  const paymentBreakdown = {
    pix: filteredOrders.filter((o) => o.paymentMethod === 'pix').reduce((sum, o) => sum + o.total, 0),
    dinheiro: filteredOrders.filter((o) => o.paymentMethod === 'dinheiro').reduce((sum, o) => sum + o.total, 0),
    cartao_maquininha: filteredOrders.filter((o) => o.paymentMethod === 'cartao_maquininha').reduce((sum, o) => sum + o.total, 0),
  };

  // Top products
  const productCountMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  filteredOrders.forEach((o) => {
    if (o.prepStatus !== 'cancelado') {
      o.items.forEach((it) => {
        if (!productCountMap[it.productId]) {
          productCountMap[it.productId] = { name: it.productName, quantity: 0, revenue: 0 };
        }
        productCountMap[it.productId].quantity += it.quantity;
        productCountMap[it.productId].revenue += it.totalItemPrice;
      });
    }
  });

  const topProducts = Object.values(productCountMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Total expenses in period
  const totalExpenses = state.expenses
    .filter((e) => new Date(e.createdAt) >= filterDate)
    .reduce((sum, e) => sum + e.amount, 0);

  const averageTicket = totalOrders > 0 ? grossRevenue / totalOrders : 0;

  res.json({
    period: period || 'all',
    totalOrders,
    grossRevenue,
    confirmedPayments,
    pendingPayments,
    pendingProofsCount,
    ordersInPrep,
    ordersReady,
    ordersWaiting,
    deliveredOrdersCount,
    deliveredAndPaidCount,
    deliveredAndPaidTotal,
    averageTicket,
    paymentBreakdown,
    topProducts,
    totalExpenses,
    netEstimatedBalance: confirmedPayments - totalExpenses,
  });
});

// Orders Management
apiRouter.get('/admin/orders', requireAuth(), (req, res) => {
  const state = db.getState();
  res.json(state.orders);
});

// Update Prep Status
apiRouter.patch('/admin/orders/:id/prep-status', requireAuth(), (req, res) => {
  const { prepStatus, notes } = req.body as { prepStatus: PrepStatus; notes?: string };
  const user = (req as any).user;
  const state = db.getState();
  const order = state.orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  const previousStatus = order.prepStatus;
  order.prepStatus = prepStatus;
  order.updatedAt = new Date().toISOString();

  // Deduct inventory when moving to 'confirmado' or 'em_preparacao' if not deducted before
  if (
    (prepStatus === 'confirmado' || prepStatus === 'em_preparacao') &&
    previousStatus === 'aguardando_confirmacao'
  ) {
    db.deductInventoryForOrder(order, user.name);
  }

  order.history.push({
    timestamp: new Date().toISOString(),
    action: `Status de preparo alterado para ${prepStatus}`,
    actor: `${user.name} (${user.role})`,
    details: notes,
  });

  db.addAuditLog(user.name, 'Alterar Preparo', order.id, `De ${previousStatus} para ${prepStatus}`);
  db.saveState();

  res.json(order);
});

// Update Payment Status
apiRouter.patch('/admin/orders/:id/payment', requireAuth(['admin', 'gerente', 'caixa']), (req, res) => {
  const { paymentStatus, notes } = req.body;
  const user = (req as any).user;
  const state = db.getState();
  const order = state.orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  order.paymentStatus = paymentStatus;
  order.updatedAt = new Date().toISOString();

  order.history.push({
    timestamp: new Date().toISOString(),
    action: `Status de pagamento alterado para: ${paymentStatus}`,
    actor: `${user.name} (${user.role})`,
    details: notes,
  });

  db.addAuditLog(user.name, 'Alterar Pagamento', order.id, `Novo status: ${paymentStatus}`);
  db.saveState();

  res.json(order);
});

// Proof Decision (Approve or Reject with reason)
apiRouter.post('/admin/orders/:id/proof-decision', requireAuth(['admin', 'gerente', 'caixa']), (req, res) => {
  const { decision, rejectionReason } = req.body as { decision: 'aprovado' | 'rejeitado'; rejectionReason?: string };
  const user = (req as any).user;
  const state = db.getState();
  const order = state.orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  if (!order.paymentProof) {
    return res.status(400).json({ error: 'Este pedido não possui comprovante anexado.' });
  }

  const now = new Date().toISOString();
  order.paymentProof.status = decision;
  order.paymentProof.reviewedBy = user.name;
  order.paymentProof.reviewedAt = now;
  order.paymentProof.rejectionReason = decision === 'rejeitado' ? rejectionReason : undefined;

  if (decision === 'aprovado') {
    order.paymentStatus = 'pagamento_aprovado';
  } else {
    order.paymentStatus = 'pagamento_recusado';
  }

  order.updatedAt = now;
  order.history.push({
    timestamp: now,
    action: `Comprovante ${decision === 'aprovado' ? 'APROVADO' : 'REJEITADO'}`,
    actor: `${user.name} (${user.role})`,
    details: rejectionReason,
  });

  db.addAuditLog(user.name, `Comprovante ${decision}`, order.id, rejectionReason || 'Comprovante conferido');
  db.saveState();

  res.json(order);
});

// Kitchen Screen (KDS) Active Orders
apiRouter.get('/admin/kitchen', requireAuth(), (req, res) => {
  const state = db.getState();
  const activeStatuses: PrepStatus[] = ['aguardando_confirmacao', 'confirmado', 'em_preparacao', 'pronto'];
  const kitchenOrders = state.orders
    .filter((o) => activeStatuses.includes(o.prepStatus))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(kitchenOrders);
});

/* ==========================================================================
   PRODUCTS & MENU MANAGEMENT
   ========================================================================== */

apiRouter.get('/admin/products', requireAuth(), (req, res) => {
  const state = db.getState();
  res.json(state.products);
});

apiRouter.post('/admin/products', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const data = req.body;

  if (!data.name || !data.categoryId || data.price === undefined) {
    return res.status(400).json({ error: 'Nome, categoria e preço são obrigatórios.' });
  }

  const id = `prod-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  const newProduct = {
    id,
    code: data.code || `PRD-${state.products.length + 1}`,
    name: data.name,
    categoryId: data.categoryId,
    description: data.description || '',
    price: Number(data.price),
    cost: data.cost ? Number(data.cost) : 0,
    image: data.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    available: data.available !== false,
    isFeatured: !!data.isFeatured,
    stockQuantity: Number(data.stockQuantity || 50),
    minStock: Number(data.minStock || 10),
    estimatedMinutes: Number(data.estimatedMinutes || 10),
    optionGroupIds: data.optionGroupIds || [],
    recipe: data.recipe || [],
    createdAt: now,
    updatedAt: now,
  };

  state.products.push(newProduct);
  db.addAuditLog(user.name, 'Criar Produto', newProduct.name, `Preço: R$ ${newProduct.price.toFixed(2)}`);
  db.saveState();

  res.status(201).json(newProduct);
});

apiRouter.put('/admin/products/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const index = state.products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const existing = state.products[index];
  const data = req.body;

  const updatedProduct = {
    ...existing,
    ...data,
    price: data.price !== undefined ? Number(data.price) : existing.price,
    cost: data.cost !== undefined ? Number(data.cost) : existing.cost,
    stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : existing.stockQuantity,
    minStock: data.minStock !== undefined ? Number(data.minStock) : existing.minStock,
    updatedAt: new Date().toISOString(),
  };

  state.products[index] = updatedProduct;
  db.addAuditLog(user.name, 'Atualizar Produto', updatedProduct.name);
  db.saveState();

  res.json(updatedProduct);
});

apiRouter.delete('/admin/products/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const index = state.products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const [removed] = state.products.splice(index, 1);
  db.addAuditLog(user.name, 'Excluir Produto', removed.name, 'Produto excluído permanentemente do cardápio');
  db.saveState();

  res.json({ message: 'Produto excluído com sucesso.', product: removed });
});

/* ==========================================================================
   CATEGORIES & OPTION GROUPS
   ========================================================================== */

apiRouter.get('/admin/categories', requireAuth(), (req, res) => {
  const state = db.getState();
  res.json(state.categories);
});

apiRouter.post('/admin/categories', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const { name, icon, order, active } = req.body;

  if (!name) return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });

  const newCategory = {
    id: `cat-${crypto.randomBytes(3).toString('hex')}`,
    name,
    icon: icon || '🍴',
    order: Number(order || state.categories.length + 1),
    active: active !== false,
  };

  state.categories.push(newCategory);
  db.addAuditLog(user.name, 'Criar Categoria', newCategory.name);
  db.saveState();

  res.status(201).json(newCategory);
});

apiRouter.put('/admin/categories/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const cat = state.categories.find((c) => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Categoria não encontrada.' });

  Object.assign(cat, req.body);
  db.addAuditLog(user.name, 'Atualizar Categoria', cat.name);
  db.saveState();

  res.json(cat);
});

apiRouter.delete('/admin/categories/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const index = state.categories.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Categoria não encontrada.' });

  const [removed] = state.categories.splice(index, 1);
  db.addAuditLog(user.name, 'Excluir Categoria', removed.name);
  db.saveState();

  res.json({ success: true, removed });
});

apiRouter.get('/admin/option-groups', requireAuth(), (req, res) => {
  const state = db.getState();
  res.json(state.optionGroups);
});

apiRouter.post('/admin/option-groups', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const { name, required, minChoices, maxChoices, options } = req.body;

  if (!name) return res.status(400).json({ error: 'Nome do grupo de opcionais é obrigatório.' });

  const newGroup = {
    id: `og-${crypto.randomBytes(3).toString('hex')}`,
    name,
    required: !!required,
    minChoices: Number(minChoices || 0),
    maxChoices: Number(maxChoices || 1),
    options: (options || []).map((o: any) => ({
      id: `opt-${crypto.randomBytes(3).toString('hex')}`,
      name: o.name,
      price: Number(o.price || 0),
      available: o.available !== false,
    })),
  };

  state.optionGroups.push(newGroup);
  db.addAuditLog(user.name, 'Criar Grupo Opcionais', newGroup.name);
  db.saveState();

  res.status(201).json(newGroup);
});

apiRouter.put('/admin/option-groups/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const group = state.optionGroups.find((g) => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Grupo não encontrado.' });

  Object.assign(group, req.body);
  db.addAuditLog(user.name, 'Atualizar Grupo Opcionais', group.name);
  db.saveState();

  res.json(group);
});

apiRouter.delete('/admin/option-groups/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const index = state.optionGroups.findIndex((g) => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Grupo não encontrado.' });

  const [removed] = state.optionGroups.splice(index, 1);
  db.addAuditLog(user.name, 'Excluir Grupo Opcionais', removed.name);
  db.saveState();

  res.json({ success: true, removed });
});

/* ==========================================================================
   TABLES & QR CODES
   ========================================================================== */

apiRouter.get('/admin/tables', requireAuth(), (req, res) => {
  const state = db.getState();
  res.json(state.tables);
});

apiRouter.post('/admin/tables', requireAuth(['admin', 'gerente']), async (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const { number, name } = req.body;

  if (!number) return res.status(400).json({ error: 'Número da mesa é obrigatório.' });

  const numStr = number.toString().padStart(2, '0');
  const existing = state.tables.find((t) => t.number === numStr);
  if (existing) {
    return res.status(400).json({ error: `Mesa ${numStr} já está cadastrada.` });
  }

  const token = `table_${numStr}_${crypto.randomBytes(4).toString('hex')}`;
  const tableUrl = `/?mesa=${numStr}&token=${token}`;

  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(tableUrl, {
      margin: 2,
      width: 320,
      color: { dark: '#ea580c', light: '#ffffff' },
    });
  } catch (err) {
    console.error('Error generating table QR code:', err);
  }

  const newTable = {
    id: `tbl-${numStr}`,
    number: numStr,
    name: name || `Mesa ${numStr}`,
    token,
    active: true,
    qrCodeDataUrl,
    createdAt: new Date().toISOString(),
  };

  state.tables.push(newTable);
  db.addAuditLog(user.name, 'Criar Mesa', `Mesa ${numStr}`, 'QR Code gerado com sucesso');
  db.saveState();

  res.status(201).json(newTable);
});

apiRouter.put('/admin/tables/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const table = state.tables.find((t) => t.id === req.params.id);
  if (!table) return res.status(404).json({ error: 'Mesa não encontrada.' });

  Object.assign(table, req.body);
  db.addAuditLog(user.name, 'Atualizar Mesa', `Mesa ${table.number}`);
  db.saveState();

  res.json(table);
});

apiRouter.post('/admin/tables/:id/regenerate-qr', requireAuth(['admin', 'gerente']), async (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const table = state.tables.find((t) => t.id === req.params.id);
  if (!table) return res.status(404).json({ error: 'Mesa não encontrada.' });

  table.token = `table_${table.number}_${crypto.randomBytes(4).toString('hex')}`;
  const tableUrl = `/?mesa=${table.number}&token=${table.token}`;

  try {
    table.qrCodeDataUrl = await QRCode.toDataURL(tableUrl, {
      margin: 2,
      width: 320,
      color: { dark: '#ea580c', light: '#ffffff' },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao gerar QR Code' });
  }

  db.addAuditLog(user.name, 'Regenerar QR Code', `Mesa ${table.number}`);
  db.saveState();

  res.json(table);
});

apiRouter.delete('/admin/tables/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const index = state.tables.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Mesa não encontrada.' });

  const [removed] = state.tables.splice(index, 1);
  db.addAuditLog(user.name, 'Excluir Mesa', `Mesa ${removed.number}`);
  db.saveState();

  res.json({ success: true, removed });
});

/* ==========================================================================
   INVENTORY (ESTOQUE) & EXPENSES
   ========================================================================== */

apiRouter.get('/admin/inventory', requireAuth(['admin', 'gerente', 'cozinha']), (req, res) => {
  const state = db.getState();
  res.json({
    items: state.inventoryItems,
    movements: state.inventoryMovements.slice(0, 100),
  });
});

apiRouter.post('/admin/inventory', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const data = req.body;

  if (!data.name || !data.unit) {
    return res.status(400).json({ error: 'Nome e unidade de medida são obrigatórios.' });
  }

  const newItem = {
    id: `inv-${crypto.randomBytes(4).toString('hex')}`,
    name: data.name,
    unit: data.unit,
    currentStock: Number(data.currentStock || 0),
    minStock: Number(data.minStock || 5),
    unitCost: Number(data.unitCost || 0),
    supplier: data.supplier || '',
    category: data.category || 'ingrediente',
    updatedAt: new Date().toISOString(),
  };

  state.inventoryItems.push(newItem);
  db.addAuditLog(user.name, 'Cadastrar Insumo', newItem.name, `Estoque inicial: ${newItem.currentStock} ${newItem.unit}`);
  db.saveState();

  res.status(201).json(newItem);
});

apiRouter.post('/admin/inventory/:id/movement', requireAuth(['admin', 'gerente', 'cozinha']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const item = state.inventoryItems.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item de estoque não encontrado.' });

  const { type, quantity, reason, cost } = req.body;
  const qty = Number(quantity);

  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantidade informada é inválida.' });
  }

  if (type === 'entrada') {
    item.currentStock = Number((item.currentStock + qty).toFixed(2));
  } else if (type === 'saida_manual') {
    item.currentStock = Math.max(0, Number((item.currentStock - qty).toFixed(2)));
  } else if (type === 'ajuste_inventario') {
    item.currentStock = qty;
  }

  item.updatedAt = new Date().toISOString();

  const movement = {
    id: `mov-${crypto.randomBytes(4).toString('hex')}`,
    inventoryItemId: item.id,
    type,
    quantity: qty,
    reason: reason || 'Movimentação manual registrada pelo operador',
    cost: cost ? Number(cost) : undefined,
    userName: user.name,
    createdAt: new Date().toISOString(),
  };

  state.inventoryMovements.unshift(movement);
  db.addAuditLog(user.name, `Estoque: ${type}`, item.name, `${qty} ${item.unit} - Motivo: ${reason}`);
  db.saveState();

  res.json({ item, movement });
});

// Expenses
apiRouter.get('/admin/expenses', requireAuth(['admin', 'gerente', 'caixa']), (req, res) => {
  const state = db.getState();
  res.json(state.expenses);
});

apiRouter.post('/admin/expenses', requireAuth(['admin', 'gerente', 'caixa']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const { title, category, amount, date, notes } = req.body;

  if (!title || !amount) {
    return res.status(400).json({ error: 'Título e valor da despesa são obrigatórios.' });
  }

  const newExpense = {
    id: `exp-${crypto.randomBytes(4).toString('hex')}`,
    title,
    category: category || 'outros',
    amount: Number(amount),
    date: date || new Date().toISOString().split('T')[0],
    notes: notes || '',
    registeredBy: user.name,
    createdAt: new Date().toISOString(),
  };

  state.expenses.unshift(newExpense);
  db.addAuditLog(user.name, 'Lançar Despesa', newExpense.title, `R$ ${newExpense.amount.toFixed(2)}`);
  db.saveState();

  res.status(201).json(newExpense);
});

apiRouter.delete('/admin/expenses/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const index = state.expenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Despesa não encontrada.' });

  const [removed] = state.expenses.splice(index, 1);
  db.addAuditLog(user.name, 'Excluir Despesa', removed.title, `R$ ${removed.amount.toFixed(2)}`);
  db.saveState();

  res.json({ success: true, removed });
});

// Cash Closing (Fechamento de Caixa)
apiRouter.get('/admin/cash-closings', requireAuth(['admin', 'gerente', 'caixa']), (req, res) => {
  const state = db.getState();
  res.json(state.cashClosings);
});

apiRouter.post('/admin/cash-closings', requireAuth(['admin', 'gerente', 'caixa']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  const { initialBalance, actualCashCounted, notes } = req.body;

  const initBal = Number(initialBalance || 0);
  const actualCount = Number(actualCashCounted || 0);

  // Calculate totals for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = state.orders.filter((o) => o.createdAt.startsWith(todayStr) && o.prepStatus !== 'cancelado');

  const totalPixConfirmed = todayOrders
    .filter((o) => o.paymentMethod === 'pix' && o.paymentStatus === 'pagamento_aprovado')
    .reduce((sum, o) => sum + o.total, 0);

  const totalCashReceived = todayOrders
    .filter((o) => o.paymentMethod === 'dinheiro' && (o.paymentStatus === 'pagamento_aprovado' || o.paymentStatus === 'pago_no_caixa'))
    .reduce((sum, o) => sum + o.total, 0);

  const totalCardReceived = todayOrders
    .filter((o) => o.paymentMethod === 'cartao_maquininha' && o.paymentStatus === 'pagamento_aprovado')
    .reduce((sum, o) => sum + o.total, 0);

  const totalExpenses = state.expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const calculatedBalance = initBal + totalCashReceived - totalExpenses;
  const difference = actualCount - calculatedBalance;

  const closing = {
    id: `cls-${crypto.randomBytes(4).toString('hex')}`,
    date: todayStr,
    initialBalance: initBal,
    totalPixConfirmed,
    totalCashReceived,
    totalCardReceived,
    totalExpenses,
    calculatedBalance,
    actualCashCounted: actualCount,
    difference,
    closedBy: user.name,
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  state.cashClosings.unshift(closing);
  db.addAuditLog(user.name, 'Fechamento de Caixa', `Data: ${todayStr}`, `Saldo Dinheiro Contado: R$ ${actualCount.toFixed(2)}, Dif: R$ ${difference.toFixed(2)}`);
  db.saveState();

  res.status(201).json(closing);
});

/* ==========================================================================
   USERS & RBAC
   ========================================================================== */

apiRouter.get('/admin/users', requireAuth(['admin']), (req, res) => {
  const state = db.getState();
  const safeUsers = state.users.map(({ passwordHash, salt, ...rest }) => rest);
  res.json(safeUsers);
});

apiRouter.post('/admin/users', requireAuth(['admin']), (req, res) => {
  const adminUser = (req as any).user;
  const state = db.getState();
  const { name, email, role, password, active } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Nome, e-mail, perfil e senha são obrigatórios.' });
  }

  const existing = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Já existe um usuário com este e-mail.' });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: `usr-${crypto.randomBytes(4).toString('hex')}`,
    name,
    email: email.trim().toLowerCase(),
    role: role as UserRole,
    active: active !== false,
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
  };

  state.users.push(newUser);
  db.addAuditLog(adminUser.name, 'Criar Usuário', newUser.name, `Perfil: ${newUser.role}`);
  db.saveState();

  const { passwordHash: _h, salt: _s, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

apiRouter.put('/admin/users/:id', requireAuth(['admin']), (req, res) => {
  const adminUser = (req as any).user;
  const state = db.getState();
  const user = state.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const { name, role, active, password } = req.body;
  if (name) user.name = name;
  if (role) user.role = role;
  if (active !== undefined) user.active = active;
  if (password) {
    const { hash, salt } = hashPassword(password);
    user.passwordHash = hash;
    user.salt = salt;
  }

  db.addAuditLog(adminUser.name, 'Atualizar Usuário', user.name, `Perfil: ${user.role}`);
  db.saveState();

  const { passwordHash: _h, salt: _s, ...safeUser } = user;
  res.json(safeUser);
});

apiRouter.delete('/admin/users/:id', requireAuth(['admin']), (req, res) => {
  const adminUser = (req as any).user;
  const state = db.getState();

  if (req.params.id === adminUser.userId) {
    return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário logado.' });
  }

  const index = state.users.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const admins = state.users.filter((u) => u.role === 'admin');
  if (state.users[index].role === 'admin' && admins.length <= 1) {
    return res.status(400).json({ error: 'Não é possível excluir o único administrador do sistema.' });
  }

  const [removed] = state.users.splice(index, 1);
  db.addAuditLog(adminUser.name, 'Excluir Usuário', removed.name, `Perfil: ${removed.role}`);
  db.saveState();

  res.json({ success: true, message: 'Usuário excluído com sucesso.' });
});

/* ==========================================================================
   SETTINGS & BACKUP
   ========================================================================== */

apiRouter.get('/admin/settings', requireAuth(), (req, res) => {
  const state = db.getState();
  res.json(state.settings);
});

apiRouter.put('/admin/settings', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  const state = db.getState();
  state.settings = { ...state.settings, ...req.body };

  db.addAuditLog(user.name, 'Atualizar Configurações', 'Configurações Gerais', 'Dados da lanchonete e Pix atualizados');
  db.saveState();

  res.json(state.settings);
});

// Full database backup export
apiRouter.get('/admin/backup', requireAuth(['admin']), (req, res) => {
  const state = db.getState();
  const safeBackup = {
    ...state,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    users: state.users.map(({ passwordHash, salt, ...rest }) => rest),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=ibplanches_backup_${new Date().toISOString().split('T')[0]}.json`);
  res.send(JSON.stringify(safeBackup, null, 2));
});

// Full database backup restore
apiRouter.post('/admin/backup/restore', requireAuth(['admin']), (req, res) => {
  const user = (req as any).user;
  try {
    const { backupData } = req.body;
    if (!backupData || !backupData.products || !backupData.tables) {
      return res.status(400).json({ error: 'Formato de backup inválido.' });
    }

    const state = db.getState();
    state.products = backupData.products;
    state.categories = backupData.categories || state.categories;
    state.optionGroups = backupData.optionGroups || state.optionGroups;
    state.tables = backupData.tables || state.tables;
    state.inventoryItems = backupData.inventoryItems || state.inventoryItems;
    state.settings = backupData.settings || state.settings;
    if (backupData.orders) state.orders = backupData.orders;

    db.addAuditLog(user.name, 'Restaurar Backup', 'Banco de Dados', 'Restauração realizada com sucesso');
    db.saveState();

    res.json({ success: true, message: 'Dados restaurados com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao restaurar backup.' });
  }
});

// Database Reset (Zerar base de dados local)
apiRouter.post('/admin/db/reset', requireAuth(['admin']), (req, res) => {
  const user = (req as any).user;
  try {
    db.resetDatabase();
    res.json({ success: true, message: 'Base de dados zerada com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao zerar base de dados.' });
  }
});

// Expenses Edit & Delete
apiRouter.put('/admin/expenses/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  try {
    const updated = db.updateExpense(req.params.id, req.body);
    db.addAuditLog(user.name, 'Editar Despesa', updated.title, `R$ ${updated.amount.toFixed(2)}`);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar despesa.' });
  }
});

// Cash Closings Edit & Delete
apiRouter.put('/admin/cash-closings/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  try {
    const updated = db.updateCashClosing(req.params.id, req.body);
    db.addAuditLog(user.name, 'Editar Fechamento de Caixa', `Data: ${updated.date}`);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar fechamento.' });
  }
});

apiRouter.delete('/admin/cash-closings/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  try {
    db.deleteCashClosing(req.params.id);
    db.addAuditLog(user.name, 'Excluir Fechamento de Caixa', req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao excluir fechamento.' });
  }
});

// Inventory Items & Movements Edit & Delete
apiRouter.put('/admin/inventory/items/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  try {
    const updated = db.updateInventoryItem(req.params.id, req.body);
    db.addAuditLog(user.name, 'Editar Insumo', updated.name);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar insumo.' });
  }
});

apiRouter.delete('/admin/inventory/items/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  try {
    db.deleteInventoryItem(req.params.id);
    db.addAuditLog(user.name, 'Excluir Insumo', req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao excluir insumo.' });
  }
});

apiRouter.delete('/admin/inventory/movements/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  try {
    db.deleteInventoryMovement(req.params.id);
    db.addAuditLog(user.name, 'Excluir Movimentação de Estoque', req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao excluir movimentação.' });
  }
});

// Orders & Payments Edit & Delete
apiRouter.put('/admin/orders/:id', requireAuth(['admin', 'gerente', 'caixa']), (req, res) => {
  const user = (req as any).user;
  try {
    const updated = db.updateOrder(req.params.id, req.body);
    db.addAuditLog(user.name, 'Editar Pedido', `#${updated.orderNumber}`);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar pedido.' });
  }
});

apiRouter.delete('/admin/orders/:id', requireAuth(['admin', 'gerente']), (req, res) => {
  const user = (req as any).user;
  try {
    db.deleteOrder(req.params.id);
    db.addAuditLog(user.name, 'Excluir Pedido', req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao excluir pedido.' });
  }
});
