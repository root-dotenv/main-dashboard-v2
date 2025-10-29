// src/pages/authentication/user-profile.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../../store/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "New passwords do not match",
    path: ["confirm_password"],
  });
type PasswordFormData = z.infer<typeof passwordSchema>;

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  middle_name: z.string().optional(),
  phone_number: z.string().min(10, "A valid phone number is required"),
  email: z.string().email("Please enter a valid email address"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
});
type ProfileFormData = z.infer<typeof profileSchema>;

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
    <div className="flex items-start gap-4 w-full px-2">
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#D6EEF9] flex items-center justify-center text-[#0785CF] mt-0.5">
          {icon}
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
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
    resolver: zodResolver(profileSchema),
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
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Personal Information</CardTitle>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </CardHeader>
      <CardContent>
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

const SecurityTab = () => {
  const { changePassword, isLoading } = useAuthStore();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    const success = await changePassword({
      current_password: data.current_password,
      new_password: data.new_password,
    });
    if (success) reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="current_password">Current Password</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrent ? "text" : "password"}
                {...register("current_password")}
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
          </div>
          <div>
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              {...register("confirm_password")}
            />
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
      </CardContent>
    </Card>
  );
};

export default function UserProfilePage() {
  const { userProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");

  return (
    <div className="container mx-auto py-8">
      <header className="mb-10">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 text-2xl">
            <AvatarFallback>
              {userProfile?.first_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {userProfile?.first_name} {userProfile?.last_name}
            </h1>
            <p className="text-gray-500">{userProfile?.email}</p>
          </div>
        </div>
      </header>
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("personal")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md",
                activeTab === "personal" ? "bg-gray-100" : ""
              )}
            >
              <User /> Personal Info
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md",
                activeTab === "security" ? "bg-gray-100" : ""
              )}
            >
              <Shield /> Security
            </button>
          </nav>
        </aside>
        <main className="flex-1">
          {activeTab === "personal" && <PersonalInfoTab />}
          {activeTab === "security" && <SecurityTab />}
        </main>
      </div>
    </div>
  );
}
