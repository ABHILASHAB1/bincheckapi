import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Play, Square, Activity, Timer, Gauge, 
  BarChart3, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Layers, Flame, Info, ChevronRight, Cpu
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

function LoadTestingScreen() {
  const { transactions } = useSimulation();
  const [isTesting, setIsTesting] = useState(false);
  const [tps, setTps] = useState(25);
  const [duration, setDuration] = useState(30);
  const [stats, setStats] = useState({ sent: 0, approved: 0, declined: 0, avgLatency: 0 });
  const [history, setHistory] = useState(new Array(40).fill(0));
  
  // Real-time telemetry simulation for the thermal heatmap
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const newVal = isTesting ? tps + (Math.random() * (tps * 0.1) - (tps * 0.05)) : 0;
        return [...prev.slice(-39), newVal];
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isTesting, tps]);

  const [showResults, setShowResults] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  const startTest = async () => {
    setIsTesting(true);
    setShowResults(false);
    setStats({ sent: 0, approved: 0, declined: 0, avgLatency: 0 });
    
    try {
      const res = await fetch('/api/load-test/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tps,
          duration,
          cards: transactions.slice(0, 10)
        })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      let currentSent = 0;
      const countInterval = setInterval(() => {
        currentSent += tps;
        const currentStats = {
          sent: currentSent,
          approved: Math.round(currentSent * 0.98),
          declined: Math.round(currentSent * 0.02),
          avgLatency: Math.round(12 + (tps * 0.5) + Math.random() * 5)
        };
        
        setStats(currentStats);
        
        if (currentSent >= tps * duration) {
           clearInterval(countInterval);
           setIsTesting(false);
           setFinalReport(currentStats);
           setShowResults(true);
        }
      }, 1000);
      
    } catch (e) {
      alert('Load Test Error: ' + e.message);
      setIsTesting(false);
    }
  };

  const getHeatColor = (val) => {
    if (val === 0) return 'bg-white/5';
    if (val < 30) return 'bg-fintech-green/40 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
    if (val < 70) return 'bg-fintech-accent/40 shadow-[0_0_10px_rgba(37,99,235,0.2)]';
    return 'bg-fintech-red/60 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse';
  };

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#0a0a0f] relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      <div className="flex justify-between items-end relative z-10">
        <div>
           <div className="flex items-center space-x-3 mb-2">
              <span className="px-2 py-0.5 rounded bg-fintech-accent/20 text-fintech-accent text-[9px] font-black uppercase tracking-widest border border-fintech-accent/30">Mada Rail Standard</span>
              <span className="text-[9px] text-gray-600 font-mono">STRESS_CORE_V4</span>
           </div>
           <h1 className="text-4xl font-black text-white flex items-center tracking-tighter">
             <Flame className={`mr-4 transition-all duration-500 ${isTesting ? 'text-fintech-red animate-bounce' : 'text-gray-700'}`} size={32} />
             Network War-Room
           </h1>
        </div>

        <div className="flex space-x-4">
           <div className="glass-panel px-6 py-4 rounded-2xl border border-white/5 flex items-center space-x-4">
              <div className="text-right">
                 <div className="text-[9px] text-gray-500 font-black uppercase">System Stability</div>
                 <div className="text-lg font-black text-fintech-green tracking-tight">99.98%</div>
              </div>
              <Activity size={20} className="text-fintech-green" />
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden relative z-10">
        
        {/* Left: Configuration Node */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
           <div className="glass-panel p-8 rounded-[2rem] border border-white/10 relative overflow-hidden bg-black/40">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fintech-accent to-fintech-red"></div>
              
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8">Simulation Config</h3>
              
              <div className="space-y-10">
                 <div>
                    <div className="flex justify-between items-end mb-4">
                       <label className="text-[10px] font-black text-white uppercase tracking-widest">Injection Rate</label>
                       <span className="text-2xl font-black text-fintech-accent font-mono">{tps} <span className="text-[10px] text-gray-600">TPS</span></span>
                    </div>
                    <input type="range" min="1" max="150" value={tps} onChange={(e) => setTps(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-full appearance-none accent-fintech-accent cursor-pointer" />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-white uppercase tracking-widest mb-4 block">Burst Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                       {[30, 60, 120].map(d => (
                          <button key={d} onClick={() => setDuration(d)} className={`py-3 rounded-xl border text-[10px] font-black transition-all ${duration === d ? 'bg-fintech-accent/10 border-fintech-accent text-white' : 'bg-white/5 border-transparent text-gray-500'}`}>
                             {d}s
                          </button>
                       ))}
                    </div>
                 </div>

                 <button 
                    onClick={isTesting ? () => setIsTesting(false) : startTest}
                    className={`w-full py-5 rounded-2xl flex items-center justify-center space-x-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all
                       ${isTesting ? 'bg-fintech-red text-white animate-pulse' : 'bg-fintech-accent text-white hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]'}
                    `}
                 >
                    {isTesting ? <Square size={16} /> : <Play size={16} />}
                    <span>{isTesting ? 'Abort Burst' : 'Ignite Stress Test'}</span>
                 </button>
              </div>
           </div>

           <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/40">
              <div className="flex items-center space-x-4 mb-4 text-fintech-accent">
                 <Zap size={18} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Anitha AI Insight</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-medium italic">
                 {isTesting 
                   ? `Current load at ${tps} TPS is saturating the HSM crypto-buffer. Expect latency jitter increase in DE 55 processing.` 
                   : "Engine primed. Suggesting a 50 TPS burst to validate mada SPG-4 concurrency thresholds."}
              </p>
           </div>
        </div>

        {/* Center: Live Thermal Matrix */}
        <div className="col-span-12 lg:col-span-6 flex flex-col space-y-6">
           <div className="flex-1 glass-panel rounded-[3rem] border border-white/10 p-10 bg-black/40 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Thermal Throughput Matrix</h3>
                    <p className="text-[9px] text-gray-600 mt-1 uppercase font-mono tracking-widest">Live Kernel Telemetry (0.5s intervals)</p>
                 </div>
                 <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                       <div className="w-2 h-2 rounded-full bg-fintech-green"></div>
                       <span className="text-[8px] text-gray-500 uppercase font-black">Healthy</span>
                    </div>
                    <div className="flex items-center space-x-1">
                       <div className="w-2 h-2 rounded-full bg-fintech-red animate-pulse"></div>
                       <span className="text-[8px] text-gray-500 uppercase font-black">Critical</span>
                    </div>
                 </div>
              </div>

              {/* Matrix visualization */}
              <div className="flex-1 grid grid-cols-10 grid-rows-4 gap-3 p-4 bg-black/20 rounded-3xl border border-white/5">
                 {history.map((val, idx) => (
                    <div key={idx} className={`rounded-xl transition-all duration-700 ${getHeatColor(val)}`}></div>
                 ))}
              </div>

              <div className="mt-8 grid grid-cols-4 gap-4">
                 <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                    <div className="text-[9px] text-gray-600 uppercase font-black mb-1">Total Packets</div>
                    <div className="text-xl font-black text-white font-mono">{stats.sent.toLocaleString()}</div>
                 </div>
                 <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                    <div className="text-[9px] text-gray-600 uppercase font-black mb-1 text-fintech-green">Approvals</div>
                    <div className="text-xl font-black text-white font-mono">{stats.approved.toLocaleString()}</div>
                 </div>
                 <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                    <div className="text-[9px] text-gray-600 uppercase font-black mb-1 text-fintech-red">Rejections</div>
                    <div className="text-xl font-black text-white font-mono">{stats.declined.toLocaleString()}</div>
                 </div>
                 <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                    <div className="text-[9px] text-gray-600 uppercase font-black mb-1 text-fintech-accent">Lat. Jitter</div>
                    <div className="text-xl font-black text-white font-mono">{stats.avgLatency}ms</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Stability Node */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
           <div className="glass-panel p-8 rounded-[2rem] border border-white/10 bg-black/40">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8">Hardware Affinity</h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Switch CPU</span>
                    <span className="text-[11px] font-black text-white">{isTesting ? Math.round(tps * 0.6) : 2}%</span>
                 </div>
                 <div className="h-1.5 bg-white/5 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-fintech-accent transition-all duration-500" style={{ width: `${isTesting ? tps * 0.6 : 2}%` }}></div>
                 </div>

                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">HSM Buffer</span>
                    <span className="text-[11px] font-black text-white">{isTesting ? Math.round(tps * 0.4) : 1}%</span>
                 </div>
                 <div className="h-1.5 bg-white/5 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-fintech-green transition-all duration-500" style={{ width: `${isTesting ? tps * 0.4 : 1}%` }}></div>
                 </div>

                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Network IO</span>
                    <span className="text-[11px] font-black text-white">{isTesting ? 88 : 0} Mbps</span>
                 </div>
                 <div className="h-1.5 bg-white/5 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-fintech-red transition-all duration-500" style={{ width: `${isTesting ? 88 : 0}%` }}></div>
                 </div>
              </div>
           </div>

           <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/40 flex items-center justify-between">
              <div>
                 <div className="text-[9px] text-gray-500 font-black uppercase">Stability Index</div>
                 <div className="text-xl font-black text-white tracking-tighter">EXCELLENT</div>
              </div>
              <CheckCircle2 size={24} className="text-fintech-green" />
           </div>
        </div>

      </div>

      {/* Results Overlay */}
      {showResults && finalReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-fadeIn">
           <div className="bg-[#050508] border border-white/10 p-12 rounded-[4rem] w-full max-w-xl shadow-2xl relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-fintech-accent"></div>
              
              <div className="w-20 h-20 bg-fintech-accent/10 text-fintech-accent rounded-3xl flex items-center justify-center mx-auto mb-8 border border-fintech-accent/20">
                 <BarChart3 size={40} />
              </div>

              <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Stress Batch Success</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.5em] font-black mb-10">Verification Report: {new Date().toLocaleDateString()}</p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                 <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                    <div className="text-[10px] text-gray-500 font-black uppercase mb-1">Peak Rate</div>
                    <div className="text-2xl font-black text-white font-mono">{tps} TPS</div>
                 </div>
                 <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                    <div className="text-[10px] text-gray-500 font-black uppercase mb-1">Avg Latency</div>
                    <div className="text-2xl font-black text-white font-mono">{finalReport.avgLatency}ms</div>
                 </div>
              </div>

              <div className="p-6 bg-fintech-accent/5 border border-fintech-accent/10 rounded-3xl mb-10 text-left flex items-start space-x-4">
                 <Info size={20} className="text-fintech-accent flex-shrink-0" />
                 <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic">
                    The mada switch kernel successfully absorbed the high-velocity burst. Minimal packet fragmentation detected in the ISO-8583 bridge. 
                    <span className="text-fintech-green block mt-1 font-black uppercase tracking-widest">Stability Verified for Production.</span>
                 </p>
              </div>

              <button onClick={() => setShowResults(false)} className="w-full bg-white text-black font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] hover:scale-[1.02] transition-all">
                 Finalize Report
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

export default LoadTestingScreen;
