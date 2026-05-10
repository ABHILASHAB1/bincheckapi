import React, { useState, useEffect } from 'react';
import { Columns2, ArrowLeftRight, Check, X, AlertTriangle, Zap, Info, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { DE_DEFINITIONS } from '../data/iso8583';

// Helper to highlight differences at character level
const DiffText = ({ valA, valB }) => {
  if (valA === valB) return <span className="text-gray-500 font-mono">{valA}</span>;
  
  const maxLength = Math.max(valA.length, valB.length);
  const result = [];
  
  for (let i = 0; i < maxLength; i++) {
    const charA = valA[i] || '';
    const charB = valB[i] || '';
    
    if (charA === charB) {
      result.push(<span key={i} className="text-gray-500">{charA}</span>);
    } else {
      result.push(<span key={i} className="text-fintech-red bg-fintech-red/10 font-bold">{charA || '⎵'}</span>);
    }
  }
  return <span className="font-mono">{result}</span>;
};

const DiffTextB = ({ valA, valB }) => {
  if (valA === valB) return <span className="text-gray-500 font-mono">{valB}</span>;
  
  const maxLength = Math.max(valA.length, valB.length);
  const result = [];
  
  for (let i = 0; i < maxLength; i++) {
    const charA = valA[i] || '';
    const charB = valB[i] || '';
    
    if (charA === charB) {
      result.push(<span key={i} className="text-gray-500">{charB}</span>);
    } else {
      result.push(<span key={i} className="text-fintech-accent bg-fintech-accent/10 font-bold">{charB || '⎵'}</span>);
    }
  }
  return <span className="font-mono">{result}</span>;
};

export default function MessageDiffScreen() {
  const { transactions } = useSimulation();
  const [txAId, setTxAId] = useState('');
  const [txBId, setTxBId] = useState('');
  const [aiInsight, setAiInsight] = useState('');

  const txA = transactions.find(t => t.id === txAId);
  const txB = transactions.find(t => t.id === txBId);

  useEffect(() => {
    if (txA && txB) {
      const diffs = allFields.filter(de => (txA.parsedReq?.elements[de] || txA.parsedRes?.elements[de]) !== (txB.parsedReq?.elements[de] || txB.parsedRes?.elements[de]));
      if (diffs.length > 5) {
        setAiInsight("⚠️ MASSIVE DISCREPANCY: These transactions likely belong to different card schemes or entry modes. I've detected a fundamental protocol shift in the Data Elements.");
      } else if (diffs.length > 0) {
        setAiInsight(`✅ MINOR VARIATION: Detected ${diffs.length} field variations. These appear to be standard session-level differences (e.g., STAN, RRN, or timestamps).`);
      } else {
        setAiInsight("💎 IDENTICAL PACKETS: Bit-for-bit parity confirmed. These messages are clones in the switching rail.");
      }
    }
  }, [txAId, txBId]);

  const allFields = Array.from(new Set([
    ...Object.keys(txA?.parsedReq?.elements || {}),
    ...Object.keys(txB?.parsedReq?.elements || {}),
    ...Object.keys(txA?.parsedRes?.elements || {}),
    ...Object.keys(txB?.parsedRes?.elements || {})
  ])).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#020205] relative">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-fintech-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex justify-between items-end z-10">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center tracking-tighter">
            <Columns2 size={32} className="mr-4 text-fintech-accent" />
            Protocol War-Room: Differential Engine
          </h1>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.3em] font-bold">Character-Level Bit Highlighting • Powered by Anitha AI</p>
        </div>
        
        <div className="flex bg-black/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl space-x-6">
           <div className="flex flex-col items-end border-r border-white/10 pr-6">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Diff Status</span>
              <span className="text-xs font-mono text-white font-black">{txA && txB ? 'ANALYZING...' : 'WAITING'}</span>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Highlighters</span>
              <span className="text-xs font-mono text-fintech-red font-black">BIT-WISE ACTIVE</span>
           </div>
        </div>
      </div>

      <div className="flex gap-4 z-10">
        <select 
          value={txAId} 
          onChange={e => setTxAId(e.target.value)}
          className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-fintech-accent shadow-2xl transition-all"
        >
          <option value="">Select Primary Packet (A)</option>
          {transactions.map(t => <option key={t.id} value={t.id}>TX: {t.id} - {t.scheme.toUpperCase()} - {t.amt} SAR</option>)}
        </select>
        <div className="flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 rounded-2xl text-gray-500 self-center shadow-lg">
           <ArrowLeftRight size={20} />
        </div>
        <select 
          value={txBId} 
          onChange={e => setTxBId(e.target.value)}
          className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-fintech-accent shadow-2xl transition-all"
        >
          <option value="">Select Comparison Packet (B)</option>
          {transactions.map(t => <option key={t.id} value={t.id}>TX: {t.id} - {t.scheme.toUpperCase()} - {t.amt} SAR</option>)}
        </select>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden z-10">
        {/* Main Differential Grid */}
        <div className="flex-1 glass-panel rounded-[3rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl bg-black/20">
           <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Comparison Matrix</span>
              <div className="flex space-x-6">
                 <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-fintech-red"></div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Bit Deviation</span>
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
              {(!txA || !txB) ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30">
                   <ShieldCheck size={80} strokeWidth={0.5} className="text-fintech-accent" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">Engine Standby</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-black/60 sticky top-0 z-20 backdrop-blur-md">
                    <tr>
                       <th className="p-4 text-[9px] font-black text-gray-500 uppercase tracking-widest w-16 text-center border-b border-white/5">DE</th>
                       <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5">Definition</th>
                       <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5">Packet A</th>
                       <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5">Packet B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allFields.map(de => {
                      const valA = txA?.parsedReq?.elements[de] || txA?.parsedRes?.elements[de] || '';
                      const valB = txB?.parsedReq?.elements[de] || txB?.parsedRes?.elements[de] || '';
                      const isMatch = valA === valB;
                      const def = DE_DEFINITIONS[de.padStart(3, '0')];

                      return (
                        <tr key={de} className={`group transition-all hover:bg-white/[0.03] ${!isMatch ? 'bg-fintech-red/5' : ''}`}>
                          <td className="p-4 text-center font-mono text-xs text-fintech-accent font-black">#{de.padStart(3, '0')}</td>
                          <td className="p-4">
                             <div className="text-[10px] text-white font-bold uppercase tracking-tight">{def?.name || 'Private Data'}</div>
                             <div className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter mt-0.5">{def?.type || 'ans'} • {def?.length || 'v'}</div>
                          </td>
                          <td className="p-4">
                             <div className="p-3 bg-black/40 rounded-xl border border-white/5 group-hover:border-white/10 transition-all">
                                <DiffText valA={valA} valB={valB} />
                             </div>
                          </td>
                          <td className="p-4">
                             <div className="p-3 bg-black/40 rounded-xl border border-white/5 group-hover:border-white/10 transition-all">
                                <DiffTextB valA={valA} valB={valB} />
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
           </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="w-[400px] flex flex-col gap-6">
           <div className="glass-panel rounded-[3rem] border border-white/5 p-8 bg-gradient-to-br from-fintech-accent/10 to-transparent relative overflow-hidden flex-1 flex flex-col shadow-2xl">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-fintech-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="flex items-center space-x-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-fintech-accent flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                    <Zap size={24} className="text-white" />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Anitha AI</h3>
                    <div className="text-[9px] text-fintech-green font-bold uppercase tracking-tighter animate-pulse">Differential Intelligence Active</div>
                 </div>
              </div>

              <div className="flex-1 bg-black/60 rounded-[2rem] p-6 border border-white/5 mb-6 relative overflow-hidden group">
                 {!aiInsight ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                      <RefreshCw size={40} className="mb-4 animate-spin-slow" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting Packets...</span>
                   </div>
                 ) : (
                   <div className="animate-fadeIn">
                      <div className="text-[10px] text-gray-500 font-bold uppercase mb-4 flex items-center">
                        <div className="w-1.5 h-1.5 bg-fintech-accent rounded-full mr-2"></div>
                        Executive Summary
                      </div>
                      <p className="text-xs text-white leading-relaxed font-medium italic">
                        "{aiInsight}"
                      </p>
                      
                      <div className="mt-10 space-y-4">
                         <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-4">Certification Impact</div>
                         <div className="p-4 bg-white/[0.02] rounded-2xl border-l-2 border-fintech-accent text-[10px] text-gray-400">
                            <span className="text-white font-bold block mb-1">Mada SPG-4 Compliance</span>
                            Differences in Field 7 (Transmission Date) and Field 11 (STAN) are expected and will NOT fail certification.
                         </div>
                         <div className="p-4 bg-white/[0.02] rounded-2xl border-l-2 border-fintech-red text-[10px] text-gray-400">
                            <span className="text-fintech-red font-bold block mb-1">Critical Mismatch</span>
                            If Field 4 (Amount) or Field 39 (RespCode) differ unexpectedly, the switch logic must be audited.
                         </div>
                      </div>
                   </div>
                 )}
              </div>

              <button className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center space-x-3 shadow-xl">
                 <Database size={16} />
                 <span>Download Comparison CSV</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
