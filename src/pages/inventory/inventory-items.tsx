// --- src/pages/housekeeping/inventory-items.tsx ---
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
  type Row,
  type PaginationState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisIcon,
  Loader2,
  Plus,
  Edit,
  Trash2,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { IoRefreshOutline } from "react-icons/io5";
import hotelClient from "@/api/hotel-client";
import { useHotel } from "@/providers/hotel-provider";

// --- Local Error Page Component to resolve dependency issue ---
const ErrorPageComponent = ({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
    <p className="text-gray-600 mb-4 max-w-md">{error.message}</p>
    <Button onClick={onRetry}>Try Again</Button>
  </div>
);

// --- Type Definitions ---
interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  quantity_instock: number;
  unit: string;
  reorder_level: number;
  quantity_in_reorder: number;
  cost_per_unit: string;
  category: string;
  hotel: string;
  is_active: boolean;
  created_at: string;
}

interface InventoryCategory {
  id: string;
  name: string;
}

interface PaginatedItemsResponse {
  count: number;
  results: InventoryItem[];
}

type ItemFormValues = Omit<InventoryItem, "id" | "created_at" | "hotel">;

// --- Helper Maps & Configs for Reorder Priority ---
const valueToPriorityMap: { [key: number]: string } = {
  1: "Low",
  5: "Medium",
  10: "High",
};

const priorityConfig = {
  Low: {
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700/60",
  },
  Medium: {
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700/60",
  },
  High: {
    className:
      "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-700/60",
  },
};

// --- Reusable Sub-component for Sortable Table Headers ---
const SortableHeader = ({
  column,
  children,
}: {
  column: any;
  children: React.ReactNode;
}) => (
  <div
    className="flex items-center gap-2 cursor-pointer select-none"
    onClick={column.getToggleSortingHandler()}
  >
    {children}
    {column.getIsSorted() === "desc" ? (
      <ChevronDownIcon size={16} />
    ) : (
      <ChevronUpIcon
        size={16}
        className={cn(
          column.getIsSorted() === "asc"
            ? "text-gray-800 dark:text-white"
            : "text-gray-400"
        )}
      />
    )}
  </div>
);

// --- Main Component ---
export default function InventoryItems() {
  const queryClient = useQueryClient();
  const { hotel } = useHotel();

  // --- State Management ---
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // --- Data Fetching for Items ---
  const {
    data: itemsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<PaginatedItemsResponse>({
    queryKey: ["inventoryItems", hotel?.id, pagination, sorting, globalFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        hotel_id: hotel!.id,
        page: String(pagination.pageIndex + 1),
        page_size: String(pagination.pageSize),
      });
      if (globalFilter) params.append("search", globalFilter);
      if (sorting.length > 0)
        params.append(
          "ordering",
          `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
        );

      const response = await hotelClient.get(`inventory-items/`, { params });
      return response.data;
    },
    keepPreviousData: true,
    enabled: !!hotel?.id,
  });

  // --- Data Fetching for Categories (to populate dropdown) ---
  const { data: categories, isLoading: isLoadingCategories } = useQuery<{
    results: InventoryCategory[];
  }>({
    queryKey: ["inventoryCategories", hotel?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        hotel_id: hotel!.id,
        page_size: "1000",
      });
      const response = await hotelClient.get(`inventory-categories/`, {
        params,
      });
      return response.data;
    },
    enabled: !!hotel?.id,
  });

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories?.results.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  // --- Data Mutations ---
  const createItemMutation = useMutation({
    mutationFn: (newItem: ItemFormValues) => {
      const payload = { ...newItem, hotel: hotel!.id };
      return hotelClient.post("inventory-items/", payload);
    },
    onSuccess: () => {
      toast.success("Item created successfully!");
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      setIsSheetOpen(false);
    },
    onError: (err: any) =>
      toast.error(
        `Failed to create item: ${err.response?.data?.name?.[0] || err.message}`
      ),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      id,
      updatedData,
    }: {
      id: string;
      updatedData: Partial<ItemFormValues>;
    }) => hotelClient.patch(`inventory-items/${id}/`, updatedData),
    onSuccess: () => {
      toast.success("Item updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      setIsSheetOpen(false);
      setSelectedItem(null);
    },
    onError: (err: any) => toast.error(`Failed to update item: ${err.message}`),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => hotelClient.delete(`inventory-items/${id}/`),
    onSuccess: () => {
      toast.success("Item deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
    onError: (err: any) => toast.error(`Failed to delete item: ${err.message}`),
  });

  const handleOpenForm = (item: InventoryItem | null = null) => {
    setSelectedItem(item);
    setIsSheetOpen(true);
  };

  const items = itemsResponse?.results ?? [];
  const totalCount = itemsResponse?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="dark:border-gray-600"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="dark:border-gray-600"
          />
        ),
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Item Name</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {row.original.name}
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: "category",
        header: "Inv Category",
        cell: ({ row }) => categoryMap.get(row.original.category) || "N/A",
      },
      {
        accessorKey: "quantity_instock",
        header: "Available Items",
        cell: ({ row }) =>
          `${row.original.quantity_instock} ${row.original.unit}`,
      },
      {
        accessorKey: "cost_per_unit",
        header: ({ column }) => (
          <SortableHeader column={column}>Costs Per Unit</SortableHeader>
        ),
        cell: ({ row }) =>
          `TZS ${parseFloat(row.original.cost_per_unit).toLocaleString()}`,
      },
      {
        accessorKey: "quantity_in_reorder",
        header: "Units to Reorder",
        cell: ({ row }) => row.original.quantity_in_reorder,
      },
      {
        accessorKey: "reorder_level",
        header: "Priority",
        cell: ({ row }) => {
          const priorityLabel =
            valueToPriorityMap[row.original.reorder_level] || "N/A";
          const config =
            priorityConfig[priorityLabel as keyof typeof priorityConfig];
          return (
            <Badge className={cn("font-medium", config?.className)}>
              {priorityLabel}
            </Badge>
          );
        },
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={cn(
              row.original.is_active
                ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700/60"
                : "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-700/60"
            )}
          >
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <RowActions
            row={row}
            onEdit={() => handleOpenForm(row.original)}
            deleteMutation={deleteItemMutation}
          />
        ),
        size: 80,
      },
    ],
    [categoryMap, deleteItemMutation]
  );

  const table = useReactTable({
    data: items,
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

  if (isError)
    return <ErrorPageComponent error={error as Error} onRetry={refetch} />;

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div className="flex-1 space-y-6 bg-gray-50 dark:bg-[#101828]">
        <Card className="border-none p-0 bg-white dark:bg-[#171F2F] rounded-none shadow-none">
          <CardHeader className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 pt-4">
            <h2 className="text-2xl font-bold tracking-wide">
              Inventory Items
            </h2>
            <CardDescription className="text-base text-gray-600 dark:text-[#98A2B3] mt-1">
              Track and manage all your housekeeping and hotel inventory items.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
                  <Input
                    placeholder="Search by item name..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-10 w-full sm:w-60 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-md shadow-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isRefetching || isLoading}
                  className="gap-2 bg-white dark:bg-[#101828] dark:text-[#D0D5DD] border-gray-200 dark:border-[#1D2939] rounded-md shadow-none"
                >
                  <IoRefreshOutline
                    className={cn("h-5 w-5", isRefetching && "animate-spin")}
                  />{" "}
                  Refresh
                </Button>
                <SheetTrigger asChild>
                  <Button
                    onClick={() => handleOpenForm()}
                    className="bg-[#0785CF] hover:bg-[#0785CF]/90"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </SheetTrigger>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-[#1D2939] shadow-none bg-white dark:bg-[#171F2F] overflow-hidden">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent border-b-2 border-gray-200 dark:border-b-[#1D2939] bg-gray-50 dark:bg-[#101828]/90"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          style={{ width: `${header.getSize()}px` }}
                          className="h-14 px-4 text-left font-semibold text-gray-600 dark:text-[#98A2B3] uppercase"
                        >
                          {flexRender(
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
                        <Loader2 className="animate-spin h-8 w-8 text-[#0785CF] mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="dark:border-b-[#1D2939] hover:bg-gray-50/50 dark:hover:bg-[#1C2433]"
                        title={row.original.description || ""}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="px-4 py-4 dark:text-gray-300"
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
                        className="h-24 text-center text-gray-500 dark:text-gray-400"
                      >
                        No items found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between gap-4 mt-6">
              <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium dark:text-gray-300">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="dark:bg-[#101828] dark:border-[#1D2939]"
                  >
                    <ChevronFirstIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="dark:bg-[#101828] dark:border-[#1D2939]"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="dark:bg-[#101828] dark:border-[#1D2939]"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                    className="dark:bg-[#101828] dark:border-[#1D2939]"
                  >
                    <ChevronLastIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <SheetContent className="w-full sm:max-w-2xl p-0 bg-white dark:bg-[#101828] border-l dark:border-l-[#1D2939]">
        <ItemFormSheet
          item={selectedItem}
          categories={categories?.results ?? []}
          isLoadingCategories={isLoadingCategories}
          onSubmit={
            selectedItem
              ? (data) =>
                  updateItemMutation.mutate({
                    id: selectedItem.id,
                    updatedData: data,
                  })
              : createItemMutation.mutate
          }
          isLoading={
            createItemMutation.isPending || updateItemMutation.isPending
          }
          onClose={() => setIsSheetOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

// --- Sub-component for Row Actions ---
function RowActions({
  row,
  onEdit,
  deleteMutation,
}: {
  row: Row<InventoryItem>;
  onEdit: () => void;
  deleteMutation: any;
}) {
  const item = row.original;
  return (
    <div className="text-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
            <EllipsisIcon size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="dark:bg-[#101828] dark:border-[#1D2939]"
        >
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator className="dark:bg-[#1D2939]" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-rose-600 dark:text-rose-400 outline-none transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/40">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent className="dark:bg-[#101828] dark:border-[#1D2939]">
              <AlertDialogHeader>
                <AlertDialogTitle className="dark:text-white">
                  Confirm Deletion
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the item "{item.name}". This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="dark:bg-[#171F2F] dark:border-none">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="bg-rose-600 hover:bg-rose-700"
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
}

// --- Sub-component for the Create/Edit Form Sheet ---
interface ItemFormSheetProps {
  item: InventoryItem | null;
  categories: InventoryCategory[];
  isLoadingCategories: boolean;
  onSubmit: (data: Partial<ItemFormValues>) => void;
  isLoading: boolean;
  onClose: () => void;
}

function ItemFormSheet({
  item,
  categories,
  isLoadingCategories,
  onSubmit,
  isLoading,
  onClose,
}: ItemFormSheetProps) {
  const [formState, setFormState] = useState<Partial<ItemFormValues>>({});

  const priorityLabelToValueMap: { [key: string]: number } = {
    Low: 1,
    Medium: 5,
    High: 10,
  };

  useEffect(() => {
    if (item) {
      setFormState(item);
    } else {
      setFormState({
        is_active: true,
        reorder_level: 1, // Default to Low
        quantity_instock: 0,
        quantity_in_reorder: 0,
      });
    }
  }, [item]);

  const handleChange = (field: keyof ItemFormValues, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formState);
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 pt-6 pb-4 border-b dark:border-b-[#1D2939]">
        <SheetTitle className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
          {item ? "Edit Inventory Item" : "Create New Item"}
        </SheetTitle>
        <SheetDescription>
          {item
            ? "Update the details for this item."
            : "Fill in the details for the new inventory item."}
        </SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-4 p-6 overflow-y-auto">
          <div className="col-span-2">
            <Label htmlFor="name">Inventory Name</Label>
            <Input
              id="name"
              value={formState.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              className="dark:bg-[#171F2F] dark:border-[#1D2939]"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="category">Inventory Category</Label>
            <Select
              onValueChange={(value) => handleChange("category", value)}
              value={formState.category}
              required
            >
              <SelectTrigger className="dark:bg-[#171F2F] dark:border-[#1D2939]">
                <SelectValue
                  placeholder={
                    isLoadingCategories ? "Loading..." : "Select a category"
                  }
                />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#101828] dark:border-[#1D2939]">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quantity">Available Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={formState.quantity_instock ?? ""}
              onChange={(e) =>
                handleChange("quantity_instock", parseInt(e.target.value) || 0)
              }
              required
              className="dark:bg-[#171F2F] dark:border-[#1D2939]"
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit of Measure</Label>
            <Input
              id="unit"
              value={formState.unit || ""}
              onChange={(e) => handleChange("unit", e.target.value)}
              placeholder="e.g., pcs, kgs"
              required
              className="dark:bg-[#171F2F] dark:border-[#1D2939]"
            />
          </div>
          <div>
            <Label htmlFor="cost">Cost per Unit (TZS)</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              value={formState.cost_per_unit || ""}
              onChange={(e) => handleChange("cost_per_unit", e.target.value)}
              required
              className="dark:bg-[#171F2F] dark:border-[#1D2939]"
            />
          </div>
          <div>
            <Label htmlFor="units_to_reorder">Units to Reorder</Label>
            <Input
              id="units_to_reorder"
              type="number"
              min="0"
              value={formState.quantity_in_reorder ?? ""}
              onChange={(e) =>
                handleChange(
                  "quantity_in_reorder",
                  parseInt(e.target.value) || 0
                )
              }
              required
              className="dark:bg-[#171F2F] dark:border-[#1D2939]"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="reorder">Reorder Priority</Label>
            <Select
              value={valueToPriorityMap[formState.reorder_level as number]}
              onValueChange={(label) =>
                handleChange("reorder_level", priorityLabelToValueMap[label])
              }
              required
            >
              <SelectTrigger className="dark:bg-[#171F2F] dark:border-[#1D2939]">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#101828] dark:border-[#1D2939]">
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formState.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="dark:bg-[#171F2F] dark:border-[#1D2939]"
            />
          </div>
          <div className="col-span-2 flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formState.is_active}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
            <Label
              htmlFor="is_active"
              className="cursor-pointer dark:text-gray-300"
            >
              Active
            </Label>
          </div>
        </div>
        <SheetFooter className="px-6 py-4 border-t bg-white dark:bg-[#101828] dark:border-t-[#1D2939] mt-auto">
          <SheetClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#0785CF] hover:bg-[#0785CF]/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {item ? "Save Changes" : "Create Item"}
          </Button>
        </SheetFooter>
      </form>
    </div>
  );
}
