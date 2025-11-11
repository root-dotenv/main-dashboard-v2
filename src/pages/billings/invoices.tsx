// src/pages/billings/invoices.tsx
"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Trash2,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  FileText,
  Download,
  Plus,
  Edit,
} from "lucide-react";
import { TbFileTypeCsv } from "react-icons/tb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { IoRefreshOutline } from "react-icons/io5";
import ErrorPage from "@/components/custom/error-page";
import billingClient from "@/api/billing-client";
import { StatCard } from "@/components/custom/StatCard";
import { useAuthStore } from "@/store/auth.store";
import { useHotel } from "@/providers/hotel-provider";
import type {
  Invoice,
  PaginatedResponse,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
} from "@/types/billing-types";

// --- Debounce Hook ---
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- Helper Functions ---
const getStatusBadgeClasses = (status: string): string => {
  switch (status?.toUpperCase()) {
    case "PAID":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-700/60";
    case "CANCELLED":
    case "REFUNDED":
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-700/60";
    case "PARTIALLY_PAID":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-700/60";
    case "PENDING":
    case "SENT":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-700/60";
    case "DRAFT":
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
};

const formatCurrency = (amount: string, currency: string = "USD"): string => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(numAmount);
};

// --- Styling Constants ---
const inputBaseClass =
  "bg-white dark:bg-[#171F2F] border border-[#DADCE0] dark:border-[#1D2939] dark:text-[#D0D5DD] dark:placeholder:text-[#5D636E] rounded-lg shadow-none h-10 px-3 py-2 text-sm";

// --- Sortable Header Component ---
const SortableHeader = ({
  column,
  children,
}: {
  column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" };
  children: React.ReactNode;
}) => {
  return (
    <button
      className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-[#D0D5DD]"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      {column.getIsSorted() === "asc" ? (
        <ChevronUpIcon className="h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <ChevronDownIcon className="h-4 w-4" />
      ) : (
        <ChevronDownIcon className="h-4 w-4 opacity-30" />
      )}
    </button>
  );
};

// --- Invoice Form Component ---
function InvoiceFormSheet({
  invoice,
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  invoice: Invoice | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateInvoiceRequest | UpdateInvoiceRequest) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    invoice_number: "",
    booking_id: "",
    user_id: "",
    vendor_id: "",
    total_amount: "",
    currency: "USD",
    status: "DRAFT",
    issue_date: "",
    due_date: "",
    invoice_metadata: {},
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number,
        booking_id: invoice.booking_id,
        user_id: invoice.user_id,
        vendor_id: invoice.vendor_id,
        total_amount: invoice.total_amount,
        currency: invoice.currency || "USD",
        status: invoice.status,
        issue_date: invoice.issue_date ? invoice.issue_date.split("T")[0] : "",
        due_date: invoice.due_date ? invoice.due_date.split("T")[0] : "",
        invoice_metadata: invoice.invoice_metadata || {},
      });
    } else {
      setFormData({
        invoice_number: "",
        booking_id: "",
        user_id: "",
        vendor_id: "",
        total_amount: "",
        currency: "USD",
        status: "DRAFT",
        issue_date: "",
        due_date: "",
        invoice_metadata: {},
      });
    }
  }, [invoice, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Format dates properly
    const submitData = {
      ...formData,
      issue_date: formData.issue_date ? `${formData.issue_date}T00:00:00Z` : undefined,
      due_date: formData.due_date ? `${formData.due_date}T23:59:59Z` : undefined,
    };
    onSubmit(submitData);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] p-0 flex flex-col">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-b-[#1D2939] bg-[#F9FAFB] dark:bg-[#101828]">
            <SheetTitle className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
              {invoice ? "Edit Invoice" : "Create New Invoice"}
            </SheetTitle>
            <SheetDescription className="text-sm text-gray-600 dark:text-[#98A2B3] mt-1">
              {invoice
                ? "Update the invoice details."
                : "Fill in the details for the new invoice."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <Label htmlFor="invoice_number" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                  Invoice Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  required
                  className={inputBaseClass}
                  placeholder="e.g., INV-2025-001"
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="booking_id" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                  Booking ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="booking_id"
                  value={formData.booking_id}
                  onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                  required
                  className={inputBaseClass}
                  placeholder="Enter booking ID"
                  maxLength={100}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user_id" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                    User ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="user_id"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    required
                    className={inputBaseClass}
                    placeholder="Enter user ID"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_id" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                    Vendor ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vendor_id"
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                    required
                    className={inputBaseClass}
                    placeholder="Enter vendor ID"
                    maxLength={100}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="total_amount" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                  Total Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  required
                  className={inputBaseClass}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                    Currency
                  </Label>
                  <Select
                    value={formData.currency || "USD"}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className={inputBaseClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="TZS">TZS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                    Status
                  </Label>
                  <Select
                    value={formData.status || "DRAFT"}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className={inputBaseClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issue_date" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                    Issue Date
                  </Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className={inputBaseClass}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                    Due Date
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className={inputBaseClass}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-t-[#1D2939] bg-white dark:bg-[#101828] flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-lg shadow-none border-gray-300 dark:border-[#1D2939] text-gray-700 dark:text-[#D0D5DD] hover:bg-gray-50 dark:hover:bg-[#171F2F]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-lg shadow-none bg-[#0785CF] hover:bg-[#0670B0] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {invoice ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  invoice ? "Update Invoice" : "Create Invoice"
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// --- Main Component ---
export default function Invoices() {
  const queryClient = useQueryClient();
  const { hotelId } = useAuthStore();
  const { hotel } = useHotel();
  const vendorId = hotel?.vendor_id;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // --- State ---
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncedGlobalFilter = useDebounce(globalFilter, 500);
  const [isExporting, setIsExporting] = useState(false);

  // --- Stats Queries ---
  const { data: allInvoicesStats } = useQuery({
    queryKey: ["invoiceStats", hotelId, vendorId, "all"],
    queryFn: async () => {
      const response = await billingClient.get("/invoices", {
        params: { vendor_id: vendorId, limit: 1 },
      });
      return { count: response.data.count || 0 };
    },
    enabled: !!hotelId && !!vendorId,
  });

  const { data: paidInvoicesStats } = useQuery({
    queryKey: ["invoiceStats", hotelId, vendorId, "paid"],
    queryFn: async () => {
      const response = await billingClient.get("/invoices", {
        params: { vendor_id: vendorId, status: "PAID", limit: 1 },
      });
      return { count: response.data.count || 0 };
    },
    enabled: !!hotelId && !!vendorId,
  });

  const { data: overdueInvoicesStats } = useQuery({
    queryKey: ["invoiceStats", hotelId, vendorId, "overdue"],
    queryFn: async () => {
      const response = await billingClient.get("/invoices/overdue", {
        params: { vendor_id: vendorId, limit: 1 },
      });
      return { count: response.data.count || 0 };
    },
    enabled: !!hotelId && !!vendorId,
  });

  // --- Data Query ---
  const {
    data: paginatedResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<PaginatedResponse<Invoice>>({
    queryKey: [
      "invoices",
      hotelId,
      vendorId,
      statusFilter,
      pagination,
      sorting,
      columnFilters,
      debouncedGlobalFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        vendor_id: vendorId || "",
        limit: String(pagination.pageSize),
        offset: String(pagination.pageIndex * pagination.pageSize),
      });

      if (statusFilter !== "All") {
        params.append("status", statusFilter);
      }

      if (debouncedGlobalFilter) {
        params.append("search", debouncedGlobalFilter);
      }

      if (sorting.length > 0) {
        const sortKey = sorting[0].id;
        const sortDir = sorting[0].desc ? "-" : "";
        params.append("ordering", `${sortDir}${sortKey}`);
      }

      columnFilters.forEach((filter) => {
        if (filter.value) {
          params.append(filter.id, String(filter.value));
        }
      });

      const response = await billingClient.get("/invoices", { params });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    enabled: !!hotelId && !!vendorId,
  });

  // --- Mutations ---
  const deleteInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      billingClient.delete(`/invoices/${invoiceId}/`),
    onSuccess: () => {
      toast.success("Invoice deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoiceStats"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Deletion failed"
        : error instanceof Error ? error.message : "Deletion failed";
      toast.error(`Failed to delete invoice: ${errorMessage}`);
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: CreateInvoiceRequest) =>
      billingClient.post("/invoices", data),
    onSuccess: () => {
      toast.success("Invoice created successfully!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoiceStats"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Creation failed"
        : error instanceof Error ? error.message : "Creation failed";
      toast.error(`Failed to create invoice: ${errorMessage}`);
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceRequest }) =>
      billingClient.patch(`/invoices/${id}/`, data),
    onSuccess: () => {
      toast.success("Invoice updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoiceStats"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Update failed"
        : error instanceof Error ? error.message : "Update failed";
      toast.error(`Failed to update invoice: ${errorMessage}`);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      billingClient.post(`/invoices/${invoiceId}/mark-paid`),
    onSuccess: () => {
      toast.success("Invoice marked as paid!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoiceStats"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Mark paid failed"
        : error instanceof Error ? error.message : "Mark paid failed";
      toast.error(`Failed to mark invoice as paid: ${errorMessage}`);
    },
  });

  // --- Computed Variables ---
  const invoices = paginatedResponse?.results ?? [];
  const totalCount = paginatedResponse?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);
  const hasNextPage = paginatedResponse?.next !== null;
  const hasPreviousPage = paginatedResponse?.previous !== null;

  // --- Table Columns ---
  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
              className="border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#171F2F] data-[state=checked]:bg-[#0785CF] data-[state=checked]:text-white dark:data-[state=checked]:bg-[#0785CF] shadow-none"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="w-full flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#171F2F] data-[state=checked]:bg-[#0785CF] data-[state=checked]:text-white dark:data-[state=checked]:bg-[#0785CF] shadow-none"
            />
          </div>
        ),
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "invoice_number",
        header: ({ column }) => (
          <SortableHeader column={column}>Invoice #</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-gray-700 dark:text-[#D0D5DD]">
            {row.original.invoice_number}
          </div>
        ),
        size: 180,
      },
      {
        accessorKey: "booking_id",
        header: "Booking ID",
        cell: ({ row }) => (
          <div className="text-gray-600 dark:text-[#98A2B3] font-mono text-sm">
            {row.original.booking_id}
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: "total_amount",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader column={column}>Amount</SortableHeader>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold text-gray-700 dark:text-[#D0D5DD]">
            {formatCurrency(row.original.total_amount, row.original.currency)}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={cn(
              "rounded-full px-3 py-1 font-medium border shadow-none",
              getStatusBadgeClasses(row.original.status)
            )}
          >
            {row.original.status}
          </Badge>
        ),
        size: 120,
      },
      {
        accessorKey: "issue_date",
        header: ({ column }) => (
          <SortableHeader column={column}>Issue Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.original.issue_date;
          if (!date) return "-";
          try {
            const parsed = parseISO(date);
            if (isValid(parsed)) {
              return format(parsed, "MMM dd, yyyy");
            }
          } catch {
            // fall through
          }
          return date;
        },
        size: 140,
      },
      {
        accessorKey: "due_date",
        header: ({ column }) => (
          <SortableHeader column={column}>Due Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.original.due_date;
          if (!date) return "-";
          try {
            const parsed = parseISO(date);
            if (isValid(parsed)) {
              return format(parsed, "MMM dd, yyyy");
            }
          } catch {
            // fall through
          }
          return date;
        },
        size: 140,
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEditingInvoice(row.original);
                      setIsFormOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 text-[#0785CF]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Invoice</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                      try {
                        const response = await billingClient.get(
                          `/invoices/${row.original.id}/pdf`,
                          { responseType: "blob" }
                        );
                        const blob = new Blob([response.data], { type: "application/pdf" });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `${row.original.invoice_number}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        toast.success("Invoice PDF downloaded successfully!");
                      } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : "Unknown error";
                        toast.error(`Failed to download PDF: ${errorMessage}`);
                      }
                    }}
                  >
                    <Download className="h-4 w-4 text-[#0785CF]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {row.original.status !== "PAID" && row.original.status !== "REFUNDED" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => markPaidMutation.mutate(row.original.id)}
                      disabled={markPaidMutation.isPending}
                    >
                      {markPaidMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mark as Paid</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete invoice{" "}
                    {row.original.invoice_number}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      deleteInvoiceMutation.mutate(row.original.id)
                    }
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
        size: 150,
        enableHiding: false,
      },
    ],
    [deleteInvoiceMutation, markPaidMutation]
  );

  const table = useReactTable({
    data: invoices,
    columns,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  // --- Export Function ---
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const selectedInvoices = table.getSelectedRowModel().rows.map((row) => row.original);
      if (selectedInvoices.length === 0) {
        toast.error("Please select at least one invoice to export");
        setIsExporting(false);
        return;
      }
      
      const invoiceNumbers = selectedInvoices.map((inv) => inv.invoice_number);
      const response = await billingClient.post(
        "/invoices/batch-pdf",
        { invoice_numbers: invoiceNumbers },
        { responseType: "blob" }
      );
      
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoices-batch-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedInvoices.length} invoice(s) successfully!`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  }, [table]);

  // --- Stats Data ---
  const stats = [
    {
      title: "Total Invoices",
      count: allInvoicesStats?.count || 0,
      icon: FileText,
      isLoading: isLoading,
    },
    {
      title: "Paid",
      count: paidInvoicesStats?.count || 0,
      icon: FileText,
      isLoading: isLoading,
    },
    {
      title: "Overdue",
      count: overdueInvoicesStats?.count || 0,
      icon: FileText,
      isLoading: isLoading,
    },
  ];

  if (isError) {
    return <ErrorPage error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101828]">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 shadow-none">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-[#D0D5DD]">
                Invoices
              </h1>
              <p className="text-sm text-gray-600 dark:text-[#98A2B3] mt-1">
                Manage and track all invoices
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="rounded-lg shadow-none"
              >
                <IoRefreshOutline
                  className={cn(
                    "h-4 w-4 mr-2",
                    isRefetching && "animate-spin"
                  )}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="rounded-lg shadow-none"
              >
                <TbFileTypeCsv
                  className={cn("h-4 w-4 mr-2", isExporting && "animate-spin")}
                />
                Export
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingInvoice(null);
                  setIsFormOpen(true);
                }}
                className="rounded-lg shadow-none bg-[#0785CF] hover:bg-[#0670B0]"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Form Sheet */}
      <InvoiceFormSheet
        invoice={editingInvoice}
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingInvoice(null);
        }}
        onSubmit={(data) => {
          if (editingInvoice) {
            updateInvoiceMutation.mutate({ id: editingInvoice.id, data });
          } else {
            // Automatically set vendor_id from hotel data when creating
            if (!vendorId) {
              toast.error("Vendor ID is not available. Please ensure you have a valid hotel.");
              return;
            }
            createInvoiceMutation.mutate({
              ...data as CreateInvoiceRequest,
              vendor_id: vendorId,
            });
          }
          setIsFormOpen(false);
          setEditingInvoice(null);
        }}
        isLoading={
          createInvoiceMutation.isPending || updateInvoiceMutation.isPending
        }
      />

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              count={stat.count}
              isLoading={stat.isLoading}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-4 shadow-none">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search invoices..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className={inputBaseClass}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn(inputBaseClass, "w-full sm:w-[180px]")}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent border-b border-gray-200 dark:border-b-[#1D2939] bg-gray-50 dark:bg-[#101828]/90"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-12 px-6 py-3 text-left font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3]"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0785CF]" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-gray-500 dark:text-[#98A2B3]"
                    >
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-gray-200 dark:border-b-[#1D2939] hover:bg-indigo-50/30 dark:hover:bg-[#1C2433]"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-6 py-4 text-gray-700 dark:text-[#D0D5DD]"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#1D2939]">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-[#98A2B3]">
                Showing {invoices.length} of {totalCount} invoices
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!hasPreviousPage || isLoading}
                className="rounded-lg shadow-none"
              >
                <ChevronFirstIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!hasPreviousPage || isLoading}
                className="rounded-lg shadow-none"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 dark:text-[#98A2B3]">
                Page {pagination.pageIndex + 1} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!hasNextPage || isLoading}
                className="rounded-lg shadow-none"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(totalPages - 1)}
                disabled={!hasNextPage || isLoading}
                className="rounded-lg shadow-none"
              >
                <ChevronLastIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
