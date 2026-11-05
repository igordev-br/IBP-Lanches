import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import {
  User,
  Table,
  Category,
  OptionGroup,
  Product,
  Order,
  InventoryItem,
  InventoryMovement,
  Expense,
  CashClosing,
  AppSettings,
  AuditLog,
} from '../src/types/index.ts';

export interface DatabaseState {
  users: (User & { passwordHash: string; salt: string })[];
  tables: Table[];
  categories: Category[];
  optionGroups: OptionGroup[];
  products: Product[];
  orders: Order[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  expenses: Expense[];
  cashClosings: CashClosing[];
  settings: AppSettings;
  auditLogs: AuditLog[];
  nextOrderNumber: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ibplanches_db.json');

// Password hash helper
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verify;
}

class Database {
  private state: DatabaseState | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private async ensureInitialized() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.state = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db file, regenerating seed data...', err);
        await this.generateSeedData();
      }
    } else {
      await this.generateSeedData();
    }
  }

  private async generateSeedData() {
    const adminAuth = hashPassword('admin123');
    const gerenteAuth = hashPassword('gerente123');
    const caixaAuth = hashPassword('caixa123');
    const cozinhaAuth = hashPassword('cozinha123');
    const atendenteAuth = hashPassword('atendente123');

    const defaultUsers = [
      {
        id: 'usr-admin',
        name: 'Pastor / Admin Geral',
        email: 'admin@ibplanches.org.br',
        role: 'admin' as const,
        active: true,
        passwordHash: adminAuth.hash,
        salt: adminAuth.salt,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-gerente',
        name: 'Coordenação Lanchonete',
        email: 'gerente@ibplanches.org.br',
        role: 'gerente' as const,
        active: true,
        passwordHash: gerenteAuth.hash,
        salt: gerenteAuth.salt,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-caixa',
        name: 'Operador de Caixa',
        email: 'caixa@ibplanches.org.br',
        role: 'caixa' as const,
        active: true,
        passwordHash: caixaAuth.hash,
        salt: caixaAuth.salt,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-cozinha',
        name: 'Equipe da Cozinha',
        email: 'cozinha@ibplanches.org.br',
        role: 'cozinha' as const,
        active: true,
        passwordHash: cozinhaAuth.hash,
        salt: cozinhaAuth.salt,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-atendente',
        name: 'Voluntário Atendimento',
        email: 'atendente@ibplanches.org.br',
        role: 'atendente' as const,
        active: true,
        passwordHash: atendenteAuth.hash,
        salt: atendenteAuth.salt,
        createdAt: new Date().toISOString(),
      },
    ];

    const defaultCategories: Category[] = [
      { id: 'cat-lanches', name: 'Hambúrgueres & Lanches', order: 1, icon: '🍔', active: true },
      { id: 'cat-salgados', name: 'Salgados & Pastéis', order: 2, icon: '🥟', active: true },
      { id: 'cat-porcoes', name: 'Porções da Comunhão', order: 3, icon: '🍟', active: true },
      { id: 'cat-bebidas', name: 'Bebidas Geladas', order: 4, icon: '🥤', active: true },
      { id: 'cat-doces', name: 'Doces & Sobremesas', order: 5, icon: '🍰', active: true },
      { id: 'cat-combos', name: 'Combos Especiais', order: 6, icon: '✨', active: true },
    ];

    const defaultOptionGroups: OptionGroup[] = [
      {
        id: 'og-ponto',
        name: 'Ponto da Carne',
        required: true,
        minChoices: 1,
        maxChoices: 1,
        options: [
          { id: 'opt-ao-ponto', name: 'Ao Ponto (suculenta)', price: 0, available: true },
          { id: 'opt-bem-passado', name: 'Bem Passado', price: 0, available: true },
          { id: 'opt-ponto-menos', name: 'Ao Ponto para Mal Passado', price: 0, available: true },
        ],
      },
      {
        id: 'og-adicionais-lanche',
        name: 'Adicionais Saborosos',
        required: false,
        minChoices: 0,
        maxChoices: 4,
        options: [
          { id: 'opt-bacon-extra', name: 'Bacon Crocante Extra', price: 4.5, available: true },
          { id: 'opt-queijo-extra', name: 'Cheddar Cremoso Extra', price: 3.5, available: true },
          { id: 'opt-cebola-caramelizada', name: 'Cebola Caramelizada', price: 3.0, available: true },
          { id: 'opt-ovo-frito', name: 'Ovo Frito na Chapa', price: 2.5, available: true },
        ],
      },
      {
        id: 'og-molho-especial',
        name: 'Molho Artesanal',
        required: false,
        minChoices: 0,
        maxChoices: 2,
        options: [
          { id: 'opt-maionese-verde', name: 'Maionese Verde da Casa', price: 2.0, available: true },
          { id: 'opt-barbecue-defumado', name: 'Barbecue Defumado', price: 2.0, available: true },
          { id: 'opt-alho-ervas', name: 'Molho de Alho com Ervas', price: 2.0, available: true },
        ],
      },
      {
        id: 'og-refrigerante-tipo',
        name: 'Escolha o Refrigerante',
        required: true,
        minChoices: 1,
        maxChoices: 1,
        options: [
          { id: 'opt-coca-normal', name: 'Coca-Cola Original 350ml', price: 0, available: true },
          { id: 'opt-coca-zero', name: 'Coca-Cola Sem Açúcar 350ml', price: 0, available: true },
          { id: 'opt-guarana-antarctica', name: 'Guaraná Antarctica 350ml', price: 0, available: true },
          { id: 'opt-fanta-laranja', name: 'Fanta Laranja 350ml', price: 0, available: true },
        ],
      },
    ];

    const defaultInventoryItems: InventoryItem[] = [
      { id: 'inv-pao-brioche', name: 'Pão de Hambúrguer Brioche', unit: 'un', currentStock: 80, minStock: 20, unitCost: 1.8, category: 'ingrediente', updatedAt: new Date().toISOString() },
      { id: 'inv-carne-150g', name: 'Blend Bovino Artesanal 150g', unit: 'un', currentStock: 75, minStock: 25, unitCost: 4.5, category: 'ingrediente', updatedAt: new Date().toISOString() },
      { id: 'inv-cheddar', name: 'Queijo Cheddar Fatiado (kg)', unit: 'kg', currentStock: 5.5, minStock: 2.0, unitCost: 38.0, category: 'ingrediente', updatedAt: new Date().toISOString() },
      { id: 'inv-bacon', name: 'Bacon Fatiado Defumado (kg)', unit: 'kg', currentStock: 4.2, minStock: 1.5, unitCost: 42.0, category: 'ingrediente', updatedAt: new Date().toISOString() },
      { id: 'inv-coxinha', name: 'Coxinha de Frango c/ Catupiry Congelada', unit: 'un', currentStock: 60, minStock: 20, unitCost: 2.8, category: 'ingrediente', updatedAt: new Date().toISOString() },
      { id: 'inv-pastel-carne', name: 'Pastel de Carne Artesanal', unit: 'un', currentStock: 45, minStock: 15, unitCost: 3.0, category: 'ingrediente', updatedAt: new Date().toISOString() },
      { id: 'inv-batata-frita', name: 'Batata Palito Pré-Frita (pct 2kg)', unit: 'pct', currentStock: 12, minStock: 4, unitCost: 24.0, category: 'ingrediente', updatedAt: new Date().toISOString() },
      { id: 'inv-coca-lata', name: 'Coca-Cola 350ml Lata', unit: 'un', currentStock: 96, minStock: 30, unitCost: 3.2, category: 'bebida', updatedAt: new Date().toISOString() },
      { id: 'inv-guarana-lata', name: 'Guaraná 350ml Lata', unit: 'un', currentStock: 72, minStock: 24, unitCost: 3.0, category: 'bebida', updatedAt: new Date().toISOString() },
      { id: 'inv-agua-sem-gas', name: 'Água Mineral sem Gás 500ml', unit: 'un', currentStock: 120, minStock: 40, unitCost: 1.2, category: 'bebida', updatedAt: new Date().toISOString() },
      { id: 'inv-suco-laranja', name: 'Laranja pera fresca (kg)', unit: 'kg', currentStock: 25, minStock: 10, unitCost: 4.0, category: 'ingrediente', updatedAt: new Date().toISOString() },
      { id: 'inv-bolo-pote', name: 'Bolo no Pote Brigadeiro Gourmet', unit: 'un', currentStock: 35, minStock: 10, unitCost: 4.5, category: 'ingrediente', updatedAt: new Date().toISOString() },
      { id: 'inv-pudim', name: 'Pudim de Leite Condensado Individual', unit: 'un', currentStock: 20, minStock: 8, unitCost: 4.0, category: 'ingrediente', updatedAt: new Date().toISOString() },
      { id: 'inv-embalagem-lanche', name: 'Caixa Kraft para Hambúrguer', unit: 'un', currentStock: 150, minStock: 40, unitCost: 0.75, category: 'embalagem', updatedAt: new Date().toISOString() },
      { id: 'inv-copo-500ml', name: 'Copo Descartável 500ml', unit: 'un', currentStock: 200, minStock: 50, unitCost: 0.25, category: 'embalagem', updatedAt: new Date().toISOString() },
    ];

    const defaultProducts: Product[] = [
      {
        id: 'prod-xbacon',
        code: 'LAN-01',
        name: 'X-Bacon Artesanal da Casa',
        categoryId: 'cat-lanches',
        description: 'Pão brioche selado na manteiga, blend bovino 150g suculento, fatias generosas de bacon crocante, cheddar derretido e maionese verde da casa.',
        price: 26.0,
        cost: 11.5,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: true,
        stockQuantity: 45,
        minStock: 10,
        estimatedMinutes: 12,
        optionGroupIds: ['og-ponto', 'og-adicionais-lanche', 'og-molho-especial'],
        recipe: [
          { inventoryItemId: 'inv-pao-brioche', quantity: 1, unit: 'un' },
          { inventoryItemId: 'inv-carne-150g', quantity: 1, unit: 'un' },
          { inventoryItemId: 'inv-bacon', quantity: 0.05, unit: 'kg' },
          { inventoryItemId: 'inv-cheddar', quantity: 0.04, unit: 'kg' },
          { inventoryItemId: 'inv-embalagem-lanche', quantity: 1, unit: 'un' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-xsalada',
        code: 'LAN-02',
        name: 'X-Salada Tradicional Especial',
        categoryId: 'cat-lanches',
        description: 'Blend bovino 150g, queijo prato derretido, alface americana fresca, rodelas de tomate maduro e maionese especial no pão brioche.',
        price: 22.0,
        cost: 9.8,
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: true,
        stockQuantity: 40,
        minStock: 10,
        estimatedMinutes: 10,
        optionGroupIds: ['og-ponto', 'og-adicionais-lanche', 'og-molho-especial'],
        recipe: [
          { inventoryItemId: 'inv-pao-brioche', quantity: 1, unit: 'un' },
          { inventoryItemId: 'inv-carne-150g', quantity: 1, unit: 'un' },
          { inventoryItemId: 'inv-embalagem-lanche', quantity: 1, unit: 'un' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-hotdog-prensado',
        code: 'LAN-03',
        name: 'Cachorro-Quente Prensado Especial',
        categoryId: 'cat-lanches',
        description: 'Pão de hot dog macio, duas salsichas grelhadas, molho de tomate caseiro com especiarias, milho, purê de batata cremoso, batata palha e queijo ralado prensado.',
        price: 18.0,
        cost: 7.2,
        image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: false,
        stockQuantity: 30,
        minStock: 8,
        estimatedMinutes: 8,
        optionGroupIds: ['og-molho-especial'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-coxinha',
        code: 'SAL-01',
        name: 'Coxinha Dourada com Catupiry',
        categoryId: 'cat-salgados',
        description: 'Massa cremosa à base de caldo caseiro, recheio farto de peito de frango desfiado temperado com ervas finas e requeijão Catupiry legítimo.',
        price: 9.5,
        cost: 3.2,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: true,
        stockQuantity: 60,
        minStock: 15,
        estimatedMinutes: 4,
        optionGroupIds: ['og-molho-especial'],
        recipe: [
          { inventoryItemId: 'inv-coxinha', quantity: 1, unit: 'un' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-pastel-carne',
        code: 'SAL-02',
        name: 'Pastel Frito de Carne com Azeitona',
        categoryId: 'cat-salgados',
        description: 'Massa crocante e sequinha, recheio farto de carne moída bem refogada, ovo cozido picadinho e azeitona verde.',
        price: 10.0,
        cost: 3.5,
        image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: false,
        stockQuantity: 45,
        minStock: 12,
        estimatedMinutes: 6,
        optionGroupIds: ['og-molho-especial'],
        recipe: [
          { inventoryItemId: 'inv-pastel-carne', quantity: 1, unit: 'un' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-pao-de-queijo',
        code: 'SAL-03',
        name: 'Porção de Mini Pão de Queijo Mineiro (6 un)',
        categoryId: 'cat-salgados',
        description: 'Feitos com queijo Canastra legítimo, quentinhos e crocantes por fora, macios por dentro.',
        price: 12.0,
        cost: 4.2,
        image: 'https://images.unsplash.com/photo-1598188306155-25e400eb5078?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: false,
        stockQuantity: 25,
        minStock: 6,
        estimatedMinutes: 5,
        optionGroupIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-batata-frita-bacon',
        code: 'POR-01',
        name: 'Batata Rústica com Cheddar & Bacon',
        categoryId: 'cat-porcoes',
        description: '400g de batata frita bem crocante coberta com cheddar derretido cremoso e farofa de bacon defumado.',
        price: 24.0,
        cost: 8.5,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: true,
        stockQuantity: 20,
        minStock: 5,
        estimatedMinutes: 12,
        optionGroupIds: ['og-molho-especial'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-coca-cola',
        code: 'BEB-01',
        name: 'Refrigerante em Lata 350ml',
        categoryId: 'cat-bebidas',
        description: 'Lata trincando de gelada. Escolha seu sabor favorito.',
        price: 6.0,
        cost: 3.2,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: false,
        stockQuantity: 96,
        minStock: 25,
        estimatedMinutes: 2,
        optionGroupIds: ['og-refrigerante-tipo'],
        recipe: [
          { inventoryItemId: 'inv-coca-lata', quantity: 1, unit: 'un' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-suco-laranja',
        code: 'BEB-02',
        name: 'Suco Natural de Laranja 400ml',
        categoryId: 'cat-bebidas',
        description: 'Espremido na hora, 100% fruta pura e refrescante, com ou sem gelo.',
        price: 9.0,
        cost: 3.5,
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: false,
        stockQuantity: 50,
        minStock: 10,
        estimatedMinutes: 4,
        optionGroupIds: [],
        recipe: [
          { inventoryItemId: 'inv-suco-laranja', quantity: 0.4, unit: 'kg' },
          { inventoryItemId: 'inv-copo-500ml', quantity: 1, unit: 'un' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-agua-mineral',
        code: 'BEB-03',
        name: 'Água Mineral com/sem Gás 500ml',
        categoryId: 'cat-bebidas',
        description: 'Garrafinha fresca para hidratar a comunhão.',
        price: 4.0,
        cost: 1.2,
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: false,
        stockQuantity: 120,
        minStock: 30,
        estimatedMinutes: 1,
        optionGroupIds: [],
        recipe: [
          { inventoryItemId: 'inv-agua-sem-gas', quantity: 1, unit: 'un' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-bolo-pote',
        code: 'DOC-01',
        name: 'Bolo no Pote Brigadeiro Gourmet',
        categoryId: 'cat-doces',
        description: 'Massa fofinha de chocolate 50% cacau, intercalada com camadas generosas de brigadeiro artesanal e granulado nobre.',
        price: 11.0,
        cost: 4.5,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: true,
        stockQuantity: 35,
        minStock: 8,
        estimatedMinutes: 2,
        optionGroupIds: [],
        recipe: [
          { inventoryItemId: 'inv-bolo-pote', quantity: 1, unit: 'un' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-combo-comunhao',
        code: 'CMB-01',
        name: 'Combo Comunhão (X-Bacon + Batata + Refri)',
        categoryId: 'cat-combos',
        description: 'O combo favorito da igreja! 1 X-Bacon Artesanal suculento + 1 porção individual de batatas crocantes + 1 Refrigerante em lata geladinho.',
        price: 36.0,
        cost: 16.5,
        image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80',
        available: true,
        isFeatured: true,
        stockQuantity: 30,
        minStock: 10,
        estimatedMinutes: 12,
        optionGroupIds: ['og-ponto', 'og-refrigerante-tipo', 'og-molho-especial'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Seed Tables 01 to 08 with tokens and QR code data URLs
    const defaultTables: Table[] = [];
    for (let i = 1; i <= 8; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      const token = `table_${numStr}_${crypto.randomBytes(4).toString('hex')}`;
      const tableUrl = `/?mesa=${numStr}&token=${token}`;
      let qrCodeDataUrl = '';
      try {
        qrCodeDataUrl = await QRCode.toDataURL(tableUrl, {
          margin: 2,
          width: 320,
          color: {
            dark: '#ea580c',
            light: '#ffffff',
          },
        });
      } catch (err) {
        console.error('QR code generation error', err);
      }

      defaultTables.push({
        id: `tbl-${numStr}`,
        number: numStr,
        name: `Mesa ${numStr} — Salão de Comunhão`,
        token,
        active: true,
        qrCodeDataUrl,
        createdAt: new Date().toISOString(),
      });
    }

    const defaultSettings: AppSettings = {
      lanchoneteName: 'IBPLanches',
      churchName: 'Igreja Batista Pioneira',
      logoUrl: '/icon.svg',
      welcomeMessage: 'Bem-vindo à lanchonete da igreja! Faça seu pedido com facilidade pelo celular.',
      isOpen: true,
      openingHours: 'Domingos após o culto (19h30 às 22h30) e Quartas (20h30 às 22h00)',
      address: 'Av. Esperança, 450 - Bairro Central',
      contactPhone: '(11) 98765-4321',
      pixKey: 'financeiro@ibplanches.org.br',
      pixKeyType: 'Chave E-mail',
      pixReceiverName: 'Lanchonete da Igreja Batista',
      pixBankName: 'Banco Cooperativo Sicredi',
      enableSoundAlerts: true,
      allowCashChange: true,
      serviceFeePercent: 0,
      primaryColor: '#ea580c',
      estimatedPrepTimeMinutes: 15,
      kitchenInstructions: 'Capricho no preparo e amor em cada entrega aos irmãos.',
    };

    // Pre-create a couple of sample orders so the dashboard & KDS are immediately rich and testable
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const twentyMinAgo = new Date(now.getTime() - 25 * 60 * 1000).toISOString();

    const sampleOrders: Order[] = [
      {
        id: 'PED-101',
        orderNumber: 101,
        tableId: 'tbl-03',
        tableNumber: '03',
        customerName: 'Irmão Carlos',
        customerPhone: '(11) 99888-7766',
        items: [
          {
            productId: 'prod-xbacon',
            productName: 'X-Bacon Artesanal da Casa',
            productCode: 'LAN-01',
            unitPrice: 26.0,
            quantity: 1,
            selectedOptions: [
              { groupId: 'og-ponto', groupName: 'Ponto da Carne', optionId: 'opt-ao-ponto', optionName: 'Ao Ponto (suculenta)', price: 0 },
              { groupId: 'og-adicionais-lanche', groupName: 'Adicionais', optionId: 'opt-bacon-extra', optionName: 'Bacon Crocante Extra', price: 4.5 },
            ],
            notes: 'Sem cebola, por favor',
            totalItemPrice: 30.5,
          },
          {
            productId: 'prod-coca-cola',
            productName: 'Refrigerante em Lata 350ml',
            productCode: 'BEB-01',
            unitPrice: 6.0,
            quantity: 1,
            selectedOptions: [
              { groupId: 'og-refrigerante-tipo', groupName: 'Refrigerante', optionId: 'opt-coca-zero', optionName: 'Coca-Cola Sem Açúcar 350ml', price: 0 },
            ],
            totalItemPrice: 6.0,
          },
        ],
        subtotal: 36.5,
        discount: 0,
        total: 36.5,
        paymentMethod: 'pix',
        paymentStatus: 'pagamento_aprovado',
        prepStatus: 'em_preparacao',
        paymentProof: {
          fileDataUrl: '',
          uploadedAt: twentyMinAgo,
          status: 'aprovado',
          reviewedBy: 'Operador de Caixa',
          reviewedAt: tenMinAgo,
        },
        clientToken: 'token_sample_101_cl',
        history: [
          { timestamp: twentyMinAgo, action: 'Pedido criado', actor: 'Cliente (Mesa 03)' },
          { timestamp: twentyMinAgo, action: 'Comprovante Pix enviado', actor: 'Cliente' },
          { timestamp: tenMinAgo, action: 'Comprovante Pix aprovado', actor: 'Caixa' },
          { timestamp: tenMinAgo, action: 'Iniciado preparo na chapa', actor: 'Cozinha' },
        ],
        createdAt: twentyMinAgo,
        updatedAt: tenMinAgo,
      },
      {
        id: 'PED-102',
        orderNumber: 102,
        tableId: 'tbl-01',
        tableNumber: '01',
        customerName: 'Irmã Mariana',
        customerPhone: '(11) 98777-6655',
        items: [
          {
            productId: 'prod-coxinha',
            productName: 'Coxinha Dourada com Catupiry',
            productCode: 'SAL-01',
            unitPrice: 9.5,
            quantity: 2,
            selectedOptions: [],
            totalItemPrice: 19.0,
          },
          {
            productId: 'prod-suco-laranja',
            productName: 'Suco Natural de Laranja 400ml',
            productCode: 'BEB-02',
            unitPrice: 9.0,
            quantity: 1,
            selectedOptions: [],
            totalItemPrice: 9.0,
          },
        ],
        subtotal: 28.0,
        discount: 0,
        total: 28.0,
        paymentMethod: 'dinheiro',
        cashChangeFor: 50.0,
        paymentStatus: 'aguardando_pagamento',
        prepStatus: 'confirmado',
        clientToken: 'token_sample_102_cl',
        history: [
          { timestamp: tenMinAgo, action: 'Pedido enviado', actor: 'Cliente (Mesa 01)' },
          { timestamp: tenMinAgo, action: 'Pedido confirmado pela equipe', actor: 'Atendente' },
        ],
        createdAt: tenMinAgo,
        updatedAt: tenMinAgo,
      },
    ];

    const sampleExpenses: Expense[] = [
      {
        id: 'exp-01',
        title: 'Compra de Laranjas e Hortifrúti (Feira)',
        category: 'ingredientes',
        amount: 85.0,
        date: new Date().toISOString().split('T')[0],
        notes: '2 caixas de laranja pêra para suco fresco',
        registeredBy: 'Coordenação Lanchonete',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exp-02',
        title: 'Reposição de Guardanapos e Copos',
        category: 'embalagens',
        amount: 42.5,
        date: new Date().toISOString().split('T')[0],
        notes: 'Distribuidora São Paulo',
        registeredBy: 'Coordenação Lanchonete',
        createdAt: new Date().toISOString(),
      },
    ];

    this.state = {
      users: defaultUsers,
      tables: defaultTables,
      categories: defaultCategories,
      optionGroups: defaultOptionGroups,
      products: defaultProducts,
      orders: sampleOrders,
      inventoryItems: defaultInventoryItems,
      inventoryMovements: [],
      expenses: sampleExpenses,
      cashClosings: [],
      settings: defaultSettings,
      auditLogs: [
        {
          id: 'log-01',
          timestamp: new Date().toISOString(),
          user: 'Sistema',
          action: 'Inicialização',
          target: 'Banco de Dados IBPLanches',
          details: 'Sistema configurado com dados padrão para lanchonete da igreja',
        },
      ],
      nextOrderNumber: 103,
    };

    this.saveState();
  }

  public saveState() {
    if (!this.state) return;
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to save database state', err);
    }
  }

  // Getters
  public getState(): DatabaseState {
    if (!this.state) {
      this.ensureInitialized();
    }
    return this.state!;
  }

  public getPublicConfig() {
    const state = this.getState();
    return {
      settings: state.settings,
      tables: state.tables.filter((t) => t.active).map((t) => ({
        id: t.id,
        number: t.number,
        name: t.name,
        token: t.token,
        active: t.active,
      })),
    };
  }

  public getTableByTokenOrNumber(identifier: string): Table | undefined {
    const state = this.getState();
    return state.tables.find(
      (t) => t.active && (t.token === identifier || t.number === identifier || t.id === identifier)
    );
  }

  public getPublicMenu() {
    const state = this.getState();
    const categories = state.categories
      .filter((c) => c.active)
      .sort((a, b) => a.order - b.order);

    const products = state.products.filter((p) => p.available);
    const optionGroups = state.optionGroups;

    return {
      categories,
      products,
      optionGroups,
    };
  }

  public createOrder(orderData: {
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
  }): Order {
    const state = this.getState();
    const orderNumber = state.nextOrderNumber++;
    const orderId = `PED-${orderNumber}`;
    const clientToken = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();

    // SERVER-SIDE CALCULATION: Recompute all item prices against authentic product catalog
    let subtotal = 0;
    const computedItems = orderData.items.map((it) => {
      const product = state.products.find((p) => p.id === it.productId);
      if (!product || !product.available) {
        throw new Error(`Produto não disponível: ${it.productId}`);
      }

      let itemUnitPrice = product.price;
      const selectedOptsList: Array<{
        groupId: string;
        groupName: string;
        optionId: string;
        optionName: string;
        price: number;
      }> = [];

      if (it.selectedOptions && it.selectedOptions.length > 0) {
        it.selectedOptions.forEach((optReq) => {
          const group = state.optionGroups.find((g) => g.id === optReq.groupId);
          if (group) {
            const opt = group.options.find((o) => o.id === optReq.optionId);
            if (opt && opt.available) {
              selectedOptsList.push({
                groupId: group.id,
                groupName: group.name,
                optionId: opt.id,
                optionName: opt.name,
                price: opt.price,
              });
              itemUnitPrice += opt.price;
            }
          }
        });
      }

      const totalItemPrice = itemUnitPrice * it.quantity;
      subtotal += totalItemPrice;

      return {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        unitPrice: product.price,
        quantity: it.quantity,
        selectedOptions: selectedOptsList,
        notes: it.notes || '',
        totalItemPrice,
      };
    });

    const discount = 0;
    const total = subtotal - discount;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      tableId: orderData.tableId,
      tableNumber: orderData.tableNumber,
      customerName: orderData.customerName || '',
      customerPhone: orderData.customerPhone || '',
      items: computedItems,
      subtotal,
      discount,
      total,
      paymentMethod: orderData.paymentMethod,
      cashChangeFor: orderData.cashChangeFor,
      paymentStatus: 'aguardando_pagamento',
      prepStatus: 'aguardando_confirmacao',
      clientToken,
      history: [
        {
          timestamp: now,
          action: 'Pedido recebido pelo sistema',
          actor: `Cliente (${orderData.tableNumber ? `Mesa ${orderData.tableNumber}` : 'Balcão'})`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    state.orders.unshift(newOrder);

    this.addAuditLog('Cliente', 'Criar Pedido', newOrder.id, `Total: R$ ${total.toFixed(2)} - Mesa ${orderData.tableNumber}`);
    this.saveState();
    return newOrder;
  }

  public getOrderByClientToken(orderId: string, clientToken: string): Order | undefined {
    const state = this.getState();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return undefined;
    // Validate token to prevent unauthorized access to other customers' orders
    if (order.clientToken !== clientToken) {
      return undefined;
    }
    return order;
  }

  public uploadPaymentProof(orderId: string, clientToken: string, fileDataUrl: string): Order {
    const state = this.getState();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || order.clientToken !== clientToken) {
      throw new Error('Pedido não encontrado ou token inválido');
    }

    const now = new Date().toISOString();
    order.paymentProof = {
      fileDataUrl,
      uploadedAt: now,
      status: 'em_analise',
    };
    order.paymentStatus = 'comprovante_em_analise';
    order.updatedAt = now;
    order.history.push({
      timestamp: now,
      action: 'Comprovante de pagamento enviado para conferência',
      actor: 'Cliente',
    });

    this.addAuditLog('Cliente', 'Upload Comprovante', orderId, 'Comprovante enviado para análise');
    this.saveState();
    return order;
  }

  // Inventory automatic recipe deduction when order is confirmed
  public deductInventoryForOrder(order: Order, actor: string) {
    const state = this.getState();
    const now = new Date().toISOString();

    for (const item of order.items) {
      const product = state.products.find((p) => p.id === item.productId);
      if (product && product.recipe) {
        for (const recipeItem of product.recipe) {
          const invItem = state.inventoryItems.find((i) => i.id === recipeItem.inventoryItemId);
          if (invItem) {
            const deduction = recipeItem.quantity * item.quantity;
            invItem.currentStock = Math.max(0, Number((invItem.currentStock - deduction).toFixed(2)));
            invItem.updatedAt = now;

            state.inventoryMovements.push({
              id: `mov-${crypto.randomBytes(4).toString('hex')}`,
              inventoryItemId: invItem.id,
              type: 'venda_automatica',
              quantity: deduction,
              reason: `Consumo automático pedido #${order.orderNumber} (${product.name} x${item.quantity})`,
              orderId: order.id,
              userName: actor,
              createdAt: now,
            });
          }
        }
      }
    }
  }

  public addAuditLog(user: string, action: string, target: string, details?: string) {
    const state = this.getState();
    state.auditLogs.unshift({
      id: `log-${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      target,
      details,
    });
    if (state.auditLogs.length > 500) {
      state.auditLogs = state.auditLogs.slice(0, 500);
    }
  }

  public resetDatabase() {
    const state = this.getState();
    state.orders = [];
    state.inventoryMovements = [];
    state.expenses = [];
    state.cashClosings = [];
    state.auditLogs = [];
    state.nextOrderNumber = 101;
    this.addAuditLog('Admin', 'Zeramento Geral do Sistema', 'Banco de Dados', 'Todos os registros operacionais, pedidos e caixas foram zerados.');
    this.saveState();
  }

  public updateExpense(id: string, data: Partial<Expense>) {
    const state = this.getState();
    const exp = state.expenses.find((e) => e.id === id);
    if (!exp) throw new Error('Despesa não encontrada');
    if (data.title !== undefined) exp.title = data.title;
    if (data.amount !== undefined) exp.amount = data.amount;
    if (data.category !== undefined) exp.category = data.category;
    if (data.notes !== undefined) exp.notes = data.notes;
    if (data.date !== undefined) exp.date = data.date;
    this.saveState();
    return exp;
  }

  public updateCashClosing(id: string, data: Partial<CashClosing>) {
    const state = this.getState();
    const cl = state.cashClosings.find((c) => c.id === id);
    if (!cl) throw new Error('Fechamento não encontrado');
    if (data.initialBalance !== undefined) cl.initialBalance = data.initialBalance;
    if (data.actualCashCounted !== undefined) {
      cl.actualCashCounted = data.actualCashCounted;
      cl.difference = Number((cl.actualCashCounted - (cl.calculatedBalance || 0)).toFixed(2));
    }
    if (data.notes !== undefined) cl.notes = data.notes;
    this.saveState();
    return cl;
  }

  public deleteCashClosing(id: string) {
    const state = this.getState();
    state.cashClosings = state.cashClosings.filter((c) => c.id !== id);
    this.saveState();
  }

  public updateInventoryItem(id: string, data: Partial<InventoryItem>) {
    const state = this.getState();
    const item = state.inventoryItems.find((i) => i.id === id);
    if (!item) throw new Error('Insumo não encontrado');
    if (data.name !== undefined) item.name = data.name;
    if (data.unit !== undefined) item.unit = data.unit;
    if (data.currentStock !== undefined) item.currentStock = data.currentStock;
    if (data.minStock !== undefined) item.minStock = data.minStock;
    if (data.unitCost !== undefined) item.unitCost = data.unitCost;
    if (data.category !== undefined) item.category = data.category;
    item.updatedAt = new Date().toISOString();
    this.saveState();
    return item;
  }

  public deleteInventoryItem(id: string) {
    const state = this.getState();
    state.inventoryItems = state.inventoryItems.filter((i) => i.id !== id);
    this.saveState();
  }

  public deleteInventoryMovement(id: string) {
    const state = this.getState();
    state.inventoryMovements = state.inventoryMovements.filter((m) => m.id !== id);
    this.saveState();
  }

  public updateOrder(id: string, data: Partial<Order>) {
    const state = this.getState();
    const order = state.orders.find((o) => o.id === id);
    if (!order) throw new Error('Pedido não encontrado');
    if (data.paymentStatus !== undefined) order.paymentStatus = data.paymentStatus;
    if (data.prepStatus !== undefined) order.prepStatus = data.prepStatus;
    if (data.paymentMethod !== undefined) order.paymentMethod = data.paymentMethod;
    if (data.total !== undefined) order.total = data.total;
    order.updatedAt = new Date().toISOString();
    this.saveState();
    return order;
  }

  public deleteOrder(id: string) {
    const state = this.getState();
    state.orders = state.orders.filter((o) => o.id !== id);
    this.saveState();
  }
}

export const db = new Database();
