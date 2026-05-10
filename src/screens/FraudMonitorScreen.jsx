import { 
  ShieldAlert, ShieldCheck, Activity, Search, AlertTriangle, 
  MapPin, Clock, BarChart3, PieChart, Info, Zap, Shield, Eye
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

function FraudMonitorScreen() {
  const { fraudStats: stats } = useSimulation();
  const threats = stats.latestThreats;

  const riskGradient = (score) => {
    if (score > 70) return 'from-red-500 to-orange-600';
    if (score > 40) return 'from-yellow-400 to-orange-500';
    return 'from-green-400 to-emerald-600';
  };

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#050508] relative">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-fintech-red/5 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-end z-10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center tracking-tight">
            <ShieldAlert className="mr-3 text-fintech-red" size={28} />
            Real-Time Fraud & Anomaly Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">Cognitive Threat Intelligence — Node: FR-SA-01</p>
        </div>
        <div className="flex items-center space-x-4 bg-black/40 border border-white/10 p-2 rounded-xl backdrop-blur-md">
           <div className="flex flex-col items-end px-4 border-r border-white/5">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Active Engine</span>
              <span className="text-xs font-mono text-fintech-green font-bold">SENTINEL-AI V4.2</span>
           </div>
           <div className="flex flex-col items-end px-4">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Global Latency</span>
              <span className="text-xs font-mono text-fintech-accent font-bold">12ms</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden z-10">
        
        {/* Left: Live Threat Stream */}
        <div className="flex-1 flex flex-col glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl bg-white/[0.01]">
           <div className="p-6 border-b border-white/5 bg-white/[0.03] flex justify-between items-center">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                 <Activity size={16} className="mr-3 text-fintech-red animate-pulse" /> Live Ingestion Stream
              </h2>
              <div className="flex items-center space-x-4">
                 <div className="flex items-center text-[9px] font-bold text-gray-500 uppercase bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    <Clock size={12} className="mr-2" /> Real-Time Bridge Connected
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left">
                 <thead className="bg-black/60 text-[9px] text-gray-500 uppercase tracking-[0.2em] sticky top-0 backdrop-blur-md z-20">
                    <tr>
                       <th className="p-5">Transaction Node</th>
                       <th className="p-5">ISO MTI</th>
                       <th className="p-5">Amount (SAR)</th>
                       <th className="p-5">Risk Score</th>
                       <th className="p-5">Analysis Outcome</th>
                       <th className="p-5 text-right">Details</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 font-mono text-[11px] text-gray-400">
                    {threats.length === 0 ? (
                       <tr>
                          <td colSpan="6" className="p-20 text-center opacity-30">
                             <Shield size={60} className="mx-auto mb-6 text-gray-700" />
                             <p className="text-sm font-bold uppercase tracking-widest">Monitoring Port 8583...</p>
                          </td>
                       </tr>
                    ) : (
                       threats.map((t, i) => (
                          <tr key={i} className={`group hover:bg-white/[0.03] transition-all animate-fadeIn ${t.risk_score > 70 ? 'bg-red-500/5' : ''}`}>
                             <td className="p-5">
                                <div className="flex items-center space-x-3">
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${t.risk_score > 70 ? 'border-red-500/30 text-red-500' : 'border-white/10 text-gray-500'}`}>
                                      <Zap size={14} />
                                   </div>
                                   <span className="text-white font-bold tracking-tighter">TX-{t.id.toString().slice(-6)}</span>
                                </div>
                             </td>
                             <td className="p-5 font-bold text-gray-500">{t.mti}</td>
                             <td className="p-5 text-white font-black">{t.amount.toFixed(2)}</td>
                             <td className="p-5">
                                <div className="flex items-center space-x-3 w-40">
                                   <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div 
                                         className={`h-full bg-gradient-to-r ${riskGradient(t.risk_score)} transition-all duration-1000`}
                                         style={{ width: `${t.risk_score}%` }}
                                      ></div>
                                   </div>
                                   <span className={`text-[10px] font-black ${t.risk_score > 60 ? 'text-fintech-red' : 'text-gray-500'}`}>{t.risk_score}</span>
                                </div>
                             </td>
                             <td className="p-5">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${t.risk_score > 70 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500/30 text-green-500'}`}>
                                   {t.risk_score > 70 ? 'ANOMALY BLOCKED' : 'VERIFIED CLEAN'}
                                </span>
                             </td>
                             <td className="p-5 text-right">
                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-600 hover:text-white transition-all">
                                   <Eye size={14} />
                                </button>
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Right: Security Analytics */}
        <div className="w-[420px] flex flex-col space-y-6">
           
           {/* Scoring Engine Status */}
           <div className="glass-panel rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden bg-gradient-to-br from-black/80 to-fintech-red/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fintech-red/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <h3 className="text-[10px] font-black text-white mb-10 uppercase tracking-[0.25em] flex items-center">
                 <BarChart3 size={18} className="mr-3 text-fintech-red" /> Threat Intelligence Core
              </h3>

              <div className="grid grid-cols-2 gap-6 mb-10">
                 <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 font-bold uppercase mb-1">Nodes Analyzed</span>
                    <span className="text-3xl font-mono font-black text-white">{stats.analyzed}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 font-bold uppercase mb-1">Anomalies Deflected</span>
                    <span className="text-3xl font-mono font-black text-fintech-red">{stats.blocked}</span>
                 </div>
              </div>

              <div className="p-6 border border-white/5 bg-black/40 rounded-[2rem] text-center space-y-2">
                 <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Average Risk Level</div>
                 <div className={`text-4xl font-mono font-black tracking-tighter ${stats.avgRisk > 50 ? 'text-orange-500' : 'text-fintech-green'}`}>
                    {stats.avgRisk}%
                 </div>
                 <div className="flex items-center justify-center text-[9px] text-gray-600 font-bold uppercase tracking-widest bg-white/5 py-1 px-4 rounded-full w-fit mx-auto">
                    Global Threshold: 75%
                 </div>
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Heuristic Depth</span>
                    <span className="text-xs font-mono text-white font-bold">DEEP_PACKET</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Pattern Recognition</span>
                    <span className="text-xs font-mono text-white font-bold text-fintech-accent">ENABLED</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Velocity Filter</span>
                    <span className="text-xs font-mono text-white font-bold text-fintech-green">PASSIVE</span>
                 </div>
              </div>
           </div>

           {/* Security Insight */}
           <div className="bg-fintech-red/5 border border-fintech-red/20 p-6 rounded-[2rem] flex items-start space-x-4 shadow-xl shadow-red-500/5">
              <AlertTriangle size={24} className="text-fintech-red mt-1 shrink-0" />
              <div>
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-2">Protocol Enforcement</h4>
                 <p className="text-[10px] text-gray-500 leading-relaxed font-medium italic">
                    The AI engine is currently monitoring ISO 8583 Bitmaps for <span className="text-white font-bold">Velocity Mismatch</span> and <span className="text-white font-bold">PAN Scraping</span> signatures. Any risk score exceeding 85 will trigger an immediate RTGS freeze.
                 </p>
              </div>
           </div>

           <button className="w-full py-5 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center space-x-3">
              <ShieldCheck size={18} />
              <span>Generate Security Audit</span>
           </button>
        </div>
      </div>
    </div>
  );
}

export default FraudMonitorScreen;
