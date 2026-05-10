import React, { useState, useEffect } from 'react';
import { Smartphone, CreditCard, ChevronRight, Wifi, Battery, SignalHigh, RefreshCw, CheckCircle, XCircle, X, Tablet, Nfc, Cpu, Zap, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export default function VirtualTerminal({ onClose }) {
  const { runTransaction, transactions, t, terminalConfig } = useSimulation();
  const [amount, setAmount] = useState(terminalConfig?.amount || '');
  const [status, setStatus] = useState('IDLE'); // IDLE, ENTRY_METHOD, PIN_ENTRY, PROCESSING, APPROVED, DECLINED
  const [pin, setPin] = useState('');
  const [entryMethod, setEntryMethod] = useState('CHIP'); // CHIP, NFC, TOKEN, SWIPE
  const [txType, setTxType] = useState(terminalConfig?.txType || 'PURCHASE'); // PURCHASE, REFUND, PREAUTH, REMIT
  const [remitCountry, setRemitCountry] = useState(terminalConfig?.remitCountry || 'SAR_INR');
  const [rrn, setRrn] = useState('');
  const [cashback, setCashback] = useState('');
  const [accountType, setAccountType] = useState('10'); // 10=Savings, 20=Current
  const [isLogon, setIsLogon] = useState(false);
  const [lastTxId, setLastTxId] = useState(null);

  // Keypad logic
  const handleKeypad = (num) => {
    if (status === 'CASHBACK_ENTRY') {
      if (cashback.length < 12) setCashback(c => c + num);
      return;
    }
    if (status === 'REFUND_RRN') {
      if (rrn.length < 12) setRrn(r => r + num);
      return;
    }
    if (status !== 'IDLE' && status !== 'PIN_ENTRY') return;
    if (status === 'PIN_ENTRY') {
      if (pin.length < 4) setPin(p => p + num);
    } else {
      setAmount(a => a + num);
    }
  };

  const handleClear = () => {
    if (status === 'PIN_ENTRY') setPin('');
    else if (status === 'REFUND_RRN') setRrn('');
    else if (status === 'CASHBACK_ENTRY') setCashback('');
    else setAmount('');
  };

  const [withCashback, setWithCashback] = useState(false);

  const handleEnter = () => {
    if (status === 'IDLE' && amount) {
      if (txType === 'REFUND') setStatus('REFUND_RRN');
      else if (txType === 'REMIT') setStatus('REMIT_COUNTRY');
      else setStatus('ACCOUNT_SELECTION');
    } else if (status === 'ACCOUNT_SELECTION') {
       if (withCashback) setStatus('CASHBACK_ENTRY');
       else setStatus('ENTRY_METHOD');
    } else if (status === 'REMIT_COUNTRY') {
       setStatus('ENTRY_METHOD');
    } else if (status === 'REFUND_RRN' && rrn.length === 12) {
      setStatus('ENTRY_METHOD');
    } else if (status === 'CASHBACK_ENTRY' && cashback) {
      setStatus('ENTRY_METHOD');
    } else if (status === 'PIN_ENTRY' && pin.length === 4) {
      processTx();
    }
  };

  const selectEntryMethod = (method) => {
    setEntryMethod(method);
    setStatus('PIN_ENTRY');
  };

  const handleLogon = () => {
    setStatus('PROCESSING');
    runTransaction({
      mti: '0800',
      procCode: '000000',
      posEntry: '000',
      netMgmtCode: '001' // Logon
    });
  };

  const processTx = () => {
    setStatus('PROCESSING');
    
    // Map entry method to ISO POS Entry Mode
    const posEntryMap = {
      'CHIP': '051',
      'NFC': '071',
      'TOKEN': '071', // Mobile wallet uses 071 usually
      'SWIPE': '021'
    };

    // Map Tx Type to MTI and ProcCode
    const txMap = {
      'PURCHASE': { mti: '0200', proc: `00${accountType}00` },
      'REFUND': { mti: '0200', proc: `20${accountType}00` },
      'PREAUTH': { mti: '0100', proc: `00${accountType}00` },
      'REMIT': { mti: '0200', proc: '260000' }
    };

    const config = txMap[txType];
    
    const txId = `tx-${Math.floor(Date.now() / 1000)}`;
    setLastTxId(txId);

    // Detect if we should offer DCC (Simulate: If amount > 100 and random chance)
    if (txType !== 'REMIT' && amount > 100 && Math.random() > 0.5 && entryMethod !== 'TOKEN') {
       setStatus('DCC_OFFER');
       return;
    }

    runTransaction({
      amount: (parseInt(amount) + (parseInt(cashback) || 0)).toString().padStart(12, '0'),
      pin: pin,
      mti: config.mti,
      procCode: config.proc,
      posEntry: posEntryMap[entryMethod],
      isTokenized: entryMethod === 'TOKEN',
      rrn: rrn || undefined,
      additionalAmount: cashback ? cashback.padStart(12, '0') : undefined,
      elements: txType === 'REMIT' ? { '48': `REMIT|${remitCountry}|FX:22.15` } : {}
    });
  };

  const handleDCC = (accepted) => {
    setStatus('PROCESSING');
    const posEntryMap = { 'CHIP': '051', 'NFC': '071', 'TOKEN': '071', 'SWIPE': '021' };
    const txMap = { 'PURCHASE': { mti: '0200', proc: '000000' }, 'REFUND': { mti: '0200', proc: '200000' }, 'PREAUTH': { mti: '0100', proc: '000000' } };
    const config = txMap[txType];

    runTransaction({
      amount: amount.padStart(12, '0'),
      pin: pin,
      mti: config.mti,
      procCode: config.proc,
      posEntry: posEntryMap[entryMethod],
      isDCC: accepted,
      currency: accepted ? '840' : '682' // Switch to USD if accepted
    });
  };

  // Monitor transactions for the result of our triggered TX
  useEffect(() => {
    if (status === 'PROCESSING' && transactions.length > 0) {
      const latest = transactions[0];
      // We check if the status has settled from 'pending'
      if (latest.status !== 'pending') {
        setTimeout(() => {
          // Check for Partial Approval (Field 6 present in response)
          if (latest.parsedRes?.elements['6']) {
            setStatus('PARTIAL_APPROVAL');
          } else if (latest.mti === '0800') {
            setStatus('LOGON_SUCCESS');
            setIsLogon(true);
          } else {
            setStatus(latest.status === 'approved' ? 'APPROVED' : 'DECLINED');
          }
          
          // Reset after 5 seconds
          setTimeout(() => {
            setStatus('IDLE');
            setAmount('');
            setPin('');
          }, 5000);
        }, 800);
      }
    }
  }, [transactions, status]);

  return (
    <div className="fixed bottom-8 right-8 z-[200] animate-slideUp">
      <div className="w-80 bg-[#16161d] rounded-[3rem] p-5 shadow-[0_30px_70px_rgba(0,0,0,0.7)] border-[6px] border-[#252530] relative">
        
        {/* Contactless Zone */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#252530] px-6 py-1.5 rounded-full border border-white/10 flex items-center space-x-3 shadow-lg">
           <Nfc size={14} className="text-fintech-accent animate-pulse" />
           <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">mada / Contactless</span>
        </div>

        {/* Status Bar */}
        <div className="flex justify-between items-center px-4 mb-3">
           <div className="flex items-center space-x-1.5">
              <SignalHigh size={12} className="text-fintech-green" />
              <span className="text-[9px] text-gray-400 font-mono tracking-tighter">5G mada-Net</span>
           </div>
           <div className="flex items-center space-x-2">
              <Zap size={10} className="text-yellow-500 fill-yellow-500" />
              <span className="text-[9px] text-gray-400 font-mono">LTE</span>
              <Battery size={12} className="text-fintech-green" />
           </div>
        </div>

        {/* LCD Screen Container */}
        <div className="bg-[#b8c9a3] h-44 rounded-2xl mb-6 shadow-inner p-4 flex flex-col items-center justify-center font-mono border-4 border-black/10 relative overflow-hidden">
           {/* Screen Scanlines Effect */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
           
           {status === 'IDLE' && (
             <div className="z-20 text-center">
                <div className="text-[10px] text-black/40 mb-1 uppercase font-bold">Terminal ID: 8820192</div>
                <div className="flex justify-center gap-1 mb-3">
                   <button onClick={() => setTxType('PURCHASE')} className={`text-[7px] px-1.5 py-0.5 rounded border ${txType === 'PURCHASE' ? 'bg-black text-[#b8c9a3]' : 'border-black/20 text-black'}`}>SALE</button>
                   <button onClick={() => setTxType('REFUND')} className={`text-[7px] px-1.5 py-0.5 rounded border ${txType === 'REFUND' ? 'bg-black text-[#b8c9a3]' : 'border-black/20 text-black'}`}>REFUND</button>
                   <button onClick={() => setTxType('PREAUTH')} className={`text-[7px] px-1.5 py-0.5 rounded border ${txType === 'PREAUTH' ? 'bg-black text-[#b8c9a3]' : 'border-black/20 text-black'}`}>AUTH</button>
                   <button onClick={() => setTxType('REMIT')} className={`text-[7px] px-1.5 py-0.5 rounded border ${txType === 'REMIT' ? 'bg-fintech-accent text-white' : 'border-black/20 text-black'}`}>REMIT</button>
                   <button onClick={() => setWithCashback(!withCashback)} className={`text-[7px] px-1.5 py-0.5 rounded border ${withCashback ? 'bg-orange-900 text-white' : 'border-black/20 text-black'}`}>CASH</button>
                   <button onClick={handleLogon} className="text-[7px] px-1.5 py-0.5 rounded border border-blue-900/40 text-blue-900 font-bold bg-blue-900/5">LOGON</button>
                </div>
                <div className="text-[10px] text-black font-bold uppercase mb-1">Enter Amount</div>
                <div className="text-3xl text-black font-black tracking-tighter">
                  {amount ? (parseInt(amount) / 100).toFixed(2) : '0.00'}
                  <span className="text-xs ml-1 opacity-60">SAR</span>
                </div>
                {isLogon && <div className="text-[7px] text-green-800 font-black mt-2 tracking-widest animate-pulse">● HOST CONNECTED</div>}
             </div>
           )}

           {status === 'REMIT_COUNTRY' && (
             <div className="z-20 w-full flex flex-col items-center text-center px-4">
                <div className="text-[10px] text-black font-bold uppercase mb-4">Target Country</div>
                <div className="grid grid-cols-2 gap-2 w-full">
                   {[
                     { id: 'SAR_INR', name: 'India', flag: '🇮🇳' },
                     { id: 'SAR_PHP', name: 'Philippines', flag: '🇵🇭' },
                     { id: 'SAR_PKR', name: 'Pakistan', flag: '🇵🇰' },
                     { id: 'SAR_EGP', name: 'Egypt', flag: '🇪🇬' }
                   ].map(c => (
                     <button 
                       key={c.id}
                       onClick={() => { setRemitCountry(c.id); handleEnter(); }}
                       className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center ${remitCountry === c.id ? 'bg-fintech-accent text-white border-fintech-accent' : 'bg-black/5 border-black/10 text-black'}`}
                     >
                        <span className="text-lg">{c.flag}</span>
                        <span className="text-[8px] font-bold uppercase">{c.name}</span>
                     </button>
                   ))}
                </div>
             </div>
           )}

           {status === 'LOGON_SUCCESS' && (
             <div className="z-20 flex flex-col items-center text-blue-900 text-center">
                <ShieldCheck size={40} className="mb-2" />
                <div className="text-[10px] font-black uppercase tracking-tight">Handshake Complete</div>
                <div className="text-[8px] font-bold mt-1">MTI: 0810 (ACK)</div>
                <div className="bg-blue-900/10 px-4 py-2 rounded mt-3">
                   <div className="text-xs font-black tracking-widest uppercase">Logon Success</div>
                </div>
                <div className="text-[6px] mt-2 opacity-50 font-mono">ZMK/TMK Keys Synchronized</div>
             </div>
           )}

           {status === 'ACCOUNT_SELECTION' && (
             <div className="z-20 w-full flex flex-col items-center text-center px-4">
                <div className="text-[10px] text-black font-bold uppercase mb-4">Select Account</div>
                <div className="grid grid-cols-1 gap-2 w-full">
                   <button 
                     onClick={() => { setAccountType('10'); handleEnter(); }}
                     className={`p-3 rounded-xl border-2 flex items-center justify-between ${accountType === '10' ? 'bg-black text-[#b8c9a3] border-black' : 'bg-black/5 border-black/10 text-black'}`}
                   >
                      <span className="text-[10px] font-bold">1. SAVINGS</span>
                      <ChevronRight size={14} />
                   </button>
                   <button 
                     onClick={() => { setAccountType('20'); handleEnter(); }}
                     className={`p-3 rounded-xl border-2 flex items-center justify-between ${accountType === '20' ? 'bg-black text-[#b8c9a3] border-black' : 'bg-black/5 border-black/10 text-black'}`}
                   >
                      <span className="text-[10px] font-bold">2. CURRENT</span>
                      <ChevronRight size={14} />
                   </button>
                </div>
             </div>
           )}

           {status === 'CASHBACK_ENTRY' && (
             <div className="z-20 text-center">
                <div className="text-[10px] text-black font-bold uppercase mb-1">Enter Cashback Amount</div>
                <div className="text-[8px] text-black/50 mb-3">(Limit: 200 SAR)</div>
                <div className="text-2xl text-black font-black tracking-tighter">
                  {cashback ? (parseInt(cashback) / 100).toFixed(2) : '0.00'}
                  <span className="text-xs ml-1 opacity-60">SAR</span>
                </div>
                <div className="mt-4 text-[9px] text-black/40 animate-pulse">Press Enter to Continue</div>
             </div>
           )}

           {status === 'ENTRY_METHOD' && (
             <div className="z-20 w-full flex flex-col items-center">
                <div className="text-[10px] text-black font-bold uppercase mb-4 underline decoration-2 underline-offset-4">Select Payment Method</div>
                <div className="grid grid-cols-2 gap-2 w-full px-2">
                   <button onClick={() => selectEntryMethod('CHIP')} className="bg-black/10 border border-black/20 p-2 rounded-lg flex flex-col items-center hover:bg-black/20 transition-colors">
                      <Cpu size={16} className="text-black mb-1" />
                      <span className="text-[8px] font-bold">EMV CHIP</span>
                   </button>
                   <button onClick={() => selectEntryMethod('NFC')} className="bg-black/10 border border-black/20 p-2 rounded-lg flex flex-col items-center hover:bg-black/20">
                      <Wifi size={16} className="text-black mb-1" />
                      <span className="text-[8px] font-bold">CONTACTLESS</span>
                   </button>
                   <button onClick={() => selectEntryMethod('TOKEN')} className="bg-black/10 border border-black/20 p-2 rounded-lg flex flex-col items-center hover:bg-black/20">
                      <Smartphone size={16} className="text-black mb-1" />
                      <span className="text-[8px] font-bold">TOKENIZED</span>
                   </button>
                   <button onClick={() => selectEntryMethod('SWIPE')} className="bg-black/10 border border-black/20 p-2 rounded-lg flex flex-col items-center hover:bg-black/20">
                      <CreditCard size={16} className="text-black mb-1" />
                      <span className="text-[8px] font-bold">MAGSTRIPE</span>
                   </button>
                </div>
             </div>
           )}

           {status === 'REFUND_RRN' && (
             <div className="z-20 text-center">
                <div className="text-[10px] text-black font-bold uppercase mb-1">Enter Original RRN</div>
                <div className="text-[8px] text-black/50 mb-3">(Check Purchase Receipt)</div>
                <div className="bg-black/5 border border-black/10 p-2 rounded text-lg font-mono tracking-widest text-black">
                  {rrn.padEnd(12, '_')}
                </div>
                <div className="mt-4 text-[9px] text-black/40 animate-pulse">Press Enter to Continue</div>
             </div>
           )}

           {status === 'DCC_OFFER' && (
             <div className="z-20 w-full flex flex-col items-center text-center px-2">
                <div className="text-[9px] text-black font-bold uppercase mb-2">Currency Choice</div>
                <div className="text-[8px] text-black/70 mb-3 leading-tight font-bold italic">Detecting International Card...</div>
                <div className="grid grid-cols-2 gap-2 w-full">
                   <button onClick={() => handleDCC(true)} className="bg-black p-2 rounded border border-black flex flex-col items-center">
                      <span className="text-[7px] text-white/50 uppercase">Home</span>
                      <span className="text-[10px] text-white font-bold">${(amount / 3.75 / 100).toFixed(2)}</span>
                      <span className="text-[6px] text-white/40 mt-1">Rate: 3.75</span>
                   </button>
                   <button onClick={() => handleDCC(false)} className="bg-white/30 p-2 rounded border border-black flex flex-col items-center">
                      <span className="text-[7px] text-black/50 uppercase">Local</span>
                      <span className="text-[10px] text-black font-bold">{(amount/100).toFixed(2)} SAR</span>
                      <span className="text-[6px] text-black/40 mt-1">No Mark-up</span>
                   </button>
                </div>
                <div className="mt-3 text-[7px] text-black/60 font-bold">Accept DCC conversion?</div>
             </div>
           )}

           {status === 'PIN_ENTRY' && (
             <div className="z-20 text-center">
                <div className="text-[10px] text-black/60 mb-2 uppercase font-bold tracking-widest">Pin Required</div>
                <div className="text-3xl text-black tracking-[0.4em] font-black drop-shadow-sm">
                  {'●●●●'.slice(0, pin.length).padEnd(4, '○')}
                </div>
                <div className="mt-4 text-[9px] text-black/40 animate-pulse">Press Enter to Confirm</div>
             </div>
           )}

           {status === 'PROCESSING' && (
             <div className="z-20 flex flex-col items-center">
                <RefreshCw size={40} className="text-black animate-spin mb-4 opacity-70" />
                <div className="text-xs text-black font-black uppercase tracking-[0.2em]">Contacting Host...</div>
                <div className="text-[8px] text-black/50 mt-2 font-mono">TLS Handshake established</div>
             </div>
           )}

           {status === 'APPROVED' && (
             <div className="z-20 flex flex-col items-center text-green-900">
                <CheckCircle size={48} className="mb-3 animate-bounce" />
                <div className="text-lg font-black uppercase tracking-tight">Approved</div>
                <div className="text-[10px] font-bold mt-1 opacity-70">AUTH: {Math.floor(Math.random()*900000+100000)}</div>
                <div className="mt-2 text-[8px] uppercase tracking-widest font-bold bg-green-900/10 px-3 py-1 rounded">Remove Card</div>
             </div>
           )}

           {status === 'PARTIAL_APPROVAL' && (
             <div className="z-20 flex flex-col items-center text-blue-900 text-center">
                <ShieldAlert size={32} className="mb-2" />
                <div className="text-[10px] font-black uppercase tracking-tight">Partial Approval</div>
                <div className="bg-blue-900/10 px-2 py-1 rounded my-1">
                   <div className="text-xs font-black">50.00 SAR</div>
                   <div className="text-[7px] font-bold uppercase opacity-60">Authorized</div>
                </div>
                <div className="text-[8px] font-bold text-red-700 uppercase mt-1">Collect Balance:</div>
                <div className="text-xs font-black text-red-700">{(amount/100 - 50).toFixed(2)} SAR</div>
                <div className="mt-2 text-[7px] uppercase tracking-widest font-bold bg-black text-[#b8c9a3] px-2 py-0.5 rounded">Split Tender</div>
             </div>
           )}

           {status === 'DECLINED' && (
             <div className="z-20 flex flex-col items-center text-red-900">
                <XCircle size={48} className="mb-3" />
                <div className="text-lg font-black uppercase tracking-tight">Declined</div>
                <div className="text-[10px] font-bold mt-1 opacity-70">REASON CODE: 51</div>
                <div className="text-[8px] font-mono mt-1">Insufficient Funds</div>
             </div>
           )}
        </div>

        {/* Physical Keypad */}
        <div className="grid grid-cols-3 gap-3 px-1 pb-6">
           {[1,2,3,4,5,6,7,8,9,0].map(n => (
             <button 
               key={n}
               onClick={() => handleKeypad(n.toString())}
               className={`h-12 rounded-xl bg-gradient-to-b from-[#3a3a4a] to-[#252530] text-white font-bold text-lg shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center border-t border-white/5 ${n === 0 ? 'col-start-2' : ''}`}
             >
               {n}
               <span className="text-[7px] block absolute mt-7 opacity-30 font-normal">
                 {n === 1 ? '' : n === 2 ? 'ABC' : n === 3 ? 'DEF' : n === 4 ? 'GHI' : n === 5 ? 'JKL' : n === 6 ? 'MNO' : n === 7 ? 'PQRS' : n === 8 ? 'TUV' : n === 9 ? 'WXYZ' : ''}
               </span>
             </button>
           ))}
           <button onClick={handleClear} className="h-12 rounded-xl bg-gradient-to-b from-red-600/40 to-red-900/60 text-white font-bold text-[9px] uppercase tracking-tighter shadow-[0_4px_0_rgba(127,29,29,0.5)] active:translate-y-1 active:shadow-none border-t border-white/10">Clear</button>
           <button onClick={handleEnter} className="h-12 rounded-xl bg-gradient-to-b from-green-600/40 to-green-900/60 text-white font-bold text-[9px] uppercase tracking-tighter shadow-[0_4px_0_rgba(20,83,45,0.5)] active:translate-y-1 active:shadow-none border-t border-white/10 col-start-3 row-start-4">Enter</button>
        </div>

        {/* Card Slot */}
        <div className="relative pt-4 flex flex-col items-center">
           <div className="w-full h-3 bg-black rounded-full shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] border border-white/5 mb-2"></div>
           <div className="text-[8px] text-gray-500 uppercase font-black tracking-[0.3em]">Insert / Swipe Card</div>
           <div className="absolute -bottom-8 flex space-x-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-2" alt="visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-2" alt="mc" />
              <div className="text-[8px] font-black text-white italic">mada</div>
           </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-[#252530] text-gray-400 rounded-full flex items-center justify-center shadow-2xl hover:text-white border border-white/10 transition-colors group"
        >
           <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}
