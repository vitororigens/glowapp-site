"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import ProfileDropdown from "@/components/ProfileDropdown";

import "../../styles/bootstrap.css";
import "../../styles/globals.css";
import "../../styles/global.css";
import "../../styles/style-theme.css";
import "../../styles/style-theme-responsive.css";

import { AuthProvider } from "@/context/AuthContext";

import { Cursor } from "@/components/Cursor";
import StyledComponentsRegistry from "../registry";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { href: "/dashboard", label: "Home" },
    { href: "/dashboard/agenda", label: "Agenda" },
    { href: "/dashboard/clientes", label: "Clientes" },
    { href: "/dashboard/servicos", label: "Serviços" },
    { href: "/dashboard/servicos/novo", label: "Novo Serviço" },
    { href: "/dashboard/procedimentos", label: "Procedimentos" },
    { href: "/dashboard/profissionais", label: "Profissionais" },
    { href: "/dashboard/financeiro", label: "Financeiro" },
  ];

  return (
    <html lang="pt">
      <body>
        <AuthProvider>
          <StyledComponentsRegistry>
            <div className="min-h-screen bg-gray-100">
              {/* Sidebar */}
              <aside
                className={cn(
                  "fixed left-0 top-0 z-40 h-screen w-64 transform bg-white transition-transform duration-200 ease-in-out",
                  !sidebarOpen && "-translate-x-full"
                )}
              >
                <div className="flex h-16 items-center justify-between border-b px-4">
                  <h1 className="text-xl font-bold">Dashboard</h1>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
                  >
                    <MenuIcon className="h-6 w-6" />
                  </button>
                </div>
                <nav className="space-y-1 p-4">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </aside>

              {/* Main content */}
              <div
                className={cn(
                  "transition-margin duration-200 ease-in-out",
                  sidebarOpen ? "lg:ml-64" : ""
                )}
              >
                <header className="fixed top-0 z-30 w-full bg-white shadow">
                  <div className="flex h-16 items-center justify-between px-4">
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="rounded-lg p-2 hover:bg-gray-100"
                    >
                      <MenuIcon className="h-6 w-6" />
                    </button>
                    <ProfileDropdown />
                  </div>
                </header>
                <main className="container mx-auto px-4 pt-20">{children}</main>
              </div>
            </div>
            <Cursor />
            <ToastContainer />
          </StyledComponentsRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
