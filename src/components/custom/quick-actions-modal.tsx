// src/components/custom/quick-actions-modal.tsx
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CgMenuGridO } from "react-icons/cg";
import { LuTicketCheck } from "react-icons/lu";
import { Bed, Receipt } from "lucide-react";
import { FiUserCheck } from "react-icons/fi";
import { MdOutlineInventory2 } from "react-icons/md";
import { IoAdd } from "react-icons/io5";

const quickActions = [
  {
    label: "New Booking",
    url: "/bookings/new-booking",
    icon: LuTicketCheck,
    color: "bg-[#D6EEF9] text-[#0785CF]",
  },
  {
    label: "Available Rooms",
    url: "/rooms/available-rooms",
    icon: Bed,
    color: "bg-green-100 text-green-600",
  },
  {
    label: "Invoices",
    url: "/billings/invoices",
    icon: Receipt,
    color: "bg-[#D6EEF9] text-[#0785CF]",
  },
  {
    label: "Check-ins",
    url: "/reservations/checkin",
    icon: FiUserCheck,
    color: "bg-[#D6EEF9] text-[#0785CF]",
  },
  {
    label: "Inventory",
    url: "/house-keeping/inventory-items",
    icon: MdOutlineInventory2,
    color: "bg-[#D6EEF9] text-[#0785CF]",
  },
  {
    label: "New Rooms",
    url: "/rooms/new-room",
    icon: IoAdd,
    color: "bg-[#D6EEF9] text-[#0785CF]",
  },
];

export function QuickActionsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <CgMenuGridO className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#FFFC] border-none rounded-none">
        <DialogHeader>
          <DialogTitle>Quick Actions</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 pt-4">
          {quickActions.map((action) => (
            <Link
              to={action.url}
              key={action.label}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center"
            >
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full mb-2 ${action.color}`}
              >
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-gray-700">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
