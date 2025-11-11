// src/pages/bookings/booking-types.ts

// --- (Keep existing interfaces: AvailabilityStatus, AvailableRoom, etc.) ---

export interface AvailabilityStatus {
  date: string;
  availability_status: "Available" | "Booked" | "Maintenance";
}

export interface AvailableRoom {
  room_id: string;
  room_code: string;
  room_type_id: string;
  room_type_name: string;
  bed_type: string;
  price_per_night: number;
  availability: AvailabilityStatus[];
}

export interface AvailabilityRangeResponse {
  hotel_id: string;
  room_type_id: string | null;
  start_date: string;
  end_date: string;
  rooms: AvailableRoom[];
}

export interface RoomImage {
  id: string;
  url: string;
}

export interface RoomAmenity {
  id: string;
  name: string;
  icon: string;
}

export interface DetailedRoom {
  id: string;
  hotel_name: string;
  room_type_name: string;
  images: RoomImage[];
  amenities: RoomAmenity[];
  description: string;
  max_occupancy: number;
  price_per_night: number;
  average_rating: string;
  review_count: number;
  code: string;
  floor_number: number;
}

// --- UPDATED: Payload type remains correct, payment_method is key ---
export interface CreateBookingPayload {
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
  amount_required: string;
  property_item_type: string;
  start_date: string;
  end_date: string;
  microservice_item_id: string;
  service_notes: string;
  number_of_children: string;
  number_of_guests: string;
  number_of_infants: string;
  booking_type: "Physical";
  booking_status: "Processing";
  special_requests: string;
  payment_method: "Cash" | "Mobile"; // Type updated to be specific
}

export interface ChargeItem {
  amount: number;
  success: boolean;
  currency: "USD";
  description: string;
  calculation_details?: any;
}

export interface BillingMetaData {
  charges_breakdown: {
    TAX?: ChargeItem;
    PENALTY?: ChargeItem;
    DISCOUNT?: ChargeItem;
    BASE_CHARGE?: ChargeItem;
    financial_scheme?: ChargeItem;
    SAFARI_PRO_PROCESSING_FEE?: ChargeItem;
    [key: string]: any;
  };
  calculation_breakdown?: {
    final_amount: number;
    [key: string]: any;
  };
  [key: string]: any;
}

// --- UPDATED: payment_method type is now more specific ---
export interface CreateBookingResponse {
  id: string;
  payment_status: "Pending";
  full_name: string;
  code: string;
  address: string;
  phone_number: number;
  email: string;
  start_date: string;
  end_date: string;
  microservice_item_id: string;
  amount_required: string;
  property_item_type: string;
  booking_status: "Processing";
  payment_method: "Cash" | "Mobile" | string; // Allow string for flexibility if API returns other methods
  created_at: string;
  updated_at: string;
  vendor_id: string;
  property_id: string;
  status_history: any[];
  billing_meta_data: BillingMetaData;
  payment_reference?: string; // Added payment_reference
}

export interface BookingDetails extends CreateBookingResponse {
  duration_days: number;
}

export interface Conversion {
  id: string;
  booking_id: string;
  original_amount: number;
  original_currency: string;
  converted_amount: number;
  converted_currency: string;
  exchange_rate: number;
  conversion_type: string;
  [key: string]: any;
}

export interface CurrencyConversionResponse {
  success: boolean;
  message: string;
  data: {
    booking: BookingDetails;
    conversions: Conversion[];
    pagination?: any;
  };
}

export interface UpdatePaymentPayload {
  booking_status: "Confirmed";
  payment_status: "Paid";
  currency_paid: "TZS";
  amount_paid: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  booking: BookingDetails & {
    checkin: string;
    booking_status: "Checked In";
    payment_status: "Paid";
  };
}

// --- NEW: Types for Mobile Payment Step ---
export interface InitiateMobilePaymentPayload {
  accountNumber: string; // Guest's phone number
  referenceId: string; // Booking's payment_reference
  amount: number; // TZS amount
}

export interface InitiateMobilePaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  pgReferenceId?: string | null;
  messageCode?: number;
  statusCode?: number | null;
}
