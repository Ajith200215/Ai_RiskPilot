"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Receipt, User, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    transactions: any[];
    customers: any[];
    merchants: any[];
  } | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  // Debounced Search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (res.ok) {
          setResults(data);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen || !mounted) return null;

  const totalResults = results
    ? results.transactions.length + results.customers.length + results.merchants.length
    : 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 px-4 bg-transparent">
      {/* Click away overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions, customers, or merchants..."
            className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-base font-medium"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-2" />}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length > 0 && query.trim().length < 2 && (
            <div className="p-6 text-center text-slate-500 text-sm">
              Type at least 2 characters to search...
            </div>
          )}

          {results && totalResults === 0 && (
            <div className="p-10 text-center text-slate-500 flex flex-col items-center">
              <Search className="w-10 h-10 text-slate-300 mb-3" />
              <p className="font-medium text-slate-700">No results found</p>
              <p className="text-sm">We couldn't find anything matching "{query}"</p>
            </div>
          )}

          {results && totalResults > 0 && (
            <div className="p-2 space-y-4">
              {/* Transactions */}
              {results.transactions.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5" /> Transactions
                  </h3>
                  <div className="space-y-1 mt-1">
                    {results.transactions.map((tx) => (
                      <button
                        key={tx.id}
                        onClick={() => {
                          onClose();
                          router.push(`/transactions/${tx.id}`);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="font-mono text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                            {tx.id}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {tx.customer?.name} • {tx.merchant?.name}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {results.customers.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Customers
                  </h3>
                  <div className="space-y-1 mt-1">
                    {results.customers.map((cust) => (
                      <button
                        key={cust.id}
                        onClick={() => {
                          onClose();
                          router.push(`/customers/${cust.id}`);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                            {cust.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {cust.email}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Merchants */}
              {results.merchants.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Merchants
                  </h3>
                  <div className="space-y-1 mt-1">
                    {results.merchants.map((merchant) => (
                      <button
                        key={merchant.id}
                        onClick={() => {
                          onClose();
                          router.push(`/merchants/${merchant.id}`);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                            {merchant.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {merchant.category}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <div>Search across the entire RiskPilot database</div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-400 font-sans shadow-sm">ESC</kbd> to close
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
