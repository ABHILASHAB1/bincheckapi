"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Directory() {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchBanks = async () => {
      setLoading(true);
      try {
        // Since we are running the Next.js app locally, we fetch from the express server
        // In production, both can run on the same domain if proxied, or we use absolute URL
        const res = await fetch(`https://remitwise.fit/api/banks/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setBanks(data);
      } catch (err) {
        console.error("Failed to fetch banks", err);
      }
      setLoading(false);
    };

    const debounce = setTimeout(() => {
      fetchBanks();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <>
      <div className="bg-white py-16 sm:py-24 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl mb-6">
                  Global Bank Directory
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto font-medium">
                  Search through thousands of banks worldwide to find SWIFT codes, contact information, and routing details instantly.
              </p>
              
              <div className="mt-10 max-w-xl mx-auto relative">
                  <div className="relative flex items-center">
                      <i className="ph-bold ph-magnifying-glass absolute left-4 text-slate-400 text-xl"></i>
                      <input 
                          type="text" 
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search by Bank Name, SWIFT, Country, or Domain..." 
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-terminal focus:ring-4 focus:ring-blue-100 transition-all font-semibold shadow-sm"
                      />
                  </div>
              </div>
          </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
          <div className="flex justify-between items-end mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Search Results</h2>
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{loading ? '...' : banks.length} found</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-20 text-slate-400">
                  <i className="ph-bold ph-spinner animate-spin text-4xl"></i>
                </div>
              ) : banks.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                      <i className="ph-bold ph-magnifying-glass text-2xl text-slate-400"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No banks found</h3>
                  <p className="text-slate-500">Try adjusting your search terms.</p>
                </div>
              ) : (
                banks.map(bank => (
                  <Link href={`/bank/${bank.short_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || bank.id}`} key={bank.id} className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start justify-between mb-6">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-inner"
                          style={{ backgroundColor: bank.brand_color || '#2563EB', color: bank.brand_text_color || '#FFFFFF' }}
                        >
                            {bank.logo_url ? <img src={bank.logo_url} alt={bank.short_name} className="w-10 h-10 object-contain" /> : bank.short_name?.substring(0, 1) || 'B'}
                        </div>
                        {bank.country && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{bank.country}</span>
                        )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-terminal transition-colors line-clamp-1">{bank.official_name || bank.short_name}</h3>
                    
                    <div className="space-y-3 mt-6">
                        {bank.swift_code && (
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                              <i className="ph-fill ph-bank text-slate-400 text-lg"></i>
                              <span className="font-mono font-semibold bg-slate-50 px-2 py-0.5 rounded text-slate-800 border border-slate-200">{bank.swift_code}</span>
                          </div>
                        )}
                        {bank.website && (
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                              <i className="ph-fill ph-globe text-slate-400 text-lg"></i>
                              <span className="truncate">{bank.website.replace(/^https?:\/\//i, '')}</span>
                          </div>
                        )}
                    </div>
                  </Link>
                ))
              )}
          </div>
      </div>
    </>
  );
}
