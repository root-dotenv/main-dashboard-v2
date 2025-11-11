// src/pages/billings/charges.tsx
"use client";
import { useState, useMemo, useEffect } from "react";
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
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { TbFileTypeCsv } from "react-icons/tb";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { IoRefreshOutline } from "react-icons/io5";
import ErrorPage from "@/components/custom/error-page";
import billingClient from "@/api/billing-client";
import { StatCard } from "@/components/custom/StatCard";
import { useAuthStore } from "@/store/auth.store";
import { useHotel } from "@/providers/hotel-provider";
import type {
  AccountTransaction,
  PaginatedResponse,
  CreateAccountTransactionRequest,
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
    case "PROCESSED":
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-700/60";
    case "FAILED":
    case "CANCELLED":
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-700/60";
    case "PENDING":
    case "CALCULATED":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-700/60";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
};

const getTransactionTypeBadgeClasses = (type: string): string => {
  if (type.includes("CREDIT")) {
    return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-700/60";
  }
  if (type.includes("DEBIT")) {
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-400 dark:border-red-700/60";
  }
  return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
};

const formatCurrency = (amount: string, currency: string = "USD"): string => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return amount;
  const sign = numAmount >= 0 ? "" : "-";
  return `${sign}${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(Math.abs(numAmount))}`;
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

// --- Transaction Form Component ---
function TransactionFormSheet({
  transaction,
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  transaction: AccountTransaction | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAccountTransactionRequest | Partial<AccountTransaction>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateAccountTransactionRequest>({
    entity_id: "",
    entity_type: "VENDOR",
    transaction_event_type: "BOOKING_CONFIRMED_CREDIT",
    amount: "",
    currency: "USD",
    description: "",
    transaction_source_type: "ONLINE",
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        entity_id: transaction.entity_id,
        entity_type: transaction.entity_type,
        transaction_event_type: transaction.transaction_event_type,
        amount: transaction.amount,
        currency: transaction.currency || "USD",
        description: transaction.description || "",
        transaction_source_type: transaction.transaction_source_type || "ONLINE",
      });
    } else {
      setFormData({
        entity_id: "",
        entity_type: "VENDOR",
        transaction_event_type: "BOOKING_CONFIRMED_CREDIT",
        amount: "",
        currency: "USD",
        description: "",
        transaction_source_type: "ONLINE",
      });
    }
  }, [transaction, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] p-0 flex flex-col">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-b-[#1D2939] bg-[#F9FAFB] dark:bg-[#101828]">
            <SheetTitle className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
              {transaction ? "Edit Transaction" : "Create New Transaction"}
            </SheetTitle>
            <SheetDescription className="text-sm text-gray-600 dark:text-[#98A2B3] mt-1">
              {transaction
                ? "Update the transaction details."
                : "Fill in the details for the new transaction."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <Label htmlFor="entity_type" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                  Entity Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.entity_type}
                  onValueChange={(value: "VENDOR" | "AGENCY") =>
                    setFormData({ ...formData, entity_type: value })
                  }
                >
                  <SelectTrigger className={inputBaseClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
                    <SelectItem value="VENDOR">Vendor</SelectItem>
                    <SelectItem value="AGENCY">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transaction_event_type" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                  Transaction Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.transaction_event_type}
                  onValueChange={(value: AccountTransaction["transaction_event_type"]) =>
                    setFormData({ ...formData, transaction_event_type: value })
                  }
                >
                  <SelectTrigger className={inputBaseClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
                    <SelectItem value="BOOKING_CONFIRMED_CREDIT">Booking Confirmed Credit</SelectItem>
                    <SelectItem value="BOOKING_CONFIRMED_DEBIT">Booking Confirmed Debit</SelectItem>
                    <SelectItem value="PAYOUT_PROCESSED">Payout Processed</SelectItem>
                    <SelectItem value="REFUND_ISSUED">Refund Issued</SelectItem>
                    <SelectItem value="FINE_APPLIED">Fine Applied</SelectItem>
                    <SelectItem value="ADJUSTMENT_CREDIT">Adjustment Credit</SelectItem>
                    <SelectItem value="ADJUSTMENT_DEBIT">Adjustment Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className={inputBaseClass}
                  placeholder="0.00"
                />
              </div>
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
                <Label htmlFor="transaction_source_type" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                  Source Type
                </Label>
                <Select
                  value={formData.transaction_source_type || "ONLINE"}
                  onValueChange={(value: "ONLINE" | "PHYSICAL") =>
                    setFormData({ ...formData, transaction_source_type: value })
                  }
                >
                  <SelectTrigger className={inputBaseClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="PHYSICAL">Physical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={inputBaseClass}
                  placeholder="Enter transaction description"
                  rows={3}
                />
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
                    {transaction ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  transaction ? "Update Transaction" : "Create Transaction"
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
export default function Charges() {
  const queryClient = useQueryClient();
  const { hotelId } = useAuthStore();
  const { hotel } = useHotel();
  const vendorId = hotel?.vendor_id;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<AccountTransaction | null>(null);

  // --- State ---
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("All");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncedGlobalFilter = useDebounce(globalFilter, 500);
  const [isExporting, setIsExporting] = useState(false);

  // --- Stats Queries ---
  const { data: allTransactionsStats } = useQuery({
    queryKey: ["transactionStats", hotelId, vendorId, "all"],
    queryFn: async () => {
      const response = await billingClient.get("/account-transactions", {
        params: { entity_id: vendorId, entity_type: "VENDOR", limit: 1 },
      });
      return { count: response.data.count || 0 };
    },
    enabled: !!hotelId && !!vendorId,
  });

  const { data: creditTransactionsStats } = useQuery({
    queryKey: ["transactionStats", hotelId, vendorId, "credit"],
    queryFn: async () => {
      const response = await billingClient.get("/account-transactions", {
        params: { entity_id: vendorId, entity_type: "VENDOR", transaction_event_type: "BOOKING_CONFIRMED_CREDIT", limit: 1 },
      });
      return { count: response.data.count || 0 };
    },
    enabled: !!hotelId && !!vendorId,
  });

  const { data: debitTransactionsStats } = useQuery({
    queryKey: ["transactionStats", hotelId, vendorId, "debit"],
    queryFn: async () => {
      const response = await billingClient.get("/account-transactions", {
        params: { entity_id: vendorId, entity_type: "VENDOR", transaction_event_type: "BOOKING_CONFIRMED_DEBIT", limit: 1 },
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
  } = useQuery<PaginatedResponse<AccountTransaction>>({
    queryKey: [
      "accountTransactions",
      hotelId,
      vendorId,
      entityTypeFilter,
      transactionTypeFilter,
      statusFilter,
      pagination,
      sorting,
      columnFilters,
      debouncedGlobalFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        entity_id: vendorId || "",
        entity_type: "VENDOR",
        limit: String(pagination.pageSize),
        offset: String(pagination.pageIndex * pagination.pageSize),
      });

      if (entityTypeFilter !== "All") {
        params.append("entity_type", entityTypeFilter);
      }

      if (transactionTypeFilter !== "All") {
        params.append("transaction_event_type", transactionTypeFilter);
      }

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

      const response = await billingClient.get("/account-transactions", { params });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    enabled: !!hotelId && !!vendorId,
  });

  // --- Mutations ---
  const createTransactionMutation = useMutation({
    mutationFn: (data: CreateAccountTransactionRequest) =>
      billingClient.post("/account-transactions", data),
    onSuccess: () => {
      toast.success("Transaction created successfully!");
      queryClient.invalidateQueries({ queryKey: ["accountTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactionStats"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Creation failed"
        : error instanceof Error ? error.message : "Creation failed";
      toast.error(`Failed to create transaction: ${errorMessage}`);
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccountTransaction> }) =>
      billingClient.patch(`/account-transactions/${id}/`, data),
    onSuccess: () => {
      toast.success("Transaction updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["accountTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactionStats"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Update failed"
        : error instanceof Error ? error.message : "Update failed";
      toast.error(`Failed to update transaction: ${errorMessage}`);
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) =>
      billingClient.delete(`/account-transactions/${id}/`),
    onSuccess: () => {
      toast.success("Transaction deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["accountTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactionStats"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Deletion failed"
        : error instanceof Error ? error.message : "Deletion failed";
      toast.error(`Failed to delete transaction: ${errorMessage}`);
    },
  });

  // --- Computed Variables ---
  const transactions = paginatedResponse?.results ?? [];
  const totalCount = paginatedResponse?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);
  const hasNextPage = paginatedResponse?.next !== null;
  const hasPreviousPage = paginatedResponse?.previous !== null;

  // --- Export Function ---
  const handleExport = async () => {
    setIsExporting(true);
    try {
      toast.success("Export started!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --- Table Columns ---
  const columns = useMemo<ColumnDef<AccountTransaction>[]>(
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
        accessorKey: "transaction_event_type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.transaction_event_type;
          const isCredit = type.includes("CREDIT");
          return (
            <div className="flex items-center gap-2">
              {isCredit ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <Badge
                className={cn(
                  "rounded-full px-3 py-1 font-medium border shadow-none text-xs",
                  getTransactionTypeBadgeClasses(type)
                )}
              >
                {type.replace(/_/g, " ")}
              </Badge>
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "entity_type",
        header: "Entity Type",
        cell: ({ row }) => (
          <Badge
            className={cn(
              "rounded-full px-3 py-1 font-medium border shadow-none",
              row.original.entity_type === "VENDOR"
                ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400"
                : "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-400"
            )}
          >
            {row.original.entity_type}
          </Badge>
        ),
        size: 120,
      },
      {
        accessorKey: "entity_id",
        header: "Entity ID",
        cell: ({ row }) => (
          <div className="text-gray-600 dark:text-[#98A2B3] font-mono text-sm">
            {row.original.entity_id.slice(0, 8)}...
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader column={column}>Amount</SortableHeader>
          </div>
        ),
        cell: ({ row }) => {
          const amount = parseFloat(row.original.amount);
          const isCredit = amount >= 0;
          return (
            <div
              className={cn(
                "text-right font-semibold",
                isCredit
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              )}
            >
              {formatCurrency(row.original.amount, row.original.currency)}
            </div>
          );
        },
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
        accessorKey: "created_at",
        header: ({ column }) => (
          <SortableHeader column={column}>Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.original.created_at;
          if (!date) return "-";
          try {
            const parsed = parseISO(date);
            if (isValid(parsed)) {
              return format(parsed, "MMM dd, yyyy HH:mm");
            }
          } catch {
            // fall through
          }
          return date;
        },
        size: 180,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="text-gray-600 dark:text-[#98A2B3] text-sm max-w-xs truncate">
            {row.original.description || "-"}
          </div>
        ),
        size: 200,
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
                      setEditingTransaction(row.original);
                      setIsFormOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 text-[#0785CF]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Transaction</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                  <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this transaction? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteTransactionMutation.mutate(row.original.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
        size: 120,
        enableHiding: false,
      },
    ],
    [deleteTransactionMutation]
  );

  const table = useReactTable({
    data: transactions,
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

  // --- Stats Data ---
  const stats = [
    {
      title: "Total Transactions",
      count: allTransactionsStats?.count || 0,
      icon: RefreshCw,
      isLoading: isLoading,
    },
    {
      title: "Credits",
      count: creditTransactionsStats?.count || 0,
      icon: TrendingUp,
      isLoading: isLoading,
    },
    {
      title: "Debits",
      count: debitTransactionsStats?.count || 0,
      icon: TrendingDown,
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
                Account Transactions
              </h1>
              <p className="text-sm text-gray-600 dark:text-[#98A2B3] mt-1">
                Track all financial movements and charges
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
                  setEditingTransaction(null);
                  setIsFormOpen(true);
                }}
                className="rounded-lg shadow-none bg-[#0785CF] hover:bg-[#0670B0]"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Form Sheet */}
      <TransactionFormSheet
        transaction={editingTransaction}
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        onSubmit={(data) => {
          if (editingTransaction) {
            updateTransactionMutation.mutate({ id: editingTransaction.id, data });
          } else {
            // Automatically set entity_id to vendor_id when creating transactions
            if (!vendorId) {
              toast.error("Vendor ID is not available. Please ensure you have a valid hotel.");
              return;
            }
            createTransactionMutation.mutate({
              ...data as CreateAccountTransactionRequest,
              entity_id: vendorId,
              entity_type: "VENDOR",
            });
          }
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        isLoading={
          createTransactionMutation.isPending || updateTransactionMutation.isPending
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
                placeholder="Search transactions..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className={inputBaseClass}
              />
            </div>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className={cn(inputBaseClass, "w-full sm:w-[150px]")}>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Entities</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="AGENCY">Agency</SelectItem>
              </SelectContent>
            </Select>
            <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
              <SelectTrigger className={cn(inputBaseClass, "w-full sm:w-[200px]")}>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="BOOKING_CONFIRMED_CREDIT">Booking Credit</SelectItem>
                <SelectItem value="BOOKING_CONFIRMED_DEBIT">Booking Debit</SelectItem>
                <SelectItem value="PAYOUT_PROCESSED">Payout Processed</SelectItem>
                <SelectItem value="REFUND_ISSUED">Refund Issued</SelectItem>
                <SelectItem value="FINE_APPLIED">Fine Applied</SelectItem>
                <SelectItem value="ADJUSTMENT_CREDIT">Adjustment Credit</SelectItem>
                <SelectItem value="ADJUSTMENT_DEBIT">Adjustment Debit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn(inputBaseClass, "w-full sm:w-[150px]")}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CALCULATED">Calculated</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PROCESSED">Processed</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-gray-500 dark:text-[#98A2B3]"
                    >
                      No transactions found.
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
                Showing {transactions.length} of {totalCount} transactions
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
