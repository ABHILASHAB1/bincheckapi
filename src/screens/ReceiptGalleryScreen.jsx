import React, { useState, useEffect } from 'react';
import { Smartphone, Search, ScrollText, ChevronRight, Download, Share2 } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export default function ReceiptRepository() {
  const { transactions } = useSimulation();
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  const dbLogs = transactions.filter(t => t.resp_code === '00');

  useEffect(() => {
    if (dbLogs.length > 0 && !selectedReceipt) {
      setSelectedReceipt(dbLogs[0]);
    }
  }, [dbLogs, selectedReceipt]);

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#0a0a0f]">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center tracking-tight">
            <ScrollText size={24} className="mr-3 text-fintech-accent" />
            Digital Receipt Repository
          </h1>
          <p className="text-sm text-gray-400 mt-1">Archived consumer receipts for all approved mada and remittance transactions.</p>
        </div>
        <div className="flex space-x-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input type="text" placeholder="Search Receipt ID..." className="bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:outline-none" />
           </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Receipt List */}
        <div className="flex-1 glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col bg-black/20">
           <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Archive</h3>
              <span className="text-[10px] text-gray-500 font-mono">{dbLogs.length} Records</span>
           </div>
           <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 custom-scrollbar">
              {dbLogs.map(log => (
                <div key={log.id} 
                   onClick={() => setSelectedReceipt(log)}
                   className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center group
                      ${selectedReceipt?.id === log.id ? 'bg-fintech-accent/10 border-fintech-accent/40 shadow-lg' : 'bg-black/40 border-white/5 hover:border-white/10'}
                   `}
                >
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-fintech-accent transition-colors">
                         <Smartphone size={20} />
                      </div>
                      <div>
                         <div className="text-xs font-bold text-white">{log.amount} SAR</div>
                         <div className="text-[9px] text-gray-500 font-mono mt-0.5 uppercase">PAN: {log.pan.slice(-4)} | {new Date(log.created_at).toLocaleDateString()}</div>
                      </div>
                   </div>
                   <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-all" />
                </div>
              ))}
           </div>
        </div>

        {/* Right: Thermal Receipt Preview */}
        <div className="w-[400px] flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-fintech-accent"></div>
           
           {!selectedReceipt ? (
             <div className="text-gray-600 italic text-xs animate-pulse">Select a transaction to preview receipt...</div>
           ) : (
             <div className="bg-[#f8f9fa] w-full rounded-sm shadow-2xl relative overflow-hidden text-black font-mono p-8 animate-slideUp transform hover:rotate-1 transition-transform cursor-crosshair">
                {/* Jagged top edge */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[#f8f9fa]" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>

                <div className="text-center mb-6">
                   <h2 className="text-xl font-black uppercase tracking-tighter">Fintech Hub</h2>
                   <p className="text-[9px] text-gray-500 uppercase mt-1">Riyadh, Saudi Arabia</p>
                   <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Ref: {selectedReceipt.rrn}</p>
                </div>

                <div className="border-t border-dashed border-gray-300 py-4 my-4 space-y-1">
                   <div className="flex justify-between text-[10px]">
                      <span className="uppercase font-bold">Transaction</span>
                      <span className="uppercase">{selectedReceipt.proc_code?.startsWith('26') ? 'REMITTANCE' : 'PURCHASE'}</span>
                   </div>
                   <div className="flex justify-between text-[10px]">
                      <span className="uppercase font-bold">Date</span>
                      <span>{new Date(selectedReceipt.created_at).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-[10px]">
                      <span className="uppercase font-bold">Trace ID</span>
                      <span>{selectedReceipt.stan}</span>
                   </div>
                   <div className="flex justify-between text-[10px]">
                      <span className="uppercase font-bold">Card No.</span>
                      <span>{selectedReceipt.pan.slice(0,6)}...{selectedReceipt.pan.slice(-4)}</span>
                   </div>
                </div>

                <div className="text-center py-8 border-y border-dashed border-gray-300 my-4">
                   <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Grand Total</div>
                   <div className="text-4xl font-black tracking-tighter">{selectedReceipt.amount} <span className="text-xs">SAR</span></div>
                   <div className="text-[8px] text-gray-500 mt-2 uppercase tracking-widest font-bold">Auth: {Math.floor(Math.random()*900000+100000)}</div>
                </div>

                <div className="space-y-1 mb-8">
                   <div className="flex justify-between text-[10px]">
                      <span className="uppercase font-bold text-gray-400">Response Code</span>
                      <span className="text-fintech-green font-black">00 - APPROVED</span>
                   </div>
                   <div className="flex justify-between text-[10px]">
                      <span className="uppercase font-bold text-gray-400">Network</span>
                      <span className="font-bold uppercase">{selectedReceipt.proc_code?.startsWith('26') ? 'CORRESPONDENT' : 'MADA'}</span>
                   </div>
                </div>

                <div className="text-center space-y-4 pt-4 border-t border-dashed border-gray-300">
                   <div className="text-[9px] uppercase font-black italic">*** Verified by SPG-4 ***</div>
                   <div className="flex gap-2">
                      <button className="flex-1 bg-black text-white text-[9px] font-black py-2 uppercase tracking-widest flex items-center justify-center space-x-2">
                         <Download size={12} /> <span>Save</span>
                      </button>
                      <button className="flex-1 border border-black text-black text-[9px] font-black py-2 uppercase tracking-widest flex items-center justify-center space-x-2">
                         <Share2 size={12} /> <span>Send</span>
                      </button>
                   </div>
                </div>

                {/* Jagged bottom edge */}
                <div className="absolute -bottom-4 left-0 w-full h-8 bg-[#f8f9fa]" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
             </div>
           )}
        </div>

      </div>

    </div>
  );
}
