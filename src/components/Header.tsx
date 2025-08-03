"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import UserDropdown from "./UserDropdown";
import { UserRole } from "@prisma/client";

const navLinks = [
  { name: "Dashboard", href: (role: UserRole) => (role === "PROFESSOR" ? "/professor" : "/student") },
  { name: "Assignments", href: () => "/assignments" },
  { name: "Messages", href: () => "/messaging" },
  { name: "Discussions", href: () => "/discussions" },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img src="/trace_logo.png" alt="TRACE" className="h-8 w-8 mr-2" />
              <span className="text-2xl font-bold text-[#222e3e]">TRACE</span>
            </Link>
          </div>
          {session && (
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => {
                const href = link.href(userRole);
                const isActive = pathname === href;
                return (
                  <Link
                    key={link.name}
                    href={href}
                    className={`font-medium text-sm transition-colors ${
                      isActive
                        ? "text-[#222e3e] dark:text-white"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          )}
          <div className="flex items-center">
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
} 