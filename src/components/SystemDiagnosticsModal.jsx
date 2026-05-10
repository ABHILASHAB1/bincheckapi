import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, RefreshCw, Database, Server, Cpu, Lock, Globe, Zap, Activity, Info, X } from 'lucide-react';

export default function SystemDiagnosticsModal({ onClose }) {
  const [stage, setStage] = useState(0);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);

  const stages = [
    { name: 'ISO-8583 Bitwise Integrity', icon: Cpu, detail: 'Validating SAMA mada packet checksums...' },
    { name: 'Supabase Cloud Sync', icon: Database, detail: 'Verifying Enterprise API v1 handshake...' },
    { name: 'Anitha AI Cognitive Load', icon: Zap, detail: 'Calibrating regulatory audit models...' },
    { name: 'RTGS Settlement Rail', icon: Activity, detail: 'Testing global liquidity corridor sockets...' },
    { name: 'mada Network Security', icon: Shield, detail: 'Confirming TLS 1.3 / HSM Key Exchange...' },
  ];

  useEffect(() => {
    if (stage < stages.length) {
      const timer = setTimeout(() => {
        setLogs(prev => [`[OK] ${stages[stage].name} verified at ${new Date().toLocaleTimeString()}`, ...prev]);
        setStage(s => s + 1);
        setProgress(((stage + 1) / stages.length) * 100);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-fadeIn">
      <div className="bg-[#050508] w-full max-w-2xl rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(37,99,235,0.15)] overflow-hidden relative">
        {/* Dynamic Scan Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-fintech-accent shadow-[0_0_15px_rgba(37,99,235,1)] animate-scan"></div>
        
        <div className="p-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-black text-white flex items-center tracking-tighter">
                <Shield className="mr-4 text-fintech-accent animate-pulse" size={32} />
                Mission Control Hub
              </h2>
              <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-[0.4em] font-black">Enterprise Infrastructure • v4.0.0-Stable</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-600 hover:text-white transition-all">
               <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
             {/* Left: Vitals Check */}
             <div className="space-y-3">
                {stages.map((s, i) => {
                  const Icon = s.icon;
                  const isDone = stage > i;
                  const isActive = stage === i;
                  
                  return (
                    <div key={i} className={`flex items-center space-x-4 p-4 rounded-2xl border transition-all ${isActive ? 'bg-fintech-accent/10 border-fintech-accent/30 shadow-2xl' : 'bg-white/[0.02] border-white/5'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDone ? 'bg-fintech-green/10 text-fintech-green' : (isActive ? 'bg-fintech-accent/10 text-fintech-accent' : 'bg-gray-800 text-gray-600')}`}>
                        {isDone ? <CheckCircle size={20} /> : <Icon size={20} className={isActive ? 'animate-spin-slow' : ''} />}
                      </div>
                      <div className="flex-1">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-500'}`}>{s.name}</span>
                        <div className="h-1 bg-white/5 w-full rounded-full mt-2 overflow-hidden">
                           <div className={`h-full transition-all duration-700 ${isDone ? 'bg-fintech-green w-full' : (isActive ? 'bg-fintech-accent w-[60%] animate-pulse' : 'w-0')}`}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>

             {/* Right: Metrics Sparklines & Cloud Monitor */}
             <div className="flex flex-col space-y-6">
                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Network Latency (ms)</span>
                      <Activity size={14} className="text-fintech-accent animate-pulse" />
                   </div>
                   <div className="flex items-end space-x-1 h-24 mb-4">
                      {[40, 35, 45, 30, 55, 40, 38, 42, 35, 30, 45, 50].map((h, i) => (
                         <div key={i} className="flex-1 bg-fintech-accent/20 rounded-t-sm group hover:bg-fintech-accent transition-all cursor-crosshair" style={{ height: `${h}%` }}></div>
                      ))}
                   </div>
                   <div className="flex justify-between text-[10px] font-mono text-gray-600">
                      <span>RIYADH_CENTRAL</span>
                      <span className="text-fintech-green">32ms</span>
                   </div>
                </div>

                <div className="bg-fintech-accent/5 border border-fintech-accent/20 rounded-3xl p-6">
                   <div className="flex items-center space-x-3 mb-4">
                      <Database size={18} className="text-fintech-accent" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Supabase Cloud Sync</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">API Handshake</span>
                      <span className="text-fintech-green font-black uppercase">Established</span>
                   </div>
                   <div className="mt-3 flex space-x-1">
                      {[1,1,1,1,1,1,0,1,1,1,1,1,1,1].map((s, i) => (
                         <div key={i} className={`h-4 w-1.5 rounded-full ${s ? 'bg-fintech-green/40' : 'bg-fintech-red animate-pulse'}`}></div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
             <div className="flex items-center space-x-4">
                <Info size={16} className="text-gray-500" />
                <span className="text-[11px] text-gray-400 italic">"All core mada certification modules report 100% bitwise parity with SAMA switch standards."</span>
             </div>
             <button 
                onClick={onClose}
                disabled={stage < stages.length}
                className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all
                   ${stage === stages.length ? 'bg-fintech-accent text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:scale-[1.05]' : 'bg-white/5 text-gray-600 cursor-not-allowed'}
                `}
             >
                {stage === stages.length ? 'Engage Control Tower' : 'Verifying Engine...'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
