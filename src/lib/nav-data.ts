// src/lib/nav-data.ts
import { Bed, PieChart, Circle } from "lucide-react"; // <-- Import Circle icon
import { FiUserCheck } from "react-icons/fi";
import { MdOutlineInventory2 } from "react-icons/md";
import { BsGrid } from "react-icons/bs";
import { RiHotelLine } from "react-icons/ri";
import { HiOutlineTicket } from "react-icons/hi2";
import { MdPayment } from "react-icons/md";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { BiSupport } from "react-icons/bi";

export const navData = {
  // The user object that was missing
  user: {
    name: "Dotenv",
    email: "rootdotenv@safaripro.com",
    avatar: "/avatars/shadcn.jpg",
  },

  // Main navigation items for the hotel dashboard
  navMain: [
    { title: "Main Overview", icon: BsGrid, url: "hotel/hotel-details" },
    {
      title: "Hotel Management",
      icon: RiHotelLine,
      items: [
        { title: "Hotel Features", url: "/hotel/hotel-features", icon: Circle },
        { title: "Hotel Gallery", url: "/hotel/hotel-gallery", icon: Circle },
      ],
    },
    {
      title: "Bookings",
      icon: HiOutlineTicket,
      items: [
        { title: "New Booking", url: "/bookings/new-booking", icon: Circle },
        { title: "All Bookings", url: "/bookings/all-bookings", icon: Circle },
      ],
    },
    {
      title: "Rooms",
      icon: Bed,
      items: [
        { title: "New Room", url: "/rooms/new-room", icon: Circle },
        { title: "Hotel Rooms", url: "/rooms/hotel-rooms", icon: Circle },
        { title: "Room Types", url: "/rooms/room-types", icon: Circle },
        {
          title: "Availability Calendar",
          url: "/rooms/available-rooms-by-date",
          icon: Circle,
        },
        {
          title: "Room Allocations",
          url: "/rooms/allocate-rooms",
          icon: Circle,
        },
      ],
    },
    {
      title: "Reservations",
      icon: FiUserCheck,
      items: [
        { title: "Checked-in", url: "/reservations/checkin", icon: Circle },
        { title: "Checked-Out", url: "/reservations/checkout", icon: Circle },
        {
          title: "Cancelled Bookings",
          url: "/reservations/cancelled-bookings",
          icon: Circle,
        },
      ],
    },
    {
      title: "House Keeping",
      icon: MdOutlineInventory2,
      items: [
        {
          title: "Departments",
          url: "/house-keeping/departments",
          icon: Circle,
        },
        {
          title: "Inventory Categories",
          url: "/house-keeping/inventory-categories",
          icon: Circle,
        },
        {
          title: "Inventory Items",
          url: "/house-keeping/inventory-items",
          icon: Circle,
        },
        {
          title: "Event Spaces Types",
          url: "/house-keeping/event-space-types",
          icon: Circle,
        },
        {
          title: "Event Spaces",
          url: "/house-keeping/event-spaces",
          icon: Circle,
        },
      ],
    },
    {
      title: "Billings & Payments",
      icon: MdPayment,
      items: [
        { title: "Wallet", url: "/billings/wallet", icon: Circle },
        { title: "Payouts", url: "/billings/payouts", icon: Circle },
        { title: "Charges", url: "/billings/charges", icon: Circle },
        { title: "Invoices", url: "/billings/invoices", icon: Circle },
      ],
    },
  ],
  // Support links that you wanted to keep
  supportLinks: [
    { title: "Analytics", icon: PieChart, url: "/analytics" },
    {
      title: "Reports",
      icon: HiOutlineDocumentReport,
      url: "/reports",
    },
    {
      title: "Support",
      icon: BiSupport,
      url: "https://web.safaripro.net/privacy-policy/support",
    },
  ],
};
