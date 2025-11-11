// src/routes/index.tsx
import { ThemeProvider } from "@/providers/theme-provider";
import { createBrowserRouter, Outlet, useRouteError } from "react-router-dom";
import DashboardLayout from "@/components/layout/dashboard-layout";
import MainHomePage from "@/pages/main-homepage";
import { ProtectedRoute, PublicRoute } from "./protected-routes";
import HotelRooms from "@/pages/rooms/hotel-rooms";
import RoomDetailsPage from "@/pages/rooms/room-details";
import AllBookings from "@/pages/bookings/all-bookings";
import AvailableRoomsByDate from "@/pages/rooms/available-rooms-date";
import AllocateRooms from "@/pages/rooms/allocate-rooms";
import AllocationDetailsPage from "@/pages/rooms/allocation-details-page";
import NewRoom from "@/pages/rooms/new-room";
import RoomTypesTabController from "@/pages/rooms/room-types/RoomTypesTabController";
import AuthenticationPage from "@/pages/authentication/authentication-page";
import MakeBookingPage from "@/pages/bookings/make-booking";
import BookingDetailsPage from "@/pages/bookings/booking-details";
import CheckedInGuests from "@/pages/reservation/checked-in";
import CheckedOutGuests from "@/pages/reservation/checked-out";
import ComingSoon from "@/pages/error/coming-soon";
import HotelFeaturesLayout from "@/pages/hotel-features/hotel-features";
import HotelDepartments from "@/pages/inventory/hotel-departments";
import InventoryItems from "@/pages/inventory/inventory-items";
import InventoryCategories from "@/pages/inventory/inventory-categories";
import EventSpaces from "@/pages/inventory/event-spaces";
import EventSpaceTypes from "@/pages/inventory/event-space-types";
import MainOverview from "@/pages/hotel/hotel-details";
import CustomizeHotel from "@/pages/hotel/customize-hotel/HotelCustomizationPage";
import HotelGallery from "@/pages/hotel/gallery/hotel-gallery";
import DataLoadingError from "@/pages/error/application-error-page";
import Payouts from "@/pages/billings/payouts";
import Charges from "@/pages/billings/charges";
import Invoices from "@/pages/billings/invoices";
import UserProfilePage from "@/pages/authentication/user-profile";
import CancelledBookings from "../pages/reservation/cancelled-bookings";
import Wallet from "@/pages/billings/wallet";

const RootLayout = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="hotel-management-theme">
      <Outlet />
    </ThemeProvider>
  );
};

const RootErrorElement = () => {
  const error = useRouteError() as Error;
  return (
    <DataLoadingError
      error={error}
      title="An Application Error Occurred"
      subtitle="Something went wrong. Please try refreshing the page or return to the dashboard."
    />
  );
};

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RootErrorElement />,
    children: [
      {
        element: <PublicRoute />,
        children: [
          {
            path: "/login",
            element: <AuthenticationPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/",
            element: <DashboardLayout />,
            children: [
              { index: true, element: <MainHomePage /> },
              { path: "profile", element: <UserProfilePage /> },
              { path: "hotel/hotel-details", element: <MainOverview /> },
              {
                path: "hotel/customize-hotel",
                element: <CustomizeHotel />,
              },
              {
                path: "hotel/hotel-gallery",
                element: <HotelGallery />,
              },
              { path: "bookings/new-booking", element: <MakeBookingPage /> },
              { path: "bookings/:booking_id", element: <BookingDetailsPage /> },
              { path: "rooms/hotel-rooms", element: <HotelRooms /> },
              {
                path: "rooms/available-rooms-by-date",
                element: <AvailableRoomsByDate />,
              },
              { path: "rooms/:room_id", element: <RoomDetailsPage /> },
              { path: "rooms/allocate-rooms", element: <AllocateRooms /> },
              {
                path: "rooms/allocations/:allocation_id",
                element: <AllocationDetailsPage />,
              },
              {
                path: "rooms/new-room",
                element: <NewRoom />,
              },
              { path: "rooms/room-types", element: <RoomTypesTabController /> },
              { path: "bookings/all-bookings", element: <AllBookings /> },
              { path: "reservations/checkin", element: <CheckedInGuests /> },
              { path: "reservations/checkout", element: <CheckedOutGuests /> },
              {
                path: "analytics",
                element: (
                  <ComingSoon
                    title="Analytics"
                    description="Our Analytics dashboard is currently under construction. Stay tuned!"
                  />
                ),
              },
              {
                path: "reports",
                element: (
                  <ComingSoon
                    title="Reports"
                    description="Our Reporting tools are currently under construction. Stay tuned!"
                  />
                ),
              },
              {
                path: "reservations/cancelled-bookings",
                element: <CancelledBookings />,
              },
              {
                path: "hotel/hotel-features",
                element: <HotelFeaturesLayout />,
              },
              {
                path: "house-keeping/departments",
                element: <HotelDepartments />,
              },
              {
                path: "house-keeping/inventory-categories",
                element: <InventoryCategories />,
              },
              {
                path: "house-keeping/inventory-items",
                element: <InventoryItems />,
              },
              {
                path: "house-keeping/event-space-types",
                element: <EventSpaceTypes />,
              },
              {
                path: "house-keeping/event-spaces",
                element: <EventSpaces />,
              },
              { path: "billings/Payouts", element: <Payouts /> },
              { path: "billings/Charges", element: <Charges /> },
              { path: "billings/Invoices", element: <Invoices /> },
              { path: "billings/wallet", element: <Wallet /> },
            ],
          },
        ],
      },
    ],
  },
]);
