import React, { useState, useEffect } from 'react';
import { Share2, Server, Globe, Landmark, Activity, Clock, Zap, ArrowRight, ShieldCheck, Database, Smartphone } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export default function NetworkTopologyScreen() {
  const { dbLogs, isSyncing } = useSimulation();
  const [activeTx, setActiveTx] = useState(null);

  useEffect(() => {
    if (dbLogs.length > 0 && !activeTx) {
      setActiveTx(dbLogs[0]);
    }
  }, [dbLogs, activeTx]);

  const hops = [
    { id: 'pos', name: 'Virtual Terminal', type: 'EDGE', icon: Smartphone, location: 'Merchant (Riyadh)', latency: '12ms' },
    { id: 'acquirer', name: 'Acquiring Host', type: 'CORE', icon: Server, location: 'Bank Cloud', latency: '45ms' },
    { id: 'scheme', name: 'mada SPG Switch', type: 'HUB', icon: Globe, location: 'SAMA Datacenter', latency: '88ms' },
    { id: 'issuer', name: 'Issuer Authorization', type: 'DEST', icon: Landmark, location: 'Issuer Bank (Global)', latency: '120ms' },
  ];

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#030305]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center tracking-tight">
            <Share2 size={24} className="mr-3 text-fintech-accent animate-pulse" />
            Network Topology & Path Observability
          </h1>
          <p className="text-sm text-gray-400 mt-1">Real-time tracing of ISO 8583 message propagation across global payment rails.</p>
        </div>
        <div className="flex items-center space-x-3 bg-black/30 p-2 rounded-lg border border-white/5">
           <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-fintech-green"></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Switch Active</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Path Visualization */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col p-8 relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fintech-accent to-purple-500"></div>
           
           {/* The Map/Topology Grid */}
           <div className="flex-1 flex items-center justify-between relative px-10">
              
              {/* Connection Lines (Background) */}
              <div className="absolute inset-x-20 top-1/2 h-0.5 bg-white/5 -translate-y-1/2 overflow-hidden">
                 <div className="h-full bg-fintech-accent w-full animate-flow-right"></div>
              </div>

              {hops.map((hop, i) => (
                <div key={hop.id} className="relative z-10 flex flex-col items-center group">
                   {/* Node */}
                   <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-500 
                      ${activeTx ? 'bg-fintech-accent/10 border-fintech-accent shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-110' : 'bg-black/50 border-white/10 opacity-50'}
                   `}>
                      <hop.icon size={32} className={activeTx ? 'text-white' : 'text-gray-600'} />
                      <div className="text-[8px] font-black text-gray-400 uppercase mt-2 tracking-tighter">{hop.type}</div>
                   </div>
                   
                   {/* Info Labels */}
                   <div className="absolute top-24 text-center w-32">
                      <div className="text-[10px] font-black text-white uppercase tracking-tight">{hop.name}</div>
                      <div className="text-[8px] text-gray-500 mt-0.5">{hop.location}</div>
                      {activeTx && (
                        <div className="flex items-center justify-center mt-2 space-x-2">
                           <Clock size={10} className="text-fintech-accent" />
                           <span className="text-[9px] font-mono text-fintech-accent font-bold">{hop.latency}</span>
                        </div>
                      )}
                   </div>

                   {/* Field Breakdown Tooltip-style info */}
                   <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 border border-white/10 p-2 rounded text-[8px] font-mono text-gray-400 w-32 z-20">
                      Processing ISO Packets...
                      <div className="text-fintech-green">DE 003, 004, 011</div>
                   </div>
                </div>
              ))}

           </div>

           {/* Metrics Footer */}
           <div className="grid grid-cols-4 gap-4 mt-8 border-t border-white/5 pt-8">
              <div className="text-center">
                 <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">End-to-End Latency</div>
                 <div className="text-xl font-mono font-bold text-white">265ms</div>
              </div>
              <div className="text-center">
                 <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">Hop Count</div>
                 <div className="text-xl font-mono font-bold text-fintech-accent">4 Nodes</div>
              </div>
              <div className="text-center">
                 <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">Path Integrity</div>
                 <div className="text-xl font-mono font-bold text-fintech-green">100%</div>
              </div>
              <div className="text-center">
                 <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">Security protocol</div>
                 <div className="text-[11px] font-mono font-bold text-gray-400 mt-2 uppercase tracking-widest">TLS 1.3 / TMK</div>
              </div>
           </div>
        </div>

        {/* Right: Real-time Trace & Decision Transparency */}
        <div className="w-96 flex flex-col space-y-6">
           
           {/* Decision Transparency Panel */}
           <div className="glass-panel p-5 rounded-xl border border-white/5 bg-[#0c0c14] relative overflow-hidden">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                 <ShieldCheck size={14} className="mr-2 text-fintech-green" /> Decision Transparency
              </h3>
              
              {activeTx ? (
                <div className="space-y-4">
                   <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                      <div className="text-[9px] text-gray-500 font-bold uppercase">Routing Logic</div>
                      <div className="text-[11px] text-white mt-1 leading-relaxed">
                         Card identified as <span className="text-fintech-accent font-bold">mada Debit</span>. Routing via <span className="text-fintech-green font-bold">Local SPG Switch</span> to avoid international fees.
                      </div>
                   </div>
                   <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                      <div className="text-[9px] text-gray-500 font-bold uppercase">Encryption Handshake</div>
                      <div className="text-[11px] text-white mt-1 leading-relaxed">
                         PIN Block decrypted using <span className="text-purple-400 font-bold">ZMK (Zone Master Key)</span> and translated to <span className="text-purple-400 font-bold">AWK (Acquirer Working Key)</span>.
                      </div>
                   </div>
                   <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                      <div className="text-[9px] text-gray-500 font-bold uppercase">Auth Rule Check</div>
                      <div className="text-[11px] text-white mt-1 leading-relaxed">
                         Balance check passed. RC: <span className="text-fintech-green font-bold">00 (Approved)</span>. STAN: {activeTx.stan}.
                      </div>
                   </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">Select a transaction to see the routing decision.</div>
              )}
           </div>

           {/* Live Trace Log */}
           <div className="flex-1 glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col bg-black/20">
              <div className="p-4 border-b border-white/5">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Trace</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                 {dbLogs.map((log, i) => (
                   <div key={log.id} onClick={() => setActiveTx(log)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer 
                         ${activeTx?.id === log.id ? 'bg-fintech-accent/10 border-fintech-accent/30' : 'bg-black/40 border-transparent hover:border-white/10'}
                      `}
                   >
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[9px] font-mono text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                         <span className={`text-[8px] font-bold px-1 rounded ${log.resp_code === '00' ? 'bg-fintech-green/20 text-fintech-green' : 'bg-red-500/20 text-red-500'}`}>
                            {log.resp_code}
                         </span>
                      </div>
                      <div className="text-[10px] text-white font-bold">{(log.pan || '').slice(-4)} | {log.amount} SAR</div>
                      <div className="text-[8px] text-gray-600 mt-1 font-mono uppercase">MTI: {log.mti} | RRN: {log.rrn}</div>
                   </div>
                 ))}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
