"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Receipt,
  FlaskConical,
  Bot,
  TestTube2,
  Building2,
  Bell,
  Search,
  SlidersHorizontal,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  User,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Simulation Center", href: "/simulation", icon: FlaskConical },
  { name: "AI Assistant", href: "/assistant", icon: Bot },
  { name: "Risk Engine Tests", href: "/risk-engine-tests", icon: TestTube2 },
  { name: "Merchants", href: "/merchants", icon: Building2 },
  { name: "Alerts", href: "/alerts", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-20 bg-transparent flex-col items-center py-6 px-3 justify-start gap-8 sticky top-0 h-screen shrink-0 select-none">
      {/* Brand Icon */}
      <Link href="/dashboard" className="group">
        <div className="w-12 h-12 rounded-full bg-emerald-400 text-black flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
          R
        </div>
      </Link>

      {/* Floating vertical circular icon bar */}
      <nav className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-full border border-slate-200/80 shadow-sm">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 relative group",
                isActive
                  ? "bg-black text-white shadow-md scale-105"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Icon className="w-5 h-5" />
              {/* Tooltip */}
              <span className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function Topbar() {
  const pathname = usePathname();

  return (
    <header className="py-4 px-6 flex items-center justify-between sticky top-0 z-40 bg-[#eef4f0]/90 backdrop-blur-md">
      {/* Left: Brand name + Horizontal Pill Navigation */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <h1 className="font-extrabold text-2xl tracking-tight text-slate-900">
            RiskPilot
          </h1>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Top Navigation Pills (Mobile & Desktop) */}
        <nav className="flex md:hidden lg:flex items-center gap-1.5 bg-white/80 p-1 rounded-full border border-slate-200/80 shadow-xs overflow-x-auto max-w-[200px] sm:max-w-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
                  isActive
                    ? "bg-black text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Synthetic Banner + Quick Tools + Profile */}
      <div className="flex items-center gap-3">
        {/* Synthetic Banner Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>DEMO ENVIRONMENT — SYNTHETIC DATA ONLY</span>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            title="Search"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            title="Filter"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>

        {/* Profile Avatar */}
        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
          RA
        </div>
      </div>
    </header>
  );
}
