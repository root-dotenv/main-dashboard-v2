// - - - src/pages/bookings/booking-ticket.tsx

import { useHotel } from "@/providers/hotel-provider";
import { format } from "date-fns";

interface BookingPrintTicketProps {
  booking: {
    code: string;
    full_name: string;
    email: string;
    phone_number: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    number_of_guests: number;
    microservice_item_name: string;
    booking_status: string;
    payment_status: string;
    amount_paid: string;
    address: string;
    billing_meta_data: any; // Using any for now, should be typed
  };
  roomDetails?: {
    room_type_name: string;
    code: string;
  } | null;
}

export default function BookingPrintTicket({
  booking,
  roomDetails,
}: BookingPrintTicketProps) {
  const { hotel } = useHotel();

  const safariProFee =
    booking.billing_meta_data?.charges_breakdown?.SAFARI_PRO_PROCESSING_FEE
      ?.amount || 0;
  const baseCharge =
    booking.billing_meta_data?.charges_breakdown?.BASE_CHARGE?.amount || 0;
  const subtotal = baseCharge + safariProFee;
  const vat = booking.billing_meta_data?.charges_breakdown?.TAX?.amount || 0;
  const total = subtotal + vat;

  return (
    <div className="max-w-4xl mx-auto bg-white text-black p-8">
      <div className="border border-gray-300 p-8">
        <h1 className="text-2xl font-bold text-center mb-8">TAX INVOICE</h1>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="font-bold">ISSUED BY (AS AGENT):</h2>
            <p>Kilongawima Road, Mbezi Beach,</p>
            <p>Kinondoni, Dar es Salaam, Tanzania</p>
            <p>Email: safaripro.net@gmail.com</p>
            <p>Phone: +255-754-447-387</p>
          </div>
          <div className="text-right">
            <h2 className="font-bold">ON BEHALF OF (PRINCIPAL SUPPLIER):</h2>
            <p>{hotel?.name}</p>
            <p>{hotel?.address}</p>
            <p>TIN: [Vendor's TIN Placeholder]</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="font-bold">BILLED TO:</h2>
          <p>{booking.full_name}</p>
          <p>{booking.address}</p>
          <p>{booking.email}</p>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <p>
              <span className="font-bold">INVOICE NUMBER:</span> {booking.code}
            </p>
            <p>
              <span className="font-bold">BOOKING REF:</span> {booking.code}
            </p>
          </div>
          <div className="text-right">
            <p>
              <span className="font-bold">DATE OF ISSUE:</span>{" "}
              {format(new Date(), "MMM dd, yyyy")}
            </p>
            <p>
              <span className="font-bold">STATUS:</span>{" "}
              {booking.payment_status.toUpperCase()}
            </p>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="bg-gray-200">
              <th className="text-left p-2">DESCRIPTION</th>
              <th className="text-right p-2">AMOUNT (TZS)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">
                {booking.microservice_item_name}
                <p className="text-xs text-gray-600">
                  Supplied by {hotel?.name}
                </p>
              </td>
              <td className="text-right p-2">{baseCharge.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="p-2">
                SafariPro Booking Fee
                <p className="text-xs text-gray-600">
                  Service provided by SafariPro Booking App
                </p>
              </td>
              <td className="text-right p-2">{safariProFee.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-1/2">
            <div className="flex justify-between">
              <p>SUBTOTAL:</p>
              <p>{subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p>VAT (18%):</p>
              <p>{vat.toFixed(2)}</p>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <p>TOTAL:</p>
              <p>{total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-bold">PAYMENT DETAILS:</h2>
          <p>
            Paid via {booking.payment_method} on{" "}
            {format(new Date(), "MMM dd, yyyy")}.
          </p>
        </div>

        <div className="text-xs text-gray-600 mt-8">
          <p className="font-bold">NOTES & TERMS:</p>
          <p>
            This invoice is issued by SafariPro on behalf of the supplier. All
            tour-related services are rendered by the supplier as per the terms
            and conditions agreed upon at the time of booking.
          </p>
        </div>

        <div className="text-center mt-8">
          <p className="font-bold">THANK YOU FOR BOOKING WITH SAFARIPRO!</p>
        </div>
      </div>
    </div>
  );
}
