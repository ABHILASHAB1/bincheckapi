import React, { useState } from 'react';
import { 
  Zap, Brain, Target, Compass, BarChart3, TrendingUp, 
  PieChart, Activity, ShieldCheck, Globe, Search, Filter,
  ArrowRight, Layers, Info, Download, Clock, Mic, MessageSquare,
  Sparkles, Star, Award, ZapOff, Briefcase
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export default function ExecutiveConsultingScreen() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState(null);

  const generateStrategy = () => {
    setIsGenerating(true);
    setActiveStrategy(null);
    setTimeout(() => {
      setActiveStrategy({
        title: 'Global Market Expansion Strategy 2026',
        score: 94,
        swot: {
          strengths: ['High Cash Reserves', 'Advanced Tech Stack', 'Strong MENA Presence'],
          weaknesses: ['Dependency on Single Cloud Provider', 'Resource Bottlenecks in Data Science'],
          opportunities: ['Emerging Fintech Regulation in SEA', 'Real Estate Yield Maximization'],
          threats: ['Geopolitical Volatility', 'Rising Interest Rates']
        },
        recommendations: [
          'Diversify capital allocation into high-yield SEA real estate.',
          'Implement AI-driven risk scoring for all domestic transactions.',
          'Accelerate Project NEOM Phase 2 to capitalize on early logistics demand.'
        ]
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#030305]">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20 mb-3">
            <Award size={12} />
            <span>McKinsey Strategic Engine v4.0</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            Executive Advisory & Decision Support
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Autonomous strategic consulting, market scenario simulation, and executive-level decision intelligence based on global benchmarks.
          </p>
        </div>

        <div className="flex items-center space-x-4">
           <button 
             onClick={generateStrategy}
             className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center space-x-2"
           >
              <Sparkles size={16} />
              <span>Initiate Strategic Run</span>
           </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Intelligence Context */}
        <div className="w-96 flex flex-col space-y-4">
           <div className="flex-1 glass-panel rounded-3xl border border-white/5 overflow-hidden flex flex-col p-6 space-y-8">
              <div>
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Strategy Context</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex items-center space-x-3">
                          <Globe size={18} className="text-blue-400" />
                          <span className="text-xs font-bold text-white">Market Data</span>
                       </div>
                       <span className="text-[10px] text-emerald-400 font-bold uppercase">LIVE</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex items-center space-x-3">
                          <Landmark size={18} className="text-emerald-400" />
                          <span className="text-xs font-bold text-white">Bank Balances</span>
                       </div>
                       <span className="text-[10px] text-emerald-400 font-bold uppercase">SYNCED</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex items-center space-x-3">
                          <Briefcase size={18} className="text-indigo-400" />
                          <span className="text-xs font-bold text-white">Project Portfolios</span>
                       </div>
                       <span className="text-[10px] text-emerald-400 font-bold uppercase">LOADED</span>
                    </div>
                 </div>
              </div>

              <div>
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">AI Consultant Focus</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {['Growth', 'Efficiency', 'Risk', 'Compliance', 'Sustainability', 'M&A'].map(f => (
                      <div key={f} className={`p-3 rounded-xl border text-[10px] font-black uppercase text-center cursor-pointer transition-all ${f === 'Growth' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}>
                         {f}
                      </div>
                    ))}
                 </div>
              </div>

              <div className="flex-1 flex flex-col justify-end">
                 <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                       <Info size={14} className="text-gray-500" />
                       <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Industry Benchmark</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed italic">
                       "Your current ROI is <span className="text-emerald-400 font-bold">4.2% higher</span> than the Deloitte global median for infrastructure developers."
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Strategy Output */}
        <div className="flex-1 glass-panel rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col bg-gradient-to-br from-[#0c0c14] to-[#030305] relative">
           
           {isGenerating ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                   <div className="w-32 h-32 rounded-full border-t-2 border-amber-500 animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={48} className="text-amber-400 animate-pulse" />
                   </div>
                </div>
                <div className="text-center">
                   <h3 className="text-xl font-bold text-white mb-2">Generating Strategic Intelligence...</h3>
                   <p className="text-xs text-gray-500 font-mono tracking-widest animate-pulse">SWOT_GEN • SCENARIO_MODELING • BENCHMARKING_GLOBAL_MARKETS</p>
                </div>
             </div>
           ) : activeStrategy ? (
             <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                {/* Strategy Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-end bg-white/[0.02]">
                   <div>
                      <h2 className="text-3xl font-black text-white">{activeStrategy.title}</h2>
                      <div className="flex items-center space-x-6 mt-3">
                         <div className="flex items-center space-x-2">
                            <Star size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Strategic Viability Score: {activeStrategy.score}/100</span>
                         </div>
                         <div className="text-[10px] font-mono text-gray-600">CONFIDENCE: 98.4%</div>
                      </div>
                   </div>
                   <button className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-[10px] font-bold text-gray-400 border border-white/10 transition-all">
                      <Download size={16} />
                      <span>DOWNLOAD EXECUTIVE DECK</span>
                   </button>
                </div>

                {/* Strategy Grid */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                   
                   {/* SWOT Analysis */}
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Internal Factors (SW)</h4>
                         <div className="grid grid-cols-1 gap-3">
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                               <div className="text-[10px] text-emerald-400 font-bold uppercase mb-3">Strengths</div>
                               <ul className="space-y-2">
                                  {activeStrategy.swot.strengths.map((s, i) => (
                                    <li key={i} className="text-xs text-gray-300 flex items-center space-x-2">
                                       <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                                       <span>{s}</span>
                                    </li>
                                  ))}
                               </ul>
                            </div>
                            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
                               <div className="text-[10px] text-red-400 font-bold uppercase mb-3">Weaknesses</div>
                               <ul className="space-y-2">
                                  {activeStrategy.swot.weaknesses.map((s, i) => (
                                    <li key={i} className="text-xs text-gray-300 flex items-center space-x-2">
                                       <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                       <span>{s}</span>
                                    </li>
                                  ))}
                               </ul>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">External Factors (OT)</h4>
                         <div className="grid grid-cols-1 gap-3">
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4">
                               <div className="text-[10px] text-blue-400 font-bold uppercase mb-3">Opportunities</div>
                               <ul className="space-y-2">
                                  {activeStrategy.swot.opportunities.map((s, i) => (
                                    <li key={i} className="text-xs text-gray-300 flex items-center space-x-2">
                                       <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                       <span>{s}</span>
                                    </li>
                                  ))}
                               </ul>
                            </div>
                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
                               <div className="text-[10px] text-amber-400 font-bold uppercase mb-3">Threats</div>
                               <ul className="space-y-2">
                                  {activeStrategy.swot.threats.map((s, i) => (
                                    <li key={i} className="text-xs text-gray-300 flex items-center space-x-2">
                                       <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                                       <span>{s}</span>
                                    </li>
                                  ))}
                               </ul>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Strategic Recommendations */}
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Core Strategic Directives</h4>
                      <div className="space-y-3">
                         {activeStrategy.recommendations.map((rec, i) => (
                           <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/[0.08] transition-all flex items-start space-x-6">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                 <Zap size={24} />
                              </div>
                              <div className="flex-1">
                                 <div className="text-[9px] text-amber-500/60 font-black uppercase mb-1">DIRECTIVE_{i+1}</div>
                                 <p className="text-sm font-bold text-white leading-relaxed">{rec}</p>
                              </div>
                              <button className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black rounded-xl text-[10px] font-black uppercase transition-all">
                                 MODEL SCENARIO
                              </button>
                           </div>
                         ))}
                      </div>
                   </div>

                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-30">
                <Brain size={80} className="text-gray-600" />
                <div className="text-center">
                   <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Awaiting Decision Logic</h3>
                   <p className="text-xs text-gray-600 mt-2">Initiate the strategic engine to generate autonomous executive recommendations.</p>
                </div>
             </div>
           )}

        </div>
      </div>

      {/* AI Consulting Chat Overlay */}
      <div className="absolute bottom-6 right-6 w-96 h-12 glass-panel border border-amber-500/30 rounded-2xl flex items-center px-4 space-x-3 cursor-pointer hover:h-96 transition-all group overflow-hidden">
         <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black">
            <MessageSquare size={16} />
         </div>
         <div className="flex-1">
            <div className="text-xs font-bold text-white group-hover:hidden">Talk to Anitha AI Strategy Consultant</div>
            <div className="hidden group-hover:flex flex-col h-full py-4">
               <div className="text-xs font-bold text-amber-400 mb-4 uppercase tracking-widest">Anitha Strategic Chat</div>
               <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  <div className="bg-white/5 p-3 rounded-xl text-[10px] text-gray-300">
                     Hello CEO. I have analyzed your portfolio. Would you like to see the risk impact of a 50bps rate hike on your Riyadh projects?
                  </div>
               </div>
               <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Type message..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
