import React, { useState } from 'react';
import { 
  Globe, Landmark, ShieldCheck, Activity, TrendingUp, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Zap, Clock,
  Search, Filter, Layers, Database, PieChart, BarChart3,
  Lock, AlertTriangle, CheckCircle2, LayoutGrid, List
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

const ASSETS = [
  { id: 'SAR-CASH', name: 'Treasury Liquid Cash', balance: '1.24B', change: '+2.4%', status: 'STABLE', icon: Landmark },
  { id: 'EQUITY-INTL', name: 'International Equities', balance: '840M', change: '-0.8%', status: 'VOLATILE', icon: Activity },
  { id: 'FIXED-INCOME', name: 'Fixed Income Bonds', balance: '2.15B', change: '+0.1%', status: 'STABLE', icon: Database },
  { id: 'RE-REIT', name: 'Real Estate REITs', balance: '450M', change: '+5.2%', status: 'GROWTH', icon: Globe },
];

export default function BankingIntelligenceScreen() {
  const { marketPulse } = useSimulation();
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#030305]">
      
      {/* Bloomberg-style Ticker Tape */}
      <div className="h-10 bg-black/40 border-y border-white/5 flex items-center overflow-hidden">
         <div className="flex animate-scroll whitespace-nowrap space-x-12">
            {Object.entries(marketPulse?.data || {}).map(([key, val], i) => (
              <div key={i} className="flex items-center space-x-2">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{key}</span>
                 <span className={`text-[10px] font-mono font-bold text-emerald-500`}>
                    {val} ▲
                 </span>
              </div>
            ))}
         </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 mb-3">
            <ShieldCheck size={12} />
            <span>BlackRock Aladdin Standard</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            Global Banking & Treasury Intelligence
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Institutional-grade liquidity monitoring, risk exposure scoring, and real-time treasury analytics for multi-asset class portfolios.
          </p>
        </div>

        <div className="flex items-center space-x-4">
           <div className="bg-black/60 border border-white/10 px-6 py-3 rounded-2xl flex items-center space-x-6 shadow-2xl">
              <div className="text-center">
                 <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">Portfolio Value</div>
                 <div className="text-xl text-white font-mono font-black">4.68B SAR</div>
              </div>
              <div className="h-10 w-px bg-white/5"></div>
              <div className="text-center">
                 <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">VaR (95%)</div>
                 <div className="text-xl text-red-400 font-mono font-black">12.4M</div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Asset Tree */}
        <div className="w-80 flex flex-col space-y-4">
           <div className="flex-1 glass-panel rounded-3xl border border-white/5 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search Assets..." 
                      className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                 {ASSETS.map(asset => (
                   <div 
                     key={asset.id} 
                     onClick={() => setSelectedAsset(asset)}
                     className={`p-4 rounded-2xl border transition-all cursor-pointer group
                       ${selectedAsset.id === asset.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-transparent hover:bg-white/[0.08]'}`}
                   >
                      <div className="flex items-center space-x-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                           ${asset.change.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            <asset.icon size={20} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-mono text-gray-500 uppercase">{asset.id}</div>
                            <div className="text-xs font-bold text-white truncate">{asset.name}</div>
                         </div>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                         <div className="text-lg font-black text-white">{asset.balance}</div>
                         <div className={`text-[10px] font-bold ${asset.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                            {asset.change}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right: Asset Intelligence Command */}
        <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
           
           {/* Top: Liquidity & Risk Grid */}
           <div className="grid grid-cols-12 gap-6 h-[400px]">
              {/* Main Chart Card */}
              <div className="col-span-8 glass-panel rounded-[2.5rem] border border-white/10 p-8 flex flex-col bg-gradient-to-br from-[#0c0c14] to-[#030305] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <TrendingUp size={160} />
                 </div>
                 <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                       <h3 className="text-xl font-bold text-white mb-1">{selectedAsset.name} Terminal</h3>
                       <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Live Market Propagation • ISIN: {Math.random().toString(36).substr(2, 12).toUpperCase()}</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-black/40 border border-white/5 p-1 rounded-xl">
                       {['1D', '1W', '1M', '1Y', 'ALL'].map(t => (
                         <button key={t} className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${t === '1M' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white'}`}>
                            {t}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Visualization Mockup */}
                 <div className="flex-1 flex items-end justify-between px-4 pb-4">
                    {[35, 42, 38, 55, 48, 62, 58, 75, 68, 85, 82, 95].map((h, i) => (
                      <div key={i} className="w-10 bg-gradient-to-t from-emerald-500/10 to-emerald-500/40 rounded-t-lg relative group transition-all hover:scale-x-110" style={{ height: `${h}%` }}>
                         <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-emerald-400 font-bold">
                            {h}M
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Risk Exposure Panel */}
              <div className="col-span-4 glass-panel rounded-[2.5rem] border border-white/10 p-8 flex flex-col bg-black/20">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center mb-6">
                    <AlertTriangle size={14} className="mr-2 text-red-500" /> Risk Exposure Center
                 </h4>
                 
                 <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-gray-500 uppercase tracking-widest">Market Volatility</span>
                          <span className="text-emerald-400">LOW</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '24%' }}></div>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-gray-500 uppercase tracking-widest">Liquidity Risk</span>
                          <span className="text-yellow-400">MEDIUM</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500" style={{ width: '58%' }}></div>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-gray-500 uppercase tracking-widest">Credit Exposure</span>
                          <span className="text-emerald-400">STABLE</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '12%' }}></div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <div className="text-[10px] text-red-400 font-black uppercase mb-1 flex items-center">
                       <Zap size={12} className="mr-1.5" /> Margin Alert
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                       Asset <span className="text-white font-bold">{selectedAsset.id}</span> approaching liquidity threshold. Simulation suggests <span className="text-white font-bold">12% liquidation</span> needed to maintain compliance.
                    </p>
                 </div>
              </div>
           </div>

           {/* Bottom: Transaction Intelligence Stream */}
           <div className="flex-1 glass-panel rounded-[2rem] border border-white/10 overflow-hidden flex flex-col bg-black/20">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                 <div className="flex items-center space-x-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Intelligence Flow</h4>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                       <RefreshCw size={10} className="animate-spin" />
                       <span>LIVE_SOCKET_ACTIVE</span>
                    </div>
                 </div>
                 <button className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors">VIEW FULL AUDIT TRAIL</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                       <tr className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                          <th className="px-4 pb-2">Timestamp</th>
                          <th className="px-4 pb-2">Asset / Description</th>
                          <th className="px-4 pb-2">MTI / Type</th>
                          <th className="px-4 pb-2">Amount</th>
                          <th className="px-4 pb-2">Risk Score</th>
                          <th className="px-4 pb-2">Status</th>
                       </tr>
                    </thead>
                    <tbody className="space-y-2">
                       {[
                         { t: '12:45:01', desc: 'SAMA RTGS / Settlement', mti: '0200', amt: '450,000.00', risk: '1.2', status: 'SETTLED' },
                         { t: '12:44:52', desc: 'STC Pay / Wallet Top-up', mti: '0100', amt: '12,500.00', risk: '0.4', status: 'AUTHORIZED' },
                         { t: '12:44:38', desc: 'International SWIFT / USD', mti: 'MT103', amt: '840,200.00', risk: '4.8', status: 'PENDING' },
                         { t: '12:44:15', desc: 'Domestic POS / Al-Rajhi', mti: '0100', amt: '1,240.00', risk: '0.2', status: 'SETTLED' },
                       ].map((tx, i) => (
                         <tr key={i} className="bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                            <td className="px-4 py-3 rounded-l-xl text-[10px] font-mono text-gray-500">{tx.t}</td>
                            <td className="px-4 py-3">
                               <div className="text-xs font-bold text-white">{tx.desc}</div>
                            </td>
                            <td className="px-4 py-3 text-[10px] font-mono text-gray-400">{tx.mti}</td>
                            <td className="px-4 py-3 text-xs font-black text-white">{tx.amt} <span className="text-[9px] font-normal text-gray-500">SAR</span></td>
                            <td className="px-4 py-3">
                               <div className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block ${parseFloat(tx.risk) > 3 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                  {tx.risk}
                               </div>
                            </td>
                            <td className="px-4 py-3 rounded-r-xl">
                               <div className="flex items-center space-x-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'SETTLED' ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>
                                  <span className="text-[10px] font-black text-gray-400">{tx.status}</span>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
