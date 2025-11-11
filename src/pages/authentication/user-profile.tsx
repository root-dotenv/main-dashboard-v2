// src/pages/authentication/user-profile.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuthStore } from "../../store/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  User,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const passwordSchema = yup.object({
  current_password: yup.string().min(1, "Current password is required"),
  new_password: yup
    .string()
    .min(8, "New password must be at least 8 characters"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("new_password")], "New passwords do not match"),
});
type PasswordFormData = yup.InferType<typeof passwordSchema>;

const profileSchema = yup.object({
  first_name: yup.string().min(1, "First name is required"),
  last_name: yup.string().min(1, "Last name is required"),
  middle_name: yup.string().optional(),
  phone_number: yup.string().min(10, "A valid phone number is required"),
  email: yup.string().email("Please enter a valid email address"),
  date_of_birth: yup.string().required("Date of birth is required"),
});
type ProfileFormData = yup.InferType<typeof profileSchema>;

const ProfileDetail = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-start py-4 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center gap-4 w-full">
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-[#0485CF] dark:text-sky-400">
          {icon}
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </dt>
        <dd className="text-base text-gray-900 font-medium truncate">
          {value || <span className="text-gray-400 italic">Not set</span>}
        </dd>
      </div>
    </div>
  </div>
);

type ProfileTab = "personal" | "security";

const PersonalInfoTab = () => {
  const { userProfile, updateUserProfile, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      first_name: userProfile?.first_name || "",
      last_name: userProfile?.last_name || "",
      middle_name: userProfile?.middle_name || "",
      phone_number: userProfile?.phone_number || "",
      email: userProfile?.email || "",
      date_of_birth: userProfile?.date_of_birth
        ? format(new Date(userProfile.date_of_birth), "yyyy-MM-dd")
        : "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      const formattedProfile = {
        ...userProfile,
        date_of_birth: userProfile.date_of_birth
          ? format(new Date(userProfile.date_of_birth), "yyyy-MM-dd")
          : "",
      };
      reset(formattedProfile);
    }
  }, [userProfile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    const success = await updateUserProfile(data);
    if (success) setIsEditing(false);
  };

  return (
    <Card className="shadow-none border-gray-200 dark:border-gray-700">
      <CardHeader
        // --- Task 2: Responsive Card Header ---
        className="flex flex-col md:flex-row justify-between md:items-center p-6 px-3 md:px-6"
      >
        <div className="mb-4 md:mb-0">
          <CardTitle>Personal Information</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Update your profile details. Please confirm your information before
            saving changes.
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="w-full md:w-auto"
          >
            Edit Profile
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6 px-3 md:px-6 pt-0">
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" {...register("first_name")} />
                {errors.first_name && (
                  <p className="text-red-500 text-sm">
                    {errors.first_name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" {...register("last_name")} />
                {errors.last_name && (
                  <p className="text-red-500 text-sm">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="middle_name">Middle Name (Optional)</Label>
              <Input id="middle_name" {...register("middle_name")} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input id="phone_number" {...register("phone_number")} />
              {errors.phone_number && (
                <p className="text-red-500 text-sm">
                  {errors.phone_number.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register("date_of_birth")}
              />
              {errors.date_of_birth && (
                <p className="text-red-500 text-sm">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  reset();
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !isDirty}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <dl className="space-y-2">
            <ProfileDetail
              label="Full Name"
              value={`${userProfile?.first_name || ""} ${
                userProfile?.middle_name || ""
              } ${userProfile?.last_name || ""}`}
              icon={<User className="w-5 h-5" />}
            />
            <ProfileDetail
              label="Email Address"
              value={userProfile?.email}
              icon={<Mail className="w-5 h-5" />}
            />
            <ProfileDetail
              label="Phone Number"
              value={userProfile?.phone_number}
              icon={<Phone className="w-5 h-5" />}
            />
            <ProfileDetail
              label="Date of Birth"
              value={
                userProfile?.date_of_birth
                  ? format(new Date(userProfile.date_of_birth), "PPP")
                  : undefined
              }
              icon={<Calendar className="w-5 h-5" />}
            />
          </dl>
        )}
      </CardContent>
    </Card>
  );
};

const PasswordStrengthIndicator = ({
  password = "",
}: {
  password?: string;
}) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;

  const StrengthBar = ({
    level,
    active,
  }: {
    level: number;
    active: boolean;
  }) => (
    <div
      className={`h-1 flex-1 rounded-full ${
        active
          ? [
              "bg-gradient-to-r from-red-500 to-red-400",
              "bg-gradient-to-r from-orange-500 to-orange-400",
              "bg-gradient-to-r from-orange-500 to-orange-400",
              "bg-gradient-to-r from-green-500 to-green-400",
              "bg-gradient-to-r from-green-500 to-green-400",
            ][level - 1]
          : "bg-gray-200"
      }`}
    />
  );

  const strengthText = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][
    strength
  ];

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1.5">
        <StrengthBar level={1} active={strength >= 1} />
        <StrengthBar level={2} active={strength >= 2} />
        <StrengthBar level={3} active={strength >= 3} />
        <StrengthBar level={4} active={strength >= 4} />
      </div>
      {password && strength > 0 && (
        <p className="text-xs font-medium text-gray-500">{strengthText}</p>
      )}
    </div>
  );
};

const SecurityTab = () => {
  const { changePassword, isLoading } = useAuthStore();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [formData, setFormData] = useState<PasswordFormData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
  });

  const onFormValidationSuccess = (data: PasswordFormData) => {
    setFormData(data);
    setIsAlertOpen(true);
  };

  const handlePasswordChange = async () => {
    if (!formData) return;

    const success = await changePassword({
      current_password: formData.current_password,
      new_password: formData.new_password,
    });
    if (success) {
      reset();
      setFormData(null);
      setIsAlertOpen(false);
    }
  };

  return (
    <Card className="shadow-none border-gray-200 dark:border-gray-700">
      <CardHeader className="p-6 px-3 md:px-6">
        <CardTitle className="mb-4">Change Password</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter a new, strong password. A strong password includes letters,
          numbers, and special characters.
        </p>
      </CardHeader>
      <CardContent className="p-6 px-3 md:px-6 pt-0">
        <form
          onSubmit={handleSubmit(onFormValidationSuccess)}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="current_password">Current Password</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrent ? "text" : "password"}
                {...register("current_password")}
                // --- Task 1: Add placeholder ---
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {showCurrent ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.current_password && (
              <p className="text-red-500 text-sm">
                {errors.current_password.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="new_password">New Password</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNew ? "text" : "password"}
                {...register("new_password")}
                // --- Task 1: Add placeholder ---
                placeholder="Enter a strong new password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {showNew ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-red-500 text-sm">
                {errors.new_password.message}
              </p>
            )}
            <PasswordStrengthIndicator password={watch("new_password")} />
          </div>
          <div>
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirm ? "text" : "password"}
                {...register("confirm_password")}
                // --- Task 1: Add placeholder ---
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {showConfirm ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-red-500 text-sm">
                {errors.confirm_password.message}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !isDirty}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Update Password
            </Button>
          </div>
        </form>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Changing your password will log you out immediately and redirect
                you to the login page. Do you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePasswordChange}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default function UserProfilePage() {
  const { userProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
      {/* --- Redesigned Header --- */}
      <header className="bg-white dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 pb-8 pt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 text-4xl border-4 border-white dark:border-gray-700 shadow-md">
              <AvatarFallback className="bg-sky-100 dark:bg-sky-900 text-[#0485CF] dark:text-sky-400">
                {userProfile?.first_name?.charAt(0)}
                {userProfile?.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userProfile?.first_name} {userProfile?.last_name}
                </h1>
                <Badge className="bg-sky-100 text-[#0485CF] dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-700">
                  Admin
                </Badge>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {userProfile?.email}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Account Center
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            You are logged in as an Admin. You can manage your profile here or
            start creating staff and assigning them different roles in this
            hotel.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("personal")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg text-sm transition-colors duration-200",
                  activeTab === "personal"
                    ? "bg-[#D6EEF9] text-[#0485CF] font-semibold dark:bg-[#0485CF] dark:text-white"
                    : "text-[#344055] font-medium hover:bg-gray-100 dark:text-[#D0D5DD] dark:hover:bg-[#1C2433]"
                )}
              >
                <User
                  className={cn(
                    "h-5 w-5",
                    activeTab === "personal"
                      ? "text-[#0485CF] dark:text-white"
                      : "text-[#344055] dark:text-[#D0D5DD]"
                  )}
                />{" "}
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg text-sm transition-colors duration-200",
                  activeTab === "security"
                    ? "bg-[#D6EEF9] text-[#0485CF] font-semibold dark:bg-[#0485CF] dark:text-white"
                    : "text-[#344055] font-medium hover:bg-gray-100 dark:text-[#D0D5DD] dark:hover:bg-[#1C2433]"
                )}
              >
                <Shield
                  className={cn(
                    "h-5 w-5",
                    activeTab === "security"
                      ? "text-[#0485CF] dark:text-white"
                      : "text-[#344055] dark:text-[#D0D5DD]"
                  )}
                />{" "}
                Security
              </button>
            </nav>
          </aside>
          <main className="flex-1">
            {activeTab === "personal" && <PersonalInfoTab />}
            {activeTab === "security" && <SecurityTab />}
          </main>
        </div>
      </main>
    </div>
  );
}
