import React, { useState, useEffect } from 'react';
import { 
  Database, Play, Download, Search, AlertCircle, Table, RefreshCw, 
  Terminal, ChevronRight, Info, BarChart3, PieChart, FileText, 
  Sparkles, Code, Cpu, ShieldCheck, Zap, Layers, Globe
} from 'lucide-react';

export default function DataExplorerScreen() {
  const [query, setQuery] = useState('SELECT * FROM bin_directory LIMIT 25;');
  const [searchDomain, setSearchDomain] = useState('local'); // 'local' or 'cloud'
  const [results, setResults] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const [showAI, setShowAI] = useState(true);

  const fetchTables = async () => {
    try {
      if (searchDomain === 'cloud') {
         // Simulated Supabase schema list for enterprise vault
         setTables(['transactions', 'module_operations', 'bin_directory', 'compliance_audits']);
         return;
      }
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: "SELECT name FROM sqlite_master WHERE type='table';" })
      });
      const data = await response.json();
      if (data.success) setTables(data.results.map(r => r.name));
    } catch (e) { console.error("Failed to fetch schema", e); }
  };

  useEffect(() => { fetchTables(); }, [searchDomain]);

  const handleExecute = async () => {
    if (!query.trim()) return;
    setIsExecuting(true);
    setError(null);
    
    try {
      let data;
      // 1. Attempt Cloud Execution first (with 3s timeout)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const isSQL = query.trim().toUpperCase().startsWith('SELECT');
        const cloudUrl = isSQL ? '/api/v1/cloud/sql' : '/api/v1/cloud/query';
        const cloudBody = isSQL ? { sql: query } : { table: 'transactions', filters: { rrn: query }, limit: 50 };

        console.log(`🌐 [INTEL] Attempting Cloud Sync (${isSQL ? 'SQL' : 'Lookup'})...`);
        const cloudRes = await fetch(cloudUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
          body: JSON.stringify(cloudBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        data = await cloudRes.json();
        if (data.success) {
          console.log('✅ [INTEL] Cloud Response Received.');
          setSearchDomain('cloud');
          setResults(data.results || []);
          return;
        }
      } catch (cloudErr) {
        console.warn('⚠️ [INTEL] Cloud Timeout or Failure. Falling back to Local Engine...');
      }

      // 2. Fallback to Local Engine
      const localRes = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ sql: query.trim().toUpperCase().startsWith('SELECT') ? query : `SELECT * FROM transactions WHERE rrn = '${query}' OR stan = '${query}' LIMIT 50;` })
      });
      data = await localRes.json();
      if (!data.success) throw new Error(data.error || 'Local execution failed');
      
      setSearchDomain('local');
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally { setIsExecuting(false); }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    const headers = Object.keys(results[0]).join(',');
    const rows = results.map(row => 
      Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forensic_audit_${new Date().getTime()}.csv`;
    link.click();
  };

  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#020204] relative">
      {/* Background Mesh */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-fintech-accent/5 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-8">
        <div>
           <div className="flex items-center space-x-3 mb-2">
              <span className="px-2 py-0.5 rounded bg-fintech-accent/20 text-fintech-accent text-[9px] font-black uppercase tracking-widest border border-fintech-accent/30 flex items-center">
                <ShieldCheck size={10} className="mr-1.5" /> Intelligence Center
              </span>
              <span className="text-[9px] text-gray-600 font-mono">NODE_FORENSIC_v4_ACTIVE</span>
           </div>
           <h1 className="text-4xl font-black text-white flex items-center tracking-tighter">
             <Database className="mr-4 text-fintech-accent" size={36} />
             Enterprise Intelligence Vault
           </h1>
        </div>

        <div className="flex items-center space-x-4">
           <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 shadow-2xl">
              <button 
                onClick={() => { setSearchDomain('local'); setQuery('SELECT * FROM bin_directory LIMIT 25;'); }}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center ${searchDomain === 'local' ? 'bg-fintech-accent text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                 <Layers size={14} className="mr-2" /> Local Engine
              </button>
              <button 
                onClick={() => { setSearchDomain('cloud'); setQuery('411122'); }}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center ${searchDomain === 'cloud' ? 'bg-fintech-accent text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                 <Globe size={14} className="mr-2" /> Global Cloud
              </button>
           </div>
           <button 
             onClick={exportToCSV}
             disabled={results.length === 0}
             className="px-6 py-4 bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-30 rounded-2xl text-[10px] font-black text-gray-300 transition-all border border-white/10 uppercase tracking-widest flex items-center shadow-2xl"
           >
             <FileText size={16} className="mr-3 text-fintech-accent" /> Audit Export
           </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden relative z-10">
        
        {/* Sidebar: Schema Forensic Browser */}
        <div className="col-span-12 lg:col-span-3 flex flex-col space-y-6 overflow-hidden">
           <div className="flex-1 glass-panel rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col bg-black/60 shadow-2xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <Table size={14} className="mr-3 text-fintech-accent" /> Master Schema
                 </span>
                 <RefreshCw size={12} className="text-gray-600 cursor-pointer hover:text-white transition-colors" onClick={fetchTables} />
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                 {tables.map(t => (
                   <div 
                     key={t} 
                     onClick={() => { setSearchDomain('local'); setQuery(`SELECT * FROM ${t} LIMIT 25;`); }}
                     className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-fintech-accent/40 cursor-pointer transition-all group flex items-center justify-between"
                   >
                     <span className="text-xs font-mono text-gray-400 group-hover:text-white truncate pr-4">{t}</span>
                     <ChevronRight size={14} className="text-gray-700 group-hover:text-fintech-accent" />
                   </div>
                 ))}
              </div>
           </div>

           <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-fintech-accent/5 flex items-start space-x-4 shadow-xl">
              <div className="p-3 bg-fintech-accent/10 text-fintech-accent rounded-xl">
                 <Sparkles size={20} />
              </div>
              <div>
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">AI Assisted Mode</h4>
                 <p className="text-[9px] text-gray-500 leading-relaxed font-bold tracking-tight uppercase mt-1">Forensic anomaly detection active for SAMA audits.</p>
              </div>
           </div>
        </div>

        {/* Center: Editor & Results */}
        <div className="col-span-12 lg:col-span-9 flex flex-col space-y-6 overflow-hidden">
           
           {/* AI SQL Orchestrator */}
           <div className="h-64 glass-panel rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl relative bg-black/60">
              <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                 <div className="flex items-center space-x-3">
                    <Code size={18} className="text-fintech-accent" />
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                       {searchDomain === 'cloud' ? 'Market Intelligence Engine' : 'AI SQL Orchestrator'}
                    </span>
                 </div>
                 <button 
                   onClick={handleExecute}
                   disabled={isExecuting}
                   className="bg-fintech-accent hover:bg-blue-600 text-white px-8 py-2.5 rounded-2xl text-[10px] font-black flex items-center transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 uppercase tracking-[0.2em]"
                 >
                    {isExecuting ? <RefreshCw size={14} className="animate-spin mr-3" /> : <Zap size={14} className="mr-3 fill-current" />}
                    {searchDomain === 'cloud' ? 'Pulse Sync' : 'Execute Forensic query'}
                 </button>
              </div>
              <textarea 
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 bg-transparent p-8 font-mono text-base text-blue-400 focus:outline-none resize-none placeholder:text-gray-800 leading-relaxed"
                placeholder={searchDomain === 'cloud' ? "Search BIN intelligence (e.g. 455700)..." : "SELECT * FROM bin_directory WHERE card_scheme = 'mada';"}
                spellCheck="false"
              />
           </div>

           {/* Forensic Results Explorer */}
           <div className="flex-1 glass-panel rounded-[3.5rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl bg-black/60 relative">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                 <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intelligence Stream</span>
                    {results.length > 0 && <span className="text-[9px] text-fintech-accent font-black bg-fintech-accent/10 px-3 py-1 rounded-lg border border-fintech-accent/20 uppercase">{results.length} Nodes Found</span>}
                 </div>
                 <div className="flex space-x-3">
                    <button className="p-2 hover:bg-white/5 rounded-xl text-gray-600 hover:text-white transition-all"><BarChart3 size={16} /></button>
                    <button className="p-2 hover:bg-white/5 rounded-xl text-gray-600 hover:text-white transition-all"><PieChart size={16} /></button>
                 </div>
              </div>

              <div className="flex-1 relative overflow-hidden">
                 {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 bg-red-500/5 backdrop-blur-md z-20">
                       <AlertCircle size={64} className="text-red-500 mb-6 animate-bounce" />
                       <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em] mb-4">Forensic Exception</span>
                       <div className="text-[10px] font-mono text-gray-400 text-center max-w-xl bg-black/60 p-8 rounded-[2rem] border border-red-500/20 leading-relaxed shadow-2xl">
                          {error}
                       </div>
                    </div>
                 )}

                 {isExecuting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-black/60 backdrop-blur-xl z-20">
                       <div className="relative">
                          <Cpu size={48} className="text-fintech-accent animate-pulse" />
                          <div className="absolute inset-0 border-4 border-fintech-accent border-t-transparent rounded-full animate-spin"></div>
                       </div>
                       <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Navigating Data Clusters...</p>
                    </div>
                 )}

                 {results.length > 0 ? (
                    <div className="h-full overflow-auto custom-scrollbar">
                       <table className="w-full text-left text-[11px] border-collapse min-w-max">
                          <thead className="bg-[#0a0a0f] text-gray-500 sticky top-0 backdrop-blur-3xl z-10 border-b border-white/10">
                             <tr>
                                {columns.map(col => (
                                  <th key={col} className="p-6 font-black uppercase tracking-widest text-[9px] border-r border-white/5">{col}</th>
                                ))}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono">
                             {results.map((row, i) => (
                               <tr key={i} className="hover:bg-white/[0.03] transition-colors group">
                                  {columns.map(col => {
                                    const val = String(row[col]);
                                    const isNumeric = !isNaN(val) && val !== '';
                                    return (
                                      <td key={col} className={`p-6 border-r border-white/5 transition-all truncate max-w-[250px] ${isNumeric ? 'text-fintech-green' : 'text-gray-400 group-hover:text-white'}`}>
                                        {val === 'null' ? <span className="opacity-20 italic">VOID</span> : val}
                                      </td>
                                    );
                                  })}
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 ) : !isExecuting && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-800 space-y-6">
                       <Search size={80} strokeWidth={0.5} className="opacity-20" />
                       <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Awaiting Forensic Input</p>
                          <p className="text-[9px] font-mono opacity-40 uppercase">Enter SQL query or intelligence term to begin pulse.</p>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
