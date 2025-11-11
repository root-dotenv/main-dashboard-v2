// src/types/billing-types.ts

// Invoice Types
export interface Invoice {
  id: string;
  invoice_number: string;
  booking_id: string;
  user_id: string;
  vendor_id: string;
  total_amount: string;
  amount_paid: string;
  currency: string;
  status: "DRAFT" | "PENDING" | "PAID" | "PARTIALLY_PAID" | "CANCELLED" | "REFUNDED";
  transaction_type: "ONLINE" | "PHYSICAL";
  issue_date: string;
  due_date: string;
  invoice_metadata?: Record<string, unknown>;
  payment_transaction_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice: string;
  financial_record?: string;
  description: string;
  quantity?: string;
  unit_price?: string;
  amount: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Payout Types
export interface VendorPayout {
  id: string;
  vendor_id: string;
  payroll_cycle: string;
  transaction_type: "ONLINE" | "PHYSICAL";
  total_gross_revenue: string;
  total_commissions_deducted: string;
  total_refunds_deducted: string;
  total_other_deductions: string;
  net_amount_payable: string;
  currency: string;
  status: "PENDING" | "CALCULATED" | "APPROVED" | "PROCESSED" | "PAID" | "FAILED" | "CANCELLED";
  payment_transaction_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface AgentPayout {
  id: string;
  agent_id: string;
  payroll_cycle: string;
  total_gross_commissions: string;
  total_deductions: string;
  net_amount_payable: string;
  currency: string;
  status: "PENDING" | "CALCULATED" | "APPROVED" | "PROCESSED" | "PAID" | "FAILED" | "CANCELLED";
  payment_transaction_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Account Transaction Types
export interface AccountTransaction {
  id: string;
  entity_id: string;
  entity_type: "VENDOR" | "AGENCY";
  transaction_source_type: "ONLINE" | "PHYSICAL";
  transaction_event_type:
    | "BOOKING_CONFIRMED_CREDIT"
    | "BOOKING_CONFIRMED_DEBIT"
    | "PAYOUT_PROCESSED"
    | "REFUND_ISSUED"
    | "FINE_APPLIED"
    | "ADJUSTMENT_CREDIT"
    | "ADJUSTMENT_DEBIT";
  amount: string;
  currency: string;
  status: "PENDING" | "CALCULATED" | "APPROVED" | "PROCESSED" | "PAID" | "FAILED" | "CANCELLED";
  description?: string;
  running_balance_after_transaction?: string;
  related_booking_financial_record?: string;
  related_payout?: string;
  related_vendor_payout?: string;
  related_refund?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Booking Financial Record Types
// Note: This is an inline schema in the API, not a defined model
export interface BookingFinancialRecord {
  id: number;
  booking_id: string;
  user_id: string;
  vendor_id: string;
  charge_type: number;
  amount: string;
  currency: "USD" | "EUR" | "TZS" | "GBP";
  description?: string;
  applied_financial_scheme?: number;
  applied_tax_scheme?: number;
  calculation_details?: Record<string, unknown>;
  is_refund_related?: boolean;
  booking_date?: string;
  transaction_date?: string;
  created_at: string;
  updated_at?: string;
}

// Charge Type
// Note: This model may not be explicitly defined in the schema but is used in endpoints
export interface ChargeType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Refund Types
export interface Refund {
  id: string;
  refund_id: string;
  booking_id: string;
  user_id: string;
  vendor_id: string;
  transaction_type: "ONLINE" | "PHYSICAL";
  amount: string;
  currency: string;
  status: "PENDING" | "CALCULATED" | "APPROVED" | "PROCESSED" | "PAID" | "FAILED" | "CANCELLED";
  reason?: string;
  payment_transaction_id?: string;
  invoice?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Paginated Response Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Request Types
export interface CreateInvoiceRequest {
  invoice_number: string;
  booking_id: string;
  user_id: string;
  vendor_id: string;
  total_amount: string;
  currency?: string;
  status?: string;
  issue_date?: string;
  due_date?: string;
  invoice_metadata?: Record<string, unknown>;
}

export type UpdateInvoiceRequest = Partial<CreateInvoiceRequest>;

export interface CreateAccountTransactionRequest {
  entity_id: string;
  entity_type: "VENDOR" | "AGENCY";
  transaction_event_type: AccountTransaction["transaction_event_type"];
  amount: string;
  currency?: string;
  description?: string;
  transaction_source_type?: "ONLINE" | "PHYSICAL";
}

// Vendor Account (Wallet) Types
export interface VendorAccount {
  id: string;
  vendor_id: string;
  bussiness_name: string;
  account_status: "active" | "suspended" | "pending_verification";
  balance: string;
  currency: string;
  commission_rate: string;
  minimum_payout: string;
  pending_amount: string;
  total_earnings: string;
  previous_balance: string;
  last_payout_date?: string;
  notes?: string;
  tags?: Record<string, unknown>;
  transaction_type?: "ONLINE" | "PHYSICAL"; // For wallet separation
  created_at: string;
  updated_at: string;
}

export interface CreateVendorAccountRequest {
  vendor_id: string;
  bussiness_name: string;
  account_status?: "active" | "suspended" | "pending_verification";
  currency?: string;
  commission_rate?: string;
  minimum_payout?: string;
  transaction_type?: "ONLINE" | "PHYSICAL";
  notes?: string;
  tags?: Record<string, unknown>;
}

export type UpdateVendorAccountRequest = Partial<CreateVendorAccountRequest>;

export interface VendorAccountSummary {
  total_balance: string;
  available_balance: string;
  pending_balance: string;
  total_earnings: string;
  currency: string;
  last_payout_date?: string;
  payout_eligibility: boolean;
  minimum_payout: string;
}

