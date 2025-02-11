"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconCalendar,
  IconUsers,
  IconTools,
  IconPlus,
  IconNotes,
  IconUserPlus,
  IconWallet,
} from "@tabler/icons-react";

const menuItems = [
  { path: "/dashboard", icon: IconHome, label: "Home" },
  { path: "/agenda", icon: IconCalendar, label: "Agenda" },
  { path: "/clientes", icon: IconUsers, label: "Clientes" },
  { path: "/servicos", icon: IconTools, label: "Serviços" },
  { path: "/servicos/novo", icon: IconPlus, label: "Novo Serviço" },
  { path: "/procedimentos", icon: IconNotes, label: "Procedimentos" },
  {
    path: "/procedimentos/novo",
    icon: IconPlus,
    label: "Add Procedimento",
  },
  { path: "/profissionais", icon: IconUsers, label: "Profissionais" },
  {
    path: "/profissionais/novo",
    icon: IconUserPlus,
    label: "Add Profissional",
  },
  { path: "/financeiro", icon: IconWallet, label: "Financeiro" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={`/private${item.path}`}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                pathname === `/private${item.path}`
                  ? "bg-primary text-white hover:bg-primary/90"
                  : ""
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}