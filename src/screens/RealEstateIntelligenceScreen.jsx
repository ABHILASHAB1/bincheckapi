import React, { useState } from 'react';
import { 
  Building2, Map as MapIcon, TrendingUp, DollarSign, Users, 
  MapPin, Activity, Search, BrainCircuit, ArrowUpRight, BarChart4
} from 'lucide-react';

export default function RealEstateIntelligenceScreen() {
  const [activeZone, setActiveZone] = useState('KAFD');

  const zones = [
    { id: 'KAFD', name: 'KAFD Financial District', valuation: '$18.4B', yield: '8.2%', occupancy: '94%', trend: '+4.1%' },
    { id: 'DIRIYAH', name: 'Diriyah Gate', valuation: '$12.1B', yield: '6.8%', occupancy: '81%', trend: '+12.4%' },
    { id: 'ROSHN', name: 'ROSHN Riyadh', valuation: '$8.5B', yield: '5.4%', occupancy: '99%', trend: '+2.1%' }
  ];

  return (
    <div className="h-full w-full flex flex-col p-8 space-y-6 overflow-hidden bg-[#030305] text-gray-200 relative">
      
      {/* Ambient background glows */}
      <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-black/40 border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
             <Building2 size={24} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
              Real Estate Intelligence
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em] mt-1 uppercase flex items-center">
              <MapIcon size={10} className="mr-1.5 text-blue-400" />
              Geospatial Valuation & Yield Analytics
            </p>
          </div>
        </div>
        
        <div className="flex space-x-4 bg-black/40 border border-white/5 rounded-2xl p-2 backdrop-blur-md">
           <div className="flex items-center px-4 border-r border-white/5">
             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Live Market Data</span>
           </div>
           <button className="px-4 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
             <BrainCircuit size={14} className="mr-2" /> AI Valuation Model
           </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 relative z-10 overflow-hidden">
        
        {/* Left Panel: Geospatial Heatmap & Zones */}
        <div className="flex-[3] flex flex-col gap-6">
          
          {/* Spatial Heatmap Simulation */}
          <div className="flex-[2] glass-panel rounded-3xl border border-white/5 p-1 relative overflow-hidden group">
            {/* Dark Map Background Simulation */}
            <div className="absolute inset-0 bg-[#0a0f18] opacity-80 z-0">
               {/* Map Grid overlay */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            </div>
            
            <div className="absolute top-6 left-6 z-20 flex items-center space-x-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
               <MapIcon size={16} className="text-blue-400" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Riyadh Metropolitan Grid</span>
            </div>

            {/* Simulated Heatmap Nodes */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
               {/* KAFD Node */}
               <div className="absolute top-[30%] left-[40%] group/node cursor-pointer">
                  <div className="w-32 h-32 bg-blue-500/20 rounded-full blur-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/node:bg-blue-500/40 transition-all"></div>
                  <div className="relative z-10 w-4 h-4 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,1)] border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                  </div>
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg opacity-0 group-hover/node:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                     <div className="text-[10px] font-black text-white uppercase">KAFD District</div>
                     <div className="text-[9px] text-emerald-400 font-mono mt-0.5">+4.1% MoM Yield</div>
                  </div>
               </div>

               {/* Diriyah Node */}
               <div className="absolute top-[45%] left-[25%] group/node cursor-pointer">
                  <div className="w-40 h-40 bg-emerald-500/15 rounded-full blur-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/node:bg-emerald-500/30 transition-all"></div>
                  <div className="relative z-10 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,1)] border-2 border-white"></div>
               </div>

               {/* ROSHN Node */}
               <div className="absolute top-[60%] left-[60%] group/node cursor-pointer">
                  <div className="w-24 h-24 bg-indigo-500/20 rounded-full blur-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/node:bg-indigo-500/40 transition-all"></div>
                  <div className="relative z-10 w-3 h-3 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(129,140,248,1)] border-2 border-white"></div>
               </div>
            </div>

            {/* Radar Sweep Effect */}
            <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] border-t border-blue-500/20 origin-top-left -translate-x-1/2 -translate-y-1/2 animate-[spin_8s_linear_infinite] z-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.1) 0%, transparent 50%)' }}></div>
          </div>

          {/* Zones Data Strip */}
          <div className="flex-1 grid grid-cols-3 gap-4">
             {zones.map(zone => (
               <div 
                 key={zone.id} 
                 onClick={() => setActiveZone(zone.id)}
                 className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all group overflow-hidden relative
                   ${activeZone === zone.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5 hover:border-white/20'}`}
               >
                 <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
                 
                 <div className="flex items-center space-x-2 mb-4 relative z-10">
                   <MapPin size={14} className={activeZone === zone.id ? 'text-blue-400' : 'text-gray-500'} />
                   <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{zone.name}</h3>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div>
                      <div className="text-[9px] text-gray-500 font-mono uppercase">Valuation</div>
                      <div className="text-lg font-black text-white">{zone.valuation}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-500 font-mono uppercase">Yield</div>
                      <div className="text-lg font-black text-emerald-400">{zone.yield}</div>
                    </div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Right Panel: Executive AI Analytics */}
        <div className="flex-[2] flex flex-col gap-6">
          
          {/* Market Trend & ROI Forecast */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-bl from-white/[0.02] to-transparent relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center">
                  <TrendingUp size={14} className="mr-2 text-indigo-400" />
                  ROI & Trend Forecasting
                </h2>
                <div className="px-2 py-1 bg-white/5 rounded text-[9px] font-mono text-gray-400 border border-white/5">Q4 2026 Prediction</div>
             </div>

             <div className="grid grid-cols-2 gap-6 mb-8">
               <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Commercial Occupancy</div>
                  <div className="flex items-end space-x-3">
                    <div className="text-4xl font-black text-white tracking-tighter">94%</div>
                    <div className="text-[10px] text-emerald-400 font-bold mb-1.5 flex items-center"><ArrowUpRight size={10} className="mr-0.5" /> Optimal</div>
                  </div>
               </div>
               <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Price Per SqM</div>
                  <div className="flex items-end space-x-3">
                    <div className="text-4xl font-black text-white tracking-tighter">24K</div>
                    <div className="text-[10px] text-emerald-400 font-bold mb-1.5 flex items-center"><ArrowUpRight size={10} className="mr-0.5" /> +8%</div>
                  </div>
               </div>
             </div>

             {/* Animated Trend Graph Simulation */}
             <div className="h-32 w-full relative border-b border-l border-white/10 pt-2 pr-2">
                <div className="absolute inset-0 flex items-end justify-between px-2 pb-1">
                   <div className="w-8 bg-blue-500/20 hover:bg-blue-500/40 transition-colors border border-blue-500/30 rounded-t-sm" style={{ height: '40%' }}></div>
                   <div className="w-8 bg-blue-500/20 hover:bg-blue-500/40 transition-colors border border-blue-500/30 rounded-t-sm" style={{ height: '55%' }}></div>
                   <div className="w-8 bg-blue-500/20 hover:bg-blue-500/40 transition-colors border border-blue-500/30 rounded-t-sm" style={{ height: '60%' }}></div>
                   <div className="w-8 bg-blue-500/40 hover:bg-blue-500/60 transition-colors border border-blue-400 rounded-t-sm shadow-[0_0_15px_rgba(96,165,250,0.5)]" style={{ height: '80%' }}></div>
                   <div className="w-8 bg-indigo-500/80 hover:bg-indigo-400 transition-colors border border-indigo-400 rounded-t-sm shadow-[0_0_15px_rgba(129,140,248,0.8)] relative group" style={{ height: '95%' }}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-indigo-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">PREDICTED</div>
                   </div>
                </div>
                {/* Dotted target line */}
                <div className="absolute top-[20%] left-0 w-full border-t border-dashed border-emerald-500/50 pointer-events-none flex justify-end">
                   <span className="text-[8px] text-emerald-500 font-mono -mt-3 mr-1">Target Yield</span>
                </div>
             </div>
             <div className="flex justify-between mt-2 text-[8px] font-mono text-gray-600 px-2">
                <span>Q1</span><span>Q2</span><span>Q3</span><span className="text-white">Q4</span><span className="text-indigo-400 font-bold">2027</span>
             </div>
          </div>

          {/* AI Consulting Advisor Panel */}
          <div className="flex-1 glass-panel rounded-3xl border border-indigo-500/20 bg-gradient-to-tr from-indigo-500/10 to-transparent p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-24 bg-indigo-500/5 blur-3xl pointer-events-none"></div>
             
             <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center mb-6">
               <BrainCircuit size={14} className="mr-2" /> Asset Advisory Intelligence
             </h3>

             <div className="space-y-4">
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-start space-x-4">
                   <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5"><DollarSign size={16} /></div>
                   <div>
                     <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Acquisition Opportunity</h4>
                     <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                       AI models detect a <span className="text-emerald-400 font-bold">14% undervaluation</span> in Class A commercial assets within the Diriyah corridor. Recommend aggressive procurement before Q1 2027 infrastructure announcements.
                     </p>
                   </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-start space-x-4">
                   <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 mt-0.5"><Activity size={16} /></div>
                   <div>
                     <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Construction Cost Escalation</h4>
                     <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                       Material indices show a spike in raw steel costs. Expected to impact ROSHN phase 3 margins by <span className="text-rose-400 font-bold">2.4%</span>.
                     </p>
                   </div>
                </div>
             </div>

             <div className="mt-6 flex space-x-3">
                <button className="flex-1 py-2 bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-500/50 text-indigo-200 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                  Run Full Simulation
                </button>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
