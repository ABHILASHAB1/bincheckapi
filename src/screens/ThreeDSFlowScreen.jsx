import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, Play, RotateCcw, ToggleLeft, ToggleRight, 
  ShoppingCart, Shield, Lock, Smartphone, Globe2, Copy, Building2, 
  ChevronRight, RefreshCw, SmartphoneIcon, ShieldCheck, XCircle,
  Activity, Hash, ArrowRight, Zap, Info
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { TEST_CARDS } from '../data/testCards';

const OTP_MODAL_STYLES = `
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  .otp-modal {
    animation: slideUp 0.3s ease-out;
  }
  .animate-shake {
    animation: shake 0.2s ease-in-out 0s 2;
  }
`;

const uid = () => Math.random().toString(36).slice(2,10);

const SCHEMES = {
  visa: {
    scheme: 'Visa Secure',
    dsUrl: 'https://3ds.visa.com/ds/v2',
    eci_frictionless: '05', eci_challenge: '05', eci_fail: '07',
    acsUrl: 'https://acs.issuer.visa.com/3ds2/challenge',
    brandColor: '#004b91'
  },
  mc: {
    scheme: 'MC Identity Check',
    dsUrl: 'https://3ds.mastercard.com/ds/v2',
    eci_frictionless: '02', eci_challenge: '02', eci_fail: '00',
    acsUrl: 'https://acs.issuer.mastercard.com/3ds2/challenge',
    brandColor: '#eb001b'
  },
  mada: {
    scheme: 'mada Secure / SPG',
    dsUrl: 'https://3ds.mada.com.sa/ds/v2',
    eci_frictionless: '05', eci_challenge: '05', eci_fail: '07',
    acsUrl: 'https://acs.snb.com.sa/3ds2/challenge',
    brandColor: '#006747'
  }
};

export default function ThreeDSFlowScreen() {
  const { runTransaction } = useSimulation();
  const [scheme, setScheme] = useState('mada');
  const [forceChallenge, setForceChallenge] = useState(true);
  const [forceFail, setForceFail] = useState(false);
  const [amount, setAmount] = useState('1250.00');
  const [pan, setPan] = useState('5888450012345678');
  const [merchant, setMerchant] = useState('Fintech Online Store');

  const [phase, setPhase] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [ids, setIds] = useState({});

  const cfg = SCHEMES[scheme];

  const log = useCallback((dir, label, payload, status) => {
    setLogs(p => [{ 
      id: Date.now() + Math.random(),
      ts: new Date().toLocaleTimeString(), 
      dir, 
      label, 
      payload: JSON.stringify(payload, null, 2), 
      status 
    }, ...p]);
  }, []);

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  const runFlow = useCallback(async () => {
    setLogs([]); 
    setPhase('checkout'); 
    setOtpInput('');
    setOtpError(false);

    const txIds = { threeDSServerTransID: uid(), dsTransID: uid(), acsTransID: uid() };
    setIds(txIds);
    let isLowRisk = parseFloat(amount) < 500 && !forceChallenge;
    const otp = "123456"; // Standardized test OTP
    setGeneratedOtp(otp);

    await delay(1000);
    log('OUT', 'PaymentIntent.create', { 
      amount: Math.round(parseFloat(amount)*100), 
      currency: 'SAR', 
      payment_method: 'pm_card_' + scheme,
      confirm: true
    }, 'info');

    setPhase('versioning');
    await delay(800);
    
    // BACKEND DS LOOKUP
    const dsRes = await fetch('/api/v1/3ds/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pan })
    });
    const dsData = await dsRes.json();

    log('OUT', '3DS Versioning Request', { 
      pan: pan.slice(0,6)+'******'+pan.slice(-4), 
      messageVersion: '2.2.0'
    }, 'info');
    
    await delay(600);
    log('IN', '3DS Versioning Response', dsData, dsData.enrolled ? 'success' : 'error');

    if (!dsData.enrolled) {
      setPhase('done_fail');
      return;
    }

    setPhase('areq');
    await delay(800);
    log('OUT', 'AReq (Auth Request)', {
      messageType: 'AReq',
      purchaseAmount: Math.round(parseFloat(amount)*100).toString(),
      merchantName: merchant
    }, 'info');

    // BACKEND ACS AUTHENTICATION / RISK SCORING
    const acsRes = await fetch('/api/v1/3ds/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), pan, forceChallenge })
    });
    const acsData = await acsRes.json();

    await delay(1000);
    isLowRisk = acsData.flow === 'FRICTIONLESS';

    log('IN', 'ARes (Auth Response)', acsData, isLowRisk ? 'success' : 'warning');

    if (isLowRisk) {
      setPhase('result');
      await delay(600);
      log('OUT', 'RReq (Results Request)', { transStatus: 'Y', eci: acsData.eci }, 'success');
      setPhase('done_pass');
      
      runTransaction({
        pan: pan,
        amount: Math.round(parseFloat(amount)*100).toString().padStart(12, '0'),
        mti: '0100', posEntry: '812', currency: '682',
        madaEcom: scheme === 'mada' ? 'MADAECOM' : null
      });
      return;
    }

    setGeneratedOtp(acsData.otp);
    setPhase('challenge');
    log('OUT', 'CReq (Challenge Request)', { messageType: 'CReq', acsTransID: acsData.threeDSServerTransID }, 'info');
  }, [scheme, forceChallenge, amount, pan, merchant, cfg, log, runTransaction]);

  const submitOtp = useCallback(async () => {
    if (otpInput !== generatedOtp) {
      setOtpError(true);
      setTimeout(() => setOtpError(false), 2000);
      return;
    }

    const correct = !forceFail;
    log('OUT', 'CRes (Challenge Response)', { 
      messageType: 'CRes', 
      transStatus: correct ? 'Y' : 'N',
      otpEntered: otpInput 
    }, correct ? 'success' : 'error');

    setPhase('result');
    await delay(1000);

    if (correct) {
      log('OUT', 'RReq (Results Request)', { transStatus: 'Y', eci: cfg.eci_challenge }, 'success');
      setPhase('done_pass');
      runTransaction({
        pan: pan,
        amount: Math.round(parseFloat(amount)*100).toString().padStart(12, '0'),
        mti: '0100', posEntry: '812', currency: '682',
        madaEcom: scheme === 'mada' ? 'MADAECOM' : null
      });
    } else {
      log('SYS', 'Authentication Failed', { eci: cfg.eci_fail }, 'error');
      setPhase('done_fail');
    }
  }, [otpInput, generatedOtp, forceFail, cfg, log, runTransaction, pan, amount, scheme]);

  return (
    <div className="h-full w-full bg-[#f6f9fc] flex overflow-hidden font-sans text-[#424770]">
      <style dangerouslySetInnerHTML={{ __html: OTP_MODAL_STYLES }} />

      {/* LEFT: CONFIGURATION */}
      <div className="w-[400px] border-r border-[#e6ebf1] bg-white flex flex-col shrink-0">
        <div className="p-8 border-b border-[#e6ebf1]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Shield size={22} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1a1f36]">3DS Simulator</h1>
              <p className="text-xs text-[#697386]">Protocol V2.2.0 Engine</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Card Scheme</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(SCHEMES).map(s => (
                  <button 
                    key={s}
                    onClick={() => setScheme(s)}
                    className={`h-10 rounded-lg border-2 font-bold text-xs transition-all flex items-center justify-center uppercase
                      ${scheme === s ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Amount</label>
                <input value={amount} onChange={e=>setAmount(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Currency</label>
                <div className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center font-bold text-slate-400">SAR</div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Merchant Name</label>
              <input value={merchant} onChange={e=>setMerchant(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500" />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <SmartphoneIcon size={16} className="text-indigo-600" />
                  <span className="text-xs font-bold">Force Challenge</span>
                </div>
                <button onClick={() => setForceChallenge(!forceChallenge)}>
                  {forceChallenge ? <ToggleRight size={28} className="text-indigo-600" /> : <ToggleLeft size={28} className="text-slate-300" />}
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-red-500" />
                  <span className="text-xs font-bold">Simulate Failure</span>
                </div>
                <button onClick={() => setForceFail(!forceFail)}>
                  {forceFail ? <ToggleRight size={28} className="text-red-500" /> : <ToggleLeft size={28} className="text-slate-300" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={runFlow} 
                disabled={phase !== 'idle'}
                className="flex-[2] h-12 bg-indigo-600 rounded-lg text-white font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
              >
                <Play size={16} fill="currentColor" /> Start Flow
              </button>
              <button 
                onClick={() => { setPhase('idle'); setLogs([]); }}
                className="flex-1 h-12 bg-slate-100 rounded-lg text-slate-600 font-bold hover:bg-slate-200 flex items-center justify-center"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Endpoint Config</h3>
          <div className="p-4 bg-slate-900 rounded-xl font-mono text-[10px] text-indigo-300 space-y-2">
            <div><span className="text-slate-500">DIRECTORY_SERVER:</span> {cfg.dsUrl}</div>
            <div><span className="text-slate-500">ACS_ENDPOINT:</span> {cfg.acsUrl}</div>
            <div><span className="text-slate-500">PROTOCOL:</span> 2.2.0 (EMVCo)</div>
          </div>
        </div>
      </div>

      {/* CENTER: LIVE PROTOCOL STREAM */}
      <div className="flex-1 flex flex-col bg-[#fbfcfd]">
        <div className="p-6 border-b border-[#e6ebf1] flex items-center justify-between bg-white">
          <h2 className="text-sm font-bold text-[#1a1f36] flex items-center gap-2">
            <Hash size={16} className="text-indigo-600" />
            3DS Protocol Inspector
          </h2>
          <div className="flex items-center gap-2">
             <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase">Active</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {logs.length === 0 && (
            <div className="text-center py-40 text-slate-300">
              <Zap size={48} className="mx-auto mb-6 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Awaiting interaction...</p>
              <p className="text-xs opacity-60 mt-2">Start the 3DS flow to see protocol messages</p>
            </div>
          )}

          {logs.map((l) => (
            <div key={l.id} className="group relative">
              <div className={`absolute left-[-21px] top-4 w-2 h-2 rounded-full border-2 border-white 
                ${l.dir === 'OUT' ? 'bg-indigo-500' : l.dir === 'IN' ? 'bg-purple-500' : 'bg-emerald-500'}`}></div>
              <div className="bg-white border border-[#e6ebf1] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md
                      ${l.dir === 'OUT' ? 'bg-indigo-50 text-indigo-600' : l.dir === 'IN' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {l.dir}
                    </span>
                    <h4 className="text-sm font-bold text-[#1a1f36]">{l.label}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{l.ts}</span>
                </div>
                <pre className="text-[11px] font-mono text-slate-600 bg-slate-50 p-4 rounded-xl overflow-x-auto border border-slate-100">
                  {l.payload}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3D SECURE OVERLAY */}
      {phase === 'challenge' && (
        <div className="fixed inset-0 z-50 bg-[#1a1f36]/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="otp-modal w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            
            {/* Bank Branding */}
            <div 
              className="p-6 text-white flex items-center justify-between"
              style={{ backgroundColor: cfg.brandColor }}
            >
              <div className="flex items-center gap-2">
                <Building2 size={24} />
                <span className="text-lg font-bold tracking-tight uppercase">
                  {scheme === 'mada' ? 'Saudi National Bank' : scheme === 'visa' ? 'Visa Secure Bank' : 'Mastercard Bank'}
                </span>
              </div>
              <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">3DS V2.2</div>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Verify Identity</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Enter the 6-digit code sent to your registered mobile number ending in <span className="font-bold text-slate-800">**43</span>.
                </p>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block uppercase mb-0.5">Merchant</span>
                  <span className="text-slate-700 font-bold truncate block">{merchant}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase mb-0.5">Amount</span>
                  <span className="text-slate-700 font-bold uppercase">SAR {amount}</span>
                </div>
              </div>

              {/* OTP Input */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Enter OTP</label>
                    <span className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">Resend Code</span>
                  </div>
                  <input 
                    autoFocus
                    maxLength={6}
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value)}
                    className={`w-full h-14 bg-slate-50 border-2 rounded-xl text-center text-3xl font-black tracking-[0.5em] transition-all focus:outline-none 
                      ${otpError ? 'border-red-500 text-red-600 animate-shake' : 'border-slate-100 focus:border-indigo-600 text-slate-800'}`}
                    placeholder="••••••"
                  />
                  {otpError && <p className="text-center text-xs text-red-600 font-bold mt-2">Invalid code. Please try again.</p>}
                  <p className="text-center text-[10px] text-slate-400 mt-2">Default test code is: <span className="text-indigo-600 font-bold">{generatedOtp}</span></p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { setPhase('idle'); setLogs([]); }}
                    className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitOtp}
                    className="flex-[2] h-12 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                    style={{ backgroundColor: cfg.brandColor }}
                  >
                    Confirm <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 py-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SCA Compliant Phase 2</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODALS */}
      {phase === 'done_pass' && (
        <div className="fixed inset-0 z-50 bg-[#1a1f36]/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 text-center max-w-[400px] shadow-2xl animate-bounce">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-[#1a1f36] mb-2">Authenticated</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              3DS2 challenge completed successfully. The cryptogram has been generated and appended to the transaction payload.
            </p>
            <button onClick={() => setPhase('idle')} className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold">Close Simulator</button>
          </div>
        </div>
      )}

      {phase === 'done_fail' && (
        <div className="fixed inset-0 z-50 bg-[#1a1f36]/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 text-center max-w-[400px] shadow-2xl">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-[#1a1f36] mb-2">Auth Failed</h2>
            <p className="text-slate-500 text-sm mb-8">
              The 3DS authentication challenge was failed or cancelled by the user.
            </p>
            <button onClick={() => setPhase('idle')} className="w-full h-12 bg-red-600 text-white rounded-xl font-bold">Retry Flow</button>
          </div>
        </div>
      )}
    </div>
  );
}
