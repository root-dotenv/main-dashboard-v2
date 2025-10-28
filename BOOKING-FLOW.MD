# Booking Flow

This document explains the booking flow in the dashboard template application. The booking process is a multi-step flow that guides the user from selecting a room to completing the booking and payment.

## Overview

The booking flow is managed by the `make-booking.tsx` component, which acts as a stepper, rendering different components for each step of the process. The state of the booking flow is managed by a Zustand store located in `src/store/booking.store.ts`.

The flow consists of 5 main steps:
1.  Select Room
2.  Guest Details
3.  Confirmation
4.  Payment (Cash or Mobile)
5.  Check-In and Finish

## 1. Select Room

-   **Component:** `src/pages/bookings/Step1_SelectRoom.tsx`
-   **Description:** The user starts by selecting the desired check-in and check-out dates. The component then fetches and displays a list of available rooms for the selected date range. The user can also filter the results by room type.
-   **Action:** When the user selects a room, the room details are saved to the booking store, and the flow proceeds to the next step.

## 2. Guest Details

-   **Component:** `src/pages/bookings/Step2_GuestDetails.tsx`
-   **Description:** The user fills out a form with the primary guest's information, including full name, email, phone number, address, and the number of guests. The user also selects a payment method: "Cash" or "Mobile".
-   **Action:** Upon submitting the form, a new booking is created in a "Processing" state via an API call to `/bookings/web-create`. The response, which includes the new booking's ID and payment reference, is saved to the store, and the flow moves to the confirmation step.

## 3. Confirmation

-   **Component:** `src/pages/bookings/Step3_ConfirmBooking.tsx`
-   **Description:** This step displays a comprehensive summary of the booking, including guest details, stay information, and a detailed pricing breakdown. The component polls an API endpoint (`/bookings/{bookingId}/currency-conversions`) to get the final amount converted to the local currency (TZS).
-   **Action:** The user reviews all the details. Clicking "Proceed to Payment" advances the flow to the payment step.

## 4. Payment

The payment step is handled by one of two components, depending on the payment method selected in Step 2.

### Mobile Payment

-   **Component:** `src/pages/bookings/Step4_MobilePayment.tsx`
-   **Description:** If the user selected "Mobile", this component is rendered. It displays the final amount in TZS and prompts the user to enter the guest's mobile number.
-   **Action:** An API request is sent to a payment gateway to initiate a mobile money transaction. The application then polls the booking status until the payment is confirmed as "Paid". Once confirmed, the flow proceeds to the final step.

### Cash Payment

-   **Component:** `src/pages/bookings/Step4_ReceivePayment copy.tsx`
-   **Description:** If the user selected "Cash", this component is rendered. It displays the total amount due in TZS.
-   **Action:** The user enters the cash amount received from the guest and confirms it. An API call is made to update the booking's payment status to "Paid". The flow then moves to the final step.

## 5. Check-In and Finish

-   **Component:** `src/pages/bookings/Step5_CheckInAndFinish.tsx`
-   **Description:** This is the final step of the booking process. It displays a booking confirmation ticket with all the relevant details and a QR code for easy access to the booking information.
-   **Action:** The user has several options:
    -   **Print Booking Ticket:** Prints the confirmation ticket.
    -   **Check-In Guest Now:** Makes an API call to `/bookings/{bookingId}/check_in` to mark the guest as checked in.
    -   **Finish & View Bookings:** Resets the booking store and navigates the user to the list of all bookings.

## State Management

-   **Store:** `src/store/booking.store.ts`
-   **Description:** A Zustand store is used to manage the state of the entire booking flow. It holds the current step number, selected dates, selected room, booking payload, and the details of the created booking. This allows for a seamless transition between steps without losing data.

## API Interaction

The booking flow interacts with several API endpoints:

-   **`hotelClient`**: Used in Step 1 to fetch room availability.
-   **`bookingClient`**: Used in Steps 2, 3, 4, and 5 to create bookings, fetch booking details, poll for updates, and perform check-ins.
-   **`paymentClient`**: Used in the Mobile Payment step to process mobile money transactions.
