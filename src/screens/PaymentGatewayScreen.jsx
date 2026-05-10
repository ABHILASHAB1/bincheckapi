import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, ShieldCheck, Lock, Globe, Zap, CheckCircle2, XCircle, 
  RefreshCw, Copy, Eye, EyeOff, Wallet, Smartphone, Hash, ArrowRight,
  ChevronRight, Building2, SmartphoneIcon, AlertTriangle, Info,
  Search, ExternalLink, Mail, Phone, MapPin, Key
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

const OTP_MODAL_STYLES = `
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .otp-modal {
    animation: slideUp 0.3s ease-out;
  }
`;

export default function PaymentGatewayScreen() {
  const { runTransaction, vaultCards, dbLogs, gatewayWebhooks } = useSimulation();
  
  // State
  const [method, setMethod] = useState('card');
  const [form, setForm] = useState({ 
    number: '', 
    month: '', 
    year: '', 
    cvc: '', 
    amount: '450.00', 
    currency: 'SAR', 
    name: 'Saleh Al-Otaibi' 
  });
  const [showCvc, setShowCvc] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [show3DS, setShow3DS] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'fail'
  const [apiLogs, setApiLogs] = useState([]);
  const [saveCard, setSaveCard] = useState(false);
  const [activeToken, setActiveToken] = useState(null);
  const [isVaulting, setIsVaulting] = useState(false);
  
  // Refs
  const otpInputRef = useRef(null);

  // Auto-fill from vault if available
  useEffect(() => {
    if (vaultCards.length > 0 && !form.number) {
      const card = vaultCards[0];
      setForm(prev => ({
        ...prev,
        number: card.pan,
        month: card.exp?.slice(0, 2) || '12',
        year: card.exp?.slice(2) || '28',
        cvc: ''
      }));
    }
  }, [vaultCards]);

  const detectScheme = (pan) => {
    if (!pan) return 'Unknown';
    const clean = pan.replace(/\s/g, '');
    if (clean.startsWith('5888') || clean.startsWith('9682') || clean.startsWith('4408') || clean.startsWith('4409')) return 'mada';
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5')) return 'Mastercard';
    return 'Unknown';
  };

  const scheme = detectScheme(form.number);

  const handlePay = () => {
    if (!form.number || !form.month || !form.year) return;
    setProcessing(true);
    
    // Log API call
    addApiLog('POST', '/v1/payments', {
      amount: parseFloat(form.amount) * 100,
      currency: form.currency,
      source: {
        type: 'card',
        number: form.number.replace(/\s/g, '').replace(/.(?=.{4})/g, '*'),
        month: form.month,
        year: form.year
      }
    });

    // Simulate Gateway Orchestration
    setTimeout(() => {
      // For eCommerce/MADA transactions, trigger 3DS
      if (scheme === 'mada' || scheme === 'Visa') {
        setShow3DS(true);
        setProcessing(false);
      } else {
        completePayment(true);
      }
    }, 1500);
  };

  const verifyOtp = () => {
    if (otp === '123456') {
      setShow3DS(false);
      setProcessing(true);
      setTimeout(() => completePayment(true), 1500);
    } else {
      setOtpError(true);
      setTimeout(() => setOtpError(false), 2000);
    }
  };

  const handleTokenize = async () => {
    setIsVaulting(true);
    try {
      const payload = {
        number: form.number.replace(/\s/g, ''),
        month: form.month,
        year: form.year,
        name: form.name
      };
      const res = await fetch('/api/v1/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.token) {
        setActiveToken(data.token);
        return data.token;
      }
    } catch (e) {
      console.error('Tokenization failed', e);
    } finally {
      setIsVaulting(false);
    }
    return null;
  };

  const completePayment = async (success) => {
    setProcessing(false);
    
    // If user requested to save card, tokenize it now
    if (saveCard) {
      await handleTokenize();
    }

    const stan = Math.floor(100000 + Math.random() * 900000).toString();
    const rrn = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    try {
      const response = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(form.amount) * 100,
          currency: form.currency,
          source: {
            type: 'card',
            number: form.number.replace(/\s/g, ''),
            month: form.month,
            year: form.year
          },
          description: 'Payment from Simulator Gateway'
        })
      });
      
      const data = await response.json();
      setResult(data.status === 'failed' ? 'fail' : 'success');

      // Trigger backend ISO transaction for simulation purposes
      const isMada = scheme === 'mada';
      runTransaction({
        mti: isMada ? '0100' : '0100', // Following user payload
        pan: form.number.replace(/\s/g, ''),
        amount: (parseFloat(form.amount) * 100).toString().padStart(12, '0'),
        stan,
        rrn,
        procCode: '000000',
        posEntry: isMada ? '010' : '051',
        posCondition: isMada ? '59' : '00',
        mcc: isMada ? '5999' : '5812',
        acquirerId: isMada ? '123456' : '123456',
        terminalId: isMada ? 'ECOMTERM01' : 'TERM0001',
        merchantId: isMada ? 'MERCHANT000001' : 'MERCH0001',
        merchantName: isMada ? 'ONLINE STORE SAUDI ARABIA' : 'GLOBAL STORE',
        currency: '682',
        madaEcom: isMada ? 'MADAECOM' : null,
        usageCode: isMada ? 'ECOM' : null,
        privateData: isMada ? 'MADAECOM' : '',
        time: isMada ? '123045' : '142201',
        dateLocal: isMada ? '0509' : '0502',
        expDate: isMada ? '2805' : '2512'
      });

      // Log Response
      addApiLog('RESPONSE', '/v1/payments', data);
    } catch (err) {
      setResult('fail');
      addApiLog('ERROR', '/v1/payments', { error: err.message });
    }
  };

  const addApiLog = (method, endpoint, data) => {
    setApiLogs(prev => [{
      id: Date.now(),
      method,
      endpoint,
      timestamp: new Date().toLocaleTimeString(),
      data: JSON.stringify(data, null, 2)
    }, ...prev].slice(0, 10));
  };

  return (
    <div className="h-full w-full bg-[#f6f9fc] flex overflow-hidden font-sans text-[#424770]">
      <style dangerouslySetInnerHTML={{ __html: OTP_MODAL_STYLES }} />

      {/* LEFT: STRIPE-LIKE CHECKOUT FORM */}
      <div className="flex-1 overflow-y-auto p-12 flex justify-center">
        <div className="w-full max-w-[480px] space-y-8">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1a1f36]">Fintech Gateway</h1>
              <p className="text-sm text-[#697386]">Secured by Saudi Payment Network</p>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.1),0_5px_15px_rgba(0,0,0,0.07)] p-8 space-y-6">
            
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-[#1a1f36]">Pay with {method === 'card' ? 'Card' : 'Wallet'}</span>
              <div className="flex gap-1">
                <div className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${scheme === 'mada' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                  {scheme}
                </div>
              </div>
            </div>

            {/* Amount Summary */}
            <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-100">
              <span className="text-sm font-medium">Order Total</span>
              <span className="text-2xl font-black text-[#1a1f36]">{form.currency} {form.amount}</span>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#697386] mb-1.5 block">Cardholder Name</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full h-11 px-4 bg-white border border-[#e6ebf1] rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all text-[#1a1f36]"
                  placeholder="Saleh Al-Otaibi"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#697386] mb-1.5 block">Card Information</label>
                <div className="relative">
                  <input 
                    value={form.number} 
                    onChange={e => setForm({...form, number: e.target.value})}
                    className="w-full h-11 px-4 bg-white border border-[#e6ebf1] rounded-t-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all text-[#1a1f36] font-mono"
                    placeholder="4408 0000 0000 0000"
                  />
                  <div className="flex border-x border-b border-[#e6ebf1] rounded-b-lg overflow-hidden">
                    <input 
                      value={form.month} 
                      onChange={e => setForm({...form, month: e.target.value})}
                      className="w-1/4 h-11 px-4 focus:outline-none focus:bg-slate-50 text-center border-r border-[#e6ebf1] text-[#1a1f36]" 
                      placeholder="MM"
                    />
                    <input 
                      value={form.year} 
                      onChange={e => setForm({...form, year: e.target.value})}
                      className="w-1/4 h-11 px-4 focus:outline-none focus:bg-slate-50 text-center border-r border-[#e6ebf1] text-[#1a1f36]" 
                      placeholder="YY"
                    />
                    <div className="relative flex-1">
                      <input 
                        type={showCvc ? 'text' : 'password'}
                        value={form.cvc} 
                        onChange={e => setForm({...form, cvc: e.target.value})}
                        className="w-full h-11 px-4 focus:outline-none focus:bg-slate-50 text-[#1a1f36]" 
                        placeholder="CVC"
                        autoComplete="off"
                      />
                      <button 
                        onClick={() => setShowCvc(!showCvc)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                      >
                        {showCvc ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 border-t border-slate-50 pt-4">
              <button 
                onClick={() => setSaveCard(!saveCard)}
                className={`w-9 h-5 rounded-full transition-colors relative ${saveCard ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${saveCard ? 'left-4' : 'left-0.5'}`} style={{ left: saveCard ? '1.1rem' : '0.125rem' }}></div>
              </button>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-700">Save card for future payments</span>
                <span className="text-[9px] text-slate-400">Vault card info in our secure simulator.</span>
              </div>
            </div>

            {/* Pay Button */}
            <button 
              onClick={handlePay}
              disabled={processing || result}
              className={`w-full h-12 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                ${processing ? 'bg-indigo-400 cursor-wait' : result === 'success' ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-200'}`}
            >
              {processing ? (
                <><RefreshCw size={18} className="animate-spin" /> Processing...</>
              ) : result === 'success' ? (
                <><CheckCircle2 size={18} /> Paid</>
              ) : (
                <><Lock size={16} /> Pay {form.currency} {form.amount}</>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 py-2 opacity-40 grayscale">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MC" className="h-6" />
              <div className="h-4 border-l border-slate-300"></div>
              <span className="text-[10px] font-black italic">mada</span>
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 animate-bounce ${result === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {result === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              <div>
                <p className="font-bold">{result === 'success' ? 'Payment Successful' : 'Payment Failed'}</p>
                <p className="text-xs opacity-80">Reference: GEN-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
              </div>
              <button onClick={() => setResult(null)} className="ml-auto text-xs font-bold hover:underline">Reset</button>
            </div>
          )}

          {/* Quick Vault Pick */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Merchant Vault Cards</h3>
            <div className="grid grid-cols-2 gap-3">
              {vaultCards.slice(0, 4).map((card, i) => (
                <button 
                  key={i}
                  onClick={() => setForm({
                    ...form,
                    number: card.pan,
                    month: card.exp?.slice(0, 2) || '12',
                    year: card.exp?.slice(2) || '28',
                    cvc: ''
                  })}
                  className="bg-white border border-[#e6ebf1] p-3 rounded-xl hover:border-indigo-400 transition-colors flex items-center gap-3 group text-left shadow-sm"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.scheme === 'mada' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    <CreditCard size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[10px] font-black uppercase text-slate-400">{card.scheme}</div>
                    <div className="text-xs font-mono font-bold truncate">•••• {card.pan?.slice(-4)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: LIVE TELEMETRY & API LOGS */}
      <div className="w-[480px] bg-white border-l border-[#e6ebf1] flex flex-col">
        
        {/* API Inspector Tab */}
        <div className="p-6 border-b border-[#e6ebf1]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#1a1f36] flex items-center gap-2">
              <Hash size={16} className="text-indigo-600" />
              Gateway API Inspector
            </h2>
            <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase">Live</div>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-emerald-400 overflow-hidden shadow-inner">
              <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-black">POST</span>
                <span className="text-slate-500">/v1/payments</span>
              </div>
              <pre className="opacity-80">
                {`{
  "amount": ${parseFloat(form.amount) * 100},
  "currency": "${form.currency}",
  "source": {
    "type": "card",
    "id": "tok_mada_..."
  }
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Live Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <RefreshCw size={12} /> Transaction Stream
          </h3>
          
          <div className="space-y-3">
            {apiLogs.length === 0 && gatewayWebhooks.length === 0 && (
              <div className="text-center py-20 text-slate-300">
                <RefreshCw size={32} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-medium uppercase tracking-widest">Awaiting interaction...</p>
              </div>
            )}
            
            {/* Real-time Webhooks */}
            {gatewayWebhooks.map(wh => (
              <div key={wh.id} className="group relative">
                <div className="absolute left-[-25px] top-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-white">WEBHOOK</span>
                      <span className="text-[10px] text-emerald-600 font-bold">{wh.event}</span>
                    </div>
                    <span className="text-[9px] text-emerald-400">{wh.url}</span>
                  </div>
                  <pre className="text-[10px] font-mono text-emerald-700 bg-white/50 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(wh.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))}

            {apiLogs.map(log => (
              <div key={log.id} className="group relative">
                <div className="absolute left-[-25px] top-4 w-2 h-2 rounded-full bg-indigo-200 border-2 border-white group-first:bg-indigo-600 group-first:animate-ping"></div>
                <div className="bg-white border border-[#e6ebf1] rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${log.method === 'RESPONSE' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {log.method}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{log.endpoint}</span>
                    </div>
                    <span className="text-[9px] text-slate-300">{log.timestamp}</span>
                  </div>
                  <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 p-3 rounded-lg overflow-x-auto">
                    {log.data}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-6 bg-slate-50 border-t border-[#e6ebf1]">
          <div className="flex items-center justify-between text-xs font-bold text-[#697386]">
            <span>Webhook Status</span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* 3D SECURE OVERLAY */}
      {show3DS && (
        <div className="fixed inset-0 z-50 bg-[#1a1f36]/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="otp-modal w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            
            {/* Bank Branding */}
            <div className="bg-[#004b91] p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={24} />
                <span className="text-lg font-bold tracking-tight">SAUDI NATIONAL BANK</span>
              </div>
              <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">Verified by mada</div>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Verify Your Identity</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  We've sent a 6-digit security code to your mobile number ending in <span className="font-bold text-slate-800">**43</span>.
                </p>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block uppercase mb-0.5">Merchant</span>
                  <span className="text-slate-700 font-bold">FINTECH SIMULATOR</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase mb-0.5">Amount</span>
                  <span className="text-slate-700 font-bold">{form.currency} {form.amount}</span>
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
                    ref={otpInputRef}
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className={`w-full h-14 bg-slate-50 border-2 rounded-xl text-center text-3xl font-black tracking-[0.5em] transition-all focus:outline-none 
                      ${otpError ? 'border-red-500 text-red-600 animate-shake' : 'border-slate-100 focus:border-indigo-600 text-slate-800'}`}
                    placeholder="••••••"
                  />
                  {otpError && <p className="text-center text-xs text-red-600 font-bold mt-2">Invalid code. Please try again.</p>}
                  <p className="text-center text-[10px] text-slate-400 mt-2">Default test code is: <span className="text-indigo-600 font-bold">123456</span></p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { setShow3DS(false); completePayment(false); }}
                    className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={verifyOtp}
                    className="flex-[2] h-12 bg-[#004b91] rounded-xl text-white font-bold hover:bg-[#003d75] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                  >
                    Submit <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 py-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PCI-DSS Level 1 Compliant</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
