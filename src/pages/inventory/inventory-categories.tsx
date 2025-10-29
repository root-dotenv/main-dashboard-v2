// - - - src/pages/housekeeping/inventory-categories.tsx
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
import { format } from "date-fns";
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
  DropdownMenuContent,
  DropdownMenuItem,
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
import ErrorPage from "@/components/custom/error-page";
import hotelClient from "../../api/hotel-client";
import { useHotel } from "../../providers/hotel-provider";

// Type Definitions
interface InventoryCategory {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  hotel: string;
}

interface PaginatedCategoriesResponse {
  count: number;
  results: InventoryCategory[];
}

type CategoryFormValues = Omit<
  InventoryCategory,
  "id" | "created_at" | "hotel"
>;

// Reusable Sub-component for Sortable Table Headers
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

// Main Component
export default function InventoryCategories() {
  const queryClient = useQueryClient();
  const { hotel } = useHotel();

  // State Management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<InventoryCategory | null>(null);

  // Data Fetching
  const {
    data: categoriesResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<PaginatedCategoriesResponse>({
    queryKey: [
      "inventoryCategories",
      hotel?.id,
      pagination,
      sorting,
      globalFilter,
    ],
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

      const response = await hotelClient.get(`inventory-categories/`, {
        params,
      });
      return response.data;
    },
    keepPreviousData: true,
    enabled: !!hotel?.id,
  });

  // Data Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (newCategory: CategoryFormValues) => {
      const payload = { ...newCategory, hotel: hotel!.id };
      return hotelClient.post("inventory-categories/", payload);
    },
    onSuccess: () => {
      toast.success("Category created successfully!");
      queryClient.invalidateQueries({ queryKey: ["inventoryCategories"] });
      setIsSheetOpen(false);
    },
    onError: (err: any) =>
      toast.error(
        `Failed to create category: ${
          err.response?.data?.name?.[0] || err.message
        }`
      ),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      updatedData,
    }: {
      id: string;
      updatedData: Partial<CategoryFormValues>;
    }) => hotelClient.patch(`inventory-categories/${id}/`, updatedData),
    onSuccess: () => {
      toast.success("Category updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["inventoryCategories"] });
      setIsSheetOpen(false);
      setSelectedCategory(null);
    },
    onError: (err: any) =>
      toast.error(`Failed to update category: ${err.message}`),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) =>
      hotelClient.delete(`inventory-categories/${id}/`),
    onSuccess: () => {
      toast.success("Category deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["inventoryCategories"] });
    },
    onError: (err: any) =>
      toast.error(`Failed to delete category: ${err.message}`),
  });

  const handleOpenForm = (category: InventoryCategory | null = null) => {
    setSelectedCategory(category);
    setIsSheetOpen(true);
  };

  const categories = categoriesResponse?.results ?? [];
  const totalCount = categoriesResponse?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);

  const columns = useMemo<ColumnDef<InventoryCategory>[]>(
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
          <SortableHeader column={column}>Name</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {row.original.name}
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div
            className="max-w-xs truncate text-gray-600 dark:text-gray-400"
            title={row.original.description}
          >
            {row.original.description}
          </div>
        ),
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
        accessorKey: "created_at",
        header: ({ column }) => (
          <SortableHeader column={column}>Date Created</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="text-gray-600 dark:text-gray-400">
            {format(new Date(row.original.created_at), "PP")}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <RowActions
            row={row}
            onEdit={() => handleOpenForm(row.original)}
            deleteMutation={deleteCategoryMutation}
          />
        ),
        size: 80,
      },
    ],
    [deleteCategoryMutation]
  );

  const table = useReactTable({
    data: categories,
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

  if (isError) return <ErrorPage error={error as Error} onRetry={refetch} />;

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div className="flex-1 space-y-6 bg-gray-50 dark:bg-[#101828]">
        <Card className="border-none p-0 bg-white dark:bg-[#171F2F] rounded-none shadow-none">
          <CardHeader className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 pt-4">
            <h2 className="text-2xl font-bold tracking-wide">
              Inventory Categories
            </h2>
            <CardDescription className="text-base text-gray-600 dark:text-[#98A2B3] mt-1">
              Manage categories for your housekeeping and inventory items.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
                  <Input
                    placeholder="Search by name..."
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
                    <Plus className="mr-2 h-4 w-4" /> Add Category
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
                        No categories found.
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
      <SheetContent className="w-full sm:max-w-lg p-0 bg-white dark:bg-[#101828] border-l dark:border-l-[#1D2939]">
        <CategoryFormSheet
          category={selectedCategory}
          onSubmit={
            selectedCategory
              ? (data) =>
                  updateCategoryMutation.mutate({
                    id: selectedCategory.id,
                    updatedData: data,
                  })
              : createCategoryMutation.mutate
          }
          isLoading={
            createCategoryMutation.isPending || updateCategoryMutation.isPending
          }
          onClose={() => setIsSheetOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

// Sub-component for Row Actions
function RowActions({
  row,
  onEdit,
  deleteMutation,
}: {
  row: Row<InventoryCategory>;
  onEdit: () => void;
  deleteMutation: any;
}) {
  const category = row.original;
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
                  This will permanently delete the category "{category.name}".
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="dark:bg-[#171F2F] dark:border-none">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(category.id)}
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

// Sub-component for the Create/Edit Form Sheet
interface CategoryFormSheetProps {
  category: InventoryCategory | null;
  onSubmit: (data: CategoryFormValues) => void;
  isLoading: boolean;
  onClose: () => void;
}

function CategoryFormSheet({
  category,
  onSubmit,
  isLoading,
  onClose,
}: CategoryFormSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description);
      setIsActive(category.is_active);
    } else {
      setName("");
      setDescription("");
      setIsActive(true);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, is_active: isActive });
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 pt-6 pb-4 border-b dark:border-b-[#1D2939]">
        <SheetTitle className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
          {category ? "Edit Category" : "Create New Category"}
        </SheetTitle>
        <SheetDescription>
          {category
            ? "Update the details for this category."
            : "Fill in the details for the new category."}
        </SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <Label
              htmlFor="name"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Category Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 dark:bg-[#171F2F] dark:border-[#1D2939]"
              placeholder="e.g., Cleaning Supplies"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="description"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 dark:bg-[#171F2F] dark:border-[#1D2939]"
              placeholder="A short description of the category"
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label
              htmlFor="is_active"
              className="cursor-pointer dark:text-gray-300"
            >
              Active
            </Label>
          </div>
        </div>
        <SheetFooter className="px-6 py-4 border-t bg-white dark:bg-[#101828] dark:border-t-[#1D2939]">
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
            {category ? "Save Changes" : "Create Category"}
          </Button>
        </SheetFooter>
      </form>
    </div>
  );
}
