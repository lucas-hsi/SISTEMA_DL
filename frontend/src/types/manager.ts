// Tipos para o Sistema de Gestão - DL Auto Peças

// ===== TIPOS BASE =====
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

// ===== DASHBOARD E KPIs =====
export interface KPICard {
  id: string;
  title: string;
  value: number;
  previousValue?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  percentage?: number;
  color: string;
  icon: string;
}

export interface DashboardFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  };
  salesChannel?: string[];
  region?: string[];
  businessUnit?: string[];
  seller?: string[];
  team?: string[];
  manager?: string[];
}

export interface SalesMetrics {
  totalSales: number;
  margin: number;
  defaultRate: number;
  currentStock: number;
  topSellers: SellerRanking[];
}

export interface SellerRanking {
  sellerId: string;
  sellerName: string;
  totalSales: number;
  margin: number;
  position: number;
  avatar?: string;
}

export interface ChannelStats {
  channelId: string;
  channelName: string;
  totalSales: number;
  orderCount: number;
  averageTicket: number;
  conversionRate: number;
  growth: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  createdAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// ===== FUNCIONÁRIOS E PERMISSÕES =====
export interface Employee extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  document: string;
  position: string;
  department: string;
  manager?: string;
  team?: string;
  region?: string;
  businessUnit?: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  permissions: EmployeePermissions;
  goals: EmployeeGoals;
  performance: PerformanceMetrics;
}

export interface EmployeePermissions {
  maxDiscount: number;
  accessReports: string[];
  canApprove: boolean;
  canEditPrices: boolean;
  canAccessFinancial: boolean;
  canManageInventory: boolean;
  canViewAllSales: boolean;
  modules: string[];
}

export interface EmployeeGoals {
  monthlySalesTarget: number;
  quarterlyTarget: number;
  yearlyTarget: number;
  customGoals: CustomGoal[];
}

export interface CustomGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

export interface PerformanceMetrics {
  currentMonthSales: number;
  lastMonthSales: number;
  yearToDateSales: number;
  goalAchievement: number;
  customerSatisfaction: number;
  averageTicket: number;
  conversionRate: number;
}

// ===== CALENDÁRIO E TAREFAS =====
export interface CalendarEvent extends BaseEntity {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'meeting' | 'task' | 'bill' | 'reminder' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string[];
  attachments: DocumentAttachment[];
  reminders: Reminder[];
  location?: string;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Reminder {
  id: string;
  type: 'email' | 'push' | 'sms';
  minutesBefore: number;
  sent: boolean;
  sentAt?: Date;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  occurrences?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

// ===== FINANCEIRO =====
export interface FinancialAccount extends BaseEntity {
  type: 'payable' | 'receivable';
  description: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  category: string;
  supplier?: string;
  customer?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  attachments: DocumentAttachment[];
  installments?: Installment[];
}

export interface Installment {
  id: string;
  number: number;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
}

export interface FinancialReport {
  id: string;
  title: string;
  type: 'cash_flow' | 'profit_loss' | 'balance_sheet' | 'custom';
  period: {
    startDate: Date;
    endDate: Date;
  };
  data: any;
  generatedAt: Date;
  generatedBy: string;
}

// ===== RELATÓRIOS =====
export type ReportType = 'sales' | 'financial' | 'inventory' | 'performance' | 'custom';

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  channel: string;
  seller: string;
  region: string;
  reportType: ReportType;
}

export interface SalesData {
  month: string;
  vendas: number;
  meta: number;
  margem: number;
}

export interface PerformanceData {
  vendedor: string;
  vendas: number;
  meta: number;
  conversao: number;
}

export interface Report extends BaseEntity {
  title: string;
  type: ReportType;
  filters: DashboardFilters;
  data: any;
  charts: ChartConfig[];
  scheduledExecution?: ScheduledExecution;
  isPublic: boolean;
  sharedWith: string[];
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  title: string;
  dataKey: string;
  xAxis?: string;
  yAxis?: string;
  colors: string[];
}

export interface ScheduledExecution {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
  isActive: boolean;
}

// ===== FLUXOS DE TRABALHO =====
export interface Workflow extends BaseEntity {
  name: string;
  description: string;
  steps: WorkflowStep[];
  isActive: boolean;
  triggers: WorkflowTrigger[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'notification' | 'action' | 'condition';
  assignedTo?: string;
  condition?: string;
  action?: string;
  order: number;
  isRequired: boolean;
}

export interface WorkflowTrigger {
  id: string;
  event: string;
  condition?: string;
  isActive: boolean;
}

export interface WorkflowInstance extends BaseEntity {
  workflowId: string;
  entityId: string;
  entityType: string;
  currentStep: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  steps: WorkflowStepInstance[];
}

export interface WorkflowStepInstance {
  stepId: string;
  status: 'pending' | 'completed' | 'rejected' | 'skipped';
  assignedTo?: string;
  completedBy?: string;
  completedAt?: Date;
  comments?: string;
}

// ===== TIPOS DE FORMULÁRIO =====
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'select' | 'multiselect' | 'date' | 'datetime' | 'textarea' | 'file' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// ===== WORKFLOW TYPES =====
export type WorkflowStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type ApprovalStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';

export interface WorkflowFilters {
  search: string;
  status?: WorkflowStatus | ApprovalStatus;
  category: string;
  assignedTo: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// ===== TIPOS DE RESPOSTA DA API =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}