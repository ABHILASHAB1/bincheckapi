import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Smartphone, RefreshCw, Trash2, Pause, Play, 
  Eye, EyeOff, Search, Filter, Hash, Lock, Globe, Key,
  ChevronRight, ArrowUpRight, AlertTriangle, Database
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export default function TokenLifecycleScreen() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [detokenizedPan, setDetokenizedPan] = useState(null);
  const [isDetokenizing, setIsDetokenizing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: 'SELECT * FROM tokens ORDER BY created_at DESC LIMIT 50' })
      });
      const data = await res.json();
      if (data.results) {
        setTokens(data.results);
      }
    } catch (e) {
      console.error('Failed to fetch tokens', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLifecycle = async (token, action) => {
    setActionLoading(token + action);
    try {
      const res = await fetch(`/api/v1/tokens/${token}/lifecycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'DELETE') {
          setTokens(tokens.filter(t => t.token !== token));
          if (selectedToken?.token === token) setSelectedToken(null);
        } else {
          setTokens(tokens.map(t => t.token === token ? { ...t, status: data.status } : t));
          if (selectedToken?.token === token) setSelectedToken({ ...selectedToken, status: data.status });
        }
      }
    } catch (e) {
      alert('Lifecycle update failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDetokenize = async (token) => {
    setIsDetokenizing(true);
    setDetokenizedPan(null);
    try {
      const res = await fetch(`/api/v1/tokens/${token}/detokenize`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDetokenizedPan(data);
      } else {
        alert(data.error || 'Detokenization failed');
      }
    } catch (e) {
      alert('Detokenization failed');
    } finally {
      setIsDetokenizing(false);
    }
  };

  const filteredTokens = tokens.filter(t => 
    t.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cardholder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.masked_pan.includes(searchTerm)
  );

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#030305]">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 mb-3">
            <Smartphone size={12} />
            <span>Enterprise TSP Simulator</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center tracking-tight">
            Token Lifecycle Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage digital wallet tokens, emv cryptograms, and secure vault mappings.</p>
        </div>

        <div className="flex items-center space-x-3">
           <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">TSP Status</div>
              <div className="text-sm text-white font-mono flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 ACTIVE
              </div>
           </div>
           <button 
             onClick={fetchTokens}
             className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-400 transition-all active:scale-95"
           >
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Token List */}
        <div className="flex-1 flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="Search by Token ID, Name or Masked PAN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all shadow-2xl"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500 animate-pulse">
                Syncing Token Registry...
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600">
                <Database size={48} className="opacity-20 mb-4" />
                <p>No tokens found in vault.</p>
              </div>
            ) : (
              filteredTokens.map(token => (
                <div 
                  key={token.id}
                  onClick={() => { setSelectedToken(token); setDetokenizedPan(null); }}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden
                    ${selectedToken?.token === token.token 
                      ? 'bg-indigo-500/10 border-indigo-500/30' 
                      : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                        ${token.scheme === 'MADA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-white font-mono">{token.token}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase
                            ${token.status === 'SUSPENDED' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {token.status || 'ACTIVE'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">
                          {token.masked_pan} • {token.cardholder_name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleLifecycle(token.token, token.status === 'SUSPENDED' ? 'RESUME' : 'SUSPEND'); }}
                         className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-all active:scale-95"
                       >
                         {actionLoading === token.token + (token.status === 'SUSPENDED' ? 'RESUME' : 'SUSPEND') 
                           ? <RefreshCw size={16} className="animate-spin" />
                           : token.status === 'SUSPENDED' ? <Play size={16} /> : <Pause size={16} />}
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); if(confirm('Purge token?')) handleLifecycle(token.token, 'DELETE'); }}
                         className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-500 transition-all active:scale-95"
                       >
                         <Trash2 size={16} />
                       </button>
                       <ChevronRight className={`text-gray-600 transition-transform ${selectedToken?.token === token.token ? 'rotate-90 text-indigo-400' : ''}`} size={20} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Token Details & Detokenizer */}
        <div className="w-[420px] flex flex-col space-y-6">
          <div className="glass-panel rounded-3xl border border-white/10 p-8 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative overflow-hidden flex-1">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Smartphone size={160} />
             </div>

             {selectedToken ? (
               <div className="h-full flex flex-col relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-lg font-bold text-white">Token Metadata</h3>
                     <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-mono text-gray-400">
                        {selectedToken.scheme} NETWORK
                     </div>
                  </div>

                  <div className="space-y-6 flex-1">
                     <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Digital Token ID</label>
                        <div className="text-xl font-mono text-white break-all leading-tight">{selectedToken.token}</div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Masked Funding PAN</label>
                           <div className="text-sm font-mono text-white mt-1">{selectedToken.masked_pan}</div>
                        </div>
                        <div>
                           <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Expiration</label>
                           <div className="text-sm font-mono text-white mt-1">{selectedToken.expiry_month}/{selectedToken.expiry_year}</div>
                        </div>
                     </div>

                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-2">
                              <Lock size={14} className="text-indigo-400" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detokenization Engine</span>
                           </div>
                           {isDetokenizing && <RefreshCw size={12} className="animate-spin text-indigo-400" />}
                        </div>

                        {detokenizedPan ? (
                           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                              <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                                 <div className="text-[9px] text-indigo-400 font-bold uppercase mb-1">Cleartext PAN (Authorized)</div>
                                 <div className="text-lg font-mono text-white tracking-widest">{detokenizedPan.pan}</div>
                              </div>
                              <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                                 <div className="text-[9px] text-purple-400 font-bold uppercase mb-1">TAVV Cryptogram (Dynamic)</div>
                                 <div className="text-xs font-mono text-white break-all">{detokenizedPan.cryptogram}</div>
                              </div>
                           </div>
                        ) : (
                           <button 
                             onClick={() => handleDetokenize(selectedToken.token)}
                             disabled={isDetokenizing || selectedToken.status === 'SUSPENDED'}
                             className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2"
                           >
                             <Key size={14} />
                             <span>Verify & Detokenize</span>
                           </button>
                        )}
                        {selectedToken.status === 'SUSPENDED' && (
                           <div className="flex items-center justify-center space-x-2 text-[10px] text-red-400 font-bold bg-red-400/5 p-2 rounded-lg">
                              <AlertTriangle size={12} />
                              <span>TOKEN SUSPENDED - DETOKENIZATION BLOCKED</span>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                     <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-gray-500 uppercase tracking-widest">Created On</span>
                        <span className="text-gray-400">{new Date(selectedToken.created_at).toLocaleString()}</span>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-700 border border-white/5">
                     <Smartphone size={40} />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-white">Select a Token</h4>
                     <p className="text-xs text-gray-500 mt-2">Pick a digital token from the registry to view its lifecycle metadata and test the TSP translation engine.</p>
                  </div>
               </div>
             )}
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/5">
             <div className="flex items-center space-x-3 mb-4">
                <Globe size={18} className="text-emerald-400" />
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TSP Network Distribution</h4>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                   <span className="text-gray-500">mada Pay (Domestic)</span>
                   <span className="text-white font-mono">{tokens.filter(t => t.scheme === 'MADA').length}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: `${(tokens.filter(t => t.scheme === 'MADA').length / (tokens.length || 1)) * 100}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs mt-4">
                   <span className="text-gray-500">Apple/Google Pay (Intl)</span>
                   <span className="text-white font-mono">{tokens.filter(t => t.scheme !== 'MADA').length}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500" style={{ width: `${(tokens.filter(t => t.scheme !== 'MADA').length / (tokens.length || 1)) * 100}%` }}></div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
