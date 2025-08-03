"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserDropdown from "@/components/UserDropdown";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      // In a real application, you would fetch the user's profile image URL here
      // For now, we'll use a placeholder or assume it's part of the session
      if (session.user.image) {
        setProfileImage(session.user.image);
      }
      setLoading(false);
    }
  }, [session, status, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // In a real application, you would upload this file to a storage service (e.g., S3)
      // and then update the user's profile image URL in the database.
      // For demonstration, we'll just display a preview.
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setProfileImage(loadEvent.target?.result as string);
        // Here you would typically call an API to save the new image URL
        // Example: saveProfileImage(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img src="/trace_logo.png" alt="TRACE" className="h-8 w-8 mr-2" />
              </Link>
              <span className="ml-4 text-gray-600 dark:text-gray-300">Profile</span>
            </div>
            <nav className="flex space-x-4 items-center">
              <Link
                href="/editor"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Practice Editor
              </Link>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Home
              </Link>
              <UserDropdown />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Your Profile</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</p>
              <p className="text-lg text-gray-900 dark:text-white">{session?.user?.name || "Not Set"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
              <p className="text-lg text-gray-900 dark:text-white">{session?.user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</p>
              <p className="text-lg text-gray-900 dark:text-white capitalize">{session?.user?.role?.toLowerCase()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Image</h2>
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.997A11.998 11.998 0 0112 12c2.037 0 3.843.684 5.337 1.838A11.998 11.998 0 0124 20.993zM12 0C7.589 0 4 3.589 4 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8z" />
                </svg>
              )}
            </div>
            <label htmlFor="profileImageInput" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Upload Image
              <input
                type="file"
                id="profileImageInput"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>
      </main>
    </div>
  );
} 