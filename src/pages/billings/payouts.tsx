// src/pages/billings/payouts.tsx
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
  DollarSign,
  Building2,
  User,
  Edit,
  Trash2,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import ErrorPage from "@/components/custom/error-page";
import billingClient from "@/api/billing-client";
import { StatCard } from "@/components/custom/StatCard";
import { useAuthStore } from "@/store/auth.store";
import { useHotel } from "@/providers/hotel-provider";
import type {
  VendorPayout,
  AgentPayout,
  PaginatedResponse,
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

// --- Vendor Payout Edit Form ---
function VendorPayoutEditForm({
  payout,
  onClose,
  onUpdate,
  isLoading,
}: {
  payout: VendorPayout;
  onClose: () => void;
  onUpdate: (data: Partial<VendorPayout>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    status: payout.status,
    currency: payout.currency || "USD",
    transaction_type: payout.transaction_type || "ONLINE",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div>
          <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
            Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as VendorPayout["status"] })}
          >
            <SelectTrigger className={inputBaseClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
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
        <div>
          <Label htmlFor="currency" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
            Currency
          </Label>
          <Select
            value={formData.currency}
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
          <Label htmlFor="transaction_type" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
            Transaction Type
          </Label>
          <Select
            value={formData.transaction_type}
            onValueChange={(value: "ONLINE" | "PHYSICAL") => setFormData({ ...formData, transaction_type: value })}
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
      </div>
      <div className="px-6 py-4 border-t border-gray-200 dark:border-t-[#1D2939] bg-white dark:bg-[#101828] flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
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
              Updating...
            </>
          ) : (
            "Update Payout"
          )}
        </Button>
      </div>
    </form>
  );
}

// --- Agent Payout Edit Form ---
function AgentPayoutEditForm({
  payout,
  onClose,
  onUpdate,
  isLoading,
}: {
  payout: AgentPayout;
  onClose: () => void;
  onUpdate: (data: Partial<AgentPayout>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    status: payout.status,
    currency: payout.currency || "USD",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div>
          <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
            Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as AgentPayout["status"] })}
          >
            <SelectTrigger className={inputBaseClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
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
        <div>
          <Label htmlFor="currency" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
            Currency
          </Label>
          <Select
            value={formData.currency}
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
      </div>
      <div className="px-6 py-4 border-t border-gray-200 dark:border-t-[#1D2939] bg-white dark:bg-[#101828] flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
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
              Updating...
            </>
          ) : (
            "Update Payout"
          )}
        </Button>
      </div>
    </form>
  );
}

// --- Vendor Payouts Component ---
function VendorPayoutsTab() {
  const queryClient = useQueryClient();
  const { hotelId } = useAuthStore();
  const { hotel } = useHotel();
  const vendorId = hotel?.vendor_id;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncedGlobalFilter = useDebounce(globalFilter, 500);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayout, setEditingPayout] = useState<VendorPayout | null>(null);

  const {
    data: paginatedResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PaginatedResponse<VendorPayout>>({
    queryKey: [
      "vendorPayouts",
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

      const response = await billingClient.get("/vendor-payouts", { params });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    enabled: !!hotelId && !!vendorId,
  });

  const updatePayoutMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorPayout> }) =>
      billingClient.patch(`/vendor-payouts/${id}/`, data),
    onSuccess: () => {
      toast.success("Payout updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["vendorPayouts"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Update failed"
        : error instanceof Error ? error.message : "Update failed";
      toast.error(`Failed to update payout: ${errorMessage}`);
    },
  });

  const deletePayoutMutation = useMutation({
    mutationFn: (id: string) =>
      billingClient.delete(`/vendor-payouts/${id}/`),
    onSuccess: () => {
      toast.success("Payout deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["vendorPayouts"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Deletion failed"
        : error instanceof Error ? error.message : "Deletion failed";
      toast.error(`Failed to delete payout: ${errorMessage}`);
    },
  });

  const payouts = paginatedResponse?.results ?? [];
  const totalCount = paginatedResponse?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);
  const hasNextPage = paginatedResponse?.next !== null;
  const hasPreviousPage = paginatedResponse?.previous !== null;

  const columns = useMemo<ColumnDef<VendorPayout>[]>(
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
        accessorKey: "vendor_id",
        header: "Vendor ID",
        cell: ({ row }) => (
          <div className="text-gray-600 dark:text-[#98A2B3] font-mono text-sm">
            {row.original.vendor_id.slice(0, 8)}...
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "net_amount_payable",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader column={column}>Net Amount</SortableHeader>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold text-gray-700 dark:text-[#D0D5DD]">
            {formatCurrency(row.original.net_amount_payable, row.original.currency)}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "total_gross_revenue",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader column={column}>Gross Revenue</SortableHeader>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right text-gray-600 dark:text-[#98A2B3]">
            {formatCurrency(row.original.total_gross_revenue || "0", row.original.currency)}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "total_commissions_deducted",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader column={column}>Commissions</SortableHeader>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right text-red-600 dark:text-red-400">
            -{formatCurrency(row.original.total_commissions_deducted || "0", row.original.currency)}
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
                      setEditingPayout(row.original);
                      setIsFormOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 text-[#0785CF]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Payout</TooltipContent>
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
                  <AlertDialogTitle>Delete Payout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this payout? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deletePayoutMutation.mutate(row.original.id)}
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
    [deletePayoutMutation]
  );

  const table = useReactTable({
    data: payouts,
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

  if (isError) {
    return <ErrorPage error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-4 shadow-none">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search vendor payouts..."
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#0785CF]" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : payouts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-gray-500 dark:text-[#98A2B3]"
                  >
                    No vendor payouts found.
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
              Showing {payouts.length} of {totalCount} payouts
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

      {/* Vendor Payout Edit Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingPayout(null);
      }}>
        <SheetContent className="w-full sm:max-w-lg bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] p-0 flex flex-col">
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-b-[#1D2939] bg-[#F9FAFB] dark:bg-[#101828]">
              <SheetTitle className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
                Edit Vendor Payout
              </SheetTitle>
              <SheetDescription className="text-sm text-gray-600 dark:text-[#98A2B3] mt-1">
                Update the payout details.
              </SheetDescription>
            </SheetHeader>
            {editingPayout && (
              <VendorPayoutEditForm
                payout={editingPayout}
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingPayout(null);
                }}
                onUpdate={(data) => {
                  updatePayoutMutation.mutate({ id: editingPayout.id, data });
                  setIsFormOpen(false);
                  setEditingPayout(null);
                }}
                isLoading={updatePayoutMutation.isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// --- Agent Payouts Component ---
function AgentPayoutsTab() {
  const queryClient = useQueryClient();
  const { hotelId } = useAuthStore();
  const { hotel } = useHotel();
  const vendorId = hotel?.vendor_id;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncedGlobalFilter = useDebounce(globalFilter, 500);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayout, setEditingPayout] = useState<AgentPayout | null>(null);

  const {
    data: paginatedResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PaginatedResponse<AgentPayout>>({
    queryKey: [
      "agentPayouts",
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
        // Note: Agent payouts may use agent_id instead of vendor_id
        // If the API supports filtering by vendor_id for agent payouts, add it here
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

      const response = await billingClient.get("/agent-payouts", { params });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    enabled: !!hotelId && !!vendorId,
  });

  const updatePayoutMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgentPayout> }) =>
      billingClient.patch(`/agent-payouts/${id}/`, data),
    onSuccess: () => {
      toast.success("Payout updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["agentPayouts"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Update failed"
        : error instanceof Error ? error.message : "Update failed";
      toast.error(`Failed to update payout: ${errorMessage}`);
    },
  });

  const deletePayoutMutation = useMutation({
    mutationFn: (id: string) =>
      billingClient.delete(`/agent-payouts/${id}/`),
    onSuccess: () => {
      toast.success("Payout deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["agentPayouts"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Deletion failed"
        : error instanceof Error ? error.message : "Deletion failed";
      toast.error(`Failed to delete payout: ${errorMessage}`);
    },
  });

  const payouts = paginatedResponse?.results ?? [];
  const totalCount = paginatedResponse?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);
  const hasNextPage = paginatedResponse?.next !== null;
  const hasPreviousPage = paginatedResponse?.previous !== null;

  const columns = useMemo<ColumnDef<AgentPayout>[]>(
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
        accessorKey: "agent_id",
        header: "Agent ID",
        cell: ({ row }) => (
          <div className="text-gray-600 dark:text-[#98A2B3] font-mono text-sm">
            {row.original.agent_id.slice(0, 8)}...
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "net_amount_payable",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader column={column}>Net Amount</SortableHeader>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold text-gray-700 dark:text-[#D0D5DD]">
            {formatCurrency(row.original.net_amount_payable, row.original.currency)}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "total_gross_commissions",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader column={column}>Gross Commissions</SortableHeader>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right text-gray-600 dark:text-[#98A2B3]">
            {formatCurrency(row.original.total_gross_commissions || "0", row.original.currency)}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "total_deductions",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader column={column}>Deductions</SortableHeader>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right text-red-600 dark:text-red-400">
            -{formatCurrency(row.original.total_deductions || "0", row.original.currency)}
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
                      setEditingPayout(row.original);
                      setIsFormOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 text-[#0785CF]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Payout</TooltipContent>
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
                  <AlertDialogTitle>Delete Payout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this payout? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deletePayoutMutation.mutate(row.original.id)}
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
    [deletePayoutMutation]
  );

  const table = useReactTable({
    data: payouts,
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

  if (isError) {
    return <ErrorPage error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-4 shadow-none">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search agent payouts..."
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#0785CF]" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : payouts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-gray-500 dark:text-[#98A2B3]"
                  >
                    No agent payouts found.
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
              Showing {payouts.length} of {totalCount} payouts
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

      {/* Agent Payout Edit Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingPayout(null);
      }}>
        <SheetContent className="w-full sm:max-w-lg bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] p-0 flex flex-col">
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-b-[#1D2939] bg-[#F9FAFB] dark:bg-[#101828]">
              <SheetTitle className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
                Edit Agent Payout
              </SheetTitle>
              <SheetDescription className="text-sm text-gray-600 dark:text-[#98A2B3] mt-1">
                Update the payout details.
              </SheetDescription>
            </SheetHeader>
            {editingPayout && (
              <AgentPayoutEditForm
                payout={editingPayout}
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingPayout(null);
                }}
                onUpdate={(data) => {
                  updatePayoutMutation.mutate({ id: editingPayout.id, data });
                  setIsFormOpen(false);
                  setEditingPayout(null);
                }}
                isLoading={updatePayoutMutation.isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// --- Main Component ---
export default function Payouts() {
  const { hotelId } = useAuthStore();
  const { hotel } = useHotel();
  const vendorId = hotel?.vendor_id;
  const [activeTab, setActiveTab] = useState("vendor");

  // Stats queries
  const { data: vendorPayoutsStats } = useQuery({
    queryKey: ["vendorPayoutStats", hotelId, vendorId],
    queryFn: async () => {
      const response = await billingClient.get("/vendor-payouts", {
        params: { vendor_id: vendorId, limit: 1 },
      });
      return { count: response.data.count || 0 };
    },
    enabled: !!hotelId && !!vendorId,
  });

  const { data: agentPayoutsStats } = useQuery({
    queryKey: ["agentPayoutStats", hotelId, vendorId],
    queryFn: async () => {
      const response = await billingClient.get("/agent-payouts", {
        params: { limit: 1 },
      });
      return { count: response.data.count || 0 };
    },
    enabled: !!hotelId && !!vendorId,
  });

  const stats = [
    {
      title: "Vendor Payouts",
      count: vendorPayoutsStats?.count || 0,
      icon: Building2,
      isLoading: false,
    },
    {
      title: "Agent Payouts",
      count: agentPayoutsStats?.count || 0,
      icon: User,
      isLoading: false,
    },
    {
      title: "Total Payouts",
      count: (vendorPayoutsStats?.count || 0) + (agentPayoutsStats?.count || 0),
      icon: DollarSign,
      isLoading: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101828]">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 shadow-none">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-[#D0D5DD]">
                Payouts
              </h1>
              <p className="text-sm text-gray-600 dark:text-[#98A2B3] mt-1">
                Manage vendor and agent payouts
              </p>
            </div>
          </div>
        </div>
      </div>

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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vendor">Vendor Payouts</TabsTrigger>
            <TabsTrigger value="agent">Agent Payouts</TabsTrigger>
          </TabsList>
          <TabsContent value="vendor">
            <VendorPayoutsTab />
          </TabsContent>
          <TabsContent value="agent">
            <AgentPayoutsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
