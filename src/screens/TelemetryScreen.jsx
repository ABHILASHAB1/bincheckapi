import React, { useState, useEffect, useRef } from 'react';
import { Gauge, Cpu, Database, Activity, Clock, Zap, Server, ShieldCheck, RefreshCw, Layers, Radio, Globe, Terminal, ChevronRight } from 'lucide-react';

export default function TelemetryScreen() {
  const [metrics, setMetrics] = useState({
    cpu: 12,
    ram: 45,
    dbLatency: 4,
    apiUptime: '99.999%',
    txPerSec: 0,
    activeSockets: 4,
    cloudSync: 'OPTIMAL'
  });

  const [jitter, setJitter] = useState(new Array(40).fill(0));
  const [thermal, setThermal] = useState(new Array(16).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 15) + 8,
        ram: 45.2,
        dbLatency: Math.floor(Math.random() * 2) + 1,
        txPerSec: Math.floor(Math.random() * 25)
      }));

      setJitter(prev => [...prev.slice(-39), Math.random() * 20 + 5]);
      setThermal(prev => prev.map(() => Math.floor(Math.random() * 30) + 10));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#020204] relative">
      {/* Background Scanning Line Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      
      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-8">
        <div>
           <div className="flex items-center space-x-3 mb-2">
              <span className="px-2 py-0.5 rounded bg-fintech-accent/20 text-fintech-accent text-[9px] font-black uppercase tracking-widest border border-fintech-accent/30 flex items-center">
                <Radio size={10} className="mr-1.5 animate-pulse" /> Infrastructure Pulse
              </span>
              <span className="text-[9px] text-gray-600 font-mono">NODE_ADMIN_SEC_v4</span>
           </div>
           <h1 className="text-4xl font-black text-white flex items-center tracking-tighter">
             <Layers className="mr-4 text-fintech-accent" size={36} />
             Infrastructure Mission Control
           </h1>
        </div>

        <div className="flex space-x-4">
           <div className="glass-panel px-6 py-4 rounded-2xl border border-white/5 flex items-center space-x-4 bg-black/40">
              <div className="text-right">
                 <div className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Cloud Link Health</div>
                 <div className="text-lg font-black text-fintech-green tracking-tight uppercase flex items-center">
                    <Globe size={16} className="mr-2" /> {metrics.cloudSync}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden relative z-10">
        
        {/* Left: Engine Vitals */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
           <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden bg-black/60 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fintech-accent to-purple-600"></div>
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8">Hardware Affinity</h3>
              
              <div className="space-y-8">
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-black text-white uppercase tracking-widest">
                       <span>CPU Core Load</span>
                       <span className="text-fintech-accent">{metrics.cpu}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-fintech-accent transition-all duration-1000" style={{ width: metrics.cpu + '%' }}></div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-black text-white uppercase tracking-widest">
                       <span>Memory Buffer</span>
                       <span className="text-purple-400">{metrics.ram}MB</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-purple-400 transition-all duration-1000" style={{ width: (metrics.ram / 100) * 100 + '%' }}></div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Core Thermal Matrix</div>
                    <div className="grid grid-cols-4 gap-2">
                       {thermal.map((t, idx) => (
                          <div key={idx} className={`h-8 rounded-lg transition-all duration-700 ${t > 30 ? 'bg-fintech-red/40 animate-pulse' : 'bg-white/5'}`}></div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-black/60 flex items-center justify-between shadow-xl">
              <div>
                 <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Global Uptime</div>
                 <div className="text-xl font-black text-white tracking-tighter">{metrics.apiUptime}</div>
              </div>
              <ShieldCheck size={28} className="text-fintech-green" />
           </div>
        </div>

        {/* Center: Kernel Jitter & Logs */}
        <div className="col-span-12 lg:col-span-6 flex flex-col space-y-6">
           <div className="flex-1 glass-panel rounded-[3.5rem] border border-white/10 p-10 bg-black/60 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Switch Kernel Jitter (ms)</h3>
                    <p className="text-[9px] text-gray-600 mt-1.5 uppercase font-mono tracking-widest">Sub-millisecond packet oscillation</p>
                 </div>
                 <div className="flex items-center space-x-3">
                    <Activity size={18} className="text-fintech-accent animate-pulse" />
                 </div>
              </div>

              {/* Jitter Waveform */}
              <div className="flex-1 flex items-end space-x-1.5 p-4 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                 {jitter.map((val, idx) => (
                    <div 
                       key={idx} 
                       className="flex-1 bg-fintech-accent transition-all duration-500 rounded-full"
                       style={{ height: `${val * 2}%`, opacity: 0.2 + (idx / jitter.length) * 0.8 }}
                    ></div>
                 ))}
              </div>

              <div className="mt-8 grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
                 <div className="text-center">
                    <div className="text-[9px] text-gray-600 uppercase font-black mb-1">Avg Jitter</div>
                    <div className="text-xl font-black text-white font-mono">0.12ms</div>
                 </div>
                 <div className="text-center border-l border-white/5">
                    <div className="text-[9px] text-gray-600 uppercase font-black mb-1">Peak Packet</div>
                    <div className="text-xl font-black text-white font-mono">1.2kb</div>
                 </div>
                 <div className="text-center border-l border-white/5">
                    <div className="text-[9px] text-gray-600 uppercase font-black mb-1 text-fintech-green">Throughput</div>
                    <div className="text-xl font-black text-white font-mono">{metrics.txPerSec} TPS</div>
                 </div>
              </div>
           </div>

           <div className="h-64 glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col bg-black/60">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center">
                    <Terminal size={14} className="mr-3 text-fintech-accent" /> Atomic Infrastructure Logs
                 </h3>
                 <span className="text-[9px] font-mono text-gray-600">AUTO_SCROLL_ON</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono text-[11px] custom-scrollbar">
                 <div className="text-gray-500 flex items-center"><ChevronRight size={12} className="mr-2" /> [SYSTEM] <span className="text-fintech-accent">SECURE_BOOT</span>: HSM Enclave initialized.</div>
                 <div className="text-gray-500 flex items-center"><ChevronRight size={12} className="mr-2" /> [SYSTEM] <span className="text-fintech-green">CLOUD_LINK</span>: Global Sync established via Supabase v1.</div>
                 <div className="text-gray-500 flex items-center"><ChevronRight size={12} className="mr-2" /> [NETWORK] <span className="text-white font-bold italic">ISO_SWITCH</span>: Listening for incoming mada SPG-4 streams on 8583.</div>
                 <div className="text-gray-400 flex items-center animate-pulse"><ChevronRight size={12} className="mr-2" /> [HEARTBEAT] {new Date().toLocaleTimeString()} Core Switch at {metrics.cpu}% efficiency.</div>
                 <div className="text-gray-500 flex items-center"><ChevronRight size={12} className="mr-2" /> [SECURITY] Key rotation scheduled for 00:00:00 UTC.</div>
              </div>
           </div>
        </div>

        {/* Right: Network Topology Mini-Map */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
           <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 bg-black/60 h-full flex flex-col shadow-2xl">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8">Topology Monitor</h3>
              
              <div className="flex-1 flex flex-col items-center justify-center space-y-12 relative">
                 <div className="absolute inset-0 opacity-[0.1] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fintech-accent to-transparent"></div>
                 
                 <div className="p-6 bg-fintech-accent text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.4)] relative z-10">
                    <Server size={32} />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase whitespace-nowrap">SWITCH_CORE</div>
                 </div>

                 <div className="flex space-x-12 relative z-10">
                    <div className="p-4 bg-white/5 border border-white/10 text-gray-500 rounded-2xl relative">
                       <Database size={24} />
                       <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase whitespace-nowrap">LOCAL_DB</div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 text-gray-500 rounded-2xl relative">
                       <Globe size={24} />
                       <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase whitespace-nowrap">SUPABASE</div>
                    </div>
                 </div>

                 <div className="w-full pt-12 space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                       <span className="text-[10px] text-gray-500 font-bold uppercase">Socket Latency</span>
                       <span className="text-xs font-black text-white">4ms</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                       <span className="text-[10px] text-gray-500 font-bold uppercase">Packet Loss</span>
                       <span className="text-xs font-black text-fintech-green">0.00%</span>
                    </div>
                 </div>
              </div>

              <button className="mt-8 w-full py-4 bg-fintech-accent text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-fintech-accent/20 hover:scale-[1.02] transition-all">
                 <RefreshCw size={14} className="inline mr-2" /> Hot Restart Switch
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
