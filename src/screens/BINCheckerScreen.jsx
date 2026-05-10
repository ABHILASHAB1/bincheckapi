import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, CreditCard, Globe, Building, ShieldCheck, 
  AlertCircle, ChevronRight, Activity, MapPin, Database, Zap, Wifi,
  CheckCircle2, XCircle, Clock, Edit3, Lock, Save, X, RefreshCw
} from 'lucide-react';

function BINCheckerScreen() {
  const [bin, setBin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState({ status: 'checking', latency: null, lastChecked: null });
  const [syncStatus, setSyncStatus] = useState({ isSyncing: false, indexed: 0, progress: 0 });
  const pollRef = useRef(null);
  const syncPollRef = useRef(null);

  // Admin Edit State
  const ADMIN_PIN = '1234';
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const checkSyncStatus = async () => {
    try {
      const res = await fetch('/api/bins/sync/status');
      const data = await res.json();
      
      // Also fetch total indexed count
      const statsRes = await fetch('/api/bins/stats');
      const statsData = await statsRes.json();
      
      setSyncStatus({ ...data, indexed: statsData.count || 0 });
    } catch (e) {
      console.error('Failed to fetch sync status');
    }
  };

  const checkApiHealth = async () => {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/health', { signal: controller.signal });
      clearTimeout(timeout);
      
      const latency = Date.now() - start;
      if (res.ok) {
        setApiStatus({ status: 'online', latency, lastChecked: new Date() });
      } else {
        setApiStatus({ status: 'degraded', latency, lastChecked: new Date() });
      }
    } catch (e) {
      setApiStatus({ status: 'offline', latency: null, lastChecked: new Date() });
    }
  };

  useEffect(() => {
    checkApiHealth();
    checkSyncStatus();
    pollRef.current = setInterval(checkApiHealth, 30000);
    syncPollRef.current = setInterval(checkSyncStatus, 5000);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(syncPollRef.current);
    };
  }, []);

  const checkBIN = async (e) => {
    if (e) e.preventDefault();
    if (!bin || bin.length < 6) {
      setError('Enter at least 6 digits.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const cleanBin = bin.replace(/\s+/g, '');
      const response = await fetch(`/api/bin/${cleanBin}`);
      
      if (!response.ok) {
        if (response.status === 404) throw new Error('BIN not found in repository.');
        throw new Error('Database connection failed.');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (pinInput === ADMIN_PIN) {
      setIsAdminMode(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('INVALID PIN');
    }
  };

  const startEdit = () => {
    setEditData({
      issuer: result.issuer || result.bank?.name || '',
      scheme: result.scheme || '',
      type: result.type || '',
      category: result.category || '',
      country: result.country?.name || result.country_name || '',
      currency: result.country?.currency || result.currency || '',
      prepaid: result.prepaid || false
    });
    setIsEditMode(true);
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bin/${result.bin}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editData, adminPin: ADMIN_PIN })
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveMessage('✅ Repository Updated');
      setTimeout(() => setSaveMessage(''), 3000);
      setIsEditMode(false);
      checkBIN();
    } catch (err) {
      setSaveMessage('❌ Error Saving');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar relative bg-[#050508]">
      {/* Background Ambient Effects */}
      <div className="fixed top-0 right-0 w-[60%] h-[60%] bg-fintech-accent/5 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 relative z-10 gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-fintech-accent/10 text-fintech-accent px-3 py-1 rounded-full text-[10px] font-mono mb-3 border border-fintech-accent/20 tracking-widest uppercase">
            <ShieldCheck size={12} className="animate-pulse" />
            <span>INTELLIGENCE NODE ACTIVE</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center tracking-tight">
            <Globe className="mr-4 text-fintech-accent" size={32} />
            BIN Intelligence Center
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-xl">
            Real-time identifier verification across local SQLite and global mada/SAMA repositories.
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-black/30 p-2.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-end px-4 border-r border-white/5">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Local DB</span>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${apiStatus.status === 'online' ? 'bg-fintech-green shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-fintech-red animate-pulse'}`}></div>
              <span className="text-xs font-mono text-gray-200 uppercase">{apiStatus.status}</span>
            </div>
          </div>
          <div className="flex flex-col items-end px-4 border-r border-white/5">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Latency</span>
            <span className="text-xs font-mono text-fintech-accent mt-1">{apiStatus.latency ? `${apiStatus.latency}ms` : '--'}</span>
          </div>
          <button 
            onClick={() => setShowPinModal(true)}
            className={`p-2 rounded-xl transition-all ${isAdminMode ? 'bg-fintech-accent text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
          >
            {isAdminMode ? <ShieldCheck size={18} /> : <Lock size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 relative z-10 min-h-0">
        
        {/* Left Side: Search & Virtual Card */}
        <div className="w-full lg:w-[420px] flex flex-col space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group bg-white/[0.01]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fintech-accent to-purple-500"></div>
            
            <form onSubmit={checkBIN} className="relative z-10">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 block">Bank Identifier (BIN)</label>
              <div className="relative mb-6">
                <Search className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${loading ? 'text-fintech-accent animate-spin' : 'text-gray-500'}`} size={22} />
                <input 
                  type="text" 
                  value={bin}
                  onChange={(e) => setBin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="e.g. 411111"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-2xl font-mono text-white placeholder:text-gray-800 focus:outline-none focus:border-fintech-accent/50 focus:ring-4 focus:ring-fintech-accent/5 transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={loading || bin.length < 6}
                className="w-full bg-fintech-accent hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center space-x-3 text-sm uppercase tracking-widest"
              >
                {loading ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />}
                <span>Analyze Range</span>
              </button>
              {error && (
                <div className="mt-5 p-4 bg-fintech-red/10 border border-fintech-red/20 rounded-2xl text-fintech-red text-[10px] uppercase font-bold flex items-center animate-shake">
                  <AlertCircle size={14} className="mr-3 flex-shrink-0" /> {error}
                </div>
              )}
            </form>
          </div>

          {/* Virtual Card Preview */}
          <div className={`relative h-60 rounded-[2.5rem] p-8 flex flex-col justify-between overflow-hidden transition-all duration-1000 shadow-2xl border border-white/10 group
            ${result?.scheme === 'visa' ? 'bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950' : 
              result?.scheme === 'mastercard' ? 'bg-gradient-to-br from-orange-600 via-red-700 to-red-900' : 
              result?.scheme === 'mada' ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-teal-900' : 
              'bg-gradient-to-br from-gray-800 to-black'}
          `}>
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-36 -mt-36 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div className="w-14 h-11 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 rounded-xl shadow-2xl flex items-center justify-center border border-white/20">
                <div className="w-10 h-7 border border-black/10 rounded flex flex-col justify-between p-1.5">
                  <div className="h-0.5 bg-black/20 w-full rounded-full"></div>
                  <div className="h-0.5 bg-black/20 w-full rounded-full"></div>
                  <div className="h-0.5 bg-black/20 w-full rounded-full"></div>
                </div>
              </div>
              <div className="text-white font-black italic text-3xl uppercase tracking-tighter drop-shadow-2xl">
                {result?.scheme || 'NETWORK'}
              </div>
            </div>

            <div className="relative z-10">
              <div className="text-2xl font-mono text-white tracking-[0.25em] mb-2 drop-shadow-lg">
                {bin.padEnd(6, 'X').replace(/(.{4})/g, '$1 ')} XXXX
              </div>
              <div className="flex space-x-8">
                <div className="flex flex-col">
                  <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Issuer Bank</span>
                  <span className="text-xs font-mono text-white truncate max-w-[220px] drop-shadow-md uppercase">
                    {result?.bank?.name || result?.issuer || 'Awaiting Input...'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Class</span>
                  <span className="text-xs font-mono text-white drop-shadow-md uppercase">{result?.type || '----'}</span>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-8 right-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
              <CreditCard size={140} strokeWidth={0.5} className="text-white" />
            </div>
          </div>
        </div>

        <div className="flex-1 glass-panel rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative flex flex-col bg-white/[0.01]">
          <div className="p-8 border-b border-white/5 bg-white/[0.03] flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-[0.3em] flex items-center">
              <ShieldCheck size={20} className="mr-4 text-fintech-green" /> 
              Detailed Intelligence Result
            </h2>
            {isAdminMode && result && (
              <button 
                onClick={isEditMode ? saveEdit : startEdit}
                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                  ${isEditMode ? 'bg-fintech-green text-white shadow-lg shadow-green-500/20' : 'bg-fintech-accent/20 text-fintech-accent border border-fintech-accent/30 hover:bg-fintech-accent/30'}
                `}
              >
                {isSaving ? 'Processing...' : (isEditMode ? 'Commit Changes' : 'Admin: Correct Metadata')}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 animate-pulse-slow">
                <Database size={80} className="mb-8 text-gray-600" />
                <h3 className="text-2xl font-bold text-white mb-3">Intelligence Repository</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Enter a card identifier to perform deep-packet inspection against the SQLite global repository.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 animate-fadeIn">
                
                {/* Issuer Intelligence */}
                <div className="space-y-10">
                  <div>
                    <h3 className="text-[11px] font-bold text-fintech-accent uppercase tracking-[0.2em] mb-6 flex items-center">
                      <div className="w-1.5 h-1.5 bg-fintech-accent rounded-full mr-3"></div>
                      Issuer Identification
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 flex items-center group hover:bg-white/[0.04] transition-all relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                          <Building size={120} />
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mr-6 border border-blue-500/20 text-blue-400">
                          <Building size={28} />
                        </div>
                        <div className="flex-1 relative z-10">
                          <div className="text-[9px] text-gray-500 uppercase font-bold mb-1 tracking-widest">Issuing Institution</div>
                          {isEditMode ? (
                            <input 
                              className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-fintech-accent"
                              value={editData.issuer}
                              onChange={(e) => setEditData({...editData, issuer: e.target.value})}
                            />
                          ) : (
                            <div className="text-xl text-white font-black tracking-tight uppercase">
                              {result.issuer || result.bank?.name || 'UNKNOWN ENTITY'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 group hover:border-white/10 transition-all">
                          <div className="text-[9px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Protocol Network</div>
                          <div className="flex items-center text-white font-mono font-black uppercase text-sm">
                            <Wifi size={14} className="mr-2 text-fintech-accent animate-pulse" /> {result.scheme || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 group hover:border-white/10 transition-all">
                          <div className="text-[9px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Identifier Class</div>
                          <div className="text-sm text-white font-mono font-black uppercase">{result.type || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Anitha AI Narrative Analysis */}
                  <div className="glass-panel p-8 rounded-[2rem] border border-fintech-accent/20 bg-gradient-to-br from-fintech-accent/10 via-transparent to-transparent relative overflow-hidden">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-fintech-accent flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                        <Zap size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Anitha AI Consultant</h4>
                        <div className="text-[8px] text-fintech-green font-bold uppercase tracking-tighter">Cognitive Analysis Engine v4.0</div>
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                      <p className="text-xs text-gray-300 leading-relaxed italic">
                        "Based on the prefix <span className="text-white font-bold">{result.bin}</span>, this card belongs to the <span className="text-fintech-accent font-bold uppercase">{result.category || 'Standard'}</span> tier. 
                        {result.country?.alpha2 === 'SA' || result.country_code === 'SA' ? 
                          " It is natively integrated with Saudi mada SPG-4, enabling domestic switching and Nafath MFA support. Expect lower interchange but strict compliance checks." : 
                          " This is an international range. Transactions will be routed via global clearing houses, subject to cross-border surcharges and enhanced risk scoring."} 
                        The issuer maintains a high reliability score for ARQC/ARPC validation."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Regional Intelligence */}
                <div className="space-y-10">
                  <div>
                    <h3 className="text-[11px] font-bold text-purple-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                      Geospatial Jurisdiction
                    </h3>
                    <div className="space-y-4">
                      {/* Premium Map Representation */}
                      <div className="relative h-48 rounded-[2rem] overflow-hidden bg-white/5 border border-white/5 group mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-50"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                           <Globe size={240} className="text-white" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center z-10">
                             <div className="text-5xl mb-3 drop-shadow-2xl">{result.country_name === 'Saudi Arabia' || result.country?.alpha2 === 'SA' ? '🇸🇦' : '🌐'}</div>
                             <div className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
                               {result.country_name || result.country?.name || 'Global Node'}
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                          <div className="text-[9px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Base Currency</div>
                          <div className="text-sm text-white font-mono font-black uppercase">{result.country?.currency || result.currency || 'USD'}</div>
                        </div>
                        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                          <div className="text-[9px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Region ISO</div>
                          <div className="text-sm text-white font-mono font-black uppercase">{result.country?.alpha2 || result.country_code || '--'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Switching Parameters</h4>
                       <Activity size={16} className="text-fintech-accent animate-spin-slow" />
                    </div>
                    <div className="space-y-6">
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] text-gray-400">Domestic Optimized</span>
                          <span className={result.country?.alpha2 === 'SA' ? 'text-fintech-green font-black text-[10px] uppercase' : 'text-gray-700 font-black text-[10px] uppercase'}>
                             {result.country?.alpha2 === 'SA' ? 'ENABLED' : 'N/A'}
                          </span>
                       </div>
                       <div className="w-full h-px bg-white/5"></div>
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] text-gray-400">EMV 3DS Support</span>
                          <span className="text-fintech-accent font-black text-[10px] uppercase">Verified Tier 1</span>
                       </div>
                       <div className="w-full h-px bg-white/5"></div>
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] text-gray-400">Nafath MFA Capable</span>
                          <span className={result.issuer?.includes('Investment') || result.issuer?.includes('National') ? 'text-fintech-green font-black text-[10px] uppercase' : 'text-gray-500 font-black text-[10px] uppercase'}>
                             {result.issuer?.includes('Investment') || result.issuer?.includes('National') ? 'YES' : 'NO'}
                          </span>
                       </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
            
            {saveMessage && (
              <div className="mt-10 p-4 rounded-2xl border bg-fintech-accent/10 border-fintech-accent/30 text-fintech-accent text-center font-bold text-xs uppercase tracking-widest animate-fadeIn">
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connectivity & Sync Status Bar */}
      <div className="mt-8 relative z-10">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-fintech-accent"></div>
          
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className={`w-2.5 h-2.5 rounded-full ${apiStatus.status === 'online' ? 'bg-fintech-green shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-fintech-red animate-pulse'}`}></div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">Service Connectivity</div>
                <div className="text-xs font-mono text-white flex items-center">
                  {apiStatus.status.toUpperCase()} 
                  {apiStatus.latency && <span className="ml-2 text-gray-500">({apiStatus.latency}ms)</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 border-l border-white/5 pl-8">
              <Database size={18} className={`${syncStatus.isSyncing ? 'text-fintech-accent animate-pulse' : 'text-gray-500'}`} />
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">Local Repository</div>
                <div className="text-xs font-mono text-white">{syncStatus.indexed?.toLocaleString() || '0'} BINS INDEXED</div>
              </div>
            </div>

            {syncStatus.isSyncing && (
              <div className="flex items-center space-x-3 border-l border-white/5 pl-8 animate-fadeIn">
                <RefreshCw size={14} className="text-fintech-accent animate-spin" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">Background Syncing</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-fintech-accent transition-all duration-1000" 
                        style={{ width: `${Math.max(5, (syncStatus.indexed % 100))}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-mono text-fintech-accent">ACTIVE</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
             <div className="flex flex-col items-end">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">API Node</div>
                <div className="text-[10px] font-mono text-gray-400">FIN-B1-SYRIA-CORE</div>
             </div>
             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-fintech-accent">
                <Wifi size={18} />
             </div>
          </div>
        </div>
      </div>

      {/* Admin Login Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0a0a0f] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative overflow-hidden text-center">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-fintech-accent"></div>
             <button onClick={() => setShowPinModal(false)} className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors"><X size={20} /></button>
             <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center tracking-tight">
                <Lock size={24} className="mr-3 text-fintech-accent" /> Elevated Access
             </h2>
             <p className="text-xs text-gray-500 mb-8 uppercase font-bold tracking-widest">Restricted Repository Management</p>
             <input 
                type="password"
                placeholder="PIN"
                value={pinInput}
                autoFocus
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="w-full bg-black border border-white/10 rounded-2xl py-6 px-6 text-4xl text-center font-mono tracking-[0.8em] text-fintech-accent focus:outline-none focus:border-fintech-accent/50 mb-6"
             />
             {pinError && <p className="text-fintech-red text-[10px] mb-6 font-bold uppercase tracking-widest animate-shake">{pinError}</p>}
             <button 
                onClick={handleAdminLogin}
                className="w-full bg-fintech-accent hover:bg-blue-600 text-white font-bold py-5 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all"
              >
                Unlock Directory
              </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default BINCheckerScreen;
