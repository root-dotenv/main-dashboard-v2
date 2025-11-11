// src/pages/rooms/allocate-rooms.tsx
"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, isValid } from "date-fns";
import { toast } from "sonner";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

// --- UI Components ---
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { CreateAllocationForm } from "./components/create-allocation-dialog";
import { EditAllocationForm } from "./components/edit-allocation-dialog";
import ErrorPage from "@/components/custom/error-page";

// --- Icons ---
import {
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  Columns3Icon,
  XIcon,
  RefreshCw,
  ChevronFirstIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronLastIcon,
  Eye, // Added Eye icon
} from "lucide-react";

// --- API & Types ---
import hotelClient from "@/api/hotel-client";
import {
  type Allocation,
  type PaginatedAllocationsResponse,
} from "@/types/allocation-types";
import { cn } from "@/lib/utils";
import { useHotel } from "@/providers/hotel-provider";
import { Label } from "@/components/ui/label"; // Added Label import

// --- Helper Hook & Functions ---
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const getStatusColor = (status?: string) => {
  // Same color logic, apply shadow-none in Badge className
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700/60";
    case "pending":
      return "bg-[#D6EEF9] text-[#0785CF] border-[#B4E6F5] dark:bg-[#B4E6F5]/50 dark:text-[#0785CF] dark:border-[#0785CF]/60";
    case "expired":
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    case "draft":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-700/60";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-400 dark:border-red-700/60";
    default:
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700/60";
  }
};

interface RoomType {
  id: string;
  name: string;
}

// --- Main Component ---
export default function AllocateRooms() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hotel } = useHotel();

  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(
    null
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncedGlobalFilter = useDebounce(globalFilter, 500);

  // --- Data Fetching ---
  const {
    data: paginatedResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<PaginatedAllocationsResponse>({
    queryKey: [
      "allocations",
      hotel?.id,
      pagination.pageIndex,
      pagination.pageSize,
      debouncedGlobalFilter,
      sorting,
      columnFilters,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({ hotel: hotel!.id });
      params.append("page", String(pagination.pageIndex + 1));
      params.append("page_size", String(pagination.pageSize));

      if (debouncedGlobalFilter) {
        // Assume API uses 'search' or 'name' for global search
        params.append("search", debouncedGlobalFilter);
      }
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

      const response = await hotelClient.get("/allocations/", { params });
      return response.data;
    },
    enabled: !!hotel?.id,
  });

  const { data: roomTypesData } = useQuery<RoomType[]>({
    queryKey: ["allRoomTypes", hotel?.id],
    queryFn: async () =>
      (await hotelClient.get("/room-types/", { params: { hotel: hotel!.id } }))
        .data.results,
    staleTime: Infinity,
    enabled: !!hotel?.id,
  });

  const roomTypesMap = useMemo(() => {
    if (!roomTypesData) return new Map<string, string>();
    return new Map(roomTypesData.map((rt) => [rt.id, rt.name]));
  }, [roomTypesData]);

  const allocations = useMemo(() => {
    if (!paginatedResponse?.results) return [];
    return paginatedResponse.results.map((alloc) => ({
      ...alloc,
      room_type_name: roomTypesMap.get(alloc.room_type) || "Unknown",
    }));
  }, [paginatedResponse, roomTypesMap]);

  // --- Mutations ---
  const deleteAllocationMutation = useMutation({
    mutationFn: (id: string) => hotelClient.delete(`/allocations/${id}/`),
    onSuccess: () => {
      toast.success("Allocation deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
    onError: (err: unknown) => {
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ||
            err.message ||
            "Deletion failed"
          : "Deletion failed";
      toast.error(errorMessage);
    },
  });

  // --- Handlers ---
  // Simplified sheet close logic
  const handleSheetClose = (sheetType: "create" | "edit") => {
    if (sheetType === "create") setIsCreateSheetOpen(false);
    if (sheetType === "edit") setEditingAllocation(null);
  };

  // --- Table Columns Definition ---
  const columns = useMemo<ColumnDef<Allocation & { room_type_name: string }>[]>(
    () => [
      {
        header: "S/N",
        cell: ({ row }) =>
          pagination.pageIndex * pagination.pageSize + row.index + 1,
        size: 50,
      },
      {
        accessorKey: "name",
        header: "Allocation Name",
        cell: ({ row }) => (
          <span className="font-medium text-blue-700 text-[0.9375rem] dark:text-[#D0D5DD]">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "room_type_name",
        id: "room_type", // Keep id for potential API filter key
        header: "Room Type",
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-[#98A2B3]">
            {row.original.room_type_name}
          </span>
        ),
      },
      {
        accessorKey: "total_rooms",
        header: "Allocated",
        cell: ({ row }) => `${row.original.total_rooms} Rooms`,
      },
      {
        header: "Period",
        cell: ({ row }) => (
          <div>
            <span className="text-gray-600 dark:text-[#98A2B3]">
              {format(new Date(row.original.start_date), "MMM dd")} -{" "}
              {format(new Date(row.original.end_date), "MMM dd, yyyy")}
            </span>
          </div>
        ),
      },
      {
        header: "Duration",
        cell: ({ row }) => {
          const startDate = new Date(row.original.start_date);
          const endDate = new Date(row.original.end_date);
          // Ensure valid dates before calculating difference
          const duration =
            isValid(startDate) && isValid(endDate)
              ? differenceInDays(endDate, startDate) + 1
              : 0;
          return (
            <span className="text-gray-600 dark:text-[#98A2B3]">
              {duration} {duration === 1 ? "Day" : "Days"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          // Added shadow-none
          <Badge
            className={cn(
              "rounded-full px-3 py-1 font-medium capitalize shadow-none",
              getStatusColor(row.original.status)
            )}
          >
            {row.original.status}
          </Badge>
        ),
      },
      // --- START: Added View Column ---
      {
        id: "view_details",
        header: () => <div className="text-center">View</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <button
              className="h-9 w-9 shadow-none text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/rooms/allocations/${row.original.id}`);
              }}
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
        ),
        size: 80,
      },
      // --- END: Added View Column ---
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const allocation = row.original;
          return (
            // Stop propagation to prevent row click from firing
            <div
              className="flex items-center justify-center" // Centered actions
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* Applied shadow-none */}
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 shadow-none hover:bg-indigo-100 dark:hover:bg-[#1C2433]"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                {/* Applied shadow-none */}
                <DropdownMenuContent
                  align="end"
                  className="shadow-none bg-white dark:bg-[#101828] border dark:border-[#1D2939]"
                >
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setEditingAllocation(allocation)}
                    className="cursor-pointer dark:hover:bg-[#1C2433]"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-[#1D2939]" />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/40 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    {/* Applied shadow-none */}
                    <AlertDialogContent className="shadow-none bg-white dark:bg-[#101828] border dark:border-[#1D2939]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-[#D0D5DD]">
                          Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-[#98A2B3]">
                          This will permanently delete the "
                          <strong>{allocation.name}</strong>" allocation. This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        {/* Adjusted button styles */}
                        <AlertDialogCancel className="rounded-lg shadow-none border-gray-300 dark:border-[#1D2939] dark:bg-[#171F2F] dark:text-[#D0D5DD] dark:hover:bg-[#1C2433]">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 rounded-lg shadow-none"
                          onClick={() =>
                            deleteAllocationMutation.mutate(allocation.id)
                          }
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 80, // Added size consistency
      },
    ],
    [deleteAllocationMutation, navigate, pagination]
  );

  const table = useReactTable({
    data: allocations,
    columns,
    pageCount: paginatedResponse?.count
      ? Math.ceil(paginatedResponse.count / pagination.pageSize)
      : -1,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  if (isError) return <ErrorPage error={error as Error} onRetry={refetch} />;

  // Consistent input styling class
  const inputBaseClass =
    "h-10 bg-white dark:bg-[#101828] border border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-all dark:placeholder:text-[#5D636E]";

  return (
    <>
      {/* Adjusted main background */}
      <div className="min-h-screen bg-gray-50 dark:bg-[#101828]">
        {/* Adjusted Header Styling */}
        <div className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 shadow-none lg:h-[132px]">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 py-6 lg:pt-8">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-[#1D2939] dark:text-[#D0D5DD] lg:text-[30px] lg:leading-[36px] lg:font-bold">
                  {hotel?.name} Room Allocations
                </h1>
                <p className="text-[0.9375rem] mt-1 text-gray-600 dark:text-[#98A2B3]">
                  Manage dedicated room blocks for SafariPro online bookings.
                </p>
              </div>
              <Sheet
                open={isCreateSheetOpen}
                onOpenChange={(open) => {
                  if (!open) handleSheetClose("create");
                  else setIsCreateSheetOpen(true);
                }}
              >
                <SheetTrigger asChild>
                  {/* Applied shadow-none */}
                  <Button className="shadow-none bg-[#3190D3] hover:bg-[#3190D3]">
                    Create Allocation
                  </Button>
                </SheetTrigger>
                {/* Applied shadow-none */}
                <SheetContent className="w-full sm:max-w-2xl p-0 shadow-none bg-white dark:bg-[#101828] border-l dark:border-l-[#1D2939]">
                  <CreateAllocationForm
                    onSuccess={() => handleSheetClose("create")}
                    // Removed onDirtyChange
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Adjusted main content background */}
        <main className="max-w-8xl bg-gray-50 dark:bg-[#101828] min-h-screen mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* --- Restyled Filter Section --- */}
          <div className="mb-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#D0D5DD]">
              Filter & Sort Allocations:
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Search Input */}
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-[#5D636E]" />
                  <Input
                    placeholder="Search by allocation name..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className={cn("pl-10", inputBaseClass)}
                  />
                  {globalFilter && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500 hover:bg-transparent"
                      onClick={() => setGlobalFilter("")}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {/* Native Select for Status */}
                <div className="grid gap-1.5 w-full sm:w-auto">
                  <Label htmlFor="status-filter" className="sr-only">
                    Status
                  </Label>{" "}
                  {/* Hidden label for accessibility */}
                  <select
                    id="status-filter"
                    value={
                      (table.getColumn("status")?.getFilterValue() as string) ||
                      "all"
                    }
                    onChange={(e) => {
                      const filterValue =
                        e.target.value === "all" ? "" : e.target.value;
                      table.getColumn("status")?.setFilterValue(filterValue);
                    }}
                    className={cn("w-full sm:w-40", inputBaseClass)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className={cn("gap-2", inputBaseClass.replace("h-10", "h-9"))} // Use base style but adjust height
                  onClick={() => refetch()}
                  disabled={isRefetching}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isRefetching && "animate-spin")}
                  />
                  Refresh
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "gap-2",
                        inputBaseClass.replace("h-10", "h-9")
                      )} // Use base style but adjust height
                    >
                      <Columns3Icon className="h-4 w-4" />
                      View
                    </Button>
                  </DropdownMenuTrigger>
                  {/* Applied shadow-none */}
                  <DropdownMenuContent
                    align="end"
                    className="shadow-none bg-white dark:bg-[#101828] border dark:border-[#1D2939]"
                  >
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator className="dark:bg-[#1D2939]" />
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                          className="capitalize dark:hover:bg-[#1C2433]"
                        >
                          {column.id.replace(/_/g, " ")}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          {/* --- End Filter Section --- */}

          {/* --- Restyled Table Container --- */}
          <div className="rounded-lg border border-gray-200 dark:border-[#1D2939] shadow-none bg-white dark:bg-[#171F2F] overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    // Applied consistent table header style
                    className="hover:bg-transparent border-b-2 border-gray-300 dark:border-b-[#1D2939]"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        // Applied consistent table header style
                        className="h-14 px-6 text-left align-middle font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3] border-r border-gray-300 dark:border-r-[#1D2939] last:border-r-0 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#101828] dark:to-[#101828]/90 shadow-none"
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
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      // Removed row onClick navigation
                      // onClick={() => navigate(`/rooms/allocations/${row.original.id}`)}
                      // className="cursor-pointer ..." -> Removed cursor-pointer
                      className="border-b border-gray-200 dark:border-b-[#1D2939] hover:bg-indigo-50/30 dark:hover:bg-[#1C2433] transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          // Applied consistent table cell style
                          className="px-6 py-4 align-middle border-r border-gray-200 dark:border-r-[#1D2939] last:border-r-0 text-gray-700 dark:text-[#D0D5DD]"
                          style={{ minHeight: "60px" }}
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
                      No allocations found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* --- End Table Container --- */}

          {/* --- Restyled Pagination --- */}
          <div className="flex items-center justify-between gap-4 mt-6">
            <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
              Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-400">
                Showing {table.getRowModel().rows.length} of{" "}
                {paginatedResponse?.count ?? 0} Allocations
              </div>
              <div className="flex items-center space-x-2">
                {/* Applied shadow-none */}
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-none bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronFirstIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
                </Button>
                {/* Applied shadow-none */}
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-none bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
                </Button>
                {/* Applied shadow-none */}
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-none bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
                </Button>
                {/* Applied shadow-none */}
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-none bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronLastIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
                </Button>
              </div>
            </div>
          </div>
          {/* --- End Pagination --- */}
        </main>
      </div>

      {/* Edit Sheet */}
      <Sheet
        open={!!editingAllocation}
        onOpenChange={(open) => {
          if (!open) handleSheetClose("edit");
          // No else needed, opening is handled by setting editingAllocation
        }}
      >
        {/* Applied shadow-none */}
        <SheetContent className="w-full sm:max-w-2xl p-0 shadow-none bg-white dark:bg-[#101828] border-l dark:border-l-[#1D2939]">
          {editingAllocation && (
            <EditAllocationForm
              allocation={editingAllocation}
              onSuccess={() => handleSheetClose("edit")}
              // Removed onDirtyChange
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Removed Unsaved Changes Dialog */}
    </>
  );
}
