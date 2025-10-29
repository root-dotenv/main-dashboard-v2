// // --- src/pages/housekeeping/event-spaces.tsx ---
// "use client";
// import { useState, useMemo, useEffect } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
// import {
//   ChevronDownIcon,
//   ChevronUpIcon,
//   EllipsisIcon,
//   Loader2,
//   Plus,
//   Edit,
//   Trash2,
//   ChevronFirstIcon,
//   ChevronLastIcon,
//   ChevronLeftIcon,
//   ChevronRightIcon,
//   Search,
//   Check,
//   ChevronsUpDown,
//   Users,
// } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   DropdownMenu,
//   DropdownMenuItem,
//   DropdownMenuContent,
//   DropdownMenuTrigger,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetFooter,
//   SheetClose,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
// } from "@/components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
// } from "@/components/ui/card";
// import { cn } from "@/lib/utils";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Textarea } from "@/components/ui/textarea";
// import { IoRefreshOutline } from "react-icons/io5";
// import ErrorPage from "@/components/custom/error-page";
// import hotelClient from "../../api/hotel-client";
// import { useHotel } from "../../providers/hotel-provider";
// import {
//   flexRender,
//   getCoreRowModel,
//   useReactTable,
//   type ColumnDef,
//   type ColumnFiltersState,
//   type PaginationState,
//   type Row,
//   type SortingState,
// } from "@tanstack/react-table";

// // --- Type Definitions ---
// interface Amenity {
//   id: string;
//   name: string;
// }
// interface EventSpaceType {
//   id: string;
//   name: string;
// }
// interface EventSpace {
//   id: string;
//   name: string;
//   code: string;
//   description: string;
//   capacity: number;
//   size_sqm: number | null;
//   floor: string | null;
//   hourly_rate: string | null;
//   event_space_type: string;
//   hotel: string;
//   amenities: string[];
//   created_at: string;
//   is_active: boolean;
// }
// interface PaginatedEventSpacesResponse {
//   count: number;
//   results: EventSpace[];
// }
// type EventSpaceFormValues = Omit<
//   EventSpace,
//   "id" | "created_at" | "hotel" | "is_active"
// > & { is_active?: boolean };

// // --- Helper Components ---
// const SortableHeader = ({
//   column,
//   children,
// }: {
//   column: any;
//   children: React.ReactNode;
// }) => (
//   <div
//     className="flex items-center gap-2 cursor-pointer select-none"
//     onClick={column.getToggleSortingHandler()}
//   >
//     {children}
//     {column.getIsSorted() === "desc" ? (
//       <ChevronDownIcon size={16} />
//     ) : (
//       <ChevronUpIcon
//         size={16}
//         className={cn(
//           column.getIsSorted() === "asc"
//             ? "text-gray-800 dark:text-white"
//             : "text-gray-400"
//         )}
//       />
//     )}
//   </div>
// );

// // --- Main Component ---
// export default function EventSpaces() {
//   const queryClient = useQueryClient();
//   const { hotel } = useHotel();

//   const [sorting, setSorting] = useState<SortingState>([]);
//   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [pagination, setPagination] = useState<PaginationState>({
//     pageIndex: 0,
//     pageSize: 10,
//   });
//   const [isSheetOpen, setIsSheetOpen] = useState(false);
//   const [selectedSpace, setSelectedSpace] = useState<EventSpace | null>(null);

//   // Data Fetching
//   const {
//     data: response,
//     isLoading,
//     isError,
//     error,
//     refetch,
//     isRefetching,
//   } = useQuery<PaginatedEventSpacesResponse>({
//     queryKey: ["eventSpaces", hotel?.id, pagination, sorting, globalFilter],
//     queryFn: async () => {
//       const params = new URLSearchParams({
//         hotel_id: hotel!.id,
//         page: String(pagination.pageIndex + 1),
//         page_size: String(pagination.pageSize),
//       });
//       if (globalFilter) params.append("search", globalFilter);
//       if (sorting.length > 0)
//         params.append(
//           "ordering",
//           `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
//         );
//       const res = await hotelClient.get(`event-spaces/`, { params });
//       return res.data;
//     },
//     enabled: !!hotel?.id,
//   });

//   const { data: amenities } = useQuery<Amenity[]>({
//     queryKey: ["allAmenities"],
//     queryFn: async () =>
//       (await hotelClient.get("amenities/?page_size=1000")).data.results,
//   });
//   const { data: eventSpaceTypes } = useQuery<EventSpaceType[]>({
//     queryKey: ["allEventSpaceTypes", hotel?.id],
//     queryFn: async () =>
//       (
//         await hotelClient.get(
//           `event-space-types/?hotel_id=${hotel!.id}&page_size=1000`
//         )
//       ).data.results,
//     enabled: !!hotel?.id,
//   });

//   const typeMap = useMemo(
//     () => new Map(eventSpaceTypes?.map((t) => [t.id, t.name])),
//     [eventSpaceTypes]
//   );

//   // Data Mutations
//   const createMutation = useMutation({
//     mutationFn: (newData: EventSpaceFormValues) =>
//       hotelClient.post("event-spaces/", { ...newData, hotel: hotel!.id }),
//     onSuccess: () => {
//       toast.success("Event space created successfully!");
//       queryClient.invalidateQueries({ queryKey: ["eventSpaces"] });
//       setIsSheetOpen(false);
//     },
//     onError: (err: any) =>
//       toast.error(
//         `Failed to create space: ${
//           err.response?.data?.name?.[0] || err.message
//         }`
//       ),
//   });

//   const updateMutation = useMutation({
//     mutationFn: ({
//       id,
//       updatedData,
//     }: {
//       id: string;
//       updatedData: Partial<EventSpaceFormValues>;
//     }) => hotelClient.patch(`event-spaces/${id}/`, updatedData),
//     onSuccess: () => {
//       toast.success("Event space updated successfully!");
//       queryClient.invalidateQueries({ queryKey: ["eventSpaces"] });
//       setIsSheetOpen(false);
//       setSelectedSpace(null);
//     },
//     onError: (err: any) =>
//       toast.error(`Failed to update space: ${err.message}`),
//   });

//   const deleteMutation = useMutation({
//     mutationFn: (id: string) => hotelClient.delete(`event-spaces/${id}/`),
//     onSuccess: () => {
//       toast.success("Event space deleted successfully!");
//       queryClient.invalidateQueries({ queryKey: ["eventSpaces"] });
//     },
//     onError: (err: any) =>
//       toast.error(`Failed to delete space: ${err.message}`),
//   });

//   const handleOpenForm = (space: EventSpace | null = null) => {
//     setSelectedSpace(space);
//     setIsSheetOpen(true);
//   };

//   const eventSpaces = response?.results ?? [];
//   const totalCount = response?.count ?? 0;
//   const totalPages = Math.ceil(totalCount / pagination.pageSize);

//   const columns = useMemo<ColumnDef<EventSpace>[]>(
//     () => [
//       {
//         id: "select",
//         header: ({ table }) => (
//           <Checkbox
//             checked={table.getIsAllPageRowsSelected()}
//             onCheckedChange={(value) =>
//               table.toggleAllPageRowsSelected(!!value)
//             }
//             aria-label="Select all"
//             className="dark:border-gray-600"
//           />
//         ),
//         cell: ({ row }) => (
//           <Checkbox
//             checked={row.getIsSelected()}
//             onCheckedChange={(value) => row.toggleSelected(!!value)}
//             aria-label="Select row"
//             className="dark:border-gray-600"
//           />
//         ),
//         size: 50,
//       },
//       {
//         accessorKey: "name",
//         header: ({ column }) => (
//           <SortableHeader column={column}>Name</SortableHeader>
//         ),
//         cell: ({ row }) => (
//           <div className="font-medium text-gray-800 dark:text-gray-200">
//             {row.original.name}
//           </div>
//         ),
//       },
//       {
//         accessorKey: "event_space_type",
//         header: "Type",
//         cell: ({ row }) => typeMap.get(row.original.event_space_type) || "N/A",
//       },
//       {
//         accessorKey: "capacity",
//         header: ({ column }) => (
//           <SortableHeader column={column}>Capacity (People)</SortableHeader>
//         ),
//         cell: ({ row }) => (
//           <div className="flex items-center gap-2">
//             <Users className="h-4 w-4 text-gray-500" />
//             {row.original.capacity}
//           </div>
//         ),
//       },
//       {
//         accessorKey: "is_active",
//         header: "Status",
//         cell: ({ row }) => (
//           <Badge
//             className={cn(
//               row.original.is_active
//                 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400"
//                 : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-400"
//             )}
//           >
//             {row.original.is_active ? "Active" : "Inactive"}
//           </Badge>
//         ),
//       },
//       {
//         id: "actions",
//         header: () => <div className="text-center">Actions</div>,
//         cell: ({ row }) => (
//           <RowActions
//             row={row}
//             onEdit={() => handleOpenForm(row.original)}
//             deleteMutation={deleteMutation}
//           />
//         ),
//         size: 80,
//       },
//     ],
//     [deleteMutation, typeMap]
//   );

//   const table = useReactTable({
//     data: eventSpaces,
//     columns,
//     state: { sorting, columnFilters, pagination },
//     pageCount: totalPages,
//     manualPagination: true,
//     manualSorting: true,
//     manualFiltering: true,
//     onSortingChange: setSorting,
//     onColumnFiltersChange: setColumnFilters,
//     onPaginationChange: setPagination,
//     getCoreRowModel: getCoreRowModel(),
//   });

//   if (isError) return <ErrorPage error={error as Error} onRetry={refetch} />;

//   return (
//     <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
//       <div className="flex-1 space-y-6 bg-gray-50 dark:bg-[#101828]">
//         <Card className="border-none p-0 bg-white dark:bg-[#171F2F] rounded-none shadow-none">
//           <CardHeader className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 pt-4">
//             <h2 className="text-2xl font-bold tracking-wide">Event Spaces</h2>
//             <CardDescription className="text-base text-gray-600 dark:text-[#98A2B3] mt-1">
//               Manage all bookable event spaces in your hotel.
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="px-6 py-4">
//             <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
//                 <Input
//                   placeholder="Search by space name..."
//                   value={globalFilter}
//                   onChange={(e) => setGlobalFilter(e.target.value)}
//                   className="pl-10 w-full sm:w-60 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-md shadow-none"
//                 />
//               </div>
//               <div className="flex items-center gap-3">
//                 <Button
//                   variant="outline"
//                   onClick={() => refetch()}
//                   disabled={isRefetching || isLoading}
//                   className="gap-2 bg-white dark:bg-[#101828] dark:text-[#D0D5DD] border-gray-200 dark:border-[#1D2939] rounded-md shadow-none"
//                 >
//                   <IoRefreshOutline
//                     className={cn("h-5 w-5", isRefetching && "animate-spin")}
//                   />{" "}
//                   Refresh
//                 </Button>
//                 <SheetTrigger asChild>
//                   <Button
//                     onClick={() => handleOpenForm()}
//                     className="bg-[#0785CF] hover:bg-[#0785CF]/90"
//                   >
//                     <Plus className="mr-2 h-4 w-4" /> Add Space
//                   </Button>
//                 </SheetTrigger>
//               </div>
//             </div>
//             <div className="rounded-lg border border-gray-200 dark:border-[#1D2939] shadow-none bg-white dark:bg-[#171F2F] overflow-hidden">
//               <Table>
//                 <TableHeader>
//                   {table.getHeaderGroups().map((headerGroup) => (
//                     <TableRow
//                       key={headerGroup.id}
//                       className="hover:bg-transparent border-b-2 border-gray-200 dark:border-b-[#1D2939] bg-gray-50 dark:bg-[#101828]/90"
//                     >
//                       {headerGroup.headers.map((header) => (
//                         <TableHead
//                           key={header.id}
//                           style={{ width: `${header.getSize()}px` }}
//                           className="h-14 px-4 font-semibold text-gray-600 dark:text-[#98A2B3] uppercase"
//                         >
//                           {flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                         </TableHead>
//                       ))}
//                     </TableRow>
//                   ))}
//                 </TableHeader>
//                 <TableBody>
//                   {isLoading ? (
//                     <TableRow>
//                       <TableCell
//                         colSpan={columns.length}
//                         className="h-24 text-center"
//                       >
//                         <Loader2 className="animate-spin h-8 w-8 text-[#0785CF] mx-auto" />
//                       </TableCell>
//                     </TableRow>
//                   ) : table.getRowModel().rows?.length ? (
//                     table.getRowModel().rows.map((row) => (
//                       <TableRow
//                         key={row.id}
//                         data-state={row.getIsSelected() && "selected"}
//                         className="dark:border-b-[#1D2939] hover:bg-gray-50/50 dark:hover:bg-[#1C2433]"
//                       >
//                         {row.getVisibleCells().map((cell) => (
//                           <TableCell
//                             key={cell.id}
//                             className="px-4 py-4 dark:text-gray-300"
//                           >
//                             {flexRender(
//                               cell.column.columnDef.cell,
//                               cell.getContext()
//                             )}
//                           </TableCell>
//                         ))}
//                       </TableRow>
//                     ))
//                   ) : (
//                     <TableRow>
//                       <TableCell
//                         colSpan={columns.length}
//                         className="h-24 text-center text-gray-500 dark:text-gray-400"
//                       >
//                         No event spaces found.
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </div>
//             <div className="flex items-center justify-end gap-4 mt-6">
//               <div className="text-sm font-medium dark:text-gray-300">
//                 Page {table.getState().pagination.pageIndex + 1} of{" "}
//                 {table.getPageCount()}
//               </div>
//               <div className="flex items-center space-x-2">
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   onClick={() => table.firstPage()}
//                   disabled={!table.getCanPreviousPage()}
//                   className="dark:bg-[#101828] dark:border-[#1D2939]"
//                 >
//                   <ChevronFirstIcon className="h-5 w-5" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   onClick={() => table.previousPage()}
//                   disabled={!table.getCanPreviousPage()}
//                   className="dark:bg-[#101828] dark:border-[#1D2939]"
//                 >
//                   <ChevronLeftIcon className="h-5 w-5" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   onClick={() => table.nextPage()}
//                   disabled={!table.getCanNextPage()}
//                   className="dark:bg-[#101828] dark:border-[#1D2939]"
//                 >
//                   <ChevronRightIcon className="h-5 w-5" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   onClick={() => table.lastPage()}
//                   disabled={!table.getCanNextPage()}
//                   className="dark:bg-[#101828] dark:border-[#1D2939]"
//                 >
//                   <ChevronLastIcon className="h-5 w-5" />
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//       <SheetContent className="w-full sm:max-w-2xl p-0 bg-white dark:bg-[#101828] border-l dark:border-l-[#1D2939]">
//         <EventSpaceFormSheet
//           eventSpace={selectedSpace}
//           onSubmit={
//             selectedSpace
//               ? (data) =>
//                   updateMutation.mutate({
//                     id: selectedSpace.id,
//                     updatedData: data,
//                   })
//               : createMutation.mutate
//           }
//           isLoading={createMutation.isPending || updateMutation.isPending}
//           amenities={amenities || []}
//           eventSpaceTypes={eventSpaceTypes || []}
//           onClose={() => setIsSheetOpen(false)}
//         />
//       </SheetContent>
//     </Sheet>
//   );
// }

// // Sub-components
// function RowActions({
//   row,
//   onEdit,
//   deleteMutation,
// }: {
//   row: Row<EventSpace>;
//   onEdit: () => void;
//   deleteMutation: any;
// }) {
//   const space = row.original;
//   return (
//     <div className="text-center">
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
//             <EllipsisIcon size={18} />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent
//           align="end"
//           className="dark:bg-[#101828] dark:border-[#1D2939]"
//         >
//           <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
//             <Edit className="mr-2 h-4 w-4" /> Edit
//           </DropdownMenuItem>
//           <DropdownMenuSeparator className="dark:bg-[#1D2939]" />
//           <AlertDialog>
//             <AlertDialogTrigger asChild>
//               <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-rose-600 dark:text-rose-400 outline-none transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/40">
//                 <Trash2 className="mr-2 h-4 w-4" />
//                 <span>Delete</span>
//               </div>
//             </AlertDialogTrigger>
//             <AlertDialogContent className="dark:bg-[#101828] dark:border-[#1D2939]">
//               <AlertDialogHeader>
//                 <AlertDialogTitle className="dark:text-white">
//                   Confirm Deletion
//                 </AlertDialogTitle>
//                 <AlertDialogDescription>
//                   This will permanently delete the space "{space.name}". This
//                   action cannot be undone.
//                 </AlertDialogDescription>
//               </AlertDialogHeader>
//               <AlertDialogFooter>
//                 <AlertDialogCancel className="dark:bg-[#171F2F] dark:border-none">
//                   Cancel
//                 </AlertDialogCancel>
//                 <AlertDialogAction
//                   onClick={() => deleteMutation.mutate(space.id)}
//                   className="bg-rose-600 hover:bg-rose-700"
//                 >
//                   Delete
//                 </AlertDialogAction>
//               </AlertDialogFooter>
//             </AlertDialogContent>
//           </AlertDialog>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     </div>
//   );
// }

// interface FormSheetProps {
//   eventSpace: EventSpace | null;
//   onSubmit: (data: EventSpaceFormValues) => void;
//   isLoading: boolean;
//   amenities: Amenity[];
//   eventSpaceTypes: EventSpaceType[];
//   onClose: () => void;
// }

// function EventSpaceFormSheet({
//   eventSpace,
//   onSubmit,
//   isLoading,
//   amenities,
//   eventSpaceTypes,
//   onClose,
// }: FormSheetProps) {
//   const [formState, setFormState] = useState<Partial<EventSpaceFormValues>>({});
//   const [amenitiesPopoverOpen, setAmenitiesPopoverOpen] = useState(false);

//   useEffect(() => {
//     setFormState(
//       eventSpace ? { ...eventSpace } : { amenities: [], is_active: true }
//     );
//   }, [eventSpace]);

//   const handleChange = (field: keyof EventSpaceFormValues, value: any) => {
//     setFormState((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmit(formState as EventSpaceFormValues);
//   };

//   return (
//     <div className="flex flex-col h-full">
//       <SheetHeader className="px-6 pt-6 pb-4 border-b dark:border-b-[#1D2939]">
//         <SheetTitle className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
//           {eventSpace ? "Edit Event Space" : "Create New Event Space"}
//         </SheetTitle>
//         <SheetDescription>
//           {eventSpace
//             ? "Update the details for this space."
//             : "Fill in the details for the new event space."}
//         </SheetDescription>
//       </SheetHeader>
//       <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
//         <div className="grid grid-cols-2 gap-4 p-6 overflow-y-auto">
//           <div className="col-span-2">
//             <Label>Name</Label>
//             <Input
//               value={formState.name || ""}
//               onChange={(e) => handleChange("name", e.target.value)}
//               required
//               className="dark:bg-[#171F2F] dark:border-[#1D2939]"
//             />
//           </div>
//           <div className="col-span-2">
//             <Label>Code</Label>
//             <Input
//               value={formState.code || ""}
//               onChange={(e) => handleChange("code", e.target.value)}
//               required
//               className="dark:bg-[#171F2F] dark:border-[#1D2939]"
//             />
//           </div>
//           <div className="col-span-2">
//             <Label>Description</Label>
//             <Textarea
//               value={formState.description || ""}
//               onChange={(e) => handleChange("description", e.target.value)}
//               className="dark:bg-[#171F2F] dark:border-[#1D2939]"
//             />
//           </div>
//           <div>
//             <Label>Capacity (People)</Label>
//             <Input
//               type="number"
//               value={formState.capacity || ""}
//               onChange={(e) => handleChange("capacity", Number(e.target.value))}
//               required
//               className="dark:bg-[#171F2F] dark:border-[#1D2939]"
//             />
//           </div>
//           <div>
//             <Label>Size (sqm)</Label>
//             <Input
//               type="number"
//               value={formState.size_sqm || ""}
//               onChange={(e) =>
//                 handleChange(
//                   "size_sqm",
//                   e.target.value ? Number(e.target.value) : null
//                 )
//               }
//               className="dark:bg-[#171F2F] dark:border-[#1D2939]"
//             />
//           </div>
//           <div>
//             <Label>Floor</Label>
//             <Input
//               value={formState.floor || ""}
//               onChange={(e) => handleChange("floor", e.target.value)}
//               className="dark:bg-[#171F2F] dark:border-[#1D2939]"
//             />
//           </div>
//           <div>
//             <Label>Hourly Rate (TZS)</Label>
//             <Input
//               type="number"
//               value={formState.hourly_rate || ""}
//               onChange={(e) =>
//                 handleChange(
//                   "hourly_rate",
//                   e.target.value ? e.target.value : null
//                 )
//               }
//               className="dark:bg-[#171F2F] dark:border-[#1D2939]"
//             />
//           </div>
//           <div className="col-span-2">
//             <Label>Type</Label>
//             <Select
//               value={formState.event_space_type}
//               onValueChange={(v) => handleChange("event_space_type", v)}
//             >
//               <SelectTrigger className="dark:bg-[#171F2F] dark:border-[#1D2939]">
//                 <SelectValue placeholder="Select a type" />
//               </SelectTrigger>
//               <SelectContent className="dark:bg-[#101828] dark:border-[#1D2939]">
//                 {eventSpaceTypes.map((t) => (
//                   <SelectItem key={t.id} value={t.id}>
//                     {t.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="col-span-2">
//             <Label>Amenities</Label>
//             <Popover
//               open={amenitiesPopoverOpen}
//               onOpenChange={setAmenitiesPopoverOpen}
//             >
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   role="combobox"
//                   className="w-full justify-between dark:bg-[#171F2F] dark:border-[#1D2939]"
//                 >
//                   {formState.amenities?.length
//                     ? `${formState.amenities.length} selected`
//                     : "Select amenities..."}
//                   <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
//                 <Command>
//                   <CommandInput placeholder="Search amenities..." />
//                   <CommandEmpty>No amenities found.</CommandEmpty>
//                   <CommandGroup className="max-h-60 overflow-y-auto">
//                     {amenities.map((a) => (
//                       <CommandItem
//                         key={a.id}
//                         onSelect={() => {
//                           const newAmenities = formState.amenities?.includes(
//                             a.id
//                           )
//                             ? formState.amenities.filter((id) => id !== a.id)
//                             : [...(formState.amenities || []), a.id];
//                           handleChange("amenities", newAmenities);
//                         }}
//                       >
//                         <Check
//                           className={cn(
//                             "mr-2 h-4 w-4",
//                             formState.amenities?.includes(a.id)
//                               ? "opacity-100"
//                               : "opacity-0"
//                           )}
//                         />
//                         {a.name}
//                       </CommandItem>
//                     ))}
//                   </CommandGroup>
//                 </Command>
//               </PopoverContent>
//             </Popover>
//           </div>
//         </div>
//         <SheetFooter className="px-6 py-4 border-t bg-white dark:bg-[#101828] dark:border-t-[#1D2939] mt-auto">
//           <SheetClose asChild>
//             <Button type="button" variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//           </SheetClose>
//           <Button
//             type="submit"
//             disabled={isLoading}
//             className="bg-[#0785CF] hover:bg-[#0785CF]/90"
//           >
//             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             {eventSpace ? "Save Changes" : "Create Space"}
//           </Button>
//         </SheetFooter>
//       </form>
//     </div>
//   );
// }

"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Users,
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
import { IoRefreshOutline } from "react-icons/io5";
import hotelClient from "@/api/hotel-client";
import { useHotel } from "@/providers/hotel-provider";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type SortingState,
} from "@tanstack/react-table";

// --- Local Error Page Component ---
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
interface Amenity {
  id: string;
  name: string;
}
interface EventSpaceType {
  id: string;
  name: string;
}
interface EventSpace {
  id: string;
  name: string;
  code: string;
  description: string;
  capacity: number;
  size_sqm: number | null;
  floor: string | null;
  hourly_rate: string | null;
  event_space_type: string;
  hotel: string;
  amenities: string[];
  created_at: string;
  is_active: boolean;
}
interface PaginatedEventSpacesResponse {
  count: number;
  results: EventSpace[];
}
type EventSpaceFormValues = Omit<
  EventSpace,
  "id" | "created_at" | "hotel" | "is_active"
> & { is_active?: boolean };

// --- Helper Components ---
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
export default function EventSpaces() {
  const queryClient = useQueryClient();
  const { hotel } = useHotel();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<EventSpace | null>(null);

  // Data Fetching
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<PaginatedEventSpacesResponse>({
    queryKey: ["eventSpaces", hotel?.id, pagination, sorting, globalFilter],
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
      const res = await hotelClient.get(`event-spaces/`, { params });
      return res.data;
    },
    enabled: !!hotel?.id,
  });

  const { data: amenities } = useQuery<Amenity[]>({
    queryKey: ["allAmenities"],
    queryFn: async () =>
      (await hotelClient.get("amenities/?page_size=1000")).data.results,
  });
  const { data: eventSpaceTypes } = useQuery<EventSpaceType[]>({
    queryKey: ["allEventSpaceTypes", hotel?.id],
    queryFn: async () =>
      (
        await hotelClient.get(
          `event-space-types/?hotel_id=${hotel!.id}&page_size=1000`
        )
      ).data.results,
    enabled: !!hotel?.id,
  });

  const typeMap = useMemo(
    () => new Map(eventSpaceTypes?.map((t) => [t.id, t.name])),
    [eventSpaceTypes]
  );

  // Data Mutations
  const createMutation = useMutation({
    mutationFn: (newData: EventSpaceFormValues) =>
      hotelClient.post("event-spaces/", { ...newData, hotel: hotel!.id }),
    onSuccess: () => {
      toast.success("Event space created successfully!");
      queryClient.invalidateQueries({ queryKey: ["eventSpaces"] });
      setIsSheetOpen(false);
    },
    onError: (err: any) =>
      toast.error(
        `Failed to create space: ${
          err.response?.data?.name?.[0] || err.message
        }`
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updatedData,
    }: {
      id: string;
      updatedData: Partial<EventSpaceFormValues>;
    }) => hotelClient.patch(`event-spaces/${id}/`, updatedData),
    onSuccess: () => {
      toast.success("Event space updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["eventSpaces"] });
      setIsSheetOpen(false);
      setSelectedSpace(null);
    },
    onError: (err: any) =>
      toast.error(`Failed to update space: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hotelClient.delete(`event-spaces/${id}/`),
    onSuccess: () => {
      toast.success("Event space deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["eventSpaces"] });
    },
    onError: (err: any) =>
      toast.error(`Failed to delete space: ${err.message}`),
  });

  const handleOpenForm = (space: EventSpace | null = null) => {
    setSelectedSpace(space);
    setIsSheetOpen(true);
  };

  const eventSpaces = response?.results ?? [];
  const totalCount = response?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);

  const columns = useMemo<ColumnDef<EventSpace>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
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
      },
      {
        accessorKey: "event_space_type",
        header: "Type",
        cell: ({ row }) => typeMap.get(row.original.event_space_type) || "N/A",
      },
      {
        accessorKey: "capacity",
        header: ({ column }) => (
          <SortableHeader column={column}>Capacity (People)</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            {row.original.capacity}
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
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400"
                : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-400"
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
            deleteMutation={deleteMutation}
          />
        ),
        size: 80,
      },
    ],
    [deleteMutation, typeMap]
  );

  const table = useReactTable({
    data: eventSpaces,
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
            <h2 className="text-2xl font-bold tracking-wide">Event Spaces</h2>
            <CardDescription className="text-base text-gray-600 dark:text-[#98A2B3] mt-1">
              Manage all bookable event spaces in your hotel.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
                <Input
                  placeholder="Search by space name..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10 w-full sm:w-60 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-md shadow-none"
                />
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
                    <Plus className="mr-2 h-4 w-4" /> Add Space
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
                          className="h-14 px-4 font-semibold text-gray-600 dark:text-[#98A2B3] uppercase"
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
                        No event spaces found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end gap-4 mt-6">
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
          </CardContent>
        </Card>
      </div>
      <SheetContent className="w-full sm:max-w-2xl p-0 bg-white dark:bg-[#101828] border-l dark:border-l-[#1D2939]">
        <EventSpaceFormSheet
          eventSpace={selectedSpace}
          onSubmit={
            selectedSpace
              ? (data) =>
                  updateMutation.mutate({
                    id: selectedSpace.id,
                    updatedData: data,
                  })
              : createMutation.mutate
          }
          isLoading={createMutation.isPending || updateMutation.isPending}
          amenities={amenities || []}
          eventSpaceTypes={eventSpaceTypes || []}
          onClose={() => setIsSheetOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

// Sub-components
function RowActions({
  row,
  onEdit,
  deleteMutation,
}: {
  row: Row<EventSpace>;
  onEdit: () => void;
  deleteMutation: any;
}) {
  const space = row.original;
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
                  This will permanently delete the space "{space.name}". This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="dark:bg-[#171F2F] dark:border-none">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(space.id)}
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

interface FormSheetProps {
  eventSpace: EventSpace | null;
  onSubmit: (data: EventSpaceFormValues) => void;
  isLoading: boolean;
  amenities: Amenity[];
  eventSpaceTypes: EventSpaceType[];
  onClose: () => void;
}

function EventSpaceFormSheet({
  eventSpace,
  onSubmit,
  isLoading,
  amenities,
  eventSpaceTypes,
  onClose,
}: FormSheetProps) {
  const [formState, setFormState] = useState<Partial<EventSpaceFormValues>>({});

  useEffect(() => {
    setFormState(
      eventSpace ? { ...eventSpace } : { amenities: [], is_active: true }
    );
  }, [eventSpace]);

  const handleChange = (field: keyof EventSpaceFormValues, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (amenityId: string) => {
    const currentAmenities = formState.amenities || [];
    const newAmenities = currentAmenities.includes(amenityId)
      ? currentAmenities.filter((id) => id !== amenityId)
      : [...currentAmenities, amenityId];
    handleChange("amenities", newAmenities);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formState as EventSpaceFormValues);
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 pt-6 pb-4 border-b dark:border-b-[#1D2939]">
        <SheetTitle className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
          {eventSpace ? "Edit Event Space" : "Create New Event Space"}
        </SheetTitle>
        <SheetDescription>
          {eventSpace
            ? "Update the details for this space."
            : "Fill in the details for the new event space."}
        </SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Name</Label>
              <Input
                value={formState.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="dark:bg-[#171F2F] dark:border-[#1D2939]"
              />
            </div>
            <div className="col-span-2">
              <Label>Code</Label>
              <Input
                value={formState.code || ""}
                onChange={(e) => handleChange("code", e.target.value)}
                required
                className="dark:bg-[#171F2F] dark:border-[#1D2939]"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formState.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="dark:bg-[#171F2F] dark:border-[#1D2939]"
              />
            </div>
            <div>
              <Label>Capacity (People)</Label>
              <Input
                type="number"
                value={formState.capacity || ""}
                onChange={(e) =>
                  handleChange("capacity", Number(e.target.value))
                }
                required
                className="dark:bg-[#171F2F] dark:border-[#1D2939]"
              />
            </div>
            <div>
              <Label>Size (sqm)</Label>
              <Input
                type="number"
                value={formState.size_sqm || ""}
                onChange={(e) =>
                  handleChange(
                    "size_sqm",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="dark:bg-[#171F2F] dark:border-[#1D2939]"
              />
            </div>
            <div>
              <Label>Floor</Label>
              <Input
                value={formState.floor || ""}
                onChange={(e) => handleChange("floor", e.target.value)}
                className="dark:bg-[#171F2F] dark:border-[#1D2939]"
              />
            </div>
            <div>
              <Label>Hourly Rate (TZS)</Label>
              <Input
                type="number"
                value={formState.hourly_rate || ""}
                onChange={(e) =>
                  handleChange(
                    "hourly_rate",
                    e.target.value ? e.target.value : null
                  )
                }
                className="dark:bg-[#171F2F] dark:border-[#1D2939]"
              />
            </div>
            <div className="col-span-2">
              <Label>Type</Label>
              <Select
                value={formState.event_space_type}
                onValueChange={(v) => handleChange("event_space_type", v)}
              >
                <SelectTrigger className="dark:bg-[#171F2F] dark:border-[#1D2939]">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#101828] dark:border-[#1D2939]">
                  {eventSpaceTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Amenities</Label>
              <div className="mt-2 flex flex-wrap gap-2 p-3 border rounded-md dark:border-[#1D2939]">
                {amenities.map((amenity) => (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity.id)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      (formState.amenities || []).includes(amenity.id)
                        ? "bg-[#0785CF] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#171F2F] dark:text-gray-300 dark:hover:bg-[#1C2433]"
                    )}
                  >
                    {amenity.name}
                  </button>
                ))}
              </div>
            </div>
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
            {eventSpace ? "Save Changes" : "Create Space"}
          </Button>
        </SheetFooter>
      </form>
    </div>
  );
}
