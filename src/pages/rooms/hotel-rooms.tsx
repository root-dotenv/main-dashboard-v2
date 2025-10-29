// //  - - - src/pages/rooms/hotel-rooms
// "use client";
// import { useState, useMemo, useEffect, useCallback, useRef } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useNavigate } from "react-router-dom";
// import {
//   type ColumnDef,
//   type ColumnFiltersState,
//   flexRender,
//   getCoreRowModel,
//   useReactTable,
//   type SortingState,
//   type Row,
//   type PaginationState,
// } from "@tanstack/react-table";
// import {
//   ChevronDownIcon,
//   ChevronUpIcon,
//   Columns3Icon,
//   EllipsisIcon,
//   Eye,
//   Trash2,
//   ChevronFirstIcon,
//   ChevronLastIcon,
//   ChevronLeftIcon,
//   ChevronRightIcon,
//   Search,
//   Loader2,
//   Loader,
//   BookCheck,
//   Wrench,
//   MoreVertical,
//   CheckCircle2,
//   Users,
//   XIcon,
//   BedDouble,
// } from "lucide-react";
// import Papa from "papaparse";
// import { toast } from "sonner";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
// import { MdAdd } from "react-icons/md";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardDescription,
// } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuLabel,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
//   DropdownMenuGroup,
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
// import { cn } from "@/lib/utils";
// import { Checkbox } from "@/components/ui/checkbox";
// import { IoRefreshOutline } from "react-icons/io5";
// import { TbFileTypeCsv } from "react-icons/tb";
// import ErrorPage from "@/components/custom/error-page";
// import hotelClient from "@/api/hotel-client";
// import { formatNumberWithOrdinal } from "@/utils/utils";
// import { StatCard } from "@/components/custom/StatCard";
// import { Slider } from "@/components/ui/slider";
// import { useAuthStore } from "@/store/auth.store"; // --- 1. Import auth store ---

// // --- Type Definitions ---
// interface Room {
//   id: string;
//   code: string;
//   description: string;
//   price_per_night: number;
//   availability_status: "Available" | "Booked" | "Maintenance";
//   floor_number: number;
//   room_type: string;
//   max_occupancy: number;
// }

// interface RoomType {
//   id: string;
//   name: string;
//   bed_type: string;
// }

// interface PaginatedRoomsResponse {
//   count: number;
//   next: string | null;
//   previous: string | null;
//   results: Room[];
// }

// interface HotelStatsData {
//   summary_counts: {
//     rooms: number;
//   };
//   availability_stats: {
//     status_counts: {
//       Available: number;
//       Booked: number;
//       Maintenance: number;
//     };
//   };
// }

// // --- Constants ---
// const GUEST_CAPACITY_OPTIONS = [
//   { label: "1 Guest", value: "1" },
//   { label: "2 Guests", value: "2" },
//   { label: "3 Guests", value: "3" },
//   { label: "4 Guests", value: "4" },
//   { label: "5+ Guests", value: "5" },
// ];
// const MIN_PRICE = 0;
// const MAX_PRICE = 1000;

// // --- Debounce Hook ---
// const useDebounce = <T,>(value: T, delay: number): T => {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);
//     return () => clearTimeout(handler);
//   }, [value, delay]);
//   return debouncedValue;
// };

// const getAvailabilityColor = (status: string) => {
//   switch (status?.toLowerCase()) {
//     case "available":
//       return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700/60";
//     case "booked":
//       return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700/60";
//     case "maintenance":
//       return "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-700/60";
//     default:
//       return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
//   }
// };

// // --- Main Component ---
// export default function HotelRooms() {
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();
//   const { hotelId } = useAuthStore(); // --- 2. Get hotelId from store ---

//   // --- State ---
//   const [statusFilter, setStatusFilter] = useState<
//     "Available" | "Booked" | "Maintenance"
//   >("Available");
//   const [sorting, setSorting] = useState<SortingState>([]);
//   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
//   const [priceRangeFilter, setPriceRangeFilter] = useState("");
//   const [priceSliderValue, setPriceSliderValue] = useState<[number, number]>([
//     MIN_PRICE,
//     MAX_PRICE,
//   ]);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [pagination, setPagination] = useState<PaginationState>({
//     pageIndex: 0,
//     pageSize: 15,
//   });
//   const debouncedGlobalFilter = useDebounce(globalFilter, 500);
//   const [isExporting, setIsExporting] = useState(false);
//   const inputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (priceRangeFilter === "") {
//       setPriceSliderValue([MIN_PRICE, MAX_PRICE]);
//     } else {
//       const [min, max] = priceRangeFilter.split("-").map(Number);
//       setPriceSliderValue([min, max]);
//     }
//   }, [priceRangeFilter]);

//   // --- Data Queries ---
//   const {
//     data: paginatedResponse,
//     isLoading: isLoadingRooms,
//     isError,
//     error,
//     refetch,
//     isRefetching,
//   } = useQuery<PaginatedRoomsResponse>({
//     queryKey: [
//       "rooms",
//       hotelId, // --- 3. Add hotelId to queryKey ---
//       statusFilter,
//       pagination.pageIndex,
//       pagination.pageSize,
//       debouncedGlobalFilter,
//       sorting,
//       columnFilters,
//       priceRangeFilter,
//     ],
//     queryFn: async () => {
//       const params = new URLSearchParams({ hotel_id: hotelId! }); // --- 4. Use dynamic hotelId ---
//       const hasSpecificFilters =
//         columnFilters.length > 0 || priceRangeFilter !== "";

//       if (!hasSpecificFilters) {
//         params.append("availability_status", statusFilter);
//       }
//       params.append("page", String(pagination.pageIndex + 1));
//       params.append("page_size", String(pagination.pageSize));

//       if (debouncedGlobalFilter) {
//         params.append("search", debouncedGlobalFilter);
//       }
//       if (sorting.length > 0) {
//         const sortKey = sorting[0].id;
//         const sortDir = sorting[0].desc ? "-" : "";
//         params.append("ordering", `${sortDir}${sortKey}`);
//       }
//       columnFilters.forEach((filter) => {
//         if (filter.value) {
//           params.append(filter.id, String(filter.value));
//         }
//       });
//       if (priceRangeFilter) {
//         const [gte, lte] = priceRangeFilter.split("-");
//         params.append("price_per_night_gte", gte);
//         if (lte) {
//           params.append("price_per_night_lte", lte);
//         }
//       }

//       const response = await hotelClient.get(`/rooms/`, { params });
//       return response.data;
//     },
//     keepPreviousData: true,
//     enabled: !!hotelId, // --- 5. Enable query only when hotelId is available ---
//   });

//   const { data: roomTypesData, isLoading: isLoadingRoomTypes } = useQuery<
//     RoomType[]
//   >({
//     queryKey: ["allRoomTypes"],
//     queryFn: async () => (await hotelClient.get("/room-types/")).data.results,
//     staleTime: Infinity,
//   });

//   const { data: hotelData, isLoading: isLoadingHotel } =
//     useQuery<HotelStatsData>({
//       queryKey: ["hotelDetails", hotelId],
//       queryFn: async () => (await hotelClient.get(`/hotels/${hotelId}/`)).data, // --- 6. Use dynamic hotelId ---
//       enabled: !!hotelId, // --- 7. Enable query only when hotelId is available ---
//     });

//   const roomTypesMap = useMemo(() => {
//     if (!roomTypesData) return new Map<string, RoomType>();
//     return new Map(roomTypesData.map((rt) => [rt.id, rt]));
//   }, [roomTypesData]);

//   const deleteRoomMutation = useMutation({
//     mutationFn: (roomId: string) => hotelClient.delete(`rooms/${roomId}/`),
//     onSuccess: () => {
//       toast.success("Room deleted successfully!");
//       queryClient.invalidateQueries({ queryKey: ["rooms"] });
//       queryClient.invalidateQueries({ queryKey: ["hotelDetails"] });
//     },
//     onError: (error: any) => {
//       toast.error(
//         `Failed to delete room: ${
//           error.response?.data?.detail || error.message
//         }`
//       );
//     },
//   });

//   const stats = {
//     total: hotelData?.summary_counts?.rooms ?? 0,
//     available: hotelData?.availability_stats?.status_counts?.Available ?? 0,
//     booked: hotelData?.availability_stats?.status_counts?.Booked ?? 0,
//     maintenance: hotelData?.availability_stats?.status_counts?.Maintenance ?? 0,
//   };

//   const roomsForCurrentPage = paginatedResponse?.results ?? [];
//   const totalRoomsCount = paginatedResponse?.count ?? 0;
//   const totalPages = paginatedResponse
//     ? Math.ceil(paginatedResponse.count / pagination.pageSize)
//     : 0;
//   const hasNextPage = paginatedResponse?.next !== null;
//   const hasPreviousPage = paginatedResponse?.previous !== null;

//   const handleExport = useCallback(async () => {
//     if (!totalRoomsCount) {
//       toast.info(`No rooms found to export.`);
//       return;
//     }
//     setIsExporting(true);
//     toast.info(`Exporting ${totalRoomsCount} rooms...`);
//     try {
//       const params = new URLSearchParams({
//         hotel_id: hotelId!, // --- 8. Use dynamic hotelId for export ---
//         page_size: String(totalRoomsCount),
//       });

//       const hasSpecificFilters =
//         columnFilters.length > 0 || priceRangeFilter !== "";
//       if (!hasSpecificFilters) {
//         params.append("availability_status", statusFilter);
//       }
//       if (debouncedGlobalFilter) params.append("search", debouncedGlobalFilter);
//       if (sorting.length > 0) {
//         params.append(
//           "ordering",
//           `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
//         );
//       }
//       columnFilters.forEach((filter) => {
//         if (filter.value) {
//           params.append(filter.id, String(filter.value));
//         }
//       });
//       if (priceRangeFilter) {
//         const [gte, lte] = priceRangeFilter.split("-");
//         params.append("price_per_night_gte", gte);
//         if (lte) {
//           params.append("price_per_night_lte", lte);
//         }
//       }

//       const response = await hotelClient.get<PaginatedRoomsResponse>(
//         "/rooms/",
//         { params }
//       );
//       const allRooms = response.data.results;
//       const csvData = allRooms.map((r) => ({
//         "Room Code": r.code,
//         "Room Type": roomTypesMap.get(r.room_type)?.name || "N/A",
//         "Bed Type": roomTypesMap.get(r.room_type)?.bed_type || "N/A",
//         "Floor Number": r.floor_number,
//         "Price/Night (USD)": r.price_per_night,
//       }));
//       const csv = Papa.unparse(csvData);
//       const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//       const link = document.createElement("a");
//       const url = URL.createObjectURL(blob);
//       link.setAttribute("href", url);
//       link.setAttribute(
//         "download",
//         `rooms_export_${new Date().toISOString().split("T")[0]}.csv`
//       );
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       toast.success("Rooms exported successfully!");
//     } catch (err) {
//       toast.error("An error occurred during the export.");
//     } finally {
//       setIsExporting(false);
//     }
//   }, [
//     hotelId,
//     totalRoomsCount,
//     debouncedGlobalFilter,
//     sorting,
//     roomTypesMap,
//     statusFilter,
//     columnFilters,
//     priceRangeFilter,
//   ]);
//   const columns = useMemo<ColumnDef<Room>[]>(() => {
//     // ... column definitions remain the same
//     return [
//       {
//         id: "select",
//         header: ({ table }) => (
//           <div className="flex items-center justify-center">
//             <Checkbox
//               checked={
//                 table.getIsAllPageRowsSelected() ||
//                 (table.getIsSomePageRowsSelected() && "indeterminate")
//               }
//               onCheckedChange={(value) =>
//                 table.toggleAllPageRowsSelected(!!value)
//               }
//               aria-label="Select all"
//               className="border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 mr-5"
//             />
//           </div>
//         ),
//         cell: ({ row }) => (
//           <div className="w-full flex items-center justify-center">
//             <Checkbox
//               checked={row.getIsSelected()}
//               onCheckedChange={(value) => row.toggleSelected(!!value)}
//               aria-label="Select row"
//               className="border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 mr-5"
//             />
//           </div>
//         ),
//         size: 50,
//         enableSorting: false,
//         enableHiding: false,
//       },
//       {
//         accessorKey: "code",
//         header: "Room Code",
//         cell: ({ row }) => (
//           <div className="font-mono text-sm text-gray-700 dark:text-[#D0D5DD] font-medium">
//             {row.original.code}
//           </div>
//         ),
//         size: 160,
//       },
//       {
//         accessorKey: "room_type",
//         id: "room_type_ids",
//         header: "Room Type",
//         cell: ({ row }) => {
//           const roomType = roomTypesMap.get(row.original.room_type);
//           return (
//             <span className="font-medium text-gray-700 dark:text-[#D0D5DD]">
//               {roomType ? roomType.name : "..."}
//             </span>
//           );
//         },
//         size: 220,
//       },
//       {
//         id: "bed_type",
//         header: "Bed Type",
//         cell: ({ row }) => {
//           const roomType = roomTypesMap.get(row.original.room_type);
//           return (
//             <span className="text-gray-600 dark:text-[#98A2B3]">
//               {roomType ? `${roomType.bed_type} Bed` : "..."}
//             </span>
//           );
//         },
//         size: 180,
//       },
//       {
//         accessorKey: "max_occupancy",
//         header: "Capacity",
//         cell: ({ row }) => (
//           <div className="flex items-center px-3 py-1">
//             <Users className="w-4 h-4 mr-2 text-[#0785CF] dark:text-[#0785CF]" />
//             <span className="font-medium text-gray-700 dark:text-[#D0D5DD]">
//               {row.original.max_occupancy} Guests
//             </span>
//           </div>
//         ),
//         size: 120,
//       },
//       {
//         accessorKey: "floor_number",
//         header: "Floor",
//         cell: ({ row }) => (
//           <span className="text-gray-600 dark:text-[#98A2B3]">
//             {formatNumberWithOrdinal(row.original.floor_number)} Floor
//           </span>
//         ),
//         size: 120,
//       },
//       {
//         accessorKey: "price_per_night",
//         header: ({ column }) => (
//           <div className="flex justify-end">
//             <SortableHeader column={column}>PRICE PER NIGHT</SortableHeader>
//           </div>
//         ),
//         cell: ({ row }) => {
//           const formatted = new Intl.NumberFormat("en-US", {
//             style: "currency",
//             currency: "USD",
//           }).format(row.original.price_per_night);
//           return (
//             <div className="text-right font-semibold text-gray-700 dark:text-[#D0D5DD]">
//               {formatted}
//             </div>
//           );
//         },
//         size: 180,
//       },
//       {
//         accessorKey: "availability_status",
//         header: "Status",
//         cell: ({ row }) => (
//           <Badge
//             className={cn(
//               "rounded-full px-3 py-1 font-medium transition-colors",
//               getAvailabilityColor(row.getValue("availability_status"))
//             )}
//           >
//             {row.getValue("availability_status")}
//           </Badge>
//         ),
//         size: 160,
//       },
//       {
//         id: "actions",
//         header: () => <div className="text-center">Actions</div>,
//         cell: ({ row }) => (
//           <div className="text-center">
//             <RowActions row={row} deleteRoomMutation={deleteRoomMutation} />
//           </div>
//         ),
//         size: 80,
//         enableHiding: false,
//       },
//     ];
//   }, [deleteRoomMutation, roomTypesMap]);

//   const table = useReactTable({
//     data: roomsForCurrentPage,
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

//   const handleDeleteRows = () => {
//     const selectedRows = table.getSelectedRowModel().rows;
//     selectedRows.forEach((row) => deleteRoomMutation.mutate(row.original.id));
//     table.resetRowSelection();
//   };

//   const clearFilters = () => {
//     setGlobalFilter("");
//     setColumnFilters([]);
//     setPriceRangeFilter("");
//     setSorting([]);
//   };

//   const activeFilters = useMemo(() => {
//     const filters = [];
//     if (globalFilter) {
//       filters.push({
//         label: `Search: "${globalFilter}"`,
//         onClear: () => setGlobalFilter(""),
//       });
//     }
//     const roomTypeFilter = columnFilters.find((f) => f.id === "room_type_ids");
//     if (roomTypeFilter?.value) {
//       filters.push({
//         label: `Type: ${
//           roomTypesMap.get(roomTypeFilter.value as string)?.name
//         }`,
//         onClear: () =>
//           setColumnFilters((prev) =>
//             prev.filter((f) => f.id !== "room_type_ids")
//           ),
//       });
//     }
//     const capacityFilter = columnFilters.find((f) => f.id === "max_occupancy");
//     if (capacityFilter?.value) {
//       filters.push({
//         label: `Capacity: ${capacityFilter.value} Guests`,
//         onClear: () =>
//           setColumnFilters((prev) =>
//             prev.filter((f) => f.id !== "max_occupancy")
//           ),
//       });
//     }
//     if (priceRangeFilter) {
//       const [min, max] = priceRangeFilter.split("-").map(Number);
//       filters.push({
//         label: `Price: $${min} - $${max}`,
//         onClear: () => setPriceRangeFilter(""),
//       });
//     }
//     return filters;
//   }, [globalFilter, columnFilters, priceRangeFilter, roomTypesMap]);

//   if (isError) return <ErrorPage error={error as Error} onRetry={refetch} />;

//   const isLoading =
//     isLoadingRooms || isLoadingRoomTypes || isLoadingHotel || !hotelId;

//   const TABS_CONFIG = [
//     {
//       label: "Available",
//       icon: CheckCircle2,
//       color: "text-emerald-600",
//     },
//     {
//       label: "Booked",
//       icon: BookCheck,
//       color: "text-amber-600",
//     },
//     {
//       label: "Maintenance",
//       icon: Wrench,
//       color: "text-rose-600",
//     },
//   ];

//   return (
//     <div className="flex-1 space-y-6 bg-gray-50 dark:bg-[#101828]">
//       <Card className="border-none p-0 bg-[#FFF] dark:bg-[#171F2F] rounded-none shadow-none">
//         <CardHeader className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 mb-4 pt-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-[1.5rem] font-bold tracking-wide">
//                 Hotel Rooms
//               </h2>
//               <CardDescription className="text-[0.9375rem] text-gray-600 dark:text-[#98A2B3] mt-1">
//                 Manage and view all rooms with ease.
//               </CardDescription>
//             </div>
//             <Button
//               className="bg-[#0785CF] hover:bg-[#0785CF]/90 gap-2"
//               onClick={() => navigate("/rooms/new-room")}
//             >
//               <MdAdd size={20} />
//               New Room
//             </Button>
//           </div>
//         </CardHeader>

//         <div className="px-6 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <StatCard
//             title="Total Rooms"
//             count={stats.total}
//             isLoading={isLoadingHotel}
//             icon={BedDouble}
//           />
//           <StatCard
//             title="Available"
//             count={stats.available}
//             isLoading={isLoadingHotel}
//             icon={CheckCircle2}
//           />
//           <StatCard
//             title="Booked"
//             count={stats.booked}
//             isLoading={isLoadingHotel}
//             icon={BookCheck}
//           />
//           <StatCard
//             title="Maintenance"
//             count={stats.maintenance}
//             isLoading={isLoadingHotel}
//             icon={Wrench}
//           />
//         </div>

//         <CardContent className="px-6 py-4">
//           <div className="flex items-center gap-2 bg-white dark:bg-[#101828] border border-gray-200 dark:border-[#1D2939] rounded-md shadow-2xs p-[6px] w-fit mb-6">
//             {TABS_CONFIG.map((tab) => {
//               const isActive = statusFilter === tab.label;
//               return (
//                 <button
//                   key={tab.label}
//                   onClick={() =>
//                     setStatusFilter(tab.label as typeof statusFilter)
//                   }
//                   className={cn(
//                     "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
//                     isActive
//                       ? "bg-[#0785CF] dark:bg-[#1c263a] text-white shadow"
//                       : "bg-transparent text-gray-600 dark:text-[#98A2B3] hover:text-gray-800 dark:hover:text-white"
//                   )}
//                 >
//                   <tab.icon
//                     className={cn(
//                       "h-5 w-5",
//                       isActive ? "text-white" : tab.color
//                     )}
//                   />
//                   {tab.label}
//                 </button>
//               );
//             })}
//           </div>

//           <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
//             <div className="flex flex-wrap items-center gap-2">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
//                 <Input
//                   ref={inputRef}
//                   placeholder="Search by room code..."
//                   value={globalFilter}
//                   onChange={(e) => setGlobalFilter(e.target.value)}
//                   className="pl-10 pr-10 w-full sm:w-80 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow focus:ring-2 focus:ring-blue-500 focus:border-[#0785CF] transition-all dark:placeholder:text-[#5D636E]"
//                 />
//                 {globalFilter && (
//                   <button
//                     className="absolute hover:bg-none right-2 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-[#98A2B3]"
//                     onClick={() => setGlobalFilter("")}
//                   >
//                     <XIcon size={18} />
//                   </button>
//                 )}
//               </div>
//               <Select
//                 value={
//                   (table
//                     .getColumn("room_type_ids")
//                     ?.getFilterValue() as string) ?? ""
//                 }
//                 onValueChange={(value) =>
//                   table
//                     .getColumn("room_type_ids")
//                     ?.setFilterValue(value === "all" ? "" : value)
//                 }
//               >
//                 <SelectTrigger className="w-36 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow focus:ring-2 focus:ring-blue-500">
//                   <SelectValue placeholder="Room Type" />
//                 </SelectTrigger>
//                 <SelectContent className="bg-[#FFF] dark:bg-[#101828] px-2 py-3 border-[1.5px] border-[#E4E7EC] dark:border-[#1D2939] rounded-xl shadow-sm">
//                   <SelectItem
//                     value="all"
//                     className="hover:bg-[#D6EEF9] dark:hover:bg-[#1C2433] text-[#1D2939] dark:text-[#D0D5DD] uppercase text-[13px] font-semibold"
//                   >
//                     All Room Types
//                   </SelectItem>
//                   {roomTypesData?.map((rt) => (
//                     <SelectItem
//                       key={rt.id}
//                       value={rt.id}
//                       className="hover:bg-[#D6EEF9] dark:hover:bg-[#1C2433] text-[#1D2939] dark:text-[#D0D5DD] uppercase text-[13px] font-semibold"
//                     >
//                       {rt.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               {/* --- NEW CAPACITY FILTER --- */}
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className="w-36 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow focus:ring-2 focus:ring-blue-500"
//                   >
//                     Capacity
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent className="p-2 dark:bg-[#101828] dark:border-[#1D2939]">
//                   <ToggleGroup
//                     type="single"
//                     value={
//                       (table
//                         .getColumn("max_occupancy")
//                         ?.getFilterValue() as string) ?? ""
//                     }
//                     onValueChange={(value) => {
//                       table
//                         .getColumn("max_occupancy")
//                         ?.setFilterValue(value || null);
//                     }}
//                     className="flex-col items-start gap-1"
//                   >
//                     {GUEST_CAPACITY_OPTIONS.map((opt) => (
//                       <ToggleGroupItem
//                         key={opt.value}
//                         value={opt.value}
//                         className="w-full justify-start data-[state=on]:bg-[#D6EEF9] dark:data-[state=on]:bg-[#B4E6F5]/50"
//                       >
//                         {opt.label}
//                       </ToggleGroupItem>
//                     ))}
//                   </ToggleGroup>
//                 </DropdownMenuContent>
//               </DropdownMenu>

//               {/* --- NEW PRICE FILTER --- */}
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className="w-44 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow focus:ring-2 focus:ring-blue-500"
//                   >
//                     Price Range (USD)
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent className="w-64 p-4 dark:bg-[#101828] dark:border-[#1D2939]">
//                   <div className="space-y-4">
//                     <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
//                       <span>${priceSliderValue[0]}</span>
//                       <span>${priceSliderValue[1]}</span>
//                     </div>
//                     <Slider
//                       value={priceSliderValue}
//                       onValueChange={setPriceSliderValue}
//                       onValueCommit={(values) =>
//                         setPriceRangeFilter(`${values[0]}-${values[1]}`)
//                       }
//                       min={MIN_PRICE}
//                       max={MAX_PRICE}
//                       step={10}
//                     />
//                   </div>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>
//             <div className="flex items-center gap-3">
//               {table.getSelectedRowModel().rows.length > 0 && (
//                 <AlertDialog>
//                   <AlertDialogTrigger asChild>
//                     <Button
//                       variant="outline"
//                       className="gap-2 bg-white dark:bg-transparent border-gray-200 dark:border-[#1D2939] rounded-lg shadow-sm hover:bg-rose-50 dark:hover:bg-rose-900/40 hover:border-rose-300 dark:hover:border-rose-600 text-rose-600 dark:text-rose-400"
//                     >
//                       <Trash2 size={16} /> Delete (
//                       {table.getSelectedRowModel().rows.length})
//                     </Button>
//                   </AlertDialogTrigger>
//                   <AlertDialogContent className="bg-white dark:bg-[#101828] dark:border-[#1D2939] rounded-xl shadow-lg">
//                     <AlertDialogHeader>
//                       <AlertDialogTitle className="text-lg font-bold text-gray-900 dark:text-[#D0D5DD]">
//                         Confirm Deletion
//                       </AlertDialogTitle>
//                       <AlertDialogDescription className="text-gray-600 dark:text-[#98A2B3]">
//                         This will permanently delete{" "}
//                         {table.getSelectedRowModel().rows.length} selected
//                         room(s). This action cannot be undone.
//                       </AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                       <AlertDialogCancel className="bg-gray-100 dark:bg-[#171F2F] hover:bg-gray-200 dark:hover:bg-[#1C2433] text-gray-700 dark:text-[#D0D5DD] rounded-lg border-none">
//                         Cancel
//                       </AlertDialogCancel>
//                       <AlertDialogAction
//                         className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
//                         onClick={handleDeleteRows}
//                       >
//                         Delete
//                       </AlertDialogAction>
//                     </AlertDialogFooter>
//                   </AlertDialogContent>
//                 </AlertDialog>
//               )}
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className="gap-2 bg-white dark:bg-[#101828] dark:text-[#D0D5DD] border-gray-200 dark:border-[#1D2939] rounded-md shadow"
//                   >
//                     <Columns3Icon size={16} /> View
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent
//                   align="end"
//                   className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-md shadow"
//                 >
//                   <DropdownMenuLabel className="text-gray-900 dark:text-[#D0D5DD] font-semibold">
//                     Toggle columns
//                   </DropdownMenuLabel>
//                   {table
//                     .getAllColumns()
//                     .filter((c) => c.getCanHide())
//                     .map((c) => (
//                       <DropdownMenuCheckboxItem
//                         key={c.id}
//                         checked={c.getIsVisible()}
//                         onCheckedChange={c.toggleVisibility}
//                         className="capitalize text-gray-700 dark:text-[#D0D5DD] hover:bg-[#D6EEF9] dark:hover:bg-[#1C2433]"
//                       >
//                         {c.id.replace(/_/g, " ")}
//                       </DropdownMenuCheckboxItem>
//                     ))}
//                 </DropdownMenuContent>
//               </DropdownMenu>
//               <Button
//                 variant="outline"
//                 onClick={() => refetch()}
//                 disabled={isRefetching || isLoading}
//                 className="gap-2 bg-white dark:bg-[#101828] dark:text-[#D0D5DD] border-gray-200 dark:border-[#1D2939] rounded-md shadow"
//               >
//                 <IoRefreshOutline
//                   className={cn("h-5 w-5", isRefetching && "animate-spin")}
//                 />
//                 Refresh
//               </Button>
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button
//                     variant="outline"
//                     size="icon"
//                     className="h-10 w-10 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-full shadow"
//                   >
//                     <MoreVertical className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
//                     <span className="sr-only">More options</span>
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent
//                   align="end"
//                   className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-md shadow"
//                 >
//                   <DropdownMenuItem
//                     onClick={handleExport}
//                     disabled={isExporting}
//                     className="gap-2 text-gray-700 dark:text-[#D0D5DD] hover:bg-indigo-50 dark:hover:bg-[#1C2433]"
//                   >
//                     {isExporting ? (
//                       <Loader2 className="h-5 w-5 animate-spin text-[#0785CF]" />
//                     ) : (
//                       <TbFileTypeCsv className="h-5 w-5 text-emerald-600" />
//                     )}
//                     <span>
//                       {isExporting ? "Exporting..." : "Export to CSV"}
//                     </span>
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>
//           </div>

//           {activeFilters.length > 0 && (
//             <div className="flex flex-wrap items-center gap-2 mb-6">
//               <span className="text-sm font-semibold text-gray-700 dark:text-[#98A2B3]">
//                 Active Filters:
//               </span>
//               {activeFilters.map((filter, index) => (
//                 <Badge
//                   key={index}
//                   variant="secondary"
//                   className="flex items-center gap-2 bg-[#D6EEF9] dark:bg-[#162142] border border-[#B4E6F5]200 dark:border-[#B4E6F5]900 text-blue-800 dark:text-[#7592FF]"
//                 >
//                   {filter.label}
//                   <button
//                     onClick={filter.onClear}
//                     className="rounded-full hover:bg-[#B4E6F<｜place▁holder▁no▁797｜>] dark:hover:bg-blue-800/50 p-0.5"
//                   >
//                     <XIcon className="h-3 w-3" />
//                   </button>
//                 </Badge>
//               ))}
//               <span
//                 className="text-[#0785CF] block text-sm font-medium cursor-pointer hover:text-[#0785CF] dark:text-[#0785CF] dark:hover:text-[#0785CF] h-auto p-1.5"
//                 onClick={clearFilters}
//               >
//                 Clear All
//               </span>
//             </div>
//           )}

//           <div className="rounded-lg border border-gray-200 dark:border-[#1D2939] shadow-sm bg-white dark:bg-[#171F2F] overflow-hidden">
//             <Table>
//               <TableHeader>
//                 {table.getHeaderGroups().map((headerGroup) => (
//                   <TableRow
//                     key={headerGroup.id}
//                     className="hover:bg-transparent border-b-2 border-gray-300 dark:border-b-[#1D2939]"
//                   >
//                     {headerGroup.headers.map((header) => (
//                       <TableHead
//                         key={header.id}
//                         style={{ width: `${header.getSize()}px` }}
//                         className="h-14 px-6 text-left align-middle font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3] border-r border-gray-300 dark:border-r-[#1D2939] last:border-r-0 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#101828] dark:to-[#101828]/90 shadow-sm"
//                       >
//                         {header.isPlaceholder
//                           ? null
//                           : flexRender(
//                               header.column.columnDef.header,
//                               header.getContext()
//                             )}
//                       </TableHead>
//                     ))}
//                   </TableRow>
//                 ))}
//               </TableHeader>
//               <TableBody className="pt-4">
//                 {isLoading ? (
//                   <TableRow>
//                     <TableCell
//                       colSpan={columns.length}
//                       className="h-24 text-center"
//                     >
//                       <div className="w-full flex items-center justify-center">
//                         <Loader className="animate-spin h-8 w-8 text-[#0785CF]" />
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ) : table.getRowModel().rows?.length ? (
//                   table.getRowModel().rows.map((row) => (
//                     <TableRow
//                       key={row.id}
//                       data-state={row.getIsSelected() && "selected"}
//                       className="border-b border-gray-200 dark:border-b-[#1D2939] hover:bg-indigo-50/30 dark:hover:bg-[#1C2433] transition-colors"
//                     >
//                       {row.getVisibleCells().map((cell) => (
//                         <TableCell
//                           key={cell.id}
//                           className="px-6 py-4 align-middle border-r border-gray-200 dark:border-r-[#1D2939] last:border-r-0 text-gray-700 dark:text-[#D0D5DD]"
//                           style={{ minHeight: "60px" }}
//                         >
//                           {flexRender(
//                             cell.column.columnDef.cell,
//                             cell.getContext()
//                           )}
//                         </TableCell>
//                       ))}
//                     </TableRow>
//                   ))
//                 ) : (
//                   <TableRow>
//                     <TableCell
//                       colSpan={columns.length}
//                       className="h-24 text-center text-gray-500 dark:text-[#98A2B3]"
//                     >
//                       No rooms found matching your criteria.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>

//           <div className="flex items-center justify-between gap-4 mt-6">
//             <div className="flex-1 text-sm text-gray-600 dark:text-[#98A2B3]">
//               {table.getFilteredSelectedRowModel().rows.length} of{" "}
//               {table.getFilteredRowModel().rows.length} row(s) selected.
//             </div>
//             <div className="flex items-center gap-6">
//               <div className="flex items-center justify-center text-sm font-medium text-gray-700 dark:text-[#98A2B3]">
//                 Page {table.getState().pagination.pageIndex + 1} of{" "}
//                 {table.getPageCount()}
//               </div>
//               <div className="flex items-center space-x-2">
//                 <Button
//                   variant="outline"
//                   className="h-9 w-9 p-0 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-[#1C2433] hover:border-indigo-300"
//                   onClick={() => table.firstPage()}
//                   disabled={!hasPreviousPage}
//                 >
//                   <ChevronFirstIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   className="h-9 w-9 p-0 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-[#1C2433] hover:border-indigo-300"
//                   onClick={() => table.previousPage()}
//                   disabled={!hasPreviousPage}
//                 >
//                   <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   className="h-9 w-9 p-0 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-[#1C2433] hover:border-indigo-300"
//                   onClick={() => table.nextPage()}
//                   disabled={!hasNextPage}
//                 >
//                   <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   className="h-9 w-9 p-0 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-[#1C2433] hover:border-indigo-300"
//                   onClick={() => table.lastPage()}
//                   disabled={!hasNextPage}
//                 >
//                   <ChevronLastIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// // --- Reusable Sub-components ---
// const SortableHeader = ({
//   column,
//   children,
//   className,
// }: {
//   column: any;
//   children: React.ReactNode;
//   className?: string;
// }) => {
//   const isSorted = column.getIsSorted();

//   return (
//     <div
//       className={cn(
//         "flex items-center gap-2 cursor-pointer select-none",
//         className
//       )}
//       onClick={column.getToggleSortingHandler()}
//     >
//       {children}
//       {isSorted === "desc" ? (
//         <ChevronDownIcon
//           size={16}
//           className="text-[#1D2939] dark:text-[#D0D5DD]"
//         />
//       ) : (
//         <ChevronUpIcon
//           size={16}
//           className={cn(
//             isSorted === "asc"
//               ? "text-[#1D2939] dark:text-[#D0D5DD]"
//               : "text-gray-600 dark:text-[#98A2B3]"
//           )}
//         />
//       )}
//     </div>
//   );
// };

// function RowActions({
//   row,
//   deleteRoomMutation,
// }: {
//   row: Row<Room>;
//   deleteRoomMutation: any;
// }) {
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();
//   const roomStatus = row.original.availability_status;

//   const updateStatusMutation = useMutation({
//     mutationFn: ({
//       roomId,
//       status,
//     }: {
//       roomId: string;
//       status: "Available" | "Booked" | "Maintenance";
//     }) =>
//       hotelClient.patch(`/rooms/${roomId}/`, { availability_status: status }),
//     onSuccess: (_, variables) => {
//       toast.success(`Room marked as ${variables.status}!`);
//       queryClient.invalidateQueries({ queryKey: ["rooms"] });
//       queryClient.invalidateQueries({ queryKey: ["hotelDetails"] });
//     },
//     onError: (error: any) => {
//       toast.error(
//         `Failed to update status: ${
//           error.response?.data?.detail || error.message
//         }`
//       );
//     },
//   });

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <div className="flex justify-center">
//           <Button
//             size="icon"
//             variant="ghost"
//             className="h-9 w-9 rounded-full hover:bg-indigo-100 dark:hover:bg-[#1C2433] text-gray-600 dark:text-[#98A2B3]"
//             aria-label="Room actions"
//           >
//             <EllipsisIcon size={18} aria-hidden="true" />
//           </Button>
//         </div>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent
//         align="end"
//         className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-lg"
//       >
//         <DropdownMenuItem
//           onClick={() => navigate(`/rooms/${row.original.id}`)}
//           className="gap-2 text-gray-700 dark:text-[#D0D5DD] hover:bg-indigo-50 dark:hover:bg-[#1C2433]"
//         >
//           <Eye className="h-5 w-5 text-[#0785CF]" /> View Details
//         </DropdownMenuItem>
//         <DropdownMenuSeparator className="dark:bg-[#1D2939]" />
//         <DropdownMenuGroup>
//           {roomStatus !== "Available" && (
//             <DropdownMenuItem
//               onClick={() =>
//                 updateStatusMutation.mutate({
//                   roomId: row.original.id,
//                   status: "Available",
//                 })
//               }
//               className="gap-2 text-gray-700 dark:text-[#D0D5DD] hover:bg-indigo-50 dark:hover:bg-[#1C2433]"
//             >
//               <CheckCircle2 className="h-5 w-5 text-emerald-600" />
//               <span>Mark as Available</span>
//             </DropdownMenuItem>
//           )}
//           {roomStatus !== "Booked" && (
//             <DropdownMenuItem
//               onClick={() =>
//                 updateStatusMutation.mutate({
//                   roomId: row.original.id,
//                   status: "Booked",
//                 })
//               }
//               className="gap-2 text-gray-700 dark:text-[#D0D5DD] hover:bg-indigo-50 dark:hover:bg-[#1C2433]"
//             >
//               <BookCheck className="h-5 w-5 text-amber-600" />
//               <span>Mark as Booked</span>
//             </DropdownMenuItem>
//           )}
//           {roomStatus !== "Maintenance" && (
//             <DropdownMenuItem
//               onClick={() =>
//                 updateStatusMutation.mutate({
//                   roomId: row.original.id,
//                   status: "Maintenance",
//                 })
//               }
//               className="gap-2 text-gray-700 dark:text-[#D0D5DD] hover:bg-indigo-50 dark:hover:bg-[#1C2433]"
//             >
//               <Wrench className="h-5 w-5 text-rose-600" />
//               <span>Mark as Maintenance</span>
//             </DropdownMenuItem>
//           )}
//         </DropdownMenuGroup>
//         <DropdownMenuSeparator className="dark:bg-[#1D2939]" />
//         <AlertDialog>
//           <AlertDialogTrigger asChild>
//             <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400">
//               <Trash2 className="mr-2 h-5 w-5" />
//               <span>Delete</span>
//             </div>
//           </AlertDialogTrigger>
//           <AlertDialogContent className="bg-white dark:bg-[#101828] dark:border-[#1D2939] rounded-xl shadow-lg">
//             <AlertDialogHeader>
//               <AlertDialogTitle className="text-lg font-bold text-gray-900 dark:text-[#D0D5DD]">
//                 Confirm Deletion
//               </AlertDialogTitle>
//               <AlertDialogDescription className="text-gray-600 dark:text-[#98A2B3]">
//                 This will permanently delete the room '{row.original.code}'.
//                 This action cannot be undone.
//               </AlertDialogDescription>
//             </AlertDialogHeader>
//             <AlertDialogFooter>
//               <AlertDialogCancel className="bg-gray-100 dark:bg-[#171F2F] hover:bg-gray-200 dark:hover:bg-[#1C2433] text-gray-700 dark:text-[#D0D5DD] rounded-lg border-none">
//                 Cancel
//               </AlertDialogCancel>
//               <AlertDialogAction
//                 className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
//                 onClick={() => deleteRoomMutation.mutate(row.original.id)}
//               >
//                 Delete
//               </AlertDialogAction>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialog>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }

//  - - - src/pages/rooms/hotel-rooms
"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Columns3Icon,
  EllipsisIcon,
  Eye,
  Trash2,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Search,
  Loader2,
  Loader,
  BookCheck,
  Wrench,
  MoreVertical,
  CheckCircle2,
  Users,
  XIcon,
  BedDouble,
} from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // No longer used
// import { MdAdd } from "react-icons/md"; // No longer used
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"; // Swapped for native select
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
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
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { IoRefreshOutline } from "react-icons/io5";
import { TbFileTypeCsv } from "react-icons/tb";
import ErrorPage from "@/components/custom/error-page";
import hotelClient from "@/api/hotel-client";
import { formatNumberWithOrdinal } from "@/utils/utils";
import { StatCard } from "@/components/custom/StatCard";
// import { Slider } from "@/components/ui/slider"; // No longer used
import { useAuthStore } from "@/store/auth.store"; // --- 1. Import auth store ---

// --- Type Definitions ---
interface Room {
  id: string;
  code: string;
  description: string;
  price_per_night: number;
  availability_status: "Available" | "Booked" | "Maintenance";
  floor_number: number;
  room_type: string;
  max_occupancy: number;
}

interface RoomType {
  id: string;
  name: string;
  bed_type: string;
}

interface PaginatedRoomsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Room[];
}

interface HotelStatsData {
  summary_counts: {
    rooms: number;
  };
  availability_stats: {
    status_counts: {
      Available: number;
      Booked: number;
      Maintenance: number;
    };
  };
}

// --- Constants ---
const GUEST_CAPACITY_OPTIONS = [
  { label: "1 Guest", value: "1" },
  { label: "2 Guests", value: "2" },
  { label: "3 Guests", value: "3" },
  { label: "4 Guests", value: "4" },
  { label: "5+ Guests", value: "5" },
];
const MIN_PRICE = 0;
const MAX_PRICE = 1000;

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

const getAvailabilityColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "available":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700/60";
    case "booked":
      return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700/60";
    case "maintenance":
      return "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-700/60";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
};

// --- Main Component ---
export default function HotelRooms() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hotelId } = useAuthStore(); // --- 2. Get hotelId from store ---

  // --- State ---
  const [statusFilter, setStatusFilter] = useState<
    "Available" | "Booked" | "Maintenance"
  >("Available");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [priceRangeFilter, setPriceRangeFilter] = useState("");
  // New state for min/max price inputs
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const debouncedGlobalFilter = useDebounce(globalFilter, 500);
  const [isExporting, setIsExporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear price inputs if the priceRangeFilter is cleared (e.g., by the "Active Filters" badge)
  useEffect(() => {
    if (priceRangeFilter === "") {
      setMinPrice("");
      setMaxPrice("");
    }
  }, [priceRangeFilter]);

  // --- Data Queries ---
  const {
    data: paginatedResponse,
    isLoading: isLoadingRooms,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<PaginatedRoomsResponse>({
    queryKey: [
      "rooms",
      hotelId, // --- 3. Add hotelId to queryKey ---
      statusFilter,
      pagination.pageIndex,
      pagination.pageSize,
      debouncedGlobalFilter,
      sorting,
      columnFilters,
      priceRangeFilter,
    ],
    queryFn: async () => {
      // Ensure hotelId is available before proceeding
      if (!hotelId) {
        throw new Error("Hotel ID is not available.");
      }
      const params = new URLSearchParams({ hotel_id: hotelId }); // Use guaranteed hotelId

      const hasSpecificFilters =
        columnFilters.length > 0 || priceRangeFilter !== "";

      // ** Logic Reinstated: Only add statusFilter if NO other specific filters are active **
      if (!hasSpecificFilters) {
        params.append("availability_status", statusFilter);
      }
      params.append("page", String(pagination.pageIndex + 1));
      params.append("page_size", String(pagination.pageSize));

      if (debouncedGlobalFilter) {
        params.append("search", debouncedGlobalFilter);
      }
      if (sorting.length > 0) {
        const sortKey = sorting[0].id;
        const sortDir = sorting[0].desc ? "-" : "";
        params.append("ordering", `${sortDir}${sortKey}`);
      }
      // --- *** REVERTED columnFilters handling to OLDER version logic *** ---
      columnFilters.forEach((filter) => {
        if (filter.value) {
          // *** Sends the parameter as filter.id (e.g., "room_type_ids") ***
          params.append(filter.id, String(filter.value));
        }
      });
      // --- *** END OF REVERSION *** ---
      if (priceRangeFilter) {
        const [gte, lte] = priceRangeFilter.split("-");
        // Use original API parameter names based on original code
        params.append("price_per_night_gte", gte);
        if (lte) {
          params.append("price_per_night_lte", lte);
        }
      }

      // Debugging: Log the final params before sending
      // console.log("API Request Params:", params.toString());

      const response = await hotelClient.get(`/rooms/`, { params });
      return response.data;
    },
    keepPreviousData: true,
    enabled: !!hotelId, // --- 5. Enable query only when hotelId is available ---
  });

  const { data: roomTypesData, isLoading: isLoadingRoomTypes } = useQuery<
    RoomType[]
  >({
    queryKey: ["allRoomTypes"],
    queryFn: async () => (await hotelClient.get("/room-types/")).data.results,
    staleTime: Infinity,
  });

  const { data: hotelData, isLoading: isLoadingHotel } =
    useQuery<HotelStatsData>({
      queryKey: ["hotelDetails", hotelId],
      queryFn: async () => (await hotelClient.get(`/hotels/${hotelId}/`)).data, // --- 6. Use dynamic hotelId ---
      enabled: !!hotelId, // --- 7. Enable query only when hotelId is available ---
    });

  const roomTypesMap = useMemo(() => {
    if (!roomTypesData) return new Map<string, RoomType>();
    return new Map(roomTypesData.map((rt) => [rt.id, rt]));
  }, [roomTypesData]);

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId: string) => hotelClient.delete(`rooms/${roomId}/`),
    onSuccess: () => {
      toast.success("Room deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["hotelDetails"] });
    },
    onError: (error: any) => {
      toast.error(
        `Failed to delete room: ${
          error.response?.data?.detail || error.message
        }`
      );
    },
  });

  const stats = {
    total: hotelData?.summary_counts?.rooms ?? 0,
    available: hotelData?.availability_stats?.status_counts?.Available ?? 0,
    booked: hotelData?.availability_stats?.status_counts?.Booked ?? 0,
    maintenance: hotelData?.availability_stats?.status_counts?.Maintenance ?? 0,
  };

  const roomsForCurrentPage = paginatedResponse?.results ?? [];
  const totalRoomsCount = paginatedResponse?.count ?? 0;
  const totalPages = paginatedResponse
    ? Math.ceil(paginatedResponse.count / pagination.pageSize)
    : 0;
  const hasNextPage = paginatedResponse?.next !== null;
  const hasPreviousPage = paginatedResponse?.previous !== null;

  // --- *** REVERTED handleExport Callback *** ---
  const handleExport = useCallback(async () => {
    // Ensure hotelId is available before proceeding
    if (!hotelId) {
      toast.error("Cannot export: Hotel ID is missing.");
      return;
    }
    if (!totalRoomsCount) {
      toast.info(`No rooms found to export.`);
      return;
    }
    setIsExporting(true);
    toast.info(`Exporting ${totalRoomsCount} rooms...`);
    try {
      const params = new URLSearchParams({
        hotel_id: hotelId, // Use guaranteed hotelId
        page_size: String(totalRoomsCount), // Fetch all rooms for export
      });

      const hasSpecificFilters =
        columnFilters.length > 0 || priceRangeFilter !== "";

      // ** Logic Reinstated: Apply the same filters as the main query **
      if (!hasSpecificFilters) {
        params.append("availability_status", statusFilter);
      }
      if (debouncedGlobalFilter) params.append("search", debouncedGlobalFilter);
      if (sorting.length > 0) {
        params.append(
          "ordering",
          `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
        );
      }
      // --- *** REVERTED columnFilters handling for EXPORT *** ---
      columnFilters.forEach((filter) => {
        if (filter.value) {
          // *** Sends the parameter as filter.id (e.g., "room_type_ids") ***
          params.append(filter.id, String(filter.value));
        }
      });
      // --- *** END OF EXPORT REVERSION *** ---
      if (priceRangeFilter) {
        const [gte, lte] = priceRangeFilter.split("-");
        // Use original API parameter names
        params.append("price_per_night_gte", gte);
        if (lte) {
          params.append("price_per_night_lte", lte);
        }
      }

      // Debugging: Log export params
      // console.log("Export API Request Params:", params.toString());

      const response = await hotelClient.get<PaginatedRoomsResponse>(
        "/rooms/",
        { params }
      );
      const allRooms = response.data.results;
      const csvData = allRooms.map((r) => ({
        "Room Code": r.code,
        "Room Type": roomTypesMap.get(r.room_type)?.name || "N/A",
        "Bed Type": roomTypesMap.get(r.room_type)?.bed_type || "N/A",
        "Floor Number": r.floor_number,
        "Price/Night (USD)": r.price_per_night,
      }));
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `rooms_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Rooms exported successfully!");
    } catch (err: any) {
      // Type error for better logging
      console.error("Export Error:", err);
      // More specific error message if possible
      const apiError =
        err.response?.data?.detail || err.message || "Unknown error";
      toast.error(`An error occurred during the export: ${apiError}`);
    } finally {
      setIsExporting(false);
    }
  }, [
    hotelId, // Added hotelId dependency
    totalRoomsCount,
    debouncedGlobalFilter,
    sorting,
    roomTypesMap,
    statusFilter,
    columnFilters,
    priceRangeFilter,
  ]);
  const columns = useMemo<ColumnDef<Room>[]>(() => {
    // ... column definitions remain the same
    return [
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
              className="border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 mr-5"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="w-full flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 mr-5"
            />
          </div>
        ),
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "code",
        header: "Room Code",
        cell: ({ row }) => (
          <div className="font-mono text-sm text-gray-700 dark:text-[#D0D5DD] font-medium">
            {row.original.code}
          </div>
        ),
        size: 160,
      },
      {
        accessorKey: "room_type",
        id: "room_type_ids", // Keep this ID for filtering logic
        header: "Room Type",
        cell: ({ row }) => {
          const roomType = roomTypesMap.get(row.original.room_type);
          return (
            <span className="font-medium text-gray-700 dark:text-[#D0D5DD]">
              {roomType ? roomType.name : "..."}
            </span>
          );
        },
        size: 220,
      },
      {
        id: "bed_type",
        header: "Bed Type",
        cell: ({ row }) => {
          const roomType = roomTypesMap.get(row.original.room_type);
          return (
            <span className="text-gray-600 dark:text-[#98A2B3]">
              {roomType ? `${roomType.bed_type} Bed` : "..."}
            </span>
          );
        },
        size: 180,
      },
      {
        accessorKey: "max_occupancy",
        header: "Capacity",
        cell: ({ row }) => (
          <div className="flex items-center px-3 py-1">
            <Users className="w-4 h-4 mr-2 text-[#0785CF] dark:text-[#0785CF]" />
            <span className="font-medium text-gray-700 dark:text-[#D0D5DD]">
              {row.original.max_occupancy} Guests
            </span>
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: "floor_number",
        header: "Floor",
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-[#98A2B3]">
            {formatNumberWithOrdinal(row.original.floor_number)} Floor
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: "price_per_night",
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortableHeader column={column}>PRICE PER NIGHT</SortableHeader>
          </div>
        ),
        cell: ({ row }) => {
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(row.original.price_per_night);
          return (
            <div className="text-right">
              <span className="font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/50 px-3 py-1 rounded-full inline-block shadow-none">
                {formatted}
              </span>
            </div>
          );
        },
        size: 180,
      },
      {
        accessorKey: "availability_status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors shadow-none",
              getAvailabilityColor(row.getValue("availability_status"))
            )}
          >
            {row.getValue("availability_status")}
          </Badge>
        ),
        size: 160,
      },
      // --- NEW "VIEW" COLUMN ---
      {
        id: "view_details",
        header: () => <div className="text-center">View</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <button
              className="h-9 w-9 shadow-none dark:text-[#0785CF]"
              onClick={() => navigate(`/rooms/${row.original.id}`)}
            >
              <Eye className="h-4 w-4 text-[#0785CF]" />
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
            <RowActions row={row} deleteRoomMutation={deleteRoomMutation} />
          </div>
        ),
        size: 80,
        enableHiding: false,
      },
    ];
  }, [deleteRoomMutation, roomTypesMap, navigate]);

  const table = useReactTable({
    data: roomsForCurrentPage,
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
    const selectedRows = table.getSelectedRowModel().rows;
    selectedRows.forEach((row) => deleteRoomMutation.mutate(row.original.id));
    table.resetRowSelection();
  };

  const clearFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    setPriceRangeFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSorting([]);
    // Reset status filter to default if needed when clearing all
    // setStatusFilter("Available"); // Optional: uncomment if you want tabs to reset too
  };

  const activeFilters = useMemo(() => {
    const filters = [];
    if (globalFilter) {
      filters.push({
        label: `Search: "${globalFilter}"`,
        onClear: () => setGlobalFilter(""),
      });
    }
    const roomTypeFilter = columnFilters.find((f) => f.id === "room_type_ids");
    if (roomTypeFilter?.value) {
      filters.push({
        label: `Type: ${
          roomTypesMap.get(roomTypeFilter.value as string)?.name
        }`,
        onClear: () =>
          setColumnFilters((prev) =>
            prev.filter((f) => f.id !== "room_type_ids")
          ),
      });
    }
    const capacityFilter = columnFilters.find((f) => f.id === "max_occupancy");
    if (capacityFilter?.value) {
      filters.push({
        label: `Capacity: ${capacityFilter.value} Guests`,
        onClear: () =>
          setColumnFilters((prev) =>
            prev.filter((f) => f.id !== "max_occupancy")
          ),
      });
    }
    if (priceRangeFilter) {
      const [min, max] = priceRangeFilter.split("-").map(Number);
      filters.push({
        label: `Price: $${min} - $${max}`,
        onClear: () => setPriceRangeFilter(""), // useEffect will clear inputs
      });
    }
    return filters;
  }, [globalFilter, columnFilters, priceRangeFilter, roomTypesMap]);

  // Display error only if it's not just a loading state issue
  if (isError && !isLoadingRooms)
    return <ErrorPage error={error as Error} onRetry={refetch} />;

  const isLoadingData =
    isLoadingRooms || isLoadingRoomTypes || isLoadingHotel || !hotelId;

  // --- MODIFIED TABS_CONFIG (icons removed) ---
  const TABS_CONFIG = [
    {
      label: "Available",
    },
    {
      label: "Booked",
    },
    {
      label: "Maintenance",
    },
  ];

  return (
    <div className="flex-1 space-y-6 bg-red-500 dark:bg-[#101828]">
      <Card className="border-none p-0 bg-[#F9FAFB] dark:bg-[#171F2F] rounded-none shadow-none">
        {/* --- MODIFIED CARD HEADER (height, text size) --- */}
        <CardHeader className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 mb-4 pt-4 lg:h-[132px]">
          <div className="flex items-center justify-between">
            <div>
              {/* --- MODIFIED HEADING (text, size) --- */}
              <h2 className="text-[1.5rem] font-bold tracking-wide lg:text-[30px] lg:leading-[36px] lg:font-bold">
                Hotel Rooms
              </h2>
              <CardDescription className="text-[0.9375rem] text-gray-600 dark:text-[#98A2B3] mt-1">
                Manage and view all rooms in your hotel with ease.
              </CardDescription>
            </div>
            {/* --- MODIFIED BUTTON (text, no icon) --- */}
            <Button
              className="bg-[#0785CF] hover:bg-[#0785CF]/90 shadow-none"
              onClick={() => navigate("/rooms/new-room")}
            >
              Create New Room
            </Button>
          </div>
        </CardHeader>

        <div className="px-6 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Rooms"
            count={stats.total}
            isLoading={isLoadingHotel}
            icon={BedDouble}
          />
          <StatCard
            title="Available"
            count={stats.available}
            isLoading={isLoadingHotel}
            icon={CheckCircle2}
          />
          <StatCard
            title="Booked"
            count={stats.booked}
            isLoading={isLoadingHotel}
            icon={BookCheck}
          />
          <StatCard
            title="Maintenance"
            count={stats.maintenance}
            isLoading={isLoadingHotel}
            icon={Wrench}
          />
        </div>

        <CardContent className="px-6 py-4">
          {/* --- MODIFIED TABS (no icons) --- */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#101828] border border-gray-200 dark:border-[#1D2939] rounded-md shadow-none p-[6px] w-fit mb-6">
            {TABS_CONFIG.map((tab) => {
              const isActive = statusFilter === tab.label;
              return (
                <button
                  key={tab.label}
                  onClick={() =>
                    setStatusFilter(tab.label as typeof statusFilter)
                  }
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200", // removed gap-2
                    isActive
                      ? "bg-[#0785CF] dark:bg-[#1c263a] text-white shadow-none"
                      : "bg-transparent text-gray-600 dark:text-[#98A2B3] hover:text-gray-800 dark:hover:text-white"
                  )}
                >
                  {/* <tab.icon ... /> Removed icon */}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* --- ADDED FILTER HEADING --- */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#D0D5DD] mb-2">
            Filter & Sort Rooms:
          </h3>

          {/* --- MODIFIED FILTER SECTION --- */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            {/* --- MODIFIED FILTER LAYOUT --- */}
            <div className="flex flex-col gap-4 w-full">
              {/* First row: Search and Selects */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="relative md:col-span-2 lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
                  <Input
                    ref={inputRef}
                    placeholder="Search by room code..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-10 pr-10 w-full bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow-none focus:ring-2 focus:ring-blue-500 focus:border-[#0785CF] transition-all dark:placeholder:text-[#5D636E]"
                  />
                  {globalFilter && (
                    <button
                      className="absolute hover:bg-none right-2 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-[#98A2B3]"
                      onClick={() => setGlobalFilter("")}
                    >
                      <XIcon size={18} />
                    </button>
                  )}
                </div>

                {/* Native Select for Room Type */}
                <select
                  aria-label="Filter by Room Type"
                  value={
                    (table
                      .getColumn("room_type_ids")
                      ?.getFilterValue() as string) ?? ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    table
                      .getColumn("room_type_ids")
                      ?.setFilterValue(value === "all" ? "" : value);
                  }}
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-[#101828] border border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow-none focus:ring-2 focus:ring-blue-500 focus:border-[#0785CF]"
                >
                  <option value="all">All Room Types</option>
                  {roomTypesData?.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>

                {/* Native Select for Capacity */}
                <select
                  aria-label="Filter by Capacity"
                  value={
                    (table
                      .getColumn("max_occupancy")
                      ?.getFilterValue() as string) ?? ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    table
                      .getColumn("max_occupancy")
                      ?.setFilterValue(value === "" ? null : value); // Send null if empty
                  }}
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-[#101828] border border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow-none focus:ring-2 focus:ring-blue-500 focus:border-[#0785CF]"
                >
                  <option value="">All Capacities</option>
                  {GUEST_CAPACITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Second row: Price Filter */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:gap-2 space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-[120px]">
                  <label
                    htmlFor="min_price"
                    className="text-sm font-medium text-gray-700 dark:text-[#98A2B3]"
                  >
                    Min Price (USD)
                  </label>
                  <Input
                    id="min_price"
                    type="number"
                    placeholder="e.g. 50"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="mt-1 w-full bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow-none focus:ring-2 focus:ring-blue-500 focus:border-[#0785CF] transition-all dark:placeholder:text-[#5D636E]"
                    min="0"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label
                    htmlFor="max_price"
                    className="text-sm font-medium text-gray-700 dark:text-[#98A2B3]"
                  >
                    Max Price (USD)
                  </label>
                  <Input
                    id="max_price"
                    type="number"
                    placeholder="e.g. 300"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="mt-1 w-full bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow-none focus:ring-2 focus:ring-blue-500 focus:border-[#0785CF] transition-all dark:placeholder:text-[#5D636E]"
                    min="0"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    const minVal = parseFloat(minPrice);
                    const maxVal = parseFloat(maxPrice);
                    if (!isNaN(minVal) || !isNaN(maxVal)) {
                      setPriceRangeFilter(
                        `${!isNaN(minVal) ? minVal : MIN_PRICE}-${
                          !isNaN(maxVal) ? maxVal : MAX_PRICE
                        }`
                      );
                    } else {
                      setPriceRangeFilter("");
                    }
                  }}
                  className="bg-[#0785CF] hover:bg-[#0785CF]/90 shadow-none"
                >
                  Apply Price
                </Button>
                {/* Clear Price Button */}
                {priceRangeFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPriceRangeFilter(""); // This will trigger the useEffect to clear inputs
                    }}
                    className="text-[#0785CF] dark:text-[#0785CF] hover:text-[#0785CF] dark:hover:text-[#0785CF] shadow-none"
                  >
                    Clear Price
                  </Button>
                )}
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
                        room(s). This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-100 dark:bg-[#171F2F] hover:bg-gray-200 dark:hover:bg-[#1C2433] text-gray-700 dark:text-[#D0D5DD] rounded-lg border-none">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
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
                    className="gap-2 bg-white dark:bg-[#101828] dark:text-[#D0D5DD] border-gray-200 dark:border-[#1D2939] rounded-md shadow-none"
                  >
                    <Columns3Icon size={16} /> View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-md shadow-none"
                >
                  <DropdownMenuLabel className="text-gray-900 dark:text-[#D0D5DD] font-semibold">
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
                        className="capitalize text-gray-700 dark:text-[#D0D5DD] hover:bg-[#D6EEF9] dark:hover:bg-[#1C2433]"
                      >
                        {c.id.replace(/_/g, " ")}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isRefetching || isLoadingData} // Use combined loading state
                className="gap-2 bg-white dark:bg-[#101828] dark:text-[#D0D5DD] border-gray-200 dark:border-[#1D2939] rounded-md shadow-none"
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
                    className="h-10 w-10 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-full shadow-none"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-md shadow-none"
                >
                  <DropdownMenuItem
                    onClick={handleExport}
                    disabled={isExporting}
                    className="gap-2 text-gray-700 dark:text-[#D0D5DD] hover:bg-indigo-50 dark:hover:bg-[#1C2433]"
                  >
                    {isExporting ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#0785CF]" />
                    ) : (
                      <TbFileTypeCsv className="h-5 w-5 text-emerald-600" />
                    )}
                    <span>
                      {isExporting ? "Exporting..." : "Export to CSV"}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm font-semibold text-gray-700 dark:text-[#98A2B3]">
                Active Filters:
              </span>
              {activeFilters.map((filter, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2 bg-[#D6EEF9] dark:bg-[#162142] border border-[#B4E6F5]200 dark:border-[#B4E6F5]900 text-blue-800 dark:text-[#7592FF] shadow-none"
                >
                  {filter.label}
                  <button
                    onClick={filter.onClear}
                    className="rounded-full hover:bg-[#B4E6F<｜place▁holder▁no▁797｜>] dark:hover:bg-blue-800/50 p-0.5"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <span
                className="text-[#0785CF] block text-sm font-medium cursor-pointer hover:text-[#0785CF] dark:text-[#0785CF] dark:hover:text-[#0785CF] h-auto p-1.5"
                onClick={clearFilters}
              >
                Clear All
              </span>
            </div>
          )}

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
              <TableBody className="pt-4">
                {isLoadingData ? ( // Use combined loading state
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
                      className="border-b border-gray-200 dark:border-b-[#1D2939] hover:bg-indigo-50/30 dark:hover:bg-[#1C2433] transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
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
                      No rooms found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-4 mt-6">
            <div className="flex-1 text-sm text-gray-600 dark:text-[#98A2B3]">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center text-sm font-medium text-gray-700 dark:text-[#98A2B3]">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount() || 1} {/* Handle zero pages */}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-none hover:bg-indigo-50 dark:hover:bg-[#1C2433] hover:border-indigo-300"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()} // Use table state
                >
                  <ChevronFirstIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
                </Button>
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-none hover:bg-indigo-50 dark:hover:bg-[#1C2433] hover:border-indigo-300"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()} // Use table state
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
                </Button>
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-none hover:bg-indigo-50 dark:hover:bg-[#1C2433] hover:border-indigo-300"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()} // Use table state
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
                </Button>
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-none hover:bg-indigo-50 dark:hover:bg-[#1C2433] hover:border-indigo-300"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()} // Use table state
                >
                  <ChevronLastIcon className="h-5 w-5 text-gray-600 dark:text-[#98A2B3]" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Reusable Sub-components ---
const SortableHeader = ({
  column,
  children,
  className,
}: {
  column: any;
  children: React.ReactNode;
  className?: string;
}) => {
  const isSorted = column.getIsSorted();

  return (
    <div
      className={cn(
        "flex items-center gap-2 cursor-pointer select-none",
        className
      )}
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      {isSorted === "desc" ? (
        <ChevronDownIcon
          size={16}
          className="text-[#1D2939] dark:text-[#D0D5DD]"
        />
      ) : (
        <ChevronUpIcon
          size={16}
          className={cn(
            isSorted === "asc"
              ? "text-[#1D2939] dark:text-[#D0D5DD]"
              : "text-gray-600 dark:text-[#98A2B3]"
          )}
        />
      )}
    </div>
  );
};

function RowActions({
  row,
  deleteRoomMutation,
}: {
  row: Row<Room>;
  deleteRoomMutation: any;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const roomStatus = row.original.availability_status;

  const updateStatusMutation = useMutation({
    mutationFn: ({
      roomId,
      status,
    }: {
      roomId: string;
      status: "Available" | "Booked" | "Maintenance";
    }) =>
      hotelClient.patch(`/rooms/${roomId}/`, { availability_status: status }),
    onSuccess: (_, variables) => {
      toast.success(`Room marked as ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["hotelDetails"] });
    },
    onError: (error: any) => {
      toast.error(
        `Failed to update status: ${
          error.response?.data?.detail || error.message
        }`
      );
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-center">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full hover:bg-indigo-100 dark:hover:bg-[#1C2433] text-gray-600 dark:text-[#98A2B3]"
            aria-label="Room actions"
          >
            <EllipsisIcon size={18} aria-hidden="true" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      {/* --- MODIFIED RowActions (View Details item removed) --- */}
      <DropdownMenuContent
        align="end"
        className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-lg shadow-none"
      >
        <DropdownMenuGroup>
          {roomStatus !== "Available" && (
            <DropdownMenuItem
              onClick={() =>
                updateStatusMutation.mutate({
                  roomId: row.original.id,
                  status: "Available",
                })
              }
              className="gap-2 text-gray-700 dark:text-[#D0D5DD] hover:bg-indigo-50 dark:hover:bg-[#1C2433]"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Mark as Available</span>
            </DropdownMenuItem>
          )}
          {roomStatus !== "Booked" && (
            <DropdownMenuItem
              onClick={() =>
                updateStatusMutation.mutate({
                  roomId: row.original.id,
                  status: "Booked",
                })
              }
              className="gap-2 text-gray-700 dark:text-[#D0D5DD] hover:bg-indigo-50 dark:hover:bg-[#1C2433]"
            >
              <BookCheck className="h-5 w-5 text-amber-600" />
              <span>Mark as Booked</span>
            </DropdownMenuItem>
          )}
          {roomStatus !== "Maintenance" && (
            <DropdownMenuItem
              onClick={() =>
                updateStatusMutation.mutate({
                  roomId: row.original.id,
                  status: "Maintenance",
                })
              }
              className="gap-2 text-gray-700 dark:text-[#D0D5DD] hover:bg-indigo-50 dark:hover:bg-[#1C2433]"
            >
              <Wrench className="h-5 w-5 text-rose-600" />
              <span>Mark as Maintenance</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="dark:bg-[#1D2939]" />
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
                This will permanently delete the room '{row.original.code}'.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-100 dark:bg-[#171F2F] hover:bg-gray-200 dark:hover:bg-[#1C2433] text-gray-700 dark:text-[#D0D5DD] rounded-lg border-none">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                onClick={() => deleteRoomMutation.mutate(row.original.id)}
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
