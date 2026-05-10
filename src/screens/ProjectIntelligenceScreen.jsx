import React, { useState } from 'react';
import { 
  Briefcase, AlertTriangle, Calendar, Clock, DollarSign, Activity, 
  ArrowUpRight, TrendingDown, Layers, Map, Network, Zap
} from 'lucide-react';

export default function ProjectIntelligenceScreen() {
  const [selectedProject, setSelectedProject] = useState('NEOM_L4');

  const projects = [
    { id: 'NEOM_L4', name: 'NEOM Line Sector 4', status: 'ahead', spi: 1.04, cpi: 0.98, budget: '$4.2B' },
    { id: 'RYD_METRO', name: 'Riyadh Metro Ph2', status: 'delayed', spi: 0.82, cpi: 1.15, budget: '$1.8B' },
    { id: 'QID_INFRA', name: 'Qiddiya Infrastructure', status: 'on_track', spi: 1.00, cpi: 1.02, budget: '$950M' }
  ];

  return (
    <div className="h-full w-full flex flex-col p-8 space-y-6 overflow-hidden bg-[#030305] text-gray-200 relative">
      
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-black/40 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
             <Briefcase size={24} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
              Project & Asset Control
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em] mt-1 uppercase flex items-center">
              <Activity size={10} className="mr-1.5 text-emerald-400 animate-pulse" />
              EVM AI Monitoring Active
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
           <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center">
             <Network size={14} className="mr-2" /> Sync Primavera
           </button>
           <button className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
             <Zap size={14} className="mr-2" /> Generate Recovery Plan
           </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 relative z-10 overflow-hidden">
        
        {/* Left Sidebar: Portfolio */}
        <div className="w-80 flex flex-col gap-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Active Portfolio</h2>
          
          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
            {projects.map(p => (
              <div 
                key={p.id}
                onClick={() => setSelectedProject(p.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden
                  ${selectedProject === p.id 
                    ? 'bg-white/[0.04] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                    : 'bg-black/40 border-white/5 hover:border-white/20'}`}
              >
                {selectedProject === p.id && (
                  <div className="absolute left-0 top-0 w-1 h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">{p.name}</div>
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] mt-1
                    ${p.status === 'ahead' ? 'bg-emerald-400 text-emerald-400' : 
                      p.status === 'delayed' ? 'bg-rose-500 text-rose-500' : 'bg-cyan-400 text-cyan-400'}
                  `}></div>
                </div>
                
                <div className="flex justify-between text-[10px] font-mono mt-4">
                  <div>
                    <div className="text-gray-500 mb-0.5">SPI (Schedule)</div>
                    <div className={p.spi < 1 ? 'text-rose-400' : 'text-emerald-400'}>{p.spi.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">CPI (Cost)</div>
                    <div className={p.cpi > 1 ? 'text-rose-400' : 'text-emerald-400'}>{p.cpi.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500 mb-0.5">Budget</div>
                    <div className="text-white">{p.budget}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-gradient-to-tr from-indigo-500/10 to-transparent">
             <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center mb-2">
               <Layers size={14} className="mr-2" /> AI Risk Radar
             </h3>
             <p className="text-[10px] text-gray-400 font-mono leading-relaxed mb-3">
               3 critical paths identified across the portfolio risking $140M in delay penalties.
             </p>
             <button className="w-full py-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">
               Analyze Dependencies
             </button>
          </div>
        </div>

        {/* Main Content: EVM & Gantt */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Top KPI Row */}
          <div className="grid grid-cols-4 gap-6">
             <div className="glass-panel p-5 rounded-2xl border border-white/5">
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center">
                  <Calendar size={12} className="mr-1" /> Estimated Completion
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tighter">Oct 2027</div>
                <div className="text-[10px] text-emerald-400 font-bold mt-1">+2 Months Ahead</div>
             </div>
             <div className="glass-panel p-5 rounded-2xl border border-white/5">
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center">
                  <DollarSign size={12} className="mr-1" /> Earned Value (EV)
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tighter">$1.84B</div>
                <div className="text-[10px] text-emerald-400 font-bold mt-1">43.8% of BAC</div>
             </div>
             <div className="glass-panel p-5 rounded-2xl border border-white/5">
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center">
                  <Activity size={12} className="mr-1" /> Estimate at Comp. (EAC)
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tighter">$4.11B</div>
                <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center"><TrendingDown size={10} className="mr-1" /> $90M Under Budget</div>
             </div>
             <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden bg-rose-500/5">
                <div className="absolute right-0 top-0 w-16 h-16 bg-rose-500/20 blur-xl"></div>
                <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center">
                  <AlertTriangle size={12} className="mr-1" /> Material Variance
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tighter">+$14M</div>
                <div className="text-[10px] text-gray-400 font-mono mt-1">Steel cost escalation</div>
             </div>
          </div>

          {/* AI Cinematic Gantt / Schedule Map */}
          <div className="flex-1 glass-panel rounded-3xl border border-white/5 p-6 flex flex-col relative overflow-hidden">
             <div className="flex justify-between items-center mb-6 z-10 relative">
                <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center">
                  <Map size={14} className="mr-2 text-emerald-400" />
                  AI Critical Path Topology
                </h2>
                <div className="flex items-center space-x-4 text-[9px] font-mono text-gray-500">
                   <div className="flex items-center"><span className="w-2 h-2 rounded bg-emerald-400 mr-2"></span> Completed</div>
                   <div className="flex items-center"><span className="w-2 h-2 rounded bg-cyan-400 mr-2"></span> In Progress</div>
                   <div className="flex items-center"><span className="w-2 h-2 rounded bg-rose-500 mr-2"></span> Critical Delay</div>
                </div>
             </div>

             {/* Simulated Gantt Area */}
             <div className="flex-1 relative border-t border-l border-white/10 mt-2 z-10">
                
                {/* Timeline Grid Background */}
                <div className="absolute inset-0 grid grid-cols-6 gap-0 opacity-20 pointer-events-none">
                   {[...Array(6)].map((_, i) => <div key={i} className="border-r border-white/10 h-full"></div>)}
                </div>
                
                {/* Months Header */}
                <div className="grid grid-cols-6 absolute top-[-24px] left-0 w-full text-[9px] font-mono text-gray-500 pl-2">
                   <div>Q1 2026</div><div>Q2 2026</div><div>Q3 2026</div><div>Q4 2026</div><div>Q1 2027</div><div>Q2 2027</div>
                </div>

                {/* Bars */}
                <div className="absolute inset-0 flex flex-col justify-around py-4 pl-4 pr-12">
                   {/* Task 1 */}
                   <div className="relative h-10 w-full group">
                      <div className="absolute top-[-16px] text-[9px] font-bold text-gray-400 group-hover:text-white transition-colors">Phase 1: Substructure</div>
                      <div className="h-4 bg-emerald-400/80 rounded-full w-[30%] shadow-[0_0_10px_rgba(52,211,153,0.5)] border border-emerald-300"></div>
                   </div>
                   
                   {/* Task 2 */}
                   <div className="relative h-10 w-full group mt-4">
                      <div className="absolute top-[-16px] left-[25%] text-[9px] font-bold text-gray-400 group-hover:text-white transition-colors">Phase 2: Superstructure</div>
                      {/* Dependency Line */}
                      <div className="absolute left-[30%] top-[-10px] w-4 h-8 border-l border-b border-gray-600 rounded-bl-lg"></div>
                      <div className="absolute left-[30%] h-4 bg-cyan-400/80 rounded-full w-[40%] shadow-[0_0_10px_rgba(34,211,238,0.5)] border border-cyan-300 relative">
                         {/* Progress fill inside bar */}
                         <div className="absolute left-0 top-0 h-full w-[45%] bg-white/30 rounded-full"></div>
                      </div>
                   </div>

                   {/* Task 3 (Critical) */}
                   <div className="relative h-10 w-full group mt-4">
                      <div className="absolute top-[-16px] left-[65%] text-[9px] font-bold text-rose-400 flex items-center">
                        <AlertTriangle size={10} className="mr-1" /> Phase 3: MEP Integration
                      </div>
                      {/* Dependency Line */}
                      <div className="absolute left-[70%] top-[-10px] w-4 h-8 border-l border-b border-rose-500/50 rounded-bl-lg"></div>
                      <div className="absolute left-[65%] h-4 bg-rose-500/80 rounded-full w-[25%] shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400 animate-pulse"></div>
                   </div>
                   
                   {/* Connection nodes to simulate network graph */}
                   <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 z-[-1]">
                     <path d="M 30% 20% C 40% 20%, 40% 40%, 50% 40%" stroke="rgba(255,255,255,0.2)" fill="transparent" strokeWidth="1" strokeDasharray="4,4" />
                   </svg>
                </div>
             </div>

             {/* Background watermark */}
             <div className="absolute bottom-[-10%] right-[-5%] w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
          </div>

        </div>
      </div>
    </div>
  );
}
