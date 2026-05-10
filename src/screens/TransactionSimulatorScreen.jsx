import React, { useState, useEffect } from 'react';
import { 
  Play, Square, Activity, Zap, Server, ShieldAlert, BarChart3, Database
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { TEST_CARDS } from '../data/testCards';

const SCENARIOS = [
  { id: 'standard', name: 'Standard Daily Traffic', desc: 'Normal distribution of purchases, 98% approval rate.', icon: Activity, color: 'text-fintech-green' },
  { id: 'blackfriday', name: 'Black Friday Load', desc: 'High TPS, increased latency on switch routing.', icon: Zap, color: 'text-fintech-accent' },
  { id: 'attack', name: 'BIN Attack Simulation', desc: 'Flood of sequential PANs, triggers fraud blocks.', icon: ShieldAlert, color: 'text-fintech-red' },
];

function TransactionSimulatorScreen() {
  const { runTransaction, vaultCards } = useSimulation();
  const [activeScenario, setActiveScenario] = useState('standard');
  const [tps, setTps] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  
  // Telemetry state
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, approved: 0, declined: 0 });
  const [sparkline, setSparkline] = useState(Array(30).fill(10));

  // Certification Runner State
  const [certTests, setCertTests] = useState([
    { id: 'v_high', name: 'SAMA High-Value (SAR 2500)', status: 'pending', detail: 'Requires Nafath MFA' },
    { id: 'v_contactless', name: 'mada Contactless Limit', status: 'pending', detail: 'Rule: > 300 SAR triggers Chip' },
    { id: 'v_ecom_3ds', name: 'Visa CNP / 3DS Mandate', status: 'pending', detail: '3DS Frictionless Flow' },
    { id: 'v_partial', name: 'Partial Approval (mada)', status: 'pending', detail: 'Field 6 Response Check' },
    { id: 'v_reversal', name: 'Auto-Reversal (0400)', status: 'pending', detail: 'Timeout simulation' }
  ]);
  const [isCertRunning, setIsCertRunning] = useState(false);

  const runCertSuite = async () => {
    if (vaultCards.length === 0) {
      alert('⚠️ No cards found in Vault. Please generate Saudi cards first to run certification.');
      return;
    }

    setIsCertRunning(true);
    const updatedTests = [...certTests].map(t => ({ ...t, status: 'running' }));
    setCertTests(updatedTests);

    // Pick a mada card for Saudi tests
    const madaCard = vaultCards.find(c => c.scheme === 'mada') || vaultCards[0];
    const visaCard = vaultCards.find(c => c.scheme === 'Visa') || vaultCards[0];

    const runOne = (idx, data) => {
      return new Promise((resolve) => {
        runTransaction({
          ...data,
          track2: data.track2 || `${data.pan}=2512101000000000`,
          emvData: data.scheme === 'mada' ? '9F2608...9F1007...' : null
        });
        setTimeout(() => {
          setCertTests(prev => {
            const next = [...prev];
            next[idx].status = 'success';
            return next;
          });
          resolve();
        }, 2500);
      });
    };

    // --- mada/SAMA CERTIFICATION SCENARIOS ---
    await runOne(0, { pan: madaCard.pan, scheme: 'mada', amount: '000000025000', mti: '0200', posEntry: '051', desc: 'SAMA High-Value Purchase' });
    await runOne(1, { pan: madaCard.pan, scheme: 'mada', amount: '000000003500', mti: '0200', posEntry: '071', desc: 'mada Contactless Validation' });
    await runOne(2, { pan: visaCard.pan, scheme: 'Visa', amount: '000000010000', mti: '0100', posEntry: '812', desc: 'Visa CNP 3DS Mandate' });
    await runOne(3, { pan: madaCard.pan, scheme: 'mada', amount: '000000009999', mti: '0200', posEntry: '051', desc: 'mada Partial Approval Check' });
    await runOne(4, { pan: visaCard.pan, scheme: 'Visa', amount: '000000005000', mti: '0400', posEntry: '051', desc: 'Auto-Reversal Consistency' });

    setIsCertRunning(false);
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        // Fire transactions based on TPS
        
        setSparkline(prev => {
          const next = [...prev.slice(1)];
          const base = activeScenario === 'blackfriday' ? 80 : (activeScenario === 'attack' ? 95 : 40);
          next.push(base + Math.random() * 20 - 10);
          return next;
        });

        // Trigger a real transaction occasionally so dashboard updates
        if (Math.random() < 0.2) {
          const isAttack = activeScenario === 'attack';
          
          // Selection logic: Prioritize Cloud Vault, fallback to static
          const availableCards = vaultCards.length > 0 ? vaultCards : TEST_CARDS;
          const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
          
          const targetPan = isAttack 
            ? '411122220000' + Math.floor(1000 + Math.random() * 9000) 
            : (randomCard?.pan || '4111222233334444');

          // Build High-Fidelity Data Elements (Track 2 & EMV)
          const track2 = randomCard?.track2 || `${targetPan}=2512101000000000`;
          const emvData = randomCard?.scheme === 'mada' ? '9F2608...9F1007...' : null; // Dynamic EMV stub

          runTransaction({
            mti: '0100',
            pan: targetPan,
            procCode: '000000',
            amount: Math.floor(Math.random() * 50000).toString().padStart(12, '0'),
            date: new Date().toISOString().replace(/-/g, '').replace(/:/g, '').replace(/T/g, '').slice(4, 14),
            stan: Math.floor(Math.random() * 999999).toString().padStart(6, '0'),
            posEntry: '051',
            track2,
            emvData
          });
        }

        setStats(prev => {
          const addTotal = Math.max(1, Math.floor(tps / 10));
          const addDeclined = activeScenario === 'attack' ? Math.floor(addTotal * 0.8) : Math.floor(addTotal * 0.02);
          const addApproved = addTotal - addDeclined;
          return {
            total: prev.total + addTotal,
            approved: prev.approved + addApproved,
            declined: prev.declined + addDeclined
          };
        });

        setProgress(prev => {
          if (prev >= 100) {
            setIsRunning(false);
            return 100;
          }
          return prev + (100 / (tps * 2)); // Artificial progress speed
        });

      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeScenario, tps, runTransaction]);

  const toggleSimulation = () => {
    if (!isRunning) {
      setProgress(0);
      setStats({ total: 0, approved: 0, declined: 0 });
    }
    setIsRunning(!isRunning);
  };

  return (
    <div className="h-full w-full flex overflow-hidden p-6 gap-6">
      
      {/* Left: Configuration */}
      <div className="w-[35%] flex flex-col glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fintech-accent to-blue-500"></div>
        <div className="p-4 border-b border-white/5 bg-black/20">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center">
            <Server size={16} className="mr-2 text-fintech-accent" />
            Batch & Load Configuration
          </h2>
        </div>

        <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
          
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Simulation Scenario</label>
            <div className="space-y-3">
              {SCENARIOS.map(scenario => {
                const Icon = scenario.icon;
                const isActive = activeScenario === scenario.id;
                return (
                  <div 
                    key={scenario.id}
                    onClick={() => !isRunning && setActiveScenario(scenario.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start
                      ${isActive ? 'bg-fintech-accent/10 border-fintech-accent/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-black/20 border-white/5 hover:border-white/10'}
                      ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className={`mt-0.5 mr-3 ${scenario.color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-200 mb-0.5">{scenario.name}</h3>
                      <p className="text-[10px] text-gray-500">{scenario.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target TPS (Transactions / Sec)</label>
              <span className="text-lg font-mono font-bold text-white">{tps} TPS</span>
            </div>
            <input 
              type="range" 
              min="1" max="1000" 
              value={tps}
              onChange={(e) => !isRunning && setTps(parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full accent-fintech-accent h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50" 
            />
            <div className="flex justify-between text-[9px] text-gray-600 mt-2 font-mono">
              <span>1 TPS</span>
              <span>500 TPS</span>
              <span>1000 TPS</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">mada SAMA Certification Suite</label>
            <div className="space-y-2">
              {certTests.map((test, i) => (
                <div key={test.id} className="bg-black/30 border border-white/5 rounded-lg p-2 flex items-center justify-between group">
                   <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${test.status === 'success' ? 'bg-fintech-green shadow-[0_0_8px_rgba(16,185,129,0.5)]' : test.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'}`}></div>
                      <div>
                         <div className="text-[10px] font-bold text-gray-200">{test.name}</div>
                         <div className="text-[8px] text-gray-500 font-mono">{test.detail}</div>
                      </div>
                   </div>
                   <div className="text-[8px] font-black text-gray-600 uppercase group-hover:text-gray-400 transition-colors">
                      {test.status}
                   </div>
                </div>
              ))}
              <button 
                onClick={runCertSuite}
                disabled={isCertRunning}
                className="w-full mt-4 py-2 bg-fintech-accent/20 hover:bg-fintech-accent text-fintech-accent hover:text-white border border-fintech-accent/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isCertRunning ? 'Running Compliance Suite...' : 'Run Automated Cert Suite'}
              </button>
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <button 
              onClick={toggleSimulation}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center transition-all shadow-lg
                ${isRunning 
                  ? 'bg-fintech-red text-white hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                  : 'bg-fintech-green text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                }
              `}
            >
              {isRunning ? (
                <><Square size={18} className="mr-2" fill="currentColor" /> STOP SIMULATION</>
              ) : (
                <><Play size={18} className="mr-2" fill="currentColor" /> START BATCH</>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Right: Telemetry */}
      <div className="flex-1 flex flex-col glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-600 to-gray-400"></div>
        <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center">
            <BarChart3 size={16} className="mr-2 text-gray-400" />
            Live Telemetry
          </h2>
          {isRunning && (
            <div className="flex items-center space-x-2 text-xs font-mono text-fintech-accent animate-pulse">
               <Activity size={14} /> <span>INJECTING LOAD...</span>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 flex flex-col">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-black/30 border border-white/5 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1 font-mono uppercase">Total Injected</div>
              <div className="text-3xl font-bold text-white font-mono">{stats.total.toLocaleString()}</div>
            </div>
            <div className="bg-fintech-green/5 border border-fintech-green/10 rounded-xl p-4">
              <div className="text-xs text-fintech-green/70 mb-1 font-mono uppercase">Approved</div>
              <div className="text-3xl font-bold text-fintech-green font-mono">{stats.approved.toLocaleString()}</div>
            </div>
            <div className="bg-fintech-red/5 border border-fintech-red/10 rounded-xl p-4">
              <div className="text-xs text-fintech-red/70 mb-1 font-mono uppercase">Declined/Blocked</div>
              <div className="text-3xl font-bold text-fintech-red font-mono">{stats.declined.toLocaleString()}</div>
            </div>
          </div>

          {/* Graph Simulation */}
          <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-5 flex flex-col justify-end relative overflow-hidden">
            <div className="absolute top-4 left-4 text-[10px] text-gray-500 font-mono">TPS THROUGHPUT GRAPH</div>
            
            <div className="flex items-end justify-between h-full pt-10 gap-1">
              {sparkline.map((val, idx) => (
                <div 
                  key={idx}
                  className="w-full rounded-t-sm transition-all duration-100"
                  style={{ 
                    height: val + '%',
                    backgroundColor: activeScenario === 'attack' ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.5)'
                  }}
                ></div>
              ))}
            </div>
            
            {/* Horizontal Grid lines mock */}
            <div className="absolute bottom-[25%] left-0 w-full border-b border-white/5 border-dashed"></div>
            <div className="absolute bottom-[50%] left-0 w-full border-b border-white/5 border-dashed"></div>
            <div className="absolute bottom-[75%] left-0 w-full border-b border-white/5 border-dashed"></div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-2">
              <span>BATCH PROGRESS</span>
              <span>{Math.floor(progress)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1">
              <div 
                className="bg-white h-1 rounded-full transition-all duration-300" 
                style={{ width: progress + '%' }}
              ></div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default TransactionSimulatorScreen;
