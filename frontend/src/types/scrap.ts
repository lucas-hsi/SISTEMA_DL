// Tipos para Sistema de Gestão de Sucatas - DL Auto Peças

import { BaseEntity, DocumentAttachment } from './manager';

// ===== FORNECEDORES =====
export interface Supplier extends BaseEntity {
  name: string;
  document: string; // CPF ou CNPJ
  email?: string;
  phone: string;
  address: SupplierAddress;
  bankAccount?: BankAccount;
  status: 'active' | 'inactive' | 'blocked';
  rating: number; // 1-5 estrelas
  totalPurchases: number;
  averagePrice: number;
  notes?: string;
}

export interface SupplierAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface BankAccount {
  bank: string;
  agency: string;
  account: string;
  accountType: 'checking' | 'savings';
  pixKey?: string;
}

// ===== SUCATAS =====
export interface Scrap extends BaseEntity {
  code: string; // Código único da sucata
  supplierId: string;
  vehicleInfo: VehicleInfo;
  purchaseInfo: PurchaseInfo;
  dismantlingInfo?: DismantlingInfo;
  status: 'purchased' | 'in_dismantling' | 'dismantled' | 'sold';
  photos: string[];
  documents: DocumentAttachment[];
  notes?: string;
  estimatedValue: number;
  actualValue?: number;
  profitMargin?: number;
  parts: ScrapPart[];
}

export interface VehicleInfo {
  brand: string;
  model: string;
  year: number;
  color: string;
  chassisNumber?: string;
  engineNumber?: string;
  licensePlate?: string;
  fuelType: 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic' | 'cvt';
  mileage?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'salvage';
  accidentHistory?: string;
}

export interface PurchaseInfo {
  purchaseDate: Date;
  totalCost: number;
  transportCost?: number;
  documentationCost?: number;
  otherCosts?: number;
  paymentMethod: 'cash' | 'pix' | 'bank_transfer' | 'check' | 'installments';
  paymentStatus: 'pending' | 'partial' | 'paid';
  invoiceNumber?: string;
  receiptNumber?: string;
}

export interface DismantlingInfo {
  startDate: Date;
  endDate?: Date;
  responsibleEmployee: string;
  estimatedParts: number;
  actualParts?: number;
  dismantlingCost: number;
  laborHours: number;
  notes?: string;
}

// ===== PEÇAS DE SUCATA =====
export interface ScrapPart extends BaseEntity {
  sku: string; // SKU único da peça
  scrapId: string; // Vinculação com a sucata original
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  condition: 'new' | 'used_excellent' | 'used_good' | 'used_fair' | 'damaged';
  location: PartLocation;
  dimensions?: PartDimensions;
  weight?: number;
  photos: string[];
  qrCode?: QRCodeInfo;
  pricing: PartPricing;
  inventory: PartInventory;
  compatibility: VehicleCompatibility[];
  qualityCheck?: QualityCheck;
  status: 'available' | 'reserved' | 'sold' | 'damaged' | 'discarded';
}

export interface PartLocation {
  warehouse: string;
  section: string;
  shelf: string;
  position: string;
  coordinates?: {
    x: number;
    y: number;
    z?: number;
  };
}

export interface PartDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'mm' | 'm';
}

export interface QRCodeInfo {
  code: string;
  generatedAt: Date;
  printedAt?: Date;
  scannedCount: number;
  lastScannedAt?: Date;
  data: QRCodeData;
}

export interface QRCodeData {
  sku: string;
  partName: string;
  scrapCode: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  condition: string;
  price: number;
  location: string;
  contactInfo: string;
  websiteUrl?: string;
}

export interface PartPricing {
  costPrice: number; // Custo proporcional da sucata
  sellingPrice: number;
  minimumPrice: number;
  suggestedPrice?: number;
  marketPrice?: number;
  profitMargin: number;
  discountAllowed: number;
  priceHistory: PriceHistory[];
}

export interface PriceHistory {
  date: Date;
  oldPrice: number;
  newPrice: number;
  reason: string;
  changedBy: string;
}

export interface PartInventory {
  quantity: number;
  reserved: number;
  available: number;
  minimumStock: number;
  reorderPoint: number;
  lastMovement?: Date;
  movements: InventoryMovement[];
}

export interface InventoryMovement {
  id: string;
  date: Date;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  reference?: string; // Número da venda, transferência, etc.
  employeeId: string;
}

export interface VehicleCompatibility {
  brand: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  engineType?: string;
  transmission?: string;
  notes?: string;
}

export interface QualityCheck {
  checkedBy: string;
  checkedAt: Date;
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  functionalTest: boolean;
  visualInspection: boolean;
  measurements?: Record<string, number>;
  defects: string[];
  recommendations: string[];
  approved: boolean;
  notes?: string;
}

// ===== RELATÓRIOS DE SUCATA =====
export interface ScrapReport {
  id: string;
  type: 'profitability' | 'inventory' | 'supplier_performance' | 'dismantling_efficiency';
  period: {
    startDate: Date;
    endDate: Date;
  };
  filters: ScrapReportFilters;
  data: ScrapReportData;
  generatedAt: Date;
  generatedBy: string;
}

export interface ScrapReportFilters {
  suppliers?: string[];
  vehicleBrands?: string[];
  vehicleModels?: string[];
  yearRange?: {
    start: number;
    end: number;
  };
  categories?: string[];
  status?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface ScrapReportData {
  totalScraps: number;
  totalInvestment: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  averageDismantlingTime: number;
  topSuppliers: SupplierPerformance[];
  topCategories: CategoryPerformance[];
  monthlyTrend: MonthlyTrend[];
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalPurchases: number;
  totalValue: number;
  averagePrice: number;
  profitMargin: number;
  rating: number;
}

export interface CategoryPerformance {
  category: string;
  totalParts: number;
  totalRevenue: number;
  averagePrice: number;
  turnoverRate: number;
  profitMargin: number;
}

export interface MonthlyTrend {
  month: string;
  scrapsCount: number;
  partsCount: number;
  investment: number;
  revenue: number;
  profit: number;
}

// ===== CONFIGURAÇÕES DO SISTEMA =====
export interface ScrapSystemConfig {
  qrCodeSettings: QRCodeSettings;
  pricingRules: PricingRules;
  inventorySettings: InventorySettings;
  qualitySettings: QualitySettings;
}

export interface QRCodeSettings {
  includePrice: boolean;
  includeLocation: boolean;
  includeContactInfo: boolean;
  includeWebsite: boolean;
  logoUrl?: string;
  size: 'small' | 'medium' | 'large';
  format: 'png' | 'svg' | 'pdf';
  batchPrinting: boolean;
}

export interface PricingRules {
  defaultMargin: number;
  minimumMargin: number;
  maxDiscountAllowed: number;
  priceUpdateFrequency: 'daily' | 'weekly' | 'monthly';
  marketPriceSource?: string;
  automaticPricing: boolean;
}

export interface InventorySettings {
  defaultMinimumStock: number;
  autoReorderPoint: boolean;
  locationMandatory: boolean;
  photosRequired: number;
  qualityCheckRequired: boolean;
}

export interface QualitySettings {
  requiredChecks: string[];
  approvalRequired: boolean;
  defectCategories: string[];
  conditionCriteria: Record<string, string[]>;
}

// ===== TIPOS DE BUSCA E FILTROS =====
export interface ScrapSearchFilters {
  search?: string;
  supplierId?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  yearRange?: { start: number; end: number };
  status?: string;
  dateRange?: { start: Date; end: Date };
  priceRange?: { min: number; max: number };
}

export interface PartSearchFilters {
  search?: string;
  scrapId?: string;
  category?: string;
  condition?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  priceRange?: { min: number; max: number };
  location?: string;
  status?: string;
  hasQRCode?: boolean;
}

// ===== TIPOS DE FORMULÁRIO =====
export interface ScrapFormData {
  supplierId: string;
  vehicleInfo: Partial<VehicleInfo>;
  purchaseInfo: Partial<PurchaseInfo>;
  photos: File[];
  documents: File[];
  notes?: string;
  estimatedValue: number;
}

export interface PartFormData {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  condition: string;
  location: Partial<PartLocation>;
  dimensions?: Partial<PartDimensions>;
  weight?: number;
  photos: File[];
  sellingPrice: number;
  minimumPrice: number;
  quantity: number;
  compatibility: Partial<VehicleCompatibility>[];
  generateQRCode: boolean;
}