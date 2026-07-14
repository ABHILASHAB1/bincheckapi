import React, { useState, useEffect } from 'react';
import { 
  Globe2, ArrowRightLeft, DollarSign, Activity, 
  ShieldAlert, CheckCircle2, Clock, Send, FileCode2
} from 'lucide-react';

export default function RemittanceDashboard() {
  const [fxRates, setFxRates] = useState([
    { pair: 'USD/SAR', rate: 3.75, trend: 'stable' },
    { pair: 'EUR/SAR', rate: 4.02, trend: 'up' },
    { pair: 'GBP/SAR', rate: 4.71, trend: 'down' },
    { pair: 'INR/SAR', rate: 0.045, trend: 'up' }
  ]);
  
  const [transactions, setTransactions] = useState([
    {
      id: 'UETR-9F3A-4B2C',
      type: 'pacs.008 (Customer Credit Transfer)',
      source: 'SA98800000001234567890',
      dest: 'US123456789012345678',
      amount: 'SAR 50,000',
      fxRate: '3.75 USD/SAR',
      settled: '$13,333.33',
      status: 'ACCC',
      time: '14:22:01'
    },
    {
      id: 'UETR-77D1-90XC',
      type: 'pain.001 (Payment Initiation)',
      source: 'SA55100000000987654321',
      dest: 'IN987654321098765432',
      amount: 'SAR 12,500',
      fxRate: '22.22 INR/SAR',
      settled: '₹277,750',
      status: 'PEND',
      time: '14:25:30'
    },
    {
      id: 'UETR-11B4-33KL',
      type: 'pacs.002 (Payment Status Report)',
      source: 'GB33445566778899001122',
      dest: 'SA11223344556677889900',
      amount: 'GBP 5,000',
      fxRate: '4.71 GBP/SAR',
      settled: 'SAR 23,550',
      status: 'RJCT',
      time: '14:28:15'
    }
  ]);

  // Simulate live FX fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setFxRates(prev => prev.map(rate => ({
        ...rate,
        rate: rate.pair === 'USD/SAR' ? 3.75 : +(rate.rate + (Math.random() * 0.02 - 0.01)).toFixed(4),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full flex flex-col p-8 space-y-6 overflow-hidden bg-[#030305] text-gray-200 relative">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
             <Globe2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center">
              Global Remittance Engine
            </h1>
            <p className="text-[10px] text-purple-400 font-mono tracking-[0.4em] mt-1 uppercase flex items-center">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse mr-2"></span>
              Live FX Spreads Active
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10 overflow-hidden flex flex-col items-center justify-center">
        
        {/* Full-screen FX Rates Engine */}
        <div className="w-full max-w-4xl bg-black/40 border border-white/10 rounded-2xl p-8 flex flex-col space-y-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Activity size={20} className="mr-3 text-purple-400" /> Real-Time Interbank FX Spreads
            </h2>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-emerald-400">
              <Clock size={12} className="animate-pulse" />
              <span>UPDATING</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {fxRates.map((fx, idx) => (
              <div key={idx} className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-6 flex justify-between items-center border border-white/5 group">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Currency Pair</span>
                  <span className="text-2xl font-black text-white">{fx.pair}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Current Rate</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-mono text-white group-hover:text-purple-400 transition-colors">{fx.rate}</span>
                    <div className={`p-2 rounded-lg ${fx.trend === 'up' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                      {fx.trend === 'up' ? (
                        <ArrowRightLeft size={20} className="text-emerald-400 rotate-[-45deg]" />
                      ) : (
                        <ArrowRightLeft size={20} className="text-rose-400 rotate-[45deg]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
