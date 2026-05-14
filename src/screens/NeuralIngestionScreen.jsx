import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, FileSpreadsheet, FileJson, Database, BrainCircuit, 
  CheckCircle2, AlertTriangle, ChevronRight, Activity, ScanLine, 
  Lock, Network, Zap, PieChart
} from 'lucide-react';

export default function NeuralIngestionScreen() {
  const [ingestState, setIngestState] = useState('idle'); // idle, processing, complete
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [fileName, setFileName] = useState('Q3_Financial_Master.xlsx');
  const fileInputRef = useRef(null);

  const steps = [
    'Parsing Raw Binary Stream...',
    'Running Neural Schema Auto-Detection...',
    'Vectorizing Textual Metadata...',
    'Mapping Financial Heuristics...',
    'Detecting Outliers & Anomalies...',
    'Finalizing Read-Only Overlay...'
  ];

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
    
    setIngestState('processing');
    setProgress(0);
    
    let stepIndex = 0;
    setCurrentStep(steps[0]);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIngestState('complete');
          return 100;
        }
        
        // Update steps based on progress
        if (p > (stepIndex + 1) * (100 / steps.length) && stepIndex < steps.length - 1) {
          stepIndex++;
          setCurrentStep(steps[stepIndex]);
        }
        
        return p + 2;
      });
    }, 50);
  };

  const resetEngine = () => {
    setIngestState('idle');
    setProgress(0);
  };

  return (
    <div className="h-full w-full flex flex-col p-8 space-y-6 overflow-hidden bg-[#030305] text-gray-200 relative">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-black/40 border border-cyan-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
             <Database size={24} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
              Neural Data Ingestion
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em] mt-1 uppercase flex items-center">
              <Lock size={10} className="mr-1.5 text-emerald-400" />
              Immutable Read-Only Layer Active
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10 flex flex-col items-center justify-center">
        
        {/* IDLE STATE: Dropzone */}
        {ingestState === 'idle' && (
          <div className="w-full max-w-4xl animate-in fade-in zoom-in duration-500">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUpload} 
              style={{ display: 'none' }}
              accept=".xlsx,.csv,.xml,.json,.txt" 
            />
            <div 
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
              className="w-full glass-panel border border-dashed border-white/20 hover:border-cyan-400/50 rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-cyan-500/5 group"
            >
              <div className="w-24 h-24 bg-black/50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                 <UploadCloud size={40} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-3">Drop Enterprise Datasets Here</h2>
              <p className="text-sm text-gray-400 max-w-lg leading-relaxed mb-8 font-mono">
                Supports Primavera XML, SAP Exports, Excel (.xlsx), CSV, MT940, and JSON. Original files are never modified.
              </p>
              
              <div className="flex space-x-6">
                <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                  <FileSpreadsheet size={14} className="mr-2 text-emerald-400" /> Excel / CSV
                </div>
                <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                  <FileJson size={14} className="mr-2 text-indigo-400" /> Primavera / XML
                </div>
                <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                  <Network size={14} className="mr-2 text-rose-400" /> ISO / MT940
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROCESSING STATE */}
        {ingestState === 'processing' && (
          <div className="w-full max-w-3xl animate-in fade-in duration-300 flex flex-col items-center text-center">
            <div className="relative mb-12">
               <div className="w-32 h-32 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-400/30 animate-[spin_4s_linear_infinite]">
                 <ScanLine size={40} className="text-cyan-400 animate-pulse" />
               </div>
               <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl"></div>
            </div>
            
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Ingesting Enterprise Architecture</h2>
            <p className="text-xs font-mono text-cyan-400 mb-8">{currentStep}</p>

            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all duration-75"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-[10px] font-mono text-gray-500 mt-3">{Math.round(progress)}% SYNTHESIZED</div>
          </div>
        )}

        {/* COMPLETE STATE: Insights Overlay */}
        {ingestState === 'complete' && (
          <div className="w-full h-full flex gap-6 animate-in slide-in-from-bottom-8 fade-in duration-700">
            
            {/* Left Column: Schema & Data Preview */}
            <div className="flex-[2] flex flex-col gap-6">
               <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">AI Schema Mapping</h3>
                      <p className="text-[9px] font-mono text-cyan-400 mt-1 flex items-center">
                        <FileSpreadsheet size={10} className="mr-1" /> Source: {fileName}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center">
                      <CheckCircle2 size={12} className="mr-1" /> 14.2M Rows Ingested
                    </div>
                  </div>

                  {/* Schema Detection Visual */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {['Cost Center', 'Revenue (YTD)', 'Date', 'Risk Variance'].map((col, idx) => (
                      <div key={idx} className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500/50"></div>
                        <span className="text-[10px] font-mono text-gray-500 mb-1">Source Column: {idx}</span>
                        <span className="text-xs font-bold text-white">{col}</span>
                        <div className="mt-2 text-[8px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded w-max uppercase font-bold border border-indigo-500/30">
                          {idx === 1 ? 'FLOAT64' : idx === 2 ? 'DATETIME' : 'STRING'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Data Preview Table */}
                  <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] text-[9px] font-black text-gray-500 uppercase tracking-widest">
                          <th className="p-3 border-b border-white/5">Cost Center</th>
                          <th className="p-3 border-b border-white/5">Revenue (YTD)</th>
                          <th className="p-3 border-b border-white/5">Date</th>
                          <th className="p-3 border-b border-white/5">Risk Variance</th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px] font-mono text-gray-300">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="p-3 border-b border-white/5">CST-ME-01</td>
                          <td className="p-3 border-b border-white/5 text-emerald-400">$14,204,500</td>
                          <td className="p-3 border-b border-white/5">2026-10-01</td>
                          <td className="p-3 border-b border-white/5"><span className="px-2 py-0.5 bg-white/5 rounded text-gray-400">Normal</span></td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] bg-rose-500/5 relative">
                          <td className="p-3 border-b border-white/5">CST-EU-14</td>
                          <td className="p-3 border-b border-white/5 text-rose-400">$2,100,000</td>
                          <td className="p-3 border-b border-white/5">2026-10-01</td>
                          <td className="p-3 border-b border-white/5 flex items-center"><AlertTriangle size={12} className="text-rose-400 mr-2" /> <span className="text-rose-400 font-bold">High Deviation</span></td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="p-3">CST-APAC-08</td>
                          <td className="p-3 text-emerald-400">$8,450,200</td>
                          <td className="p-3">2026-10-01</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-white/5 rounded text-gray-400">Normal</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

            {/* Right Column: AI Consulting Insights */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 to-transparent flex-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
                
                <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center mb-6">
                  <BrainCircuit size={16} className="mr-2" /> Synthesized Insights
                </h3>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                       <PieChart size={14} className="text-cyan-400" />
                       <h4 className="text-xs font-bold text-white">European Sector Contraction</h4>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                      Anomaly detected in <span className="text-rose-400 bg-rose-500/10 px-1 rounded">CST-EU-14</span>. Revenue is tracking 22% below the baseline forecast. AI models suggest macroeconomic headwinds in the DACH region.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                       <Zap size={14} className="text-emerald-400" />
                       <h4 className="text-xs font-bold text-white">Forecasting Suggestion</h4>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                      Reallocate $1.2M from EU Capex budget into APAC operational channels to stabilize Q4 portfolio yields. Confidence score: <span className="text-emerald-400 font-bold">94.2%</span>.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                   <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                     Generate Board Report
                   </button>
                   <button onClick={resetEngine} className="w-full mt-3 py-3 bg-transparent border border-white/10 hover:bg-white/5 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                     Ingest New Dataset
                   </button>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
