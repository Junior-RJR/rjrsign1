export interface Representative {
  name: string;
  email: string;
  role: string;
}

export interface RegisteredClient {
  id: string; // e.g. UUID or string id
  name: string;
  email: string;
  representatives: Representative[];
  hasChangedPassword?: boolean;
  createdAt: string;
}

export type ContractStatus = 'pending' | 'signed';

export interface SignerStatus {
  email: string;
  name: string;
  status: 'pending' | 'signed';
  signedAt?: string;
  signatureDrawing?: string; // base64 PNG
  signatureIp?: string;
  signatureType?: 'drawn' | 'typed';
}

export interface Contract {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  content: string; // Markdown contract body
  status: ContractStatus;
  createdAt: string;
  signedAt?: string;
  signatureDrawing?: string; // base64 PNG from main drawer or fallback
  signatureName?: string;
  signatureIp?: string;
  sentEmailCount: number;
  downloadCount: number;
  category: string;
  value?: number;
  signers: SignerStatus[]; // JSONB multi-signers array
}

export type BillingStatus = 'pending' | 'paid';

export interface BillingItem {
  id: string;
  clientName: string;
  clientEmail: string;
  type: 'monthly_fee' | 'additional';
  amount: number; // R$ 179,90 fixed central
  dueDate: string; // standard ISO string date
  paymentDate?: string;
  status: BillingStatus;
  description: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  cnpj: string;
  companyName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  businessType: string; // Construtora, Distribuidora, Lojista de Tintas, Pintor de Obras Consumidor, Uso Próprio
  targetProduct: string;
  message?: string;
  isContacted: boolean; // lead manager status
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  createdAt: string;
}

export interface NewsletterEmail {
  id: string;
  email: string;
  createdAt: string;
}

export interface ProductVariant {
  size: string; // e.g. "Galão 3.6L", "Lata 18L"
  price?: number;
  image?: string;
  colorName?: string;
  colorHex?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  isEssential: boolean; // highlighted on home grid (max 3 rule!)
  dilution: string;
  diluent: 'Água' | 'Solvente' | string;
  finish: 'Brilhante' | 'Fosco' | 'Acetinado' | string;
  yieldPerM2: string;
  dryingTime: string;
  yieldTotal: string;
  recommendedCoats: number;
  areaOfUse: 'Interior' | 'Exterior' | 'Interior/Exterior' | string;
  odor: 'Sem Odor' | 'Baixo Odor' | string;
  antimold: boolean;
  colors: string[]; // array of strings (names/hexes, e.g. ["Preto #000000", "Branco #ffffff"])
  variants: ProductVariant[];
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface AnalyticsSummary {
  weeklyLeads: { day: string; count: number }[];
  leadsByRamo: { ramo: string; value: number; color: string }[];
  totalClicksVendaDireta: number;
  averageTimeOnSite: string; // text e.g. "3m 42s"
  conversionRate: number; // percentage e.g. 14.5
  utmSources: { source: string; count: number }[];
}
