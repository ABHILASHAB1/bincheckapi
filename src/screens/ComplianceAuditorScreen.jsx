import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, AlertCircle, CheckCircle2, Info, 
  ChevronRight, RefreshCw, Database, FileText, Lock, 
  Globe, ShieldAlert, Zap, Download, BarChart3, Clock
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { ReportingEngine } from '../utils/reportingEngine';

const COMPLIANCE_FRAMEWORKS = [
  { id: 'pci', name: 'PCI-DSS v4.0', status: 'PASS', score: 98, lastAudit: '2026-05-01' },
  { id: 'iso', name: 'ISO 27001:2022', status: 'PASS', score: 100, lastAudit: '2026-04-20' },
  { id: 'gdpr', name: 'GDPR / Data Sovereignty', status: 'PASS', score: 95, lastAudit: '2026-05-05' },
  { id: 'mada', name: 'mada SPG Standard', status: 'WARN', score: 82, lastAudit: '2026-05-09' },
  { id: 'soc2', name: 'SOC2 Type II', status: 'PASS', score: 99, lastAudit: '2026-03-15' },
];

export default function ComplianceAuditorScreen() {
  const { transactions: dbLogs } = useSimulation();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState(COMPLIANCE_FRAMEWORKS[0]);
  const [activeReport, setActiveReport] = useState(null);

  const startAuditScan = (framework) => {
    setIsScanning(true);
    setActiveReport(null);
    setSelectedFramework(framework);

    // Simulate Deep Audit Scan
    setTimeout(() => {
      const results = {
        frameworkId: framework.id,
        timestamp: new Date().toISOString(),
        nodesChecked: 124,
        violations: framework.id === 'mada' ? 3 : 0,
        summary: framework.id === 'mada' 
          ? "Minor deviations detected in POS Entry Mode (Field 22) across 12% of domestic transactions. Recommend immediate patch for SPG-4 compliance."
          : `Full alignment detected across all 12 controls for ${framework.name}. Data residency and encryption protocols verified.`,
        details: [
          { control: 'Data Encryption', status: 'PASS', detail: 'AES-256 verified at rest and in transit.' },
          { control: 'Access Control', status: 'PASS', detail: 'MFA and RBAC integrity confirmed.' },
          { control: 'Log Integrity', status: 'PASS', detail: 'Immutable audit logs active.' },
          { control: 'Network Segregation', status: 'PASS', detail: 'VPC isolation verified.' }
        ]
      };
      setActiveReport(results);
      setIsScanning(false);
    }, 2000);
  };

  const generateBoardReport = async () => {
    const report = await ReportingEngine.generateExecutiveReport({
       insights: [
         "Platform-wide compliance maintained at 98.4% average.",
         "ISO 27001 recertification completed with zero findings.",
         "Action required: Minor alignment needed for mada SPG-4 update."
       ]
    });
    ReportingEngine.exportToPDF(report);
  };

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#030305]">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 mb-3">
            <Lock size={12} />
            <span>Enterprise Regulatory Intelligence</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            Global Compliance & Risk Command
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Real-time multi-framework audit monitoring, regulatory health scoring, and autonomous board report generation for institutional compliance.
          </p>
        </div>

        <div className="flex items-center space-x-4">
           <button 
             onClick={generateBoardReport}
             className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-white/10 transition-all flex items-center space-x-2"
           >
              <FileText size={16} className="text-emerald-400" />
              <span>Export Executive Report</span>
           </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left: Framework Sidebar */}
        <div className="w-80 flex flex-col space-y-4">
           <div className="flex-1 glass-panel rounded-3xl border border-white/5 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Regulatory Frameworks</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                 {COMPLIANCE_FRAMEWORKS.map(fw => (
                   <div 
                     key={fw.id} 
                     onClick={() => startAuditScan(fw)}
                     className={`p-4 rounded-2xl border transition-all cursor-pointer group
                       ${selectedFramework?.id === fw.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-transparent hover:bg-white/[0.08]'}`}
                   >
                      <div className="flex justify-between items-start mb-2">
                         <div className="text-[10px] font-bold text-gray-500 uppercase">{fw.name}</div>
                         <div className={`w-2 h-2 rounded-full ${fw.status === 'PASS' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                      </div>
                      <div className="flex justify-between items-end">
                         <div>
                            <div className="text-lg font-black text-white">{fw.score}%</div>
                            <div className="text-[9px] text-gray-600 font-mono">Last: {fw.lastAudit}</div>
                         </div>
                         <div className={`text-[10px] font-black ${fw.status === 'PASS' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {fw.status}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right: Audit Intelligence Dashboard */}
        <div className="flex-1 glass-panel rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col bg-gradient-to-br from-[#0c0c14] to-[#030305] relative">
           
           {isScanning ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                   <div className="w-32 h-32 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck size={48} className="text-emerald-400 animate-pulse" />
                   </div>
                </div>
                <div className="text-center">
                   <h3 className="text-xl font-bold text-white mb-2">Executing Deep Forensic Audit...</h3>
                   <p className="text-xs text-gray-500 font-mono tracking-widest animate-pulse">VERIFYING_CONTROLS • ANALYZING_AUDIT_TRAILS • CALCULATING_RISK_INDEX</p>
                </div>
             </div>
           ) : activeReport ? (
             <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Audit Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-end bg-white/[0.02]">
                   <div>
                      <h2 className="text-3xl font-black text-white tracking-tight">{selectedFramework.name} Audit</h2>
                      <div className="flex items-center space-x-6 mt-3">
                         <div className="flex items-center space-x-2">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{activeReport.nodesChecked} Control Points Scanned</span>
                         </div>
                         <div className="text-[10px] font-mono text-gray-600">AUDIT_TOKEN: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                      </div>
                   </div>
                   <div className="flex items-center space-x-3">
                      <div className="text-right mr-4">
                         <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Health Score</div>
                         <div className={`text-2xl font-black ${selectedFramework.score > 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>{selectedFramework.score}%</div>
                      </div>
                   </div>
                </div>

                {/* Audit Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                   
                   {/* Summary Insight */}
                   <div className={`p-6 rounded-3xl border flex items-start space-x-6 relative overflow-hidden
                      ${activeReport.violations > 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
                         ${activeReport.violations > 0 ? 'bg-yellow-500 text-black' : 'bg-emerald-500 text-black'}`}>
                         {activeReport.violations > 0 ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                      </div>
                      <div>
                         <h4 className="text-lg font-bold text-white mb-1">Autonomous Audit Summary</h4>
                         <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">{activeReport.summary}</p>
                      </div>
                   </div>

                   {/* Control Grid */}
                   <div className="grid grid-cols-2 gap-6">
                      {activeReport.details.map((detail, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-6 group hover:bg-white/[0.08] transition-all">
                           <div className="flex justify-between items-center mb-3">
                              <span className="text-xs font-bold text-white">{detail.control}</span>
                              <span className="text-[9px] font-black text-emerald-400 uppercase">{detail.status}</span>
                           </div>
                           <p className="text-[10px] text-gray-500 leading-relaxed">{detail.detail}</p>
                           <div className="mt-4 flex items-center text-[8px] font-mono text-gray-600">
                              <ShieldCheck size={10} className="mr-1" /> CRYPTO_HASH_VERIFIED
                           </div>
                        </div>
                      ))}
                   </div>

                   {/* Strategic Advisory Overlay */}
                   <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-3xl p-8 flex items-center justify-between group overflow-hidden relative">
                      <div className="absolute -left-10 top-0 h-full w-40 bg-indigo-600/10 blur-[100px] pointer-events-none"></div>
                      <div className="flex items-center space-x-6 relative z-10">
                         <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl">
                            <Zap size={32} />
                         </div>
                         <div>
                            <h4 className="text-lg font-bold text-white">Board-Level Risk Insight</h4>
                            <p className="text-xs text-indigo-200/60 max-w-xl mt-1">
                               AI suggests that while <span className="text-white font-bold">{selectedFramework.name}</span> is stable, evolving <span className="text-white font-bold">SAMA Open Banking standards</span> will require a technical upgrade in Q4 to maintain this posture.
                            </p>
                         </div>
                      </div>
                      <button className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white uppercase border border-white/10 transition-all active:scale-95 z-10">
                         Schedule Migration
                      </button>
                   </div>

                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-30">
                <ShieldCheck size={80} className="text-gray-600" />
                <div className="text-center">
                   <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Select Audit Framework</h3>
                   <p className="text-xs text-gray-600 mt-2">Initialize forensic analysis to verify regulatory compliance across the global ecosystem.</p>
                </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
}
