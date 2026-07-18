"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function BinList() {
  const [bins, setBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBins = async (pageNum = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const res = await fetch(`https://remitwise.fit/api/bins?page=${pageNum}&limit=50&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      if (pageNum === 1) {
        setBins(data);
      } else {
        setBins(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === 50);
    } catch (err) {
      console.error("Failed to fetch bins", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      fetchBins(1, query);
    }, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBins(nextPage, query);
  };

  return (
    <>
      <div className="bg-slate-50 pt-20 pb-24 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none">
            <i className="ph-fill ph-credit-card text-9xl text-terminal"></i>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Global BIN Database</h1>
                <p className="text-lg text-slate-600">Browse our extensive list of Bank Identification Numbers. Premium fields are locked—try our API to unlock full real-time data.</p>
            </div>

            {/* Search Bar */}
            <div className="mb-8 max-w-2xl mx-auto relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-terminal transition-colors">
                    <i className="ph-bold ph-magnifying-glass text-xl"></i>
                </div>
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-white text-slate-900 rounded-full py-4 pl-14 pr-32 text-lg font-medium border-2 border-slate-200 focus:outline-none focus:border-terminal focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                    placeholder="Search by BIN or Bank Name..."
                />
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-bold uppercase tracking-wider">
                                <th className="py-4 px-6">BIN</th>
                                <th className="py-4 px-6">Bank Name</th>
                                <th className="py-4 px-6">Country</th>
                                <th className="py-4 px-6 text-center">Scheme <i className="ph-fill ph-lock-key text-xs ml-1"></i></th>
                                <th className="py-4 px-6 text-center">Type <i className="ph-fill ph-lock-key text-xs ml-1"></i></th>
                                <th className="py-4 px-6 text-center">Level <i className="ph-fill ph-lock-key text-xs ml-1"></i></th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-800 text-sm font-medium">
                            {bins.map((bin) => (
                                <tr key={bin.id || bin.bin} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer">
                                    <td className="py-4 px-6">
                                        <Link href={`/bin/${bin.bin}`} className="font-mono text-terminal font-bold group-hover:underline">
                                            {bin.bin}
                                        </Link>
                                    </td>
                                    <td className="py-4 px-6 font-semibold">{bin.bank_name || 'N/A'}</td>
                                    <td className="py-4 px-6 text-slate-500">{bin.country || 'N/A'}</td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400">
                                            <i className="ph-bold ph-lock-key text-sm"></i>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400">
                                            <i className="ph-bold ph-lock-key text-sm"></i>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400">
                                            <i className="ph-bold ph-lock-key text-sm"></i>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <i className="ph-bold ph-spinner animate-spin text-3xl"></i>
                                    </td>
                                </tr>
                            )}
                            {!loading && bins.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                                            <i className="ph-bold ph-magnifying-glass text-xl text-slate-400"></i>
                                        </div>
                                        <h3 className="text-slate-900 font-bold mb-1">No BINs found</h3>
                                        <p className="text-slate-500 text-sm">Try adjusting your search criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {!loading && hasMore && bins.length > 0 && (
                <div className="mt-8 text-center">
                    <button 
                        onClick={loadMore}
                        className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-3 rounded-full font-bold hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Load More Results
                    </button>
                </div>
            )}
        </div>
      </div>
    </>
  );
}
