"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState, Suspense } from "react";
import { cn } from "@/lib/utils";
import ProfileDropdown from "@/components/ProfileDropdown";
import ClientOnly from "@/components/ClientOnly";

import { AuthProvider } from "@/context/AuthContext";
import { PlanProvider } from "@/context/PlanContext";

import { Cursor } from "@/components/Cursor";
import StyledComponentsRegistry from "../registry";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { href: "/dashboard", label: "Home" },
    { href: "/dashboard/agenda", label: "Agenda" },
    { href: "/dashboard/clientes", label: "Clientes" },
    { href: "/dashboard/historicoclientes", label: "Histórico de Clientes" },
    { href: "/dashboard/servicos", label: "Serviços" },
    { href: "/dashboard/procedimentos", label: "Procedimentos" },
    { href: "/dashboard/profissionais", label: "Profissionais" },
    { href: "/dashboard/financeiro", label: "Financeiro" },
    { href: "/dashboard/planos", label: "Planos" },
    { href: "/dashboard/assinatura", label: "Minha Assinatura" },
  ];

  return (
    <ClientOnly>
      <AuthProvider>
        <PlanProvider>
          <StyledComponentsRegistry>
            <div className="min-h-screen bg-gray-100">
              {/* Overlay para mobile */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              {/* Sidebar */}
              <aside
                className={cn(
                  "fixed left-0 top-0 z-40 h-screen w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out",
                  sidebarOpen ? "translate-x-0" : "-translate-x-full",
                  "lg:translate-x-0"
                )}
              >
                <div className="flex h-16 items-center justify-between border-b px-4">
                  <h1 className="text-xl font-bold">Dashboard</h1>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
                    title="Fechar menu"
                  >
                    <MenuIcon className="h-6 w-6" />
                  </button>
                </div>
                <nav className="space-y-1 p-4 overflow-y-auto h-[calc(100vh-4rem)]">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </aside>

              {/* Conteúdo principal */}
              <div className="lg:ml-64 flex flex-col min-h-screen">
                <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 bg-white shadow">
                  <div className="flex h-16 items-center justify-between px-4">
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="rounded-lg p-2 hover:bg-gray-100"
                      title="Abrir menu"
                    >
                      <MenuIcon className="h-6 w-6" />
                    </button>
                    <div className="mr-2">
                      <ProfileDropdown />
                    </div>
                  </div>
                </header>
                <main className="flex-1 px-4 pt-20 pb-6 max-w-full overflow-x-hidden">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    }
                  >
                    {children}
                  </Suspense>
                </main>
              </div>
            </div>
            <Cursor />
            <ToastContainer />
          </StyledComponentsRegistry>
        </PlanProvider>
      </AuthProvider>
    </ClientOnly>
  );
}
