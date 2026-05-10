import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Shield, FileDigit, Hash, ArrowRight, ShieldAlert, CheckCircle2, 
  XCircle, Copy, Cpu, Zap, Radio, Terminal, ChevronRight, Lock, Unlock, Database, Activity, Sparkles
} from 'lucide-react';
import { generatePinBlock } from '../data/iso8583';

function CryptographyLabScreen() {
  const [inputs, setInputs] = useState({
    pan: '4111222233334444',
    pin: '1234',
    atc: '001A',
    unpredictableNum: '1B2C3D4E',
    masterKey: '11111111111111112222222222222222',
    compA: '11111111111111112222222222222222',
    compB: '00000000000000000000000000000000',
    compC: '00000000000000000000000000000000'
  });

  const xorHex = (h1, h2, h3) => {
    try {
      const hexToBytes = (hex) => {
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
          bytes[i] = parseInt(hex.substr(i * 2, 2), 16) || 0;
        }
        return bytes;
      };

      const b1 = hexToBytes(h1);
      const b2 = hexToBytes(h2);
      const b3 = hexToBytes(h3);
      
      let out = '';
      for (let i = 0; i < 16; i++) {
        const xored = b1[i] ^ b2[i] ^ b3[i];
        out += xored.toString(16).padStart(2, '0').toUpperCase();
      }
      return out;
    } catch (e) { return 'ERROR_CRYPTO_0x42'; }
  };

  const derivedMasterKey = xorHex(inputs.compA, inputs.compB, inputs.compC);

  const [flowState, setFlowState] = useState('idle');
  const [activeStep, setActiveStep] = useState(-1);
  const [validationResult, setValidationResult] = useState(null);

  // Live PIN Block calculation
  const pinBlockResult = inputs.pin && inputs.pan ? generatePinBlock(inputs.pin, inputs.pan) : '';

  const STEPS = [
    { id: 1, label: 'PIN Block XORing', transform: 'ISO_9564_FORMAT_0', out: pinBlockResult || '—' },
    { id: 2, label: 'UDK Derivation', transform: 'DES3(MK, PAN||ATC)', out: '7A8B9C0D1E2F' },
    { id: 3, label: 'Session Key Gen', transform: 'DES3(UDK, ATC)', out: '112233445566' },
    { id: 4, label: 'ARQC Generation', transform: 'MAC_ALGO_3', out: '8F9E7D6C5B4A' },
    { id: 5, label: 'Integrity Check', transform: 'VERIFY(ARQC)', out: validationResult === 'pass' ? 'MATCH ✓' : (validationResult === 'fail' ? 'MISMATCH ✗' : '—') },
    { id: 6, label: 'ARPC Response', transform: 'DES3(SK, ARQC)', out: 'A1B2C3D4E5F6' },
  ];

  const runCryptoFlow = (simulateFail = false) => {
    setFlowState('running');
    setActiveStep(-1);
    setValidationResult(null);
    let step = 0;
    const interval = setInterval(() => {
      setActiveStep(step);
      if (step === 4) setValidationResult(simulateFail ? 'fail' : 'pass');
      if (step === STEPS.length - 1 || (step === 4 && simulateFail)) {
        clearInterval(interval);
        setFlowState('complete');
        if (simulateFail) setActiveStep(4);
      } else { step++; }
    }, 400);
  };

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#020204] relative">
      {/* Background Scanning Line Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      
      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-8">
        <div>
           <div className="flex items-center space-x-3 mb-2">
              <span className="px-2 py-0.5 rounded bg-fintech-accent/20 text-fintech-accent text-[9px] font-black uppercase tracking-widest border border-fintech-accent/30 flex items-center">
                <Radio size={10} className="mr-1.5 animate-pulse" /> HSM Secure Mode
              </span>
              <span className="text-[9px] text-gray-600 font-mono">ENCLAVE_STATUS_ENCRYPTED</span>
           </div>
           <h1 className="text-4xl font-black text-white flex items-center tracking-tighter">
             <Shield className="mr-4 text-fintech-accent" size={36} />
             HSM Cryptography Enclave
           </h1>
        </div>

        <div className="flex space-x-4">
           <div className="glass-panel px-6 py-4 rounded-2xl border border-white/5 flex items-center space-x-4 bg-black/40">
              <div className="text-right">
                 <div className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Key Enclave</div>
                 <div className="text-lg font-black text-fintech-green tracking-tight uppercase flex items-center">
                    <Lock size={16} className="mr-2" /> HSM_MASTER_V1
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden relative z-10">
        
        {/* Left: Key Hierarchy & Parameters */}
        <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col overflow-hidden">
           <div className="flex-1 glass-panel p-10 rounded-[3rem] border border-white/10 relative overflow-hidden bg-black/60 shadow-2xl flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fintech-accent to-purple-600"></div>
              
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-10 shrink-0">Key Hierarchy Visualization</h3>
              
              <div className="flex-1 flex flex-col items-center justify-center space-y-12 relative overflow-hidden">
                 {/* 3D-ish Key Tree */}
                 <div className="p-5 bg-fintech-accent text-white rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.3)] relative z-10 group cursor-help">
                    <KeyRound size={32} />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase whitespace-nowrap">Zone Master (ZMK)</div>
                    <div className="absolute inset-0 border border-white/20 rounded-2xl group-hover:scale-125 transition-all opacity-0 group-hover:opacity-100"></div>
                 </div>

                 <div className="w-0.5 h-12 bg-gradient-to-b from-fintech-accent to-purple-600"></div>

                 <div className="flex space-x-12">
                    <div className="p-4 bg-white/5 border border-white/10 text-purple-400 rounded-xl relative group">
                       <Shield size={24} />
                       <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase whitespace-nowrap">Terminal Key (TMK)</div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 text-fintech-green rounded-xl relative group">
                       <Unlock size={24} />
                       <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase whitespace-nowrap">PIN Key (PVK)</div>
                    </div>
                 </div>
              </div>

              <div className="mt-10 space-y-4 pt-10 border-t border-white/5 shrink-0">
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Master Key Injection (XOR)</div>
                 <div className="grid grid-cols-1 gap-2">
                    {['compA', 'compB', 'compC'].map((c, i) => (
                       <input 
                         key={c}
                         type="text" 
                         value={inputs[c]}
                         onChange={(e) => setInputs({...inputs, [c]: e.target.value})}
                         className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-[10px] text-gray-500 font-mono focus:border-fintech-accent transition-all"
                         placeholder={`Component ${String.fromCharCode(65+i)}`}
                       />
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Center: Crypto Workbench */}
        <div className="col-span-12 lg:col-span-5 flex flex-col space-y-6">
           <div className="flex-1 glass-panel rounded-[3.5rem] border border-white/10 p-10 bg-black/60 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-10 shrink-0">
                 <div>
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Cryptographic Workbench</h3>
                    <p className="text-[9px] text-gray-600 mt-1.5 uppercase font-mono tracking-widest">mada SPG-4 Compliance Validation</p>
                 </div>
                 <div className="flex items-center space-x-3">
                    <Terminal size={18} className="text-fintech-accent" />
                 </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center space-y-4 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
                 {STEPS.map((step, idx) => {
                    const isPast = activeStep >= idx;
                    const isError = validationResult === 'fail' && idx === 4;
                    if (activeStep === -1 && flowState === 'idle') return null;
                    return (
                       <div key={idx} className={`w-full transition-all duration-500 ${isPast ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
                          <div className={`p-4 rounded-2xl border flex items-center justify-between ${isError ? 'bg-fintech-red/10 border-fintech-red/30' : (isPast ? 'bg-fintech-accent/5 border-fintech-accent/20 shadow-xl' : 'bg-black/40 border-white/5')}`}>
                             <div className="flex items-center space-x-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${isError ? 'bg-fintech-red text-white border-red-500' : (isPast ? 'bg-fintech-accent text-white border-fintech-accent' : 'bg-gray-800 text-gray-500 border-gray-700')}`}>
                                   0{idx + 1}
                                </div>
                                <div>
                                   <div className={`text-[11px] font-black uppercase ${isError ? 'text-fintech-red' : 'text-white'}`}>{step.label}</div>
                                   <div className="text-[9px] font-mono text-gray-600">{step.transform}</div>
                                </div>
                             </div>
                             {isPast && (
                                <div className="flex items-center space-x-4">
                                   <ChevronRight size={14} className="text-gray-700" />
                                   <div className={`text-[10px] font-mono px-3 py-1 rounded-lg bg-black/60 border ${isError ? 'text-fintech-red border-fintech-red/30' : 'text-fintech-accent border-fintech-accent/30'}`}>
                                      {step.out}
                                   </div>
                                </div>
                             )}
                          </div>
                       </div>
                    );
                 })}

                 {flowState === 'idle' && (
                    <div className="flex flex-col items-center justify-center opacity-30 space-y-6">
                       <Database size={64} strokeWidth={0.5} />
                       <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Enclave Standby</p>
                          <p className="text-[9px] font-mono uppercase">Launch generation to visualize bit-level transforms.</p>
                       </div>
                    </div>
                 )}
              </div>

              <div className="mt-8 flex space-x-4 shrink-0">
                 <button onClick={() => runCryptoFlow(false)} disabled={flowState === 'running'}
                    className="flex-1 py-4 bg-fintech-accent text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-fintech-accent/20 hover:scale-[1.02] transition-all">
                    Generate Full Cryptogram
                 </button>
                 <button onClick={() => runCryptoFlow(true)} disabled={flowState === 'running'}
                    className="px-6 py-4 bg-fintech-red/10 border border-fintech-red/30 text-fintech-red rounded-2xl hover:bg-fintech-red/20 transition-all">
                    <ShieldAlert size={20} />
                 </button>
              </div>
           </div>
        </div>

        {/* Right: Validation & Bit Console */}
        <div className="col-span-12 lg:col-span-3 space-y-6 flex flex-col overflow-hidden">
           
           <div className="flex-1 glass-panel rounded-[3rem] border border-white/10 p-8 bg-black/60 flex flex-col shadow-2xl">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Bit-Level Console</h3>
              
              <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                 {/* Live PIN XOR Box */}
                 <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] flex flex-col space-y-4">
                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">ISO 9564 PIN XOR Mapping</div>
                    <div className="space-y-3 font-mono text-[10px]">
                       <div className="flex justify-between items-center p-2 bg-black/40 rounded border border-white/5">
                          <span className="text-gray-600">PIN_BLOCK</span>
                          <span className="text-white">0{inputs.pin.length}{inputs.pin}{'F'.repeat(14 - inputs.pin.length)}</span>
                       </div>
                       <div className="flex justify-center"><ChevronRight size={12} className="text-gray-800 rotate-90" /></div>
                       <div className="flex justify-between items-center p-2 bg-black/40 rounded border border-white/5">
                          <span className="text-gray-600">PAN_BLOCK</span>
                          <span className="text-white">0000{inputs.pan.slice(-13, -1)}</span>
                       </div>
                       <div className="flex justify-center text-fintech-accent font-black">XOR</div>
                       <div className="flex justify-between items-center p-2 bg-fintech-accent/10 rounded border border-fintech-accent/30 text-fintech-accent font-black">
                          <span>RESULT</span>
                          <span>{pinBlockResult || '...'}</span>
                       </div>
                    </div>
                 </div>

                 {/* Validation Status */}
                 <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black/40 border border-white/5 rounded-[2rem] relative overflow-hidden">
                    {flowState === 'complete' ? (
                       <div className="text-center">
                          {validationResult === 'pass' ? (
                             <>
                                <CheckCircle2 size={48} className="text-fintech-green mx-auto mb-4 animate-bounce-slow shadow-[0_0_30px_rgba(16,185,129,0.3)]" />
                                <div className="text-[10px] font-black text-fintech-green uppercase tracking-widest">Integrity Verified</div>
                                <div className="text-xs font-black text-white mt-2 uppercase tracking-tighter">Cryptogram Match</div>
                             </>
                          ) : (
                             <>
                                <ShieldAlert size={48} className="text-fintech-red mx-auto mb-4 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]" />
                                <div className="text-[10px] font-black text-fintech-red uppercase tracking-widest">Validation Fail</div>
                                <div className="text-xs font-black text-white mt-2 uppercase tracking-tighter">Key Mismatch Detected</div>
                             </>
                          )}
                       </div>
                    ) : (
                       <div className="opacity-20 text-center">
                          <Shield size={48} className="mx-auto mb-4" />
                          <div className="text-[9px] font-black uppercase tracking-widest">Awaiting Verification</div>
                       </div>
                    )}
                 </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 shrink-0">
                 <div className="flex items-start space-x-3">
                    <Sparkles size={16} className="text-fintech-accent shrink-0" />
                    <p className="text-[9px] text-gray-600 leading-relaxed font-bold uppercase italic">
                       Anitha AI™ Crypto Auditor suggests: PIN encryption adheres to SPG-4 standards.
                    </p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

export default CryptographyLabScreen;
