"use client";
import React from "react";
import { useHotel } from "@/providers/hotel-provider";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import hotelClient from "@/api/hotel-client";
import bookingClient from "@/api/booking-client";
import { format } from "date-fns";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  CalendarCheck2,
  CalendarX2,
  AreaChart as AreaChartIcon,
  ArrowRight,
  Menu,
  Eye,
  TrendingUp,
  Users,
  Bed,
  Star,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Settings,
  GalleryHorizontal,
  Sparkles,
} from "lucide-react";
import type {
  Booking,
  PaginatedResponse,
  Amenity,
  Facility,
  Service,
  Department,
  MealType,
  Translation,
  Allocation,
  RoomType,
} from "../hotel/hotel-types";

// --- Helper Functions (Merged) ---

const getRoomTypeColor = (roomType: string) => {
  const colors = [
    "#8dd3c7",
    "#fdb462",
    "#b3de69",
    "#fccde5",
    "#d9d9d9",
    "#bc80bd",
    "#80b1d3",
  ];
  const index =
    roomType.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
};

const formatCurrency = (amount: number | string) => {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

const getBookingStatusClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "bg-green-100 text-green-800 border-green-200";
    case "checked in":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "processing":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// ADDED: Helper for dynamic progress bar colors
const getOccupancyProgressClass = (percentage: number): string => {
  if (percentage > 80) {
    return "[&>div]:bg-rose-500"; // High occupancy
  }
  if (percentage > 50) {
    return "[&>div]:bg-amber-500"; // Moderate occupancy
  }
  return "[&>div]:bg-emerald-500"; // Low occupancy
};

// --- Child Components (Merged & Updated) ---

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isLoading,
  linkTo,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  isLoading: boolean;
  linkTo?: string;
  variant?: "default" | "primary" | "success" | "warning" | "info";
}) => {
  const variants = {
    default: "bg-white border-gray-200",
    primary: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    success:
      "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200",
    warning: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
    info: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
  };
  const iconVariants = {
    default: "text-gray-600",
    primary: "text-blue-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
    info: "text-purple-600",
  };

  const cardContent = (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow group",
        variants[variant]
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600 font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div
          className={cn("p-2 rounded-lg bg-white/50", iconVariants[variant])}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        {description && <p className="text-sm text-gray-500">{description}</p>}
        {linkTo && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
            <span>View details</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Card className={variants[variant]}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }
  return linkTo ? <Link to={linkTo}>{cardContent}</Link> : cardContent;
};

const RevenueChart = ({
  data,
  isLoading,
}: {
  data: any[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Daily revenue and booking trends
              </CardDescription>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full" />
        </CardContent>
      </Card>
    );
  }
  const totalRevenue = data.reduce((sum, day) => sum + day.revenue, 0);
  const avgDaily = data.length > 0 ? totalRevenue / data.length : 0;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" /> Revenue Overview
            </CardTitle>
            <CardDescription>
              Daily revenue and booking performance
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Avg: TZS {formatCurrency(avgDaily)}/day
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value) => formatCurrency(value as number)}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const RoomDistributionChart = ({
  data,
  isLoading,
}: {
  data: any[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Room Distribution</CardTitle>
          <CardDescription>Distribution of room types.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Distribution</CardTitle>
        <CardDescription>
          Distribution of room types in your hotel.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getRoomTypeColor(entry.name)}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const RoomTypesTable = ({
  roomTypes,
  isLoading,
}: {
  roomTypes: RoomType[] | undefined;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bed className="h-5 w-5 text-indigo-600" /> Room Types Overview
      </CardTitle>
      <CardDescription>
        Detailed breakdown of room availability and occupancy
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <Skeleton className="h-5 w-32" />{" "}
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <Skeleton className="h-4 w-full" />{" "}
                <Skeleton className="h-4 w-full" />{" "}
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : roomTypes && roomTypes.length > 0 ? (
          roomTypes.map((rt) => (
            <div
              key={rt.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900">{rt.name}</h4>
                <Badge
                  variant={
                    rt.availability.occupancy_percentage > 80
                      ? "destructive"
                      : rt.availability.occupancy_percentage > 50
                      ? "secondary"
                      : "default"
                  }
                >
                  {rt.availability.occupancy_percentage.toFixed(0)}% occupied
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                <div>
                  Total:{" "}
                  <span className="font-medium text-gray-900">
                    {rt.room_counts.total}
                  </span>
                </div>
                <div>
                  Available:{" "}
                  <span className="font-medium text-emerald-600">
                    {rt.availability.available_rooms}
                  </span>
                </div>
                <div>
                  Occupied:{" "}
                  <span className="font-medium text-gray-900">
                    {rt.room_counts.total - rt.availability.available_rooms}
                  </span>
                </div>
              </div>
              {/* UPDATED: Progress bar now uses dynamic colors */}
              <Progress
                value={rt.availability.occupancy_percentage}
                className={cn(
                  "h-2",
                  getOccupancyProgressClass(
                    rt.availability.occupancy_percentage
                  )
                )}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No room types configured
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const RecentCheckIns = ({
  guests,
  isLoading,
}: {
  guests: Booking[] | undefined;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" /> Recent Check-ins
          </CardTitle>
          <CardDescription>Latest guests who have checked in</CardDescription>
        </div>
        <Button
          className="bg-none text-blue-600 border-none px-0"
          variant="outline"
          size="sm"
          asChild
        >
          <Link to="/reservations/checkin">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-3 p-3 border rounded-lg"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))
        ) : guests && guests.length > 0 ? (
          guests.map((guest) => (
            <div
              key={guest.id}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {guest.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {guest.full_name}
                </p>
                <p className="text-sm text-gray-500">
                  {guest.property_item_type}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Checked in:</div>
                <div className="text-sm font-medium text-gray-900">
                  {format(new Date(guest.start_date), "MMM dd")}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent check-ins
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const RecentAllocations = ({
  allocations,
  isLoading,
}: {
  allocations: Allocation[] | undefined;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Allocations</CardTitle>
      <CardDescription>
        A summary of the latest room blocks allocated for online bookings.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Allocation Name</TableHead>
            <TableHead>Room Type</TableHead>
            <TableHead className="text-center">Rooms</TableHead>
            <TableHead>Period</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-3/4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-2/3" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-5 w-8 mx-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : allocations && allocations.length > 0 ? (
            allocations.map((alloc) => (
              <TableRow key={alloc.id}>
                <TableCell className="font-medium">{alloc.name}</TableCell>
                <TableCell>{alloc.room_type_name}</TableCell>
                <TableCell className="text-center">
                  {alloc.total_rooms}
                </TableCell>
                <TableCell>
                  {format(new Date(alloc.start_date), "MMM dd")} -{" "}
                  {format(new Date(alloc.end_date), "MMM dd, yyyy")}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No recent allocations found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          className="bg-none text-blue-600 border-none"
          asChild
        >
          <Link to="/rooms/allocate-rooms">
            Manage Allocations <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);

const RecentBookings = ({
  bookings,
  isLoading,
}: {
  bookings: Booking[] | undefined;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Bookings</CardTitle>
      <CardDescription>A list of the most recent bookings.</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead className="hidden sm:table-cell">Room Type</TableHead>
            <TableHead className="hidden md:table-cell">Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : bookings && bookings.length > 0 ? (
            bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="font-medium">{booking.full_name}</div>
                  <div className="text-sm text-muted-foreground hidden md:inline">
                    {booking.email}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {booking.property_item_type}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(new Date(booking.start_date), "PP")} to{" "}
                  {format(new Date(booking.end_date), "PP")}
                </TableCell>
                <TableCell>
                  <Badge
                    className={getBookingStatusClass(booking.booking_status)}
                  >
                    {booking.booking_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/bookings/${booking.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">
                No recent bookings found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          className="bg-none text-blue-600 border-none px-0"
          asChild
        >
          <Link to="/bookings/all-bookings">
            View All Bookings <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);

// --- Main Overview Component ---

export default function MainOverview() {
  const { hotel, isLoading: isHotelLoading } = useHotel();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  // --- Core Data Queries ---
  const { data: checkedInData, isLoading: isCheckInLoading } = useQuery<
    PaginatedResponse<Booking>
  >({
    queryKey: ["checkedInGuests", { hotelId: hotel?.id }],
    queryFn: () =>
      bookingClient
        .get(`/bookings?booking_status=Checked In`)
        .then((res) => res.data),
    enabled: !!hotel?.id,
  });

  const { data: checkedOutData, isLoading: isCheckOutLoading } = useQuery<
    PaginatedResponse<Booking>
  >({
    queryKey: ["checkedOutGuests", { hotelId: hotel?.id, date: today }],
    queryFn: () =>
      bookingClient
        .get(`/bookings?booking_status=Checked Out&checkout_after=${today}`)
        .then((res) => res.data),
    enabled: !!hotel?.id,
  });

  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: ["revenueLast7Days", hotel?.id],
    queryFn: async () => {
      const today = new Date();
      const last7Days: { date: string; revenue: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split("T")[0];
        const res = await bookingClient.get<PaginatedResponse<Booking>>(
          `/bookings?start_date=${dateString}&end_date=${dateString}&payment_status=Paid`
        );
        const dailyRevenue = res.data.results.reduce(
          (acc, booking) => acc + parseFloat(booking.amount_paid),
          0
        );
        last7Days.push({
          date: date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue: dailyRevenue,
        });
      }
      return last7Days;
    },
    enabled: !!hotel?.id,
  });

  const { data: allocationData, isLoading: isAllocationLoading } = useQuery<
    PaginatedResponse<Allocation>
  >({
    queryKey: ["allocations", { limit: 5, hotelId: hotel?.id }],
    queryFn: () =>
      hotelClient.get(`/allocations?limit=5`).then((res) => res.data),
    enabled: !!hotel?.id,
  });

  const { data: bookingData, isLoading: isBookingLoading } = useQuery<
    PaginatedResponse<Booking>
  >({
    queryKey: ["bookings", { limit: 5, hotelId: hotel?.id }],
    queryFn: () =>
      bookingClient.get(`/bookings?limit=5`).then((res) => res.data),
    enabled: !!hotel?.id,
  });

  // --- Feature Data Queries ---
  const queries = (hotel?.amenities || []).map((id) => ({
    queryKey: ["amenity", id],
    queryFn: () =>
      hotelClient.get(`/amenities/${id}/`).then((res) => res.data as Amenity),
    enabled: !!hotel,
  }));
  const amenityQueries = useQueries({ queries });
  const facilityQueries = useQueries({
    queries: (hotel?.facilities || []).map((id) => ({
      queryKey: ["facility", id],
      queryFn: () =>
        hotelClient
          .get(`/facilities/${id}/`)
          .then((res) => res.data as Facility),
      enabled: !!hotel,
    })),
  });
  const serviceQueries = useQueries({
    queries: (hotel?.services || []).map((id) => ({
      queryKey: ["service", id],
      queryFn: () =>
        hotelClient.get(`/services/${id}/`).then((res) => res.data as Service),
      enabled: !!hotel,
    })),
  });
  const departmentQueries = useQueries({
    queries: (hotel?.department_ids || []).map((id) => ({
      queryKey: ["department", id],
      queryFn: () =>
        hotelClient
          .get(`/departments/${id}/`)
          .then((res) => res.data as Department),
      enabled: !!hotel,
    })),
  });
  const mealTypeQueries = useQueries({
    queries: (hotel?.meal_types || []).map((id) => ({
      queryKey: ["mealType", id],
      queryFn: () =>
        hotelClient
          .get(`/meal-types/${id}/`)
          .then((res) => res.data as MealType),
      enabled: !!hotel,
    })),
  });
  const translationQueries = useQueries({
    queries: (hotel?.translations || []).map((id) => ({
      queryKey: ["translation", id],
      queryFn: () =>
        hotelClient
          .get(`/translations/${id}/`)
          .then((res) => res.data as Translation),
      enabled: !!hotel,
    })),
  });

  const amenities = amenityQueries
    .filter((q) => q.isSuccess)
    .map((q) => q.data);
  const facilities = facilityQueries
    .filter((q) => q.isSuccess)
    .map((q) => q.data);
  const services = serviceQueries.filter((q) => q.isSuccess).map((q) => q.data);
  const departments = departmentQueries
    .filter((q) => q.isSuccess)
    .map((q) => q.data);
  const mealTypes = mealTypeQueries
    .filter((q) => q.isSuccess)
    .map((q) => q.data);
  const translations = translationQueries
    .filter((q) => q.isSuccess)
    .map((q) => q.data);

  const allocationsWithRoomNames = (allocationData?.results || []).map(
    (alloc) => ({
      ...alloc,
      room_type_name:
        (hotel?.room_type || []).find((rt) => rt.id === alloc.room_type)
          ?.name || "Unknown",
    })
  );

  const todaysRevenue =
    revenueData?.find(
      (d) =>
        d.date ===
        new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        })
    )?.revenue || 0;

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900/50">
      

      <main className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Stat Cards */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Occupancy Rate"
            value={`${hotel?.occupancy_rate || 0}%`}
            description={`${
              hotel?.summary_counts?.available_rooms || 0
            } rooms available`}
            icon={AreaChartIcon}
            isLoading={isHotelLoading}
            linkTo="/rooms/hotel-rooms"
            variant="primary"
          />
          <StatCard
            title="Today's Revenue (TZS)"
            value={formatCurrency(todaysRevenue)}
            description="From all paid bookings"
            icon={DollarSign}
            isLoading={isRevenueLoading}
            linkTo="/bookings/all-bookings"
            variant="success"
          />
          <StatCard
            title="Guests Checked-In"
            value={checkedInData?.count || 0}
            description="Currently in the hotel"
            icon={CalendarCheck2}
            isLoading={isCheckInLoading}
            linkTo="/reservations/checkin"
            variant="warning"
          />
          <StatCard
            title="Today's Check-outs"
            value={checkedOutData?.count || 0}
            description="Scheduled for today"
            icon={CalendarX2}
            isLoading={isCheckOutLoading}
            linkTo="/reservations/checkout"
            variant="info"
          />
        </section>

        {/* Main Dashboard Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <RevenueChart
              data={revenueData || []}
              isLoading={isRevenueLoading}
            />
            <RecentBookings
              bookings={bookingData?.results}
              isLoading={isBookingLoading}
            />
          </div>
          <div className="space-y-8">
            <RoomDistributionChart
              data={(hotel?.room_type || []).map((rt) => ({
                name: rt.name,
                total: rt.room_counts.total,
              }))}
              isLoading={isHotelLoading}
            />
            <RoomTypesTable
              roomTypes={hotel?.room_type}
              isLoading={isHotelLoading}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentCheckIns
            guests={(checkedInData?.results || []).slice(0, 5)}
            isLoading={isCheckInLoading}
          />
          <RecentAllocations
            allocations={allocationsWithRoomNames}
            isLoading={isAllocationLoading}
          />
        </section>

        {/* Navigation & Actions Section */}
        <section>
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Management Actions
              </CardTitle>
              <CardDescription>
                Quickly access key management areas of your hotel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-center">
                {[
                  {
                    title: "New Booking",
                    icon: CalendarCheck2,
                    path: "/bookings/new-booking",
                    color: "text-sky-600",
                  },
                  {
                    title: "Add New Room",
                    icon: Bed,
                    path: "/rooms/new-room",
                    color: "text-indigo-600",
                  },
                  {
                    title: "Manage Check-ins",
                    icon: Users,
                    path: "/reservations/checkin",
                    color: "text-amber-600",
                  },
                  {
                    title: "Customize Hotel",
                    icon: Settings,
                    path: "/hotel/customize-hotel",
                    color: "text-rose-600",
                  },
                  {
                    title: "Features & Services",
                    icon: Sparkles,
                    path: "/hotel/hotel-features",
                    color: "text-blue-600",
                  },
                  {
                    title: "Property Details",
                    icon: Building2,
                    path: "/hotel/customize-hotel",
                    color: "text-purple-600",
                  },
                  {
                    title: "Photo Gallery",
                    icon: GalleryHorizontal,
                    path: "/hotel/hotel-gallery",
                    color: "text-teal-600",
                  },
                ].map((action) => (
                  <button
                    key={action.title}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                  >
                    <action.icon
                      className={cn("h-8 w-8 mb-2", action.color)}
                    />
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {action.title}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
