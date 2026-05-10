import React, { useState, useEffect } from 'react';
import { 
  Activity, Globe, ShieldAlert, Zap, TrendingUp, ArrowUpRight, 
  Clock, Server, Database, Share2, DollarSign, Search, Smartphone,
  BarChart3, BrainCircuit, LineChart, Briefcase, Building2, Eye, Map, Cpu
} from 'lucide-react';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for the cinematic dashboard
  const aiInsights = [
    { title: 'Liquidity Variance', desc: 'Predicting 14% cashflow tightening in Q3 due to regional Capex.', type: 'warning' },
    { title: 'Fraud Detection', desc: 'Anomalous SWIFT patterns isolated in SEA corridor. Node secured.', type: 'critical' },
    { title: 'Real Estate Val.', desc: 'Commercial sector yields up 4.2% against predictive benchmark.', type: 'positive' }
  ];

  return (
    <div className="h-full w-full flex flex-col p-8 space-y-6 overflow-hidden bg-[#030305] text-gray-200 relative">
      {/* Background Holographic Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Executive Command Header */}
      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)]">
               <Cpu size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center">
                Global Enterprise Node
              </h1>
              <p className="text-[10px] text-cyan-400 font-mono tracking-[0.4em] mt-1 uppercase flex items-center">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse mr-2"></span>
                AI Orchestration Core Active
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-8 text-right bg-black/40 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
           <div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Local Time</div>
              <div className="text-xs font-mono text-white">{time}</div>
           </div>
           <div className="w-px h-8 bg-white/10"></div>
           <div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">System Health</div>
              <div className="text-xs font-mono text-emerald-400 font-bold">99.99% OPTIMAL</div>
           </div>
           <div className="w-px h-8 bg-white/10"></div>
           <div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Active Models</div>
              <div className="text-xs font-mono text-white font-bold flex items-center justify-end">
                <BrainCircuit size={12} className="mr-1 text-indigo-400" /> 14 Online
              </div>
           </div>
        </div>
      </div>

      {/* Cinematic Bento Grid Layout */}
      <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-6 relative z-10 overflow-hidden">
        
        {/* Main KPI Panel - spanning 8 cols, 2 rows */}
        <div className="col-span-8 row-span-2 glass-panel rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Consolidated Financial Intelligence</h2>
            <div className="flex space-x-2">
               <button className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/5">24H</button>
               <button className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-indigo-500/30">7D</button>
               <button className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/5">30D</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Global Revenue Projection</div>
              <div className="flex items-end space-x-3">
                 <div className="text-4xl font-black text-white tracking-tighter">$14.2B</div>
                 <div className="flex items-center text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md mb-1">
                   <ArrowUpRight size={12} className="mr-1" /> +12.4%
                 </div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full w-[78%]"></div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Operational Capex</div>
              <div className="flex items-end space-x-3">
                 <div className="text-4xl font-black text-white tracking-tighter">$2.1B</div>
                 <div className="flex items-center text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded-md mb-1">
                   <TrendingUp size={12} className="mr-1" /> -4.1%
                 </div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full w-[42%]"></div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">AI Cost Efficiency</div>
              <div className="flex items-end space-x-3">
                 <div className="text-4xl font-black text-white tracking-tighter">$840M</div>
                 <div className="flex items-center text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded-md mb-1">
                   Saved
                 </div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full w-[94%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight Feed - spanning 4 cols, 4 rows */}
        <div className="col-span-4 row-span-4 glass-panel rounded-3xl border border-white/5 p-6 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-30 bg-indigo-500/5 blur-3xl w-full h-1/2"></div>
           <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center">
             <BrainCircuit size={14} className="mr-2 text-indigo-400" />
             Strategic AI Directives
           </h2>

           <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
             {aiInsights.map((insight, idx) => (
               <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{insight.title}</div>
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]
                      ${insight.type === 'warning' ? 'bg-amber-400 text-amber-400' : 
                        insight.type === 'critical' ? 'bg-rose-500 text-rose-500' : 'bg-emerald-400 text-emerald-400'}
                    `}></div>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-mono">{insight.desc}</p>
               </div>
             ))}
           </div>

           {/* AI Chat Prompt Input */}
           <div className="mt-4 pt-4 border-t border-white/5">
             <div className="relative">
               <input 
                 type="text" 
                 placeholder="Ask the AI Executive Advisor..." 
                 className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-[11px] text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 font-mono transition-all"
               />
               <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/30">
                 <Search size={12} />
               </button>
             </div>
           </div>
        </div>

        {/* Project & Real Estate Module - 4 cols, 2 rows */}
        <div className="col-span-4 row-span-2 glass-panel rounded-3xl border border-white/5 p-6 bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="flex justify-between items-start mb-6">
             <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center">
               <Building2 size={14} className="mr-2 text-cyan-400" />
               Asset & Project Control
             </h2>
             <ArrowUpRight size={14} className="text-gray-600" />
          </div>

          <div className="space-y-4">
            <div>
               <div className="flex justify-between text-[10px] font-bold mb-1">
                 <span className="text-gray-300">NEOM Line Sector 4</span>
                 <span className="text-emerald-400 font-mono">Ahead 4%</span>
               </div>
               <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                 <div className="h-full bg-cyan-400 rounded-full w-[65%] shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
               </div>
            </div>
            <div>
               <div className="flex justify-between text-[10px] font-bold mb-1">
                 <span className="text-gray-300">Riyadh Metro Phase 2</span>
                 <span className="text-rose-400 font-mono">Delayed</span>
               </div>
               <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                 <div className="h-full bg-rose-500 rounded-full w-[82%] shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
               </div>
            </div>
          </div>
        </div>

        {/* Predictive Analytics Module - 4 cols, 2 rows */}
        <div className="col-span-4 row-span-2 glass-panel rounded-3xl border border-white/5 p-6 bg-gradient-to-bl from-white/[0.02] to-transparent relative overflow-hidden">
          {/* Simulated graph background */}
          <div className="absolute bottom-0 left-0 w-full h-24 opacity-20 pointer-events-none">
             <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full text-indigo-500 fill-current">
                <path d="M0 30 L0 15 Q 10 5, 20 15 T 40 10 T 60 20 T 80 5 T 100 15 L100 30 Z" />
             </svg>
          </div>

          <div className="flex justify-between items-start mb-4 relative z-10">
             <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center">
               <LineChart size={14} className="mr-2 text-purple-400" />
               Predictive Analytics
             </h2>
          </div>

          <div className="relative z-10">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Q4 Forecast Deviation</div>
            <div className="text-3xl font-black text-white font-mono tracking-tighter">
              +4.8% <span className="text-[12px] text-gray-500 font-sans tracking-normal ml-1">above baseline</span>
            </div>
            <div className="mt-4 flex space-x-2">
               <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-mono text-gray-400 border border-white/5">ARIMA</span>
               <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-mono text-gray-400 border border-white/5">PROPHET</span>
               <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-[9px] font-mono border border-purple-500/30">LLM-SYNTHESIS</span>
            </div>
          </div>
        </div>

        {/* Interactive Globe / Topology preview - 8 cols, 2 rows */}
        <div className="col-span-8 row-span-2 glass-panel rounded-3xl border border-white/5 p-0 overflow-hidden relative group">
          <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none group-hover:bg-black/40 transition-colors duration-500"></div>
          
          <div className="absolute top-6 left-6 z-20">
             <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center drop-shadow-md">
               <Map size={14} className="mr-2 text-fintech-accent" />
               Live Global Topology
             </h2>
             <p className="text-[9px] text-gray-300 font-mono mt-1 drop-shadow-md">Monitoring 14,024 nodes across 8 regions</p>
          </div>

          {/* Placeholder for the actual Globe Component, simulating it with a stylised background for now */}
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-screen transform group-hover:scale-105 transition-transform duration-[10s]"></div>
          
          {/* Scanning Line overlay */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-20 animate-[scan_4s_ease-in-out_infinite]"></div>

          <button className="absolute bottom-6 right-6 z-20 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center">
             <Eye size={12} className="mr-2" /> Enter Topography
          </button>
        </div>

      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
