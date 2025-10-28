# Project Summary: Hotel Management Dashboard

This document provides a high-level overview of the Hotel Management Dashboard application, detailing its architecture, core functionalities, and the technologies it employs.

## 1. Core Purpose

The application is a comprehensive, web-based dashboard designed for hotel staff to manage reservations and guest information efficiently. It provides a modern, responsive interface for viewing, creating, and managing various aspects of hotel operations, with a primary focus on the booking lifecycle.

## 2. Technology Stack

The project is built on a modern frontend stack, ensuring a high-quality developer and user experience.

- **Framework:** [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/)) for building the user interface.
- **Language:** [TypeScript](https://www.typescriptlang.org/) for static typing, improving code quality and maintainability.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) for a utility-first styling approach, complemented by [shadcn/ui](https://ui.shadcn.com/) for a pre-built, accessible, and themeable component library.
- **Data Fetching & State Management:**
  - **[TanStack Query (React Query)](https://tanstack.com/query/latest):** Manages all asynchronous operations, including data fetching, caching, and server state synchronization. This is central to the application's data handling, providing features like automatic refetching and mutation management.
  - **[Zustand](https://zustand-demo.pmnd.rs/):** Used for global client-side state management, such as storing authentication details and the current hotel context.
- **Routing:** [React Router](https://reactrouter.com/) handles all client-side navigation within the application.
- **API Client:** [Axios](https://axios-http.com/) is used for making HTTP requests to the backend APIs, wrapped in a `bookingClient` instance for centralized configuration.

## 3. Application Architecture & Key Concepts

The application is structured around a component-based architecture and communicates with a microservices-based backend.

### Backend Interaction

The frontend interacts with at least two distinct backend microservices, as evidenced by the different base URLs used for API calls:

- **Booking Service (`https://booking.safaripro.net/api/v1/`):** Handles all booking-related operations, such as fetching bookings, creating new ones, checking guests in/out, and deleting records.
- **Hotel Service (`http://hotel.safaripro.net/api/v1/`):** Manages hotel-specific data, such as room details and amenities.

This separation indicates a scalable backend architecture where different domains of the business logic are handled by specialized services.

### Data Flow

1.  **Authentication & Context:** The application uses a `useAuthStore` (Zustand) to manage the user's authentication state and the `hotelId`. A `useHotel` provider makes the current hotel's details available throughout the component tree.
2.  **Data Fetching:** Components use the `useQuery` hook from TanStack Query to fetch data. A unique query key (e.g., `['bookings', hotelId, filters]`) is used to identify and cache the data. This key includes dependencies like filters and pagination state, so the data is automatically refetched when they change.
3.  **Data Display:** The powerful `@tanstack/react-table` library is used to render data in robust, feature-rich tables. These tables support pagination, sorting, and filtering, with the table state being managed by React state and seamlessly integrated with the `useQuery` hook.
4.  **Data Mutation:** Actions that modify server data (like creating, updating, or deleting a booking) are handled by the `useMutation` hook. This hook provides a clear pattern for handling loading states, success notifications (using `sonner`), and error handling. Upon a successful mutation, `queryClient.invalidateQueries` is called to refetch and update the relevant data tables.

## 4. Core Features & File Breakdown

The application's functionality is organized into distinct pages, primarily within the `/src/pages` directory.

### Booking Management

- **`all-bookings.tsx`:** This is the central hub for viewing all bookings.

  - It features statistical cards at the top for a quick overview (Total, Online, Walk-in).
  - It includes tabs to filter bookings by type and provides advanced filtering for status, payment, and amount.
  - The table in this component allows staff to perform key actions like **Check In** (for "Confirmed" bookings) and **Delete**.

- **`checked-in.tsx`:** A specialized view showing only guests who are currently checked in.

  - The data is filtered by `booking_status: "Checked In"`.
  - The primary action here is the **Check Out** button, which triggers a `POST` request to the `/check_out` endpoint for a specific booking.

- **`checked-out.tsx`:** A historical view of guests who have completed their stay.

  - The data is filtered by `booking_status: "Completed"`.
  - This view is primarily for reference and allows for deleting old records.

- **`booking-details.tsx`:** Provides a detailed, read-only view of a single booking.
  - It aggregates data from both the **Booking Service** (guest and payment details) and the **Hotel Service** (room details and amenities).
  - It features an **Edit** functionality, which opens a side panel (`Sheet`) containing the `EditBookingForm` to modify booking details.
  - It also includes a **Print Ticket** feature, which renders a print-friendly `BookingPrintTicket` component.

### Component Reusability

The project demonstrates strong component reusability and adherence to the DRY (Don't Repeat Yourself) principle.

- **Tables:** The table structure, including sortable headers (`SortableHeader`), pagination controls, and action menus (`RowActions`), is highly consistent across `all-bookings.tsx`, `checked-in.tsx`, and `checked-out.tsx`.
- **UI Components:** `shadcn/ui` components (`Button`, `Card`, `Badge`, `AlertDialog`, etc.) are used consistently to maintain a uniform design language.
- **Styling:** Utility classes for common styles (e.g., `focusRingClass`, `inputBaseClass`) are defined and reused.
- **Hooks:** A custom `useDebounce` hook is used to prevent excessive API calls while the user is typing in search fields.

## 5. Development Conventions

As outlined in `GEMINI.md`, the project follows strict development conventions:

- **Resilient Component Design:** Components are designed to handle loading and error states gracefully, typically showing skeleton loaders or an error component (`ErrorPage`) to prevent the UI from crashing.
- **Styling and Theming:** A well-defined design system for both light and dark modes ensures visual consistency.
- **State Management:** A clear separation exists between server state (managed by TanStack Query) and client state (managed by Zustand).

This structured approach makes the application robust, maintainable, and scalable.
