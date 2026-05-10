import React, { useState } from 'react';
import { Terminal, Send, Database, Globe, ShieldAlert, Cpu, Copy, CheckCircle2, Play, ChevronRight, Info } from 'lucide-react';

export default function APIExplorerScreen() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [params, setParams] = useState({});

  const endpoints = [
    { 
      id: 'remit-compare', 
      method: 'GET', 
      path: '/api/remittance/compare', 
      desc: 'Compare remittance rates across KSA banks for a specific corridor.',
      defaultParams: { corridor: 'SAR_INR', amount: 1000 }
    },
    { 
      id: 'remit-feed', 
      method: 'GET', 
      path: '/api/remittance/feed', 
      desc: 'Fetch the real-time intelligence feed for market volatility.',
      defaultParams: {}
    },
    { 
      id: 'logs', 
      method: 'GET', 
      path: '/api/logs', 
      desc: 'Retrieve historical ISO 8583 transaction audit logs.',
      defaultParams: { limit: 10 }
    },
    { 
      id: 'bin-lookup', 
      method: 'GET', 
      path: '/api/bin/', 
      desc: 'Perform a deep BIN intelligence lookup (Issuer, Country, Scheme).',
      defaultParams: { bin: '440647' },
      isPathVar: true
    }
  ];

  const handleSelect = (ep) => {
    setSelectedEndpoint(ep);
    setParams(ep.defaultParams);
    setResponse(null);
  };

  const handleTest = async (endpoint) => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      let url = endpoint.path;
      if (endpoint.isPathVar) {
        url += params.bin || '';
      } else {
        const query = new URLSearchParams(params).toString();
        if (query) url += '?' + query;
      }
      
      const res = await fetch(url);
      const json = await res.json();
      setResponse(json);
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#0a0a0f]">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center tracking-tight">
            <Terminal size={24} className="mr-3 text-fintech-accent" />
            Payment Intelligence API Explorer
          </h1>
          <p className="text-sm text-gray-400 mt-1">Direct interactive sandbox for the core simulation and aggregation microservices.</p>
        </div>
        <div className="bg-fintech-accent/10 px-4 py-2 rounded-lg border border-fintech-accent/20">
           <span className="text-[10px] text-fintech-accent font-black uppercase tracking-widest">Base URL: http://localhost:3001</span>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Endpoint List */}
        <div className="w-[40%] flex flex-col glass-panel rounded-2xl border border-white/5 overflow-hidden">
           <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Service Registry</h3>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {endpoints.map(ep => (
                <div key={ep.id} 
                   onClick={() => handleSelect(ep)}
                   className={`p-4 rounded-xl border transition-all cursor-pointer group
                      ${selectedEndpoint?.id === ep.id ? 'bg-fintech-accent/10 border-fintech-accent/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/10'}
                   `}
                >
                   <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                         <span className="text-[9px] font-black bg-fintech-accent text-white px-2 py-0.5 rounded uppercase">{ep.method}</span>
                         <span className="text-xs font-mono text-gray-300 group-hover:text-white transition-colors">{ep.path}</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-600 group-hover:text-fintech-accent transition-all" />
                   </div>
                   <p className="text-[11px] text-gray-500 leading-relaxed">{ep.desc}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Right: Request/Response Console */}
        <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-white/5 overflow-hidden bg-black/40">
           
           {!selectedEndpoint ? (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-4">
                <Cpu size={64} strokeWidth={0.5} className="opacity-20 animate-pulse" />
                <div className="text-[10px] font-black uppercase tracking-[0.2em]">Select an endpoint to initialize</div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                   <div className="flex items-center space-x-3">
                      <span className="text-xs font-black text-white uppercase tracking-widest">{selectedEndpoint.id}</span>
                   </div>
                   <button 
                     onClick={() => handleTest(selectedEndpoint)}
                     disabled={isLoading}
                     className="btn-primary py-1.5 px-6 flex items-center disabled:opacity-50"
                   >
                      {isLoading ? <Play size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
                      EXECUTE REQUEST
                   </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                   
                   {/* Params Section */}
                   <div>
                      <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Query Parameters</h4>
                      <div className="space-y-2">
                         {Object.entries(params).map(([key, val]) => (
                           <div key={key} className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                              <span className="text-[11px] font-mono text-fintech-accent">{key}</span>
                              <input 
                                type="text" 
                                value={val}
                                onChange={(e) => setParams({ ...params, [key]: e.target.value })}
                                className="bg-transparent text-right text-xs text-white focus:outline-none font-mono"
                              />
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Response Console */}
                   <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                         <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">HTTP Response</h4>
                         {response && (
                           <button onClick={() => copyToClipboard(JSON.stringify(response, null, 2))} className="text-gray-500 hover:text-white transition-colors">
                              {copied ? <CheckCircle2 size={14} className="text-fintech-green" /> : <Copy size={14} />}
                           </button>
                         )}
                      </div>
                      <div className="flex-1 bg-[#0c0c14] border border-white/5 rounded-xl p-4 font-mono text-[11px] overflow-auto min-h-[200px]">
                         {isLoading ? (
                           <div className="text-gray-600 animate-pulse">Awaiting response from backend...</div>
                         ) : response ? (
                           <pre className="text-fintech-green">{JSON.stringify(response, null, 2)}</pre>
                         ) : (
                           <div className="text-gray-700 italic">// Click execute to see the raw JSON response payload.</div>
                         )}
                      </div>
                   </div>

                   {/* Documentation Hint */}
                   <div className="bg-fintech-accent/5 border border-fintech-accent/10 rounded-xl p-4 flex items-start space-x-3">
                      <Info size={16} className="text-fintech-accent shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                         The <span className="text-white font-bold">{selectedEndpoint.id}</span> service is part of the Payment Intelligence Microservices Layer.
                      </p>
                   </div>

                </div>
             </div>
           )}

        </div>

      </div>

    </div>
  );
}
