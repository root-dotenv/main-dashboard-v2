// src/pages/billings/wallet.tsx
"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Loader2,
  Plus,
  Edit,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { IoRefreshOutline } from "react-icons/io5";
import ErrorPage from "@/components/custom/error-page";
import billingClient from "@/api/billing-client";
import { StatCard } from "@/components/custom/StatCard";
import { useAuthStore } from "@/store/auth.store";
import { useHotel } from "@/providers/hotel-provider";
import type {
  VendorAccount,
  PaginatedResponse,
  CreateVendorAccountRequest,
  UpdateVendorAccountRequest,
} from "@/types/billing-types";

// --- Helper Functions ---
const getAccountStatusBadgeClasses = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-700/60";
    case "suspended":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-400 dark:border-red-700/60";
    case "pending_verification":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-700/60";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
};

const formatCurrency = (amount: string, currency: string = "USD"): string => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(numAmount);
};

// --- Styling Constants ---
const inputBaseClass =
  "bg-white dark:bg-[#171F2F] border border-[#DADCE0] dark:border-[#1D2939] dark:text-[#D0D5DD] dark:placeholder:text-[#5D636E] rounded-lg shadow-none h-10 px-3 py-2 text-sm";

// --- Wallet Form Component ---
function WalletFormSheet({
  wallet,
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading,
  vendorId,
}: {
  wallet: VendorAccount | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateVendorAccountRequest | UpdateVendorAccountRequest) => void;
  isLoading: boolean;
  vendorId: string | undefined;
}) {
  const [formData, setFormData] = useState<CreateVendorAccountRequest>({
    vendor_id: vendorId || "",
    bussiness_name: "",
    account_status: "active",
    currency: "USD",
    commission_rate: "",
    minimum_payout: "",
    transaction_type: "ONLINE",
    notes: "",
    tags: {},
  });

  useEffect(() => {
    if (wallet) {
      setFormData({
        vendor_id: wallet.vendor_id,
        bussiness_name: wallet.bussiness_name,
        account_status: wallet.account_status,
        currency: wallet.currency || "USD",
        commission_rate: wallet.commission_rate || "",
        minimum_payout: wallet.minimum_payout || "",
        transaction_type: wallet.transaction_type || "ONLINE",
        notes: wallet.notes || "",
        tags: wallet.tags || {},
      });
    } else {
      setFormData({
        vendor_id: vendorId || "",
        bussiness_name: "",
        account_status: "active",
        currency: "USD",
        commission_rate: "",
        minimum_payout: "",
        transaction_type: "ONLINE",
        notes: "",
        tags: {},
      });
    }
  }, [wallet, isOpen, vendorId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] p-0 flex flex-col">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-b-[#1D2939] bg-[#F9FAFB] dark:bg-[#101828]">
            <SheetTitle className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
              {wallet ? "Edit Wallet" : "Create New Wallet"}
            </SheetTitle>
            <SheetDescription className="text-sm text-gray-600 dark:text-[#98A2B3] mt-1">
              {wallet
                ? "Update the wallet details."
                : "Create a new wallet for online or physical bookings."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <Label htmlFor="bussiness_name" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bussiness_name"
                  value={formData.bussiness_name}
                  onChange={(e) => setFormData({ ...formData, bussiness_name: e.target.value })}
                  required
                  className={inputBaseClass}
                  placeholder="Enter business name"
                  maxLength={200}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transaction_type" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                    Transaction Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.transaction_type || "ONLINE"}
                    onValueChange={(value: "ONLINE" | "PHYSICAL") =>
                      setFormData({ ...formData, transaction_type: value })
                    }
                  >
                    <SelectTrigger className={inputBaseClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
                      <SelectItem value="ONLINE">Online Bookings</SelectItem>
                      <SelectItem value="PHYSICAL">Physical Bookings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="account_status" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                    Account Status
                  </Label>
                  <Select
                    value={formData.account_status || "active"}
                    onValueChange={(value: "active" | "suspended" | "pending_verification") =>
                      setFormData({ ...formData, account_status: value })
                    }
                  >
                    <SelectTrigger className={inputBaseClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                    Currency
                  </Label>
                  <Select
                    value={formData.currency || "USD"}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className={inputBaseClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="TZS">TZS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="commission_rate" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                    Commission Rate (%)
                  </Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.01"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                    className={inputBaseClass}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="minimum_payout" className="text-sm font-medium text-gray-700 dark:text-[#D0D5DD] mb-2 block">
                  Minimum Payout
                </Label>
                <Input
                  id="minimum_payout"
                  type="number"
                  step="0.01"
                  value={formData.minimum_payout}
                  onChange={(e) => setFormData({ ...formData, minimum_payout: e.target.value })}
                  className={inputBaseClass}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-t-[#1D2939] bg-white dark:bg-[#101828] flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-lg shadow-none border-gray-300 dark:border-[#1D2939] text-gray-700 dark:text-[#D0D5DD] hover:bg-gray-50 dark:hover:bg-[#171F2F]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-lg shadow-none bg-[#0785CF] hover:bg-[#0670B0] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {wallet ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  wallet ? "Update Wallet" : "Create Wallet"
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// --- Main Component ---
export default function Wallet() {
  const queryClient = useQueryClient();
  const { hotelId } = useAuthStore();
  const { hotel } = useHotel();
  const vendorId = hotel?.vendor_id;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<VendorAccount | null>(null);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("All");

  // --- Stats Queries ---
  const { data: allWalletsStats } = useQuery({
    queryKey: ["walletStats", hotelId, vendorId, "all"],
    queryFn: async () => {
      const response = await billingClient.get("/vendor-accounts", {
        params: { vendor_id: vendorId, limit: 1 },
      });
      return { count: response.data.count || 0 };
    },
    enabled: !!hotelId && !!vendorId,
  });

  const { data: onlineWalletsStats } = useQuery({
    queryKey: ["walletStats", hotelId, vendorId, "online"],
    queryFn: async () => {
      const response = await billingClient.get("/vendor-accounts", {
        params: { vendor_id: vendorId, transaction_type: "ONLINE", limit: 1 },
      });
      return { count: response.data.count || 0 };
    },
    enabled: !!hotelId && !!vendorId,
  });

  const { data: physicalWalletsStats } = useQuery({
    queryKey: ["walletStats", hotelId, vendorId, "physical"],
    queryFn: async () => {
      const response = await billingClient.get("/vendor-accounts", {
        params: { vendor_id: vendorId, transaction_type: "PHYSICAL", limit: 1 },
      });
      return { count: response.data.count || 0 };
    },
    enabled: !!hotelId && !!vendorId,
  });

  // --- Data Query ---
  const {
    data: paginatedResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<PaginatedResponse<VendorAccount>>({
    queryKey: [
      "vendorAccounts",
      hotelId,
      vendorId,
      transactionTypeFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        vendor_id: vendorId || "",
      });

      if (transactionTypeFilter !== "All") {
        params.append("transaction_type", transactionTypeFilter);
      }

      const response = await billingClient.get("/vendor-accounts", { params });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    enabled: !!hotelId && !!vendorId,
  });

  // --- Mutations ---
  const createWalletMutation = useMutation({
    mutationFn: (data: CreateVendorAccountRequest) =>
      billingClient.post("/vendor-accounts", data),
    onSuccess: () => {
      toast.success("Wallet created successfully!");
      queryClient.invalidateQueries({ queryKey: ["vendorAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["walletStats"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Creation failed"
        : error instanceof Error ? error.message : "Creation failed";
      toast.error(`Failed to create wallet: ${errorMessage}`);
    },
  });

  const updateWalletMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVendorAccountRequest }) =>
      billingClient.patch(`/vendor-accounts/${id}/`, data),
    onSuccess: () => {
      toast.success("Wallet updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["vendorAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["walletStats"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Update failed"
        : error instanceof Error ? error.message : "Update failed";
      toast.error(`Failed to update wallet: ${errorMessage}`);
    },
  });

  const requestPayoutMutation = useMutation({
    mutationFn: (accountId: string) =>
      billingClient.post(`/vendor-accounts/${accountId}/request-payout`),
    onSuccess: () => {
      toast.success("Payout request submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["vendorAccounts"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (error as Error).message || "Payout request failed"
        : error instanceof Error ? error.message : "Payout request failed";
      toast.error(`Failed to request payout: ${errorMessage}`);
    },
  });

  // --- Computed Variables ---
  const wallets = paginatedResponse?.results ?? [];

  // Calculate total balances
  const totalBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance || "0"), 0);
  const totalPending = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.pending_amount || "0"), 0);
  const totalEarnings = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.total_earnings || "0"), 0);

  // Separate wallets by transaction type
  const onlineWallets = wallets.filter((w) => w.transaction_type === "ONLINE");
  const physicalWallets = wallets.filter((w) => w.transaction_type === "PHYSICAL");

  // --- Stats Data ---
  const stats = [
    {
      title: "Total Wallets",
      count: allWalletsStats?.count || 0,
      icon: WalletIcon,
      isLoading: isLoading,
    },
    {
      title: "Online Wallets",
      count: onlineWalletsStats?.count || 0,
      icon: CreditCard,
      isLoading: isLoading,
    },
    {
      title: "Physical Wallets",
      count: physicalWalletsStats?.count || 0,
      icon: DollarSign,
      isLoading: isLoading,
    },
  ];

  if (isError) {
    return <ErrorPage error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101828]">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 shadow-none">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-[#D0D5DD]">
                Wallet
              </h1>
              <p className="text-sm text-gray-600 dark:text-[#98A2B3] mt-1">
                Manage your vendor account wallets for online and physical bookings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="rounded-lg shadow-none"
              >
                <IoRefreshOutline
                  className={cn(
                    "h-4 w-4 mr-2",
                    isRefetching && "animate-spin"
                  )}
                />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingWallet(null);
                  setIsFormOpen(true);
                }}
                className="rounded-lg shadow-none bg-[#0785CF] hover:bg-[#0670B0]"
                disabled={!vendorId}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Form Sheet */}
      <WalletFormSheet
        wallet={editingWallet}
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingWallet(null);
        }}
        onSubmit={(data) => {
          if (editingWallet) {
            updateWalletMutation.mutate({ id: editingWallet.id, data });
          } else {
            if (!vendorId) {
              toast.error("Vendor ID is not available. Please ensure you have a valid hotel.");
              return;
            }
            createWalletMutation.mutate({
              ...data as CreateVendorAccountRequest,
              vendor_id: vendorId,
            });
          }
          setIsFormOpen(false);
          setEditingWallet(null);
        }}
        isLoading={
          createWalletMutation.isPending || updateWalletMutation.isPending
        }
        vendorId={vendorId}
      />

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              count={stat.count}
              isLoading={stat.isLoading}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* Balance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-6 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-[#98A2B3]">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-[#D0D5DD] mt-1">
                  {formatCurrency(String(totalBalance), wallets[0]?.currency || "USD")}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <WalletIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-6 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-[#98A2B3]">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-[#D0D5DD] mt-1">
                  {formatCurrency(String(totalPending), wallets[0]?.currency || "USD")}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-6 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-[#98A2B3]">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-[#D0D5DD] mt-1">
                  {formatCurrency(String(totalEarnings), wallets[0]?.currency || "USD")}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-4 shadow-none">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
              <SelectTrigger className={cn(inputBaseClass, "w-full sm:w-[200px]")}>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Wallets</SelectItem>
                <SelectItem value="ONLINE">Online Bookings</SelectItem>
                <SelectItem value="PHYSICAL">Physical Bookings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Online Wallets */}
          {onlineWallets.length > 0 && (
            <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-6 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#D0D5DD] flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Online Bookings Wallet
                </h2>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400">
                  ONLINE
                </Badge>
              </div>
              {onlineWallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  onEdit={() => {
                    setEditingWallet(wallet);
                    setIsFormOpen(true);
                  }}
                  onRequestPayout={() => requestPayoutMutation.mutate(wallet.id)}
                  isLoadingPayout={requestPayoutMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Physical Wallets */}
          {physicalWallets.length > 0 && (
            <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-6 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#D0D5DD] flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Physical Bookings Wallet
                </h2>
                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-400">
                  PHYSICAL
                </Badge>
              </div>
              {physicalWallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  onEdit={() => {
                    setEditingWallet(wallet);
                    setIsFormOpen(true);
                  }}
                  onRequestPayout={() => requestPayoutMutation.mutate(wallet.id)}
                  isLoadingPayout={requestPayoutMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {wallets.length === 0 && !isLoading && (
            <div className="col-span-2 bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-12 shadow-none text-center">
              <WalletIcon className="h-12 w-12 text-gray-400 dark:text-[#98A2B3] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#D0D5DD] mb-2">
                No wallets found
              </h3>
              <p className="text-sm text-gray-600 dark:text-[#98A2B3] mb-4">
                Create your first wallet to start managing your account balance.
              </p>
              <Button
                onClick={() => {
                  setEditingWallet(null);
                  setIsFormOpen(true);
                }}
                className="rounded-lg shadow-none bg-[#0785CF] hover:bg-[#0670B0]"
                disabled={!vendorId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Wallet
              </Button>
            </div>
          )}
        </div>

        {/* Wallets Table */}
        {wallets.length > 0 && (
          <div className="bg-white dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-lg shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-b-[#1D2939] bg-gray-50 dark:bg-[#101828]/90">
                    <TableHead className="h-12 px-6 py-3 text-left font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3]">
                      Business Name
                    </TableHead>
                    <TableHead className="h-12 px-6 py-3 text-left font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3]">
                      Type
                    </TableHead>
                    <TableHead className="h-12 px-6 py-3 text-right font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3]">
                      Balance
                    </TableHead>
                    <TableHead className="h-12 px-6 py-3 text-right font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3]">
                      Pending
                    </TableHead>
                    <TableHead className="h-12 px-6 py-3 text-right font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3]">
                      Earnings
                    </TableHead>
                    <TableHead className="h-12 px-6 py-3 text-left font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3]">
                      Status
                    </TableHead>
                    <TableHead className="h-12 px-6 py-3 text-center font-semibold text-[13px] uppercase tracking-wide text-[#667085] dark:text-[#98A2B3]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-[#0785CF]" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    wallets.map((wallet) => (
                      <TableRow
                        key={wallet.id}
                        className="border-b border-gray-200 dark:border-b-[#1D2939] hover:bg-indigo-50/30 dark:hover:bg-[#1C2433]"
                      >
                        <TableCell className="px-6 py-4 text-gray-700 dark:text-[#D0D5DD]">
                          <div className="font-medium">{wallet.bussiness_name}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            className={cn(
                              "rounded-full px-3 py-1 font-medium border shadow-none",
                              wallet.transaction_type === "ONLINE"
                                ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400"
                                : "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-400"
                            )}
                          >
                            {wallet.transaction_type || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-[#D0D5DD]">
                          {formatCurrency(wallet.balance, wallet.currency)}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right text-yellow-600 dark:text-yellow-400">
                          {formatCurrency(wallet.pending_amount, wallet.currency)}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right text-green-600 dark:text-green-400">
                          {formatCurrency(wallet.total_earnings, wallet.currency)}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            className={cn(
                              "rounded-full px-3 py-1 font-medium border shadow-none",
                              getAccountStatusBadgeClasses(wallet.account_status)
                            )}
                          >
                            {wallet.account_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setEditingWallet(wallet);
                                      setIsFormOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 text-[#0785CF]" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Wallet</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => requestPayoutMutation.mutate(wallet.id)}
                                    disabled={requestPayoutMutation.isPending || parseFloat(wallet.balance) < parseFloat(wallet.minimum_payout || "0")}
                                  >
                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Request Payout</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Wallet Card Component ---
function WalletCard({
  wallet,
  onEdit,
  onRequestPayout,
  isLoadingPayout,
}: {
  wallet: VendorAccount;
  onEdit: () => void;
  onRequestPayout: () => void;
  isLoadingPayout: boolean;
}) {
  const canRequestPayout = parseFloat(wallet.balance) >= parseFloat(wallet.minimum_payout || "0");

  return (
    <div className="border border-gray-200 dark:border-[#1D2939] rounded-lg p-4 mb-4 last:mb-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-[#D0D5DD]">{wallet.bussiness_name}</h3>
          <p className="text-sm text-gray-600 dark:text-[#98A2B3]">{wallet.currency}</p>
        </div>
        <Badge
          className={cn(
            "rounded-full px-3 py-1 font-medium border shadow-none",
            getAccountStatusBadgeClasses(wallet.account_status)
          )}
        >
          {wallet.account_status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600 dark:text-[#98A2B3]">Available Balance</p>
          <p className="text-lg font-bold text-gray-900 dark:text-[#D0D5DD]">
            {formatCurrency(wallet.balance, wallet.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-[#98A2B3]">Pending</p>
          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
            {formatCurrency(wallet.pending_amount, wallet.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-[#98A2B3]">Total Earnings</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(wallet.total_earnings, wallet.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-[#98A2B3]">Min. Payout</p>
          <p className="text-lg font-bold text-gray-900 dark:text-[#D0D5DD]">
            {formatCurrency(wallet.minimum_payout, wallet.currency)}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex-1 rounded-lg shadow-none"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          size="sm"
          onClick={onRequestPayout}
          disabled={isLoadingPayout || !canRequestPayout}
          className="flex-1 rounded-lg shadow-none bg-[#0785CF] hover:bg-[#0670B0] disabled:opacity-50"
        >
          {isLoadingPayout ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ArrowUpRight className="h-4 w-4 mr-2" />
          )}
          Request Payout
        </Button>
      </div>
    </div>
  );
}

