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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, Suspense, useEffect } from "react";
import { createPortal } from "react-dom";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { GlobalFilterModal } from "./GlobalFilterModal";

const NAV_ITEMS: any[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Simulation Center", href: "/simulation", icon: FlaskConical },
  // { name: "AI Assistant", href: "/assistant", icon: Bot }, // Temporarily disabled, save for later
  { name: "Risk Engine Tests", href: "/risk-engine-tests", icon: TestTube2 },
  { name: "Merchants", href: "/merchants", icon: Building2 },
  { name: "Alerts", href: "/alerts", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();

  // Temporarily hidden sidebar as requested by user
  return null;
  /*
  return (
    <aside className="hidden md:flex w-20 bg-transparent flex-col items-center py-6 px-3 justify-start gap-8 sticky top-0 h-screen shrink-0 select-none">
      {/* Floating vertical circular icon bar *\/}
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
              {/* Tooltip *\/}
              <span className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
  */
}

export function Topbar() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="py-4 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 bg-[#eef4f0]/90 backdrop-blur-md">
      {/* Left: Mobile Hamburger + Brand name + Horizontal Pill Navigation */}
      <div className="flex items-center gap-4 sm:gap-6">
        
        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden w-10 h-10 flex items-center justify-center bg-white rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">
            RiskPilot
          </h1>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Top Navigation Pills (Desktop Only) */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-white/80 p-1 rounded-full border border-slate-200/80 shadow-xs">
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
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Synthetic Banner Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>DEMO ENVIRONMENT — SYNTHETIC DATA ONLY</span>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            title="Search"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFilterOpen(true)}
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
        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs ml-1 sm:ml-0 shrink-0">
          RA
        </div>
      </div>

      {/* Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <Suspense fallback={null}>
        <GlobalFilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      </Suspense>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] md:hidden flex items-start">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-sm bg-[#eef4f0] h-[100dvh] shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-6 flex items-center justify-between shrink-0">
              <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">RiskPilot</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-full transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all",
                      isActive ? "bg-black text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-emerald-400" : "text-slate-400")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-6 shrink-0 mt-auto">
              <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-amber-800 leading-tight">DEMO ENVIRONMENT</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
