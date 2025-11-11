// src/pages/reservation/cancelled-bookings.tsx
"use client";
import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  type FC,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import {
  type ColumnDef,
  type Column,
  type ColumnFiltersState,
  type SortingState,
  type PaginationState,
  type Row,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Eye,
  Trash2,
  Loader2,
  Loader,
  ChevronUpIcon,
  ChevronDownIcon,
  EllipsisIcon,
  Columns3Icon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  MoreVertical,
} from "lucide-react";
import { TbFileTypeCsv } from "react-icons/tb";
import { MdAdd } from "react-icons/md";
import { IoRefreshOutline } from "react-icons/io5";

import bookingClient from "@/api/booking-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ErrorPage from "@/components/custom/error-page";
import { useHotel } from "@/providers/hotel-provider";

// --- Type Definitions ---
interface Booking {
  id: string;
  full_name: string;
  code: string;
  phone_number: string | number;
  start_date: string;
  end_date: string;
  checkout: string | null;
  booking_type: "Physical" | "Online";
  amount_paid: string;
}

interface PaginatedBookingsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Booking[];
}

// --- Debounce Hook ---
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- Helper Functions ---
const getBookingTypeBadgeClasses = (type: "Physical" | "Online"): string => {
  switch (type) {
    case "Physical":
      return "bg-[#D6EEF9] text-blue-800 border-[#B4E6F5]200 dark:bg-[#B4E6F5]/50 dark:text-[#0785CF] dark:border-[#B4E6F5]700/60";
    case "Online":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-700/60";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
};

// --- Styling Constants ---
const focusRingClass =
  "focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 focus:border-[#B4E6F5]500 dark:focus:border-[#B4E6F5]400 focus:outline-none";
const inputBaseClass =
  "bg-white dark:bg-[#171F2F] border border-[#DADCE0] dark:border-[#1D2939] dark:text-[#D0D5DD] dark:placeholder:text-[#5D636E] rounded-lg shadow-none h-10 px-3 py-2 text-sm";

// --- Main Component ---
export default function CancelledBookings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hotel } = useHotel();
  const hotelId = hotel?.id;
  const inputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncedGlobalFilter = useDebounce(globalFilter, 500);
  const [isExporting, setIsExporting] = useState(false);

  // --- Data Query ---
  const {
    data: paginatedResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<PaginatedBookingsResponse>({
    queryKey: [
      "cancelledBookings",
      hotelId,
      pagination,
      debouncedGlobalFilter,
      sorting,
      columnFilters,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        microservice_item_id: hotelId!,
        limit: String(pagination.pageSize),
        offset: String(pagination.pageIndex * pagination.pageSize),
        booking_status: "Cancelled",
      });
      if (debouncedGlobalFilter)
        params.append("full_name", debouncedGlobalFilter);
      if (sorting.length > 0) {
        params.append(
          "ordering",
          `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
        );
      }
      columnFilters.forEach((filter) => {
        if (filter.value) {
          params.append(filter.id, String(filter.value));
        }
      });
      const response = await bookingClient.get(`/bookings`, { params });
      return response.data;
    },
    keepPreviousData: true,
    enabled: !!hotelId,
  });

  // --- Mutations ---
  const deleteBookingMutation = useMutation({
    mutationFn: (bookingId: string) =>
      bookingClient.delete(`/bookings/${bookingId}`),
    onSuccess: () => {
      toast.success("Booking deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["cancelledBookings"] });
    },
    onError: (error: any) =>
      toast.error(
        `Failed to delete booking: ${
          error.response?.data?.detail || error.message
        }`
      ),
  });

  const bookings = paginatedResponse?.results ?? [];
  const totalCount = paginatedResponse?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);
  const hasNextPage = paginatedResponse?.next !== null;
  const hasPreviousPage = paginatedResponse?.previous !== null;

  // --- Handlers ---
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    toast.info("Preparing CSV export...");
    try {
      const { data } = await bookingClient.get(`/bookings`, {
        params: {
          microservice_item_id: hotelId,
          booking_status: "Cancelled",
          limit: totalCount || 10,
        },
      });
      if (!data.results || data.results.length === 0) {
        toast.warning("No bookings to export.");
        return;
      }
      const csv = Papa.unparse(
        data.results.map((b: Booking) => ({
          "Booking Code": b.code,
          "Guest Name": b.full_name,
          Phone: b.phone_number,
          "Original Check-in Date": format(new Date(b.start_date), "PP"),
          "Original Check-out Date": format(new Date(b.end_date), "PP"),
          "Amount Paid": b.amount_paid,
        }))
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `cancelled-bookings-${format(
        new Date(),
        "yyyy-MM-dd"
      )}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Export successful!");
    } catch (err) {
      toast.error("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  }, [hotelId, totalCount]);

  const columns = useMemo<ColumnDef<Booking>[]>(
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
        accessorKey: "full_name",
        header: ({ column }) => (
          <SortableHeader column={column}>Guest</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-gray-700 dark:text-[#D0D5DD]">
            {row.original.full_name}
          </div>
        ),
        size: 220,
      },
      {
        id: "stay_dates",
        header: "Original Stay Dates",
        cell: ({ row }) => (
          <div className="text-gray-600 dark:text-[#98A2B3]">
            {format(new Date(row.original.start_date), "PP")} -{" "}
            {format(new Date(row.original.end_date), "PP")}
          </div>
        ),
        size: 280,
      },
      {
        accessorKey: "booking_type",
        header: "Booking Type",
        cell: ({ row }) => (
          <Badge
            className={cn(
              "rounded-full px-3 py-1 font-medium",
              getBookingTypeBadgeClasses(row.original.booking_type)
            )}
          >
            {row.original.booking_type}
          </Badge>
        ),
        size: 160,
      },
      {
        accessorKey: "amount_paid",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader column={column}>Amount Paid</SortableHeader>
          </div>
        ),
        cell: ({ row }) => {
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "TZS",
          }).format(parseFloat(row.original.amount_paid));
          return (
            <div className="text-right font-semibold text-gray-700 dark:text-[#D0D5DD]">
              {formatted}
            </div>
          );
        },
        size: 180,
      },
      {
        id: "details",
        header: () => <div className="text-center">Details</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button
              className="h-8 w-8 shadow-none flex items-center justify-center text-[#0785CF] hover:text-blue-800"
              onClick={() => navigate(`/bookings/${row.original.id}`)}
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
        ),
        size: 80,
        enableHiding: false,
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <RowActions
              row={row}
              deleteBookingMutation={deleteBookingMutation}
            />
          </div>
        ),
        size: 80,
        enableHiding: false,
      },
    ],
    [deleteBookingMutation, navigate]
  );

  const table = useReactTable({
    data: bookings,
    columns,
    state: { sorting, columnFilters, pagination },
    pageCount: totalPages,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleDeleteRows = () => {
    table
      .getSelectedRowModel()
      .rows.forEach((row) => deleteBookingMutation.mutate(row.original.id));
    table.resetRowSelection();
  };

  const activeFilters = useMemo(() => {
    const filters = [];
    if (globalFilter) {
      filters.push({
        label: `Guest: "${globalFilter}"`,
        onClear: () => setGlobalFilter(""),
      });
    }
    const bookingTypeFilter = columnFilters.find(
      (f) => f.id === "booking_type"
    );
    if (bookingTypeFilter?.value) {
      filters.push({
        label: `Type: ${bookingTypeFilter.value}`,
        onClear: () =>
          setColumnFilters((prev) =>
            prev.filter((f) => f.id !== "booking_type")
          ),
      });
    }
    return filters;
  }, [globalFilter, columnFilters]);

  const clearFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    setSorting([]);
  };

  if (isError) return <ErrorPage error={error as Error} onRetry={refetch} />;

  return (
    <div className="flex-1 space-y-6 bg-[#F9FAFB] dark:bg-[#101828] pb-10 min-h-screen">
      <div className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 px-4 md:px-6 py-4 shadow-none h-[132px] flex flex-col justify-center">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-[30px] lg:leading-[36px] font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Cancelled Bookings
            </h1>
            <p className="text-base text-gray-600 dark:text-[#98A2B3] mt-1">
              A list of all bookings that have been cancelled.
            </p>
          </div>
          <Button
            className="bg-[#0785CF] hover:bg-[#0785CF]/90 shadow-none rounded-lg"
            onClick={() => navigate("/bookings/new-booking")}
          >
            Create New Booking
          </Button>
        </div>
      </div>

      <main className="px-4 md:px-6 space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-[#D0D5DD]">
            Total Cancelled:
          </span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-400 shadow-none rounded-md px-2.5 py-0.5 text-sm font-semibold">
              {totalCount}
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label htmlFor="guest-search" className="sr-only">
                  Search by Guest
                </label>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    id="guest-search"
                    placeholder="Search by guest name..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className={cn(
                      "pr-8 w-full sm:w-60",
                      inputBaseClass,
                      focusRingClass
                    )}
                  />
                  {globalFilter && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#98A2B3] hover:text-gray-700 dark:hover:text-white"
                      onClick={() => {
                        setGlobalFilter("");
                        inputRef.current?.focus();
                      }}
                    >
                      <XIcon size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="booking-type-filter" className="sr-only">
                  Booking Type
                </label>
                <select
                  id="booking-type-filter"
                  value={
                    (table
                      .getColumn("booking_type")
                      ?.getFilterValue() as string) ?? ""
                  }
                  onChange={(e) =>
                    table
                      .getColumn("booking_type")
                      ?.setFilterValue(
                        e.target.value === "all" ? "" : e.target.value
                      )
                  }
                  className={cn(
                    "w-full sm:w-40",
                    inputBaseClass,
                    focusRingClass
                  )}
                >
                  <option value="all">All Types</option>
                  <option value="Physical">Physical</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {table.getSelectedRowModel().rows.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 bg-white dark:bg-transparent border-gray-200 dark:border-[#1D2939] rounded-lg shadow-none hover:bg-rose-50 dark:hover:bg-rose-900/40 hover:border-rose-300 dark:hover:border-rose-600 text-rose-600 dark:text-rose-400"
                    >
                      <Trash2 size={16} /> Delete (
                      {table.getSelectedRowModel().rows.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white dark:bg-[#101828] dark:border-[#1D2939] rounded-xl shadow-none">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg font-bold text-gray-900 dark:text-[#D0D5DD]">
                        Confirm Deletion
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600 dark:text-[#98A2B3]">
                        This will permanently delete{" "}
                        {table.getSelectedRowModel().rows.length} selected
                        booking(s). This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-100 dark:bg-[#171F2F] hover:bg-gray-200 dark:hover:bg-[#1C2433] text-gray-700 dark:text-[#D0D5DD] rounded-lg border-none shadow-none">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-none"
                        onClick={handleDeleteRows}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 bg-white dark:bg-[#101828] dark:text-[#D0D5DD] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-none"
                  >
                    <Columns3Icon size={16} /> View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="dark:bg-[#101828] dark:border-[#1D2939] shadow-none rounded-lg"
                >
                  <DropdownMenuLabel className="dark:text-[#D0D5DD]">
                    Toggle columns
                  </DropdownMenuLabel>
                  {table
                    .getAllColumns()
                    .filter((c) => c.getCanHide())
                    .map((c) => (
                      <DropdownMenuCheckboxItem
                        key={c.id}
                        checked={c.getIsVisible()}
                        onCheckedChange={c.toggleVisibility}
                        className="capitalize dark:text-[#D0D5DD] dark:hover:bg-[#1C2433]"
                      >
                        {c.id.replace(/_/g, " ")}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isRefetching || isLoading}
                className="gap-2 bg-white dark:bg-[#101828] dark:text-[#D0D5DD] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-none"
              >
                <IoRefreshOutline
                  className={cn("h-5 w-5", isRefetching && "animate-spin")}
                />
                Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-none"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="dark:bg-[#101828] dark:border-[#1D2939] rounded-lg shadow-none"
                >
                  <DropdownMenuItem
                    onClick={handleExport}
                    disabled={isExporting}
                    className="dark:text-[#D0D5DD] dark:hover:bg-[#1C2433]"
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <TbFileTypeCsv className="mr-2 h-4 w-4" />
                    )}
                    <span>
                      {isExporting ? "Exporting..." : "Export to CSV"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/bookings/new-booking")}
                    className="dark:text-[#D0D5DD] dark:hover:bg-[#1C2433]"
                  >
                    <MdAdd className="mr-2 h-4 w-4" />
                    <span>New Booking</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-[#98A2B3]">
                Active Filters:
              </span>
              {activeFilters.map((filter, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2 bg-[#D6EEF9] dark:bg-[#162142] border border-[#B4E6F5]200 dark:border-[#B4E6F5]900 text-blue-800 dark:text-[#7592FF] shadow-none rounded-full"
                >
                  {filter.label}
                  <button
                    onClick={filter.onClear}
                    className="rounded-full hover:bg-[#B4E6F5] dark:hover:bg-blue-800/50 p-0.5"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <span
                className="text-[#0785CF] text-sm font-medium cursor-pointer hover:text-[#0785CF] dark:text-[#0785CF] dark:hover:text-[#0785CF] p-1.5"
                onClick={clearFilters}
              >
                Clear All
              </span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-[#1D2939] shadow-none bg-white dark:bg-[#171F2F] overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-b-2 border-gray-300 dark:border-b-[#1D2939]"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="h-14 px-4 text-left align-middle font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3] border-r border-gray-200 dark:border-r-[#1D2939] last:border-r-0 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#171F2F] dark:to-[#171F2F]/90 shadow-none"
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
                    <div className="w-full flex items-center justify-center">
                      <Loader className="animate-spin h-8 w-8 text-[#0785CF]" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b border-gray-200 dark:border-b-[#1D2939] hover:bg-indigo-50/30 dark:hover:bg-[#1C2433] transition-colors data-[state=selected]:bg-[#D6EEF9] dark:data-[state=selected]:bg-[#162142]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3 align-middle border-r border-gray-200 dark:border-r-[#1D2939] last:border-r-0 text-gray-700 dark:text-[#D0D5DD] text-sm"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-gray-500 dark:text-[#98A2B3]"
                  >
                    No cancelled bookings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-[#98A2B3]">
              Rows per page:
            </span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-9 w-[70px] bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-lg shadow-none focus:ring-1 focus:ring-blue-500">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent
                side="top"
                className="dark:bg-[#101828] dark:border-[#1D2939] shadow-none rounded-lg"
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="dark:text-[#D0D5DD] dark:hover:bg-[#1C2433]"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 dark:text-[#98A2B3] hidden sm:block">
              {table.getFilteredSelectedRowModel().rows.length} of {totalCount}{" "}
              row(s) selected.
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center justify-center text-sm font-medium text-gray-700 dark:text-[#98A2B3]">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-9 w-9 p-0 shadow-none dark:bg-[#101828] dark:border-[#1D2939] dark:hover:bg-[#1C2433] rounded-lg"
                onClick={() => table.firstPage()}
                disabled={!hasPreviousPage}
              >
                <ChevronFirstIcon className="h-5 w-5 dark:text-[#98A2B3]" />
              </Button>
              <Button
                variant="outline"
                className="h-9 w-9 p-0 shadow-none dark:bg-[#101828] dark:border-[#1D2939] dark:hover:bg-[#1C2433] rounded-lg"
                onClick={() => table.previousPage()}
                disabled={!hasPreviousPage}
              >
                <ChevronLeftIcon className="h-5 w-5 dark:text-[#98A2B3]" />
              </Button>
              <Button
                variant="outline"
                className="h-9 w-9 p-0 shadow-none dark:bg-[#101828] dark:border-[#1D2939] dark:hover:bg-[#1C2433] rounded-lg"
                onClick={() => table.nextPage()}
                disabled={!hasNextPage}
              >
                <ChevronRightIcon className="h-5 w-5 dark:text-[#98A2B3]" />
              </Button>
              <Button
                variant="outline"
                className="h-9 w-9 p-0 shadow-none dark:bg-[#101828] dark:border-[#1D2939] dark:hover:bg-[#1C2433] rounded-lg"
                onClick={() => table.lastPage()}
                disabled={!hasNextPage}
              >
                <ChevronLastIcon className="h-5 w-5 dark:text-[#98A2B3]" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Reusable Sub-components ---
const SortableHeader: FC<{
  column: Column<Booking, unknown>;
  children: React.ReactNode;
}> = ({ column, children }) => {
  const isSorted = column.getIsSorted();
  return (
    <div
      className="flex items-center gap-2 cursor-pointer select-none"
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      {isSorted === "desc" ? (
        <ChevronDownIcon size={16} className="dark:text-[#D0D5DD]" />
      ) : (
        <ChevronUpIcon
          size={16}
          className={cn(
            isSorted === "asc"
              ? "text-gray-800 dark:text-[#D0D5DD]"
              : "text-gray-400 dark:text-[#98A2B3]"
          )}
        />
      )}
    </div>
  );
};

function RowActions({
  row,
  deleteBookingMutation,
}: {
  row: Row<Booking>;
  deleteBookingMutation: any;
}) {
  const booking = row.original;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-center">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full hover:bg-indigo-100 dark:hover:bg-[#1C2433] text-gray-600 dark:text-[#98A2B3] shadow-none"
          >
            <EllipsisIcon size={18} />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-none"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400">
              <Trash2 className="mr-2 h-5 w-5" />
              <span>Delete</span>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white dark:bg-[#101828] dark:border-[#1D2939] rounded-xl shadow-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold text-gray-900 dark:text-[#D0D5DD]">
                Confirm Deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-[#98A2B3]">
                This will permanently delete the booking for '
                {booking.full_name}'. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-100 dark:bg-[#171F2F] hover:bg-gray-200 dark:hover:bg-[#1C2433] text-gray-700 dark:text-[#D0D5DD] rounded-lg border-none shadow-none">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-none"
                onClick={() => deleteBookingMutation.mutate(booking.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
