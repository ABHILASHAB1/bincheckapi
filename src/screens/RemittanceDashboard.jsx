import React, { useState, useEffect } from 'react';
import { 
  Globe, ArrowRightLeft, TrendingUp, ShieldCheck, 
  Info, Zap, BarChart3, ArrowUpRight, Search, Landmark, CreditCard, Clock, Activity, Sparkles, ChevronRight, AlertCircle
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

function RemittanceDashboard() {
  const { fxRates } = useSimulation();
  const [amount, setAmount] = useState(1000);
  const [selectedCorridor, setSelectedCorridor] = useState('SAR_INR');
  const [activeRates, setActiveRates] = useState([]);

  useEffect(() => {
    if (fxRates && fxRates.length > 0) {
      setActiveRates(fxRates);
    }
  }, [fxRates]);

  const currentRateData = activeRates.find(r => r.pair === selectedCorridor) || activeRates[0];

  const getCurrencySymbol = (pair) => {
    if (pair?.endsWith('INR')) return '₹';
    if (pair?.endsWith('PKR')) return '₨';
    if (pair?.endsWith('PHP')) return '₱';
    if (pair?.endsWith('EGP')) return 'E£';
    return '$';
  };

  const getCorridorLabel = (pair) => {
    if (pair === 'SAR_INR') return 'India (INR)';
    if (pair === 'SAR_PKR') return 'Pakistan (PKR)';
    if (pair === 'SAR_PHP') return 'Philippines (PHP)';
    if (pair === 'SAR_EGP') return 'Egypt (EGP)';
    return pair || 'Select Corridor';
  };

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#050508] relative">
      {/* Background Mesh Gradient */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-fintech-accent/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-fintech-green/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-8">
        <div>
           <div className="flex items-center space-x-3 mb-2">
              <span className="px-2 py-0.5 rounded bg-fintech-accent/20 text-fintech-accent text-[9px] font-black uppercase tracking-widest border border-fintech-accent/30 flex items-center">
                <Sparkles size={10} className="mr-1.5" /> Intelligence Mode
              </span>
              <span className="text-[9px] text-gray-600 font-mono">NODE_FX_V4_SECURE</span>
           </div>
           <h1 className="text-4xl font-black text-white flex items-center tracking-tighter">
             <ArrowRightLeft className="mr-4 text-fintech-accent" size={32} />
             Remittance Intelligence Hub
           </h1>
        </div>

        <div className="flex space-x-4">
           <div className="glass-panel px-6 py-4 rounded-2xl border border-white/5 flex items-center space-x-4 bg-black/40">
              <div className="text-right">
                 <div className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Market Liquidity</div>
                 <div className="text-lg font-black text-fintech-green tracking-tight uppercase">Optimal</div>
              </div>
              <Activity size={20} className="text-fintech-green" />
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden relative z-10">
        
        {/* Left: Input & Corridor Select */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="glass-panel p-10 rounded-[3rem] border border-white/10 relative overflow-hidden bg-black/60 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fintech-accent to-purple-600"></div>
              
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-10">Transfer Configuration</h3>
              
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-white uppercase tracking-widest ml-1 flex justify-between">
                       <span>You Send</span>
                       <span className="text-gray-500">SAR</span>
                    </label>
                    <div className="relative group">
                       <input 
                          type="number" 
                          value={amount} 
                          onChange={(e) => setAmount(parseFloat(e.target.value))}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-6 px-8 text-3xl font-black text-white focus:border-fintech-accent focus:bg-white/[0.05] transition-all outline-none"
                       />
                       <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-fintech-accent/20 text-fintech-accent rounded-lg border border-fintech-accent/30 group-focus-within:bg-fintech-accent group-focus-within:text-white transition-all">
                          <Search size={20} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-white uppercase tracking-widest ml-1">Destination Rail</label>
                    <div className="grid grid-cols-1 gap-3 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                       {activeRates.map(r => (
                          <button 
                             key={r.pair}
                             onClick={() => setSelectedCorridor(r.pair)}
                             className={`p-5 rounded-2xl border flex items-center justify-between transition-all group shrink-0
                                ${selectedCorridor === r.pair ? 'bg-fintech-accent/10 border-fintech-accent text-white shadow-xl' : 'bg-white/[0.03] border-white/5 text-gray-500 hover:bg-white/[0.05] hover:border-white/20'}
                             `}
                          >
                             <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${selectedCorridor === r.pair ? 'bg-fintech-accent text-white' : 'bg-black/60 text-gray-400 group-hover:text-white'}`}>
                                   {r.pair.split('_')[1]}
                                </div>
                                <span className="font-black text-sm uppercase tracking-tighter">{getCorridorLabel(r.pair)}</span>
                             </div>
                             <ChevronRight size={18} className={selectedCorridor === r.pair ? 'text-fintech-accent' : 'text-gray-700'} />
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-black/60 flex items-start space-x-5 shadow-xl">
              <div className="p-3 bg-fintech-green/10 text-fintech-green rounded-2xl border border-fintech-green/20">
                 <ShieldCheck size={24} />
              </div>
              <div>
                 <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Mada Secure Pipeline</h4>
                 <p className="text-[10px] text-gray-500 leading-relaxed font-medium italic">
                    All calculations adhere to SPG-4 compliance. Final settlement rates are guaranteed for 60 seconds from ingestion.
                 </p>
              </div>
           </div>
        </div>

        {/* Center/Right: Effective Payout Analysis */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6 overflow-hidden">
           
           {/* Anitha AI Prediction Banner */}
           <div className="bg-gradient-to-r from-fintech-accent/20 to-purple-500/20 border border-fintech-accent/30 p-6 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden group shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fintech-accent/10 rounded-full blur-2xl group-hover:bg-fintech-accent/20 transition-all"></div>
              <div className="flex items-center space-x-5 relative z-10">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-fintech-accent shadow-lg animate-bounce-slow">
                    <Zap size={24} fill="currentColor" />
                 </div>
                 <div>
                    <div className="text-[9px] font-black text-fintech-accent uppercase tracking-[0.2em] mb-1">Anitha AI™ Market Pulse</div>
                    <p className="text-sm font-bold text-white tracking-tight italic">
                       "{currentRateData?.ai_recommendation || 'Analyzing corridor volatility...'}"
                    </p>
                 </div>
              </div>
              <button className="px-6 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl relative z-10">
                 Lock Best Rate
              </button>
           </div>

           <div className="flex-1 glass-panel rounded-[3.5rem] border border-white/10 p-10 bg-black/60 flex flex-col shadow-2xl overflow-hidden">
              <div className="flex justify-between items-start mb-10 shrink-0">
                 <div>
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Effective Payout Ranking</h3>
                    <p className="text-[9px] text-gray-600 mt-1.5 uppercase font-mono tracking-widest">Real-time normalization of market providers</p>
                 </div>
                 <div className="flex items-center space-x-3">
                    <span className="text-[8px] text-gray-600 uppercase font-black">Sort: High-to-Low Net Received</span>
                    <BarChart3 size={14} className="text-gray-700" />
                 </div>
              </div>

              {/* Payout Ranker */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                 {currentRateData?.all_providers?.map((provider, idx) => (
                    <div 
                       key={idx} 
                       className={`relative overflow-hidden rounded-[2.5rem] p-8 border transition-all flex items-center justify-between
                          ${idx === 0 ? 'bg-fintech-accent/5 border-fintech-accent/30 shadow-[0_0_30px_rgba(37,99,235,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}
                       `}
                    >
                       {idx === 0 && (
                          <div className="absolute top-0 right-0 px-6 py-2 bg-fintech-green text-black font-black text-[9px] uppercase tracking-widest rounded-bl-3xl">
                             BEST PAYOUT
                          </div>
                       )}

                       <div className="flex items-center space-x-8">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all ${idx === 0 ? 'bg-fintech-accent text-white border-fintech-accent/20' : 'bg-black/60 text-gray-500 border-white/5'}`}>
                             {provider.source === 'Al Rajhi' ? <Landmark size={32} /> : provider.source === 'STC Bank' ? <CreditCard size={32} /> : <ArrowUpRight size={32} />}
                          </div>
                          <div>
                             <div className="text-lg font-black text-white tracking-tighter uppercase">{provider.source}</div>
                             <div className="flex items-center space-x-4 mt-1.5">
                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Fee: <span className="text-white">SAR {provider.fee}</span></div>
                                <div className="w-1 h-1 rounded-full bg-gray-800"></div>
                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Spread: <span className="text-orange-500">{provider.hidden_spread?.toFixed(2)}%</span></div>
                             </div>
                          </div>
                       </div>

                       <div className="text-right">
                          <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Net Recipient Receives</div>
                          <div className="text-3xl font-black text-white tracking-tighter">
                             {getCurrencySymbol(selectedCorridor)} {((amount - provider.fee) * provider.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] font-mono text-fintech-accent mt-1 uppercase font-black">Effective Rate: {provider.effective_rate?.toFixed(4)}</div>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Summary Footer */}
              <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-4 gap-8 shrink-0">
                 <div className="text-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    <div className="text-[9px] text-gray-600 uppercase font-black mb-1">Spread Advantage</div>
                    <div className="text-xl font-black text-white font-mono">+{currentRateData?.market_spread?.toFixed(2)}%</div>
                 </div>
                 <div className="text-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    <div className="text-[9px] text-gray-600 uppercase font-black mb-1 text-fintech-green">Best Value</div>
                    <div className="text-xl font-black text-white uppercase tracking-tighter truncate">{currentRateData?.best_provider}</div>
                 </div>
                 <div className="text-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    <div className="text-[9px] text-gray-600 uppercase font-black mb-1 text-fintech-accent">Live Ingestion</div>
                    <div className="text-xl font-black text-white font-mono">30s PULSE</div>
                 </div>
                 <div className="text-center p-4 bg-fintech-accent/5 rounded-2xl border border-fintech-accent/20">
                    <div className="text-[9px] text-fintech-accent uppercase font-black mb-1">Est. Savings</div>
                    <div className="text-xl font-black text-white font-mono">SAR 12.40</div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

export default RemittanceDashboard;
