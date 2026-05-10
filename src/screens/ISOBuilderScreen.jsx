import React, { useState, useMemo, useCallback } from 'react';
import { Code2, Braces, Check, Copy, RefreshCw, Info, Play, AlertCircle, Binary, CreditCard, Zap, ArrowLeftRight } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { DE_DEFINITIONS, MTI_DEFINITIONS, RESPONSE_CODES, PROCESSING_CODES, POS_ENTRY_MODES, calculateBitmap, luhnCheck, generateSTAN, generateRRN, generateDE7, loadISOConfig, buildISO8583Message, executeSchemeModule, DE22_OPTIONS } from '../data/iso8583';
import { TEST_CARDS } from '../data/testCards';
import { autoPopulateFromCard, buildDE55, SCHEME_META, TRANSACTION_TYPES } from '../utils/isoFieldBuilder';

const BUILDER_FIELDS = [
  { deId: '000', key: 'mti' },
  { deId: '002', key: 'pan' },
  { deId: '003', key: 'procCode' },
  { deId: '004', key: 'amount' },
  { deId: '007', key: 'date' },
  { deId: '011', key: 'stan' },
  { deId: '014', key: 'expDate' },
  { deId: '022', key: 'posEntry' },
  { deId: '025', key: 'posCondition', default: '00' },
  { deId: '032', key: 'acquirerId' },
  { deId: '035', key: 'track2' },
  { deId: '037', key: 'rrn', default: '' },
  { deId: '041', key: 'terminalId', default: 'TERM0001' },
  { deId: '042', key: 'merchantId', default: '000000000000001' },
  { deId: '043', key: 'merchantName', default: 'TEST MERCHANT          RIYADH       SA' },
  { deId: '048', key: 'privateData', default: '' },
  { deId: '049', key: 'currency' },
  { deId: '052', key: 'pinBlock', default: '' },
  { deId: '055', key: 'emvData', default: '' },
  { deId: '060', key: 'batchData', default: '' },
];

export default function ISOBuilderScreen({ setActiveScreen }) {
  const [viewMode, setViewMode] = useState('raw');
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [customHex, setCustomHex] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [activeTxType, setActiveTxType] = useState('PURCHASE');
  const { isoFields, setIsoFields, runTransaction, detectScheme, vaultCards, refreshVault } = useSimulation();

  const scheme = useMemo(() => detectScheme(isoFields.pan || ''), [isoFields.pan, detectScheme]);
  const schemeConfig = useMemo(() => loadISOConfig(scheme), [scheme]);

  // Extended fields beyond what SimulationContext holds
  const [extFields, setExtFields] = useState({
    posCondition: '00',
    rrn: '',
    terminalId: 'TERM0001',
    merchantId: '000000000000001',
    merchantName: 'TEST MERCHANT          RIYADH       SA',
    pinBlock: '',
    emvData: '',
    track2: '',
  });

  const getFieldValue = (key) => isoFields[key] !== undefined ? isoFields[key] : (extFields[key] || '');

  // ── Refresh vault & update DE02 dropdown ─────────────────────────────────
  const handleRefreshVault = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 300)); // allow spinner to render
    refreshVault();
    setTimeout(() => {
      setIsRefreshing(false);
      setLastSynced(new Date().toLocaleTimeString());
    }, 800);
  }, [refreshVault]);

  // ── Card selection: full scheme-aware auto-population ─────────────────────
  const handleCardSelect = useCallback((pan, txType = activeTxType) => {
    const allCards = [...vaultCards, ...TEST_CARDS];
    const card = allCards.find(c => c.pan === pan);
    if (!card) return;

    const amount = isoFields.amount || '000000010000';
    const populated = autoPopulateFromCard(card, amount, txType);

    console.log(`🎯 [DE02 AUTO-SYNC] ${populated._scheme} | TxType: ${txType} | 9C=${populated._9C} | MTI=${populated._mti} | AID: ${populated._aid}`);

    setIsoFields(prev => ({
      ...prev,
      pan:         populated.pan,
      expDate:     populated.expDate,
      currency:    populated.currency,
      mti:         populated.mti,
      posEntry:    populated.posEntry,
      procCode:    populated.procCode,
    }));

    setExtFields(prev => ({
      ...prev,
      track2:       populated.track2,
      emvData:      populated.emvData,
      posCondition: populated.posCondition,
      pinBlock:     populated.pinBlock,
    }));
  }, [vaultCards, isoFields.amount, activeTxType, setIsoFields]);

  // ── Change transaction type and re-populate all fields if card is set ─────
  const handleTxTypeChange = useCallback((txType) => {
    setActiveTxType(txType);
    if (isoFields.pan) handleCardSelect(isoFields.pan, txType);
    else {
      // No card selected – just update proc code and MTI
      const txDef = TRANSACTION_TYPES[txType];
      if (txDef) {
        setIsoFields(prev => ({ ...prev, procCode: txDef.procCode }));
        if (txType === 'REVERSAL') setIsoFields(prev => ({ ...prev, mti: '0400' }));
      }
    }
  }, [isoFields.pan, handleCardSelect, setIsoFields]);

  // ── Regenerate DE55 (txType-aware, call after amount change) ──────────────
  const handleRegenerateEMV = useCallback(() => {
    if (!isoFields.pan) return;
    const allCards = [...vaultCards, ...TEST_CARDS];
    const card = allCards.find(c => c.pan === isoFields.pan);
    if (!card) return;
    const populated = autoPopulateFromCard(card, isoFields.amount || '000000010000', activeTxType);
    setExtFields(prev => ({ ...prev, emvData: populated.emvData, track2: populated.track2 }));
  }, [isoFields.pan, isoFields.amount, activeTxType, vaultCards]);

  const setFieldValue = (key, val) => {
    if (isoFields[key] !== undefined) {
      setIsoFields(prev => ({ ...prev, [key]: val }));
    } else {
      setExtFields(prev => ({ ...prev, [key]: val }));
    }
    // Legacy path for manual PAN typing (not from dropdown)
    if (key === 'pan' && val) handleCardSelect(val);
  };

  const handleClear = () => {
    setIsoFields({ mti: '', pan: '', procCode: '', amount: '', date: '', stan: '', expDate: '', posEntry: '', acquirerId: '', currency: '' });
    setExtFields({ posCondition: '', rrn: '', terminalId: '', merchantId: '', merchantName: '', pinBlock: '', emvData: '' });
  };

  const handleAutoFill = () => {
    setIsoFields(prev => ({
      ...prev,
      stan: generateSTAN(),
      date: generateDE7(),
    }));
    setExtFields(prev => ({ ...prev, rrn: generateRRN() }));
  };

  const handleFillVisa = () => {
    setIsoFields({ ...isoFields, pan: '4111222233334444', amount: '000000015000', mti: '0100', procCode: '000000', posEntry: '051', currency: '840' });
    handleAutoFill();
  };
  const handleFillMC = () => {
    setIsoFields({ ...isoFields, pan: '5500111122223333', amount: '000000050000', mti: '0100', procCode: '000000', posEntry: '051', currency: '840' });
    handleAutoFill();
  };
  const handleFillMada = () => {
    setIsoFields({ ...isoFields, pan: '9682010000001234', amount: '000000050000', mti: '0200', procCode: '000000', posEntry: '051', currency: '682', acquirerId: '112233' });
    handleAutoFill();
  };
  const handleFillMadaAtheer = () => {
    setIsoFields({ ...isoFields, pan: '4406470000005678', amount: '000000010000', mti: '0200', procCode: '000000', posEntry: '071', currency: '682', acquirerId: '112233' });
    handleAutoFill();
  };

  const handleSimulate = () => {
    if (isOverrideMode && customHex) {
      // Expert Mode: Skip builder and send raw hex
      runTransaction({ 
        ...isoFields, 
        ...extFields, 
        rawHexOverride: customHex,
        isOverride: true 
      });
      if (setActiveScreen) setActiveScreen('dashboard');
      return;
    }

    // 1. Detect Scheme & Validate Luhn
    const activeScheme = detectScheme(isoFields.pan || '');
    if (isoFields.pan && !luhnCheck(isoFields.pan)) {
      alert('❌ [SECURITY BLOCK]: Transaction Aborted.\n\nThe PAN provided fails the Luhn validation check. Only mathematically valid cards can be simulated in production-hardened mode.');
      return;
    }
    
    // 2. Load Configuration
    const config = loadISOConfig(activeScheme);

    // Prepare transaction data using DE fields
    const txData = { '000': isoFields.mti };
    BUILDER_FIELDS.forEach(f => {
      if(f.deId !== '000') txData[f.deId] = getFieldValue(f.key);
    });

    // 3. Build Message based on Scheme Config
    const message = buildISO8583Message(config, txData);

    // 4. Execute Scheme Module Validations
    const result = executeSchemeModule(activeScheme, message);
    
    if (!result.valid) {
      alert(`Scheme Validation Failed [${result.module}]:\n\n- ` + result.errors.join('\n- '));
      return;
    }

    // Proceed to transaction run
    runTransaction({ ...isoFields, ...extFields });
    if (setActiveScreen) {
      setActiveScreen('dashboard');
    }
  };

  // Validation
  const validations = useMemo(() => {
    const v = {};
    const pan = isoFields.pan || '';
    if (pan && !luhnCheck(pan)) v['002'] = 'Luhn check failed';
    if (isoFields.mti && !MTI_DEFINITIONS[isoFields.mti]) v['000'] = 'Unknown MTI';
    if (isoFields.procCode && !PROCESSING_CODES[isoFields.procCode]) v['003'] = 'Non-standard processing code';
    return v;
  }, [isoFields]);

  // Active DEs for bitmap
  const activeDEs = useMemo(() => {
    const active = [];
    BUILDER_FIELDS.forEach(f => {
      if (f.deId === '000') return;
      const val = getFieldValue(f.key);
      if (val && val.trim()) active.push(parseInt(f.deId));
    });
    return active;
  }, [isoFields, extFields]);

  const bitmapHex = useMemo(() => calculateBitmap(activeDEs), [activeDEs]);

  // Build raw ISO string
  const rawParts = useMemo(() => {
    const parts = [];
    parts.push({ label: 'MTI', value: isoFields.mti || '0000', color: 'text-fintech-accent' });
    parts.push({ label: 'Bitmap', value: bitmapHex, color: 'text-purple-400' });
    BUILDER_FIELDS.forEach(f => {
      if (f.deId === '000') return;
      const val = getFieldValue(f.key);
      if (!val) return;
      const def = DE_DEFINITIONS[f.deId];
      if (def && !def.fixed) {
        parts.push({ label: 'DE' + f.deId + ' Len', value: val.length.toString().padStart(2, '0'), color: 'text-gray-500' });
      }
      const colors = ['text-green-400', 'text-yellow-400', 'text-orange-400', 'text-pink-400', 'text-teal-400', 'text-indigo-400', 'text-red-400', 'text-blue-300', 'text-green-300', 'text-cyan-400', 'text-amber-400', 'text-lime-400', 'text-rose-400', 'text-violet-400', 'text-emerald-400', 'text-sky-400'];
      const idx = BUILDER_FIELDS.findIndex(x => x.deId === f.deId) % colors.length;
      parts.push({ label: 'DE' + f.deId, value: val, color: colors[idx] });
    });
    return parts;
  }, [isoFields, extFields, bitmapHex]);

  const rawString = rawParts.map(p => p.value).join('');

  // JSON view
  const jsonObj = useMemo(() => {
    const obj = { MTI: isoFields.mti, bitmap: bitmapHex, elements: {} };
    BUILDER_FIELDS.forEach(f => {
      if (f.deId === '000') return;
      const val = getFieldValue(f.key);
      if (val) obj.elements[f.deId] = val;
    });
    return obj;
  }, [isoFields, extFields, bitmapHex]);

  // Hex view
  const hexView = useMemo(() => {
    const bytes = [];
    for (let i = 0; i < rawString.length; i += 2) {
      const char1 = rawString.charCodeAt(i);
      const char2 = i + 1 < rawString.length ? rawString.charCodeAt(i + 1) : 0;
      bytes.push(char1.toString(16).padStart(2, '0').toUpperCase());
      if (char2) bytes.push(char2.toString(16).padStart(2, '0').toUpperCase());
    }
    return bytes;
  }, [rawString]);

  return (
    <>
    <div className="h-full w-full flex overflow-hidden p-6 gap-6">
      
      {/* Left: Message Builder Form */}
      <div className="w-1/2 flex flex-col glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fintech-accent"></div>
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center">
            <Code2 size={16} className="mr-2 text-purple-400" />
            Message Builder
            <span className="ml-2 text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-gray-500">{BUILDER_FIELDS.length} DEs</span>
          </h2>
          <div className="flex space-x-1.5 flex-wrap items-center gap-y-1">
            {/* Transaction Type Selector */}
            <div className="flex bg-black/40 border border-white/10 rounded overflow-hidden">
              {Object.entries(TRANSACTION_TYPES).map(([key, def]) => (
                <button
                  key={key}
                  onClick={() => handleTxTypeChange(key)}
                  title={def.label}
                  className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider transition-all border-r border-white/5 last:border-r-0 ${
                    activeTxType === key
                      ? `bg-white/10 ${def.color}`
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {key === 'PURCHASE' ? '🛒' : key === 'REFUND' ? '↩' : key === 'ATM' ? '🏧' : key === 'CASHBACK' ? '💸' : key === 'REVERSAL' ? '⟲' : key === 'BALANCE' ? '💰' : '•'}
                  {' '}{key === 'CASH_ADVANCE' ? 'ADV' : key.slice(0, 3)}
                </button>
              ))}
            </div>
            <div className="h-4 w-[1px] bg-white/10 mx-0.5"></div>
            <button onClick={handleFillVisa} className="btn-secondary text-[9px] py-0.5 px-1.5">Visa</button>
            <button onClick={handleFillMC} className="btn-secondary text-[9px] py-0.5 px-1.5">MC</button>
            <button onClick={handleFillMada} className="btn-secondary text-[9px] py-0.5 px-1.5" style={{borderColor: 'rgba(16,185,129,0.3)', color: '#10b981'}}>mada</button>
            <button onClick={handleFillMadaAtheer} className="btn-secondary text-[9px] py-0.5 px-1.5" style={{borderColor: 'rgba(16,185,129,0.3)', color: '#10b981'}}>Atheer</button>
            <button onClick={handleAutoFill} className="btn-secondary text-[9px] py-0.5 px-1.5">Auto STAN/RRN</button>
            <button onClick={handleClear} className="btn-secondary text-[9px] py-0.5 px-1.5 flex items-center">
              <RefreshCw size={10} className="mr-0.5" /> Clear
            </button>
            <button onClick={handleSimulate} className="btn-primary text-[9px] py-0.5 px-2 flex items-center">
              <Play size={10} className="mr-0.5" /> Simulate
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {BUILDER_FIELDS.map((field) => {
            const def = DE_DEFINITIONS[field.deId];
            if (!def) return null;
            const val = getFieldValue(field.key);
            const hasError = validations[field.deId];
            const mtiDef = field.deId === '000' && isoFields.mti ? MTI_DEFINITIONS[isoFields.mti] : null;

            return (
              <div key={field.deId} className={'group flex items-start space-x-2 p-2 rounded-lg border transition-colors ' + (hasError ? 'bg-fintech-red/5 border-fintech-red/20' : 'bg-black/20 border-transparent hover:border-white/10 hover:bg-black/40')}>
                <div className="w-10 text-center mt-1.5 flex-shrink-0">
                  <span className={'font-mono text-[10px] font-bold px-1 py-0.5 rounded ' + (hasError ? 'bg-fintech-red/20 text-fintech-red' : 'bg-fintech-accent/10 text-fintech-accent')}>
                    {field.deId === '000' ? 'MTI' : 'DE' + field.deId}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[10px] font-medium text-gray-300 truncate flex items-center">
                      {def.name} {schemeConfig.requiredFields.includes(field.deId) && <span className="text-fintech-red ml-1" title={`Required for ${scheme}`}>*</span>}
                      <span className="text-[8px] text-gray-600 font-mono ml-1.5 hidden group-hover:inline">[{def.type} {def.len}]</span>
                    </label>
                  </div>
                  {field.deId === '022' ? (
                    <select
                      value={val}
                      onChange={(e) => setFieldValue(field.key, e.target.value)}
                      className={'w-full bg-[#0a0a0f] border rounded py-1 px-2 text-xs text-gray-100 font-mono focus:outline-none focus:ring-1 transition-colors shadow-inner appearance-none ' + (hasError ? 'border-fintech-red/50 focus:border-fintech-red focus:ring-fintech-red/50' : 'border-gray-700 focus:border-fintech-accent focus:ring-fintech-accent/50')}
                    >
                      <option value="">-- Select POS Entry Mode --</option>
                      {(DE22_OPTIONS[scheme] || DE22_OPTIONS['Unknown']).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} - {opt.label}</option>
                      ))}
                    </select>
                  ) : field.deId === '002' ? (
                    <div className="space-y-1.5">
                      {/* ── Refresh + Card count header ── */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CreditCard size={10} className="text-cyan-400" />
                          <span className="text-[9px] text-gray-500 font-mono">
                            {vaultCards.length > 0
                              ? <><span className="text-cyan-400 font-bold">{vaultCards.length}</span> vault · <span className="text-gray-500">{TEST_CARDS.length} static</span></>
                              : <span className="text-yellow-500">Static cards only</span>
                            }
                          </span>
                          {lastSynced && (
                            <span className="text-[8px] text-gray-600 font-mono">· synced {lastSynced}</span>
                          )}
                        </div>
                        <button
                          onClick={handleRefreshVault}
                          disabled={isRefreshing}
                          title="Refresh vault cards"
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 transition-all disabled:opacity-50"
                        >
                          <RefreshCw size={9} className={isRefreshing ? 'animate-spin' : ''} />
                          {isRefreshing ? 'Fetching...' : 'Refresh'}
                        </button>
                      </div>

                      {/* ── Card Dropdown ── */}
                      <div className="relative">
                        <select
                          value={val}
                          onChange={(e) => handleCardSelect(e.target.value)}
                          className={'w-full bg-[#0a0a0f] border rounded py-1.5 px-2 text-xs text-gray-100 font-mono focus:outline-none focus:ring-1 transition-colors shadow-inner appearance-none pr-6 ' + (hasError ? 'border-fintech-red/50 focus:ring-fintech-red/50' : 'border-cyan-700/50 focus:border-cyan-500 focus:ring-cyan-500/30')}
                        >
                          <option value="">-- Select Card from Vault --</option>
                          {/* Cloud vault cards first */}
                          {vaultCards.length > 0 && (
                            <optgroup label="☁️ Cloud Vault">
                              {vaultCards.map(card => {
                                const isLuhnValid = luhnCheck(card.pan);
                                const net = card.scheme || card.network || '?';
                                return (
                                  <option key={card.id || card.pan} value={card.pan} disabled={!isLuhnValid} className="bg-[#0d0d14]">
                                    {isLuhnValid ? '✅' : '❌'} {net} {card.type} ···{card.pan.slice(-4)} ({card.issuer_name || card.issuer || '—'})
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                          {/* Static test cards */}
                          <optgroup label="📦 Static Test Cards">
                            {TEST_CARDS.map(card => {
                              const isLuhnValid = luhnCheck(card.pan);
                              return (
                                <option key={card.id || card.pan} value={card.pan} className="bg-[#0d0d14]">
                                  {isLuhnValid ? '✅' : '❌'} {card.network} {card.type} ···{card.pan.slice(-4)} — {card.scenario}
                                </option>
                              );
                            })}
                          </optgroup>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <CreditCard size={10} className="text-cyan-700" />
                        </div>
                      </div>

                      {/* ── Auto-populated fields banner ── */}
                      {isoFields.pan && (() => {
                        const txDef = TRANSACTION_TYPES[activeTxType] || TRANSACTION_TYPES.PURCHASE;
                        const isRefund = activeTxType === 'REFUND';
                        const isATM    = activeTxType === 'ATM';
                        const bannerColor = isRefund ? 'border-orange-500/30 bg-orange-500/5' :
                                            isATM    ? 'border-yellow-500/30 bg-yellow-500/5' :
                                                       'border-cyan-500/20 bg-cyan-500/5';
                        const labelColor  = isRefund ? 'text-orange-400' : isATM ? 'text-yellow-400' : 'text-cyan-400';
                        return (
                          <div className={`border rounded px-2 py-1.5 space-y-1 ${bannerColor}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Zap size={9} className={labelColor} />
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${labelColor}`}>
                                  {txDef.label} · POS Chip
                                </span>
                              </div>
                              <button
                                onClick={handleRegenerateEMV}
                                title="Regenerate DE35 + DE55 with current amount and transaction type"
                                className={`text-[8px] font-mono border px-1.5 py-0.5 rounded transition-colors ${isRefund ? 'border-orange-500/30 text-orange-400 hover:text-orange-200' : 'border-cyan-500/30 text-cyan-500 hover:text-cyan-300'}`}
                              >
                                ⟳ Regen EMV
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[8px]">
                              <span className="text-gray-500">MTI:</span>
                              <span className="text-green-400">{isoFields.mti || '—'}</span>
                              <span className="text-gray-500">DE03 ProcCode:</span>
                              <span className={isRefund ? 'text-orange-400 font-bold' : 'text-green-400'}>{isoFields.procCode || txDef.procCode}</span>
                              <span className="text-gray-500">DE14 Exp:</span>
                              <span className="text-green-400">{isoFields.expDate || '—'}</span>
                              <span className="text-gray-500">DE22 POS Mode:</span>
                              <span className="text-green-400">{isoFields.posEntry || '—'} (Chip)</span>
                              <span className="text-gray-500">DE25 Condition:</span>
                              <span className="text-green-400">{extFields.posCondition || '00'}</span>
                              <span className="text-gray-500">DE35 Track2:</span>
                              <span className="text-green-400 truncate">{extFields.track2 ? extFields.track2.slice(0, 22) + '…' : '—'}</span>
                              <span className="text-gray-500">DE49 Currency:</span>
                              <span className="text-green-400">{isoFields.currency === '682' ? '682 (SAR)' : isoFields.currency === '840' ? '840 (USD)' : isoFields.currency || '—'}</span>
                              <span className="text-gray-500">DE55 EMV:</span>
                              <span className={extFields.emvData ? 'text-green-400' : 'text-gray-600'}>{extFields.emvData ? `${extFields.emvData.length / 2} bytes TLV ✓` : '—'}</span>
                              <span className="text-gray-500">9C (Tx Type):</span>
                              <span className={isRefund ? 'text-orange-400 font-bold' : 'text-green-400'}>{txDef.txnType9C} ({txDef.label})</span>
                              {isRefund && <>
                                <span className="text-orange-500/70">9F34 CVM:</span>
                                <span className="text-orange-300">{scheme === 'mada' ? '1E0302 (Online PIN)' : '3F0002 (No CVM)'}</span>
                              </>}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => setFieldValue(field.key, e.target.value)}
                      placeholder={def.desc}
                      className={'w-full bg-[#0a0a0f] border rounded py-1 px-2 text-xs text-gray-100 font-mono focus:outline-none focus:ring-1 transition-colors shadow-inner ' + (hasError ? 'border-fintech-red/50 focus:border-fintech-red focus:ring-fintech-red/50' : 'border-gray-700 focus:border-fintech-accent focus:ring-fintech-accent/50')}
                    />
                  )}
                  {field.deId === '002' && (
                    <datalist id="pan-datalist">
                      {TEST_CARDS.map(card => (
                        <option key={card.id} value={card.pan}>
                          {card.network} {card.type} - {card.scenario}
                        </option>
                      ))}
                    </datalist>
                  )}
                  {hasError && <div className="text-[9px] text-fintech-red mt-0.5 flex items-center"><AlertCircle size={9} className="mr-1" />{hasError}</div>}
                  {mtiDef && <div className="text-[9px] text-fintech-accent mt-0.5">{mtiDef.name} — {mtiDef.desc}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="w-1/2 flex flex-col glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-600 to-gray-400"></div>
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center space-x-3">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center">
              <Braces size={16} className="mr-2 text-gray-400" />
              Live Preview
            </h2>
            <div className="flex bg-black/50 p-0.5 rounded-md border border-white/10">
              {['raw', 'json', 'hex', 'expert'].map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={'text-[10px] px-2 py-1 rounded transition-colors uppercase ' + (viewMode === m ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300')}>{m}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {Object.keys(validations).length === 0 ? (
              <div className="text-[10px] text-fintech-green flex items-center bg-fintech-green/10 px-2 py-0.5 rounded border border-fintech-green/20">
                <Check size={10} className="mr-1" /> Valid
              </div>
            ) : (
              <div className="text-[10px] text-fintech-red flex items-center bg-fintech-red/10 px-2 py-0.5 rounded border border-fintech-red/20">
                <AlertCircle size={10} className="mr-1" /> {Object.keys(validations).length} error(s)
              </div>
            )}
            <button onClick={() => navigator.clipboard?.writeText(viewMode === 'json' ? JSON.stringify(jsonObj, null, 2) : rawString)} className="p-1 hover:bg-white/10 rounded-md text-gray-400 transition-colors" title="Copy">
              <Copy size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex-1 bg-[#050508] border border-gray-800 rounded-lg p-4 overflow-y-auto font-mono text-sm shadow-inner custom-scrollbar">
            {viewMode === 'raw' && (
              <div className="break-all leading-relaxed">
                {rawParts.map((part, i) => (
                  <span key={i} className={part.color} title={part.label}>{part.value}</span>
                ))}
              </div>
            )}
            {viewMode === 'json' && (
              <pre className="text-gray-300 text-xs">{JSON.stringify(jsonObj, null, 2)}</pre>
            )}
            {viewMode === 'hex' && (
              <div className="space-y-1">
                {Array.from({ length: Math.ceil(rawString.length / 32) }).map((_, row) => {
                  const offset = row * 32;
                  const slice = rawString.slice(offset, offset + 32);
                  const hexChars = [];
                  for (let i = 0; i < slice.length; i++) {
                    hexChars.push(slice.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase());
                  }
                  const ascii = slice.replace(/[^\x20-\x7E]/g, '.');
                  return (
                    <div key={row} className="flex">
                      <span className="text-gray-600 w-12 flex-shrink-0">{offset.toString(16).padStart(4, '0').toUpperCase()}</span>
                      <span className="text-fintech-accent flex-1">{hexChars.join(' ')}</span>
                      <span className="text-gray-500 ml-4 flex-shrink-0">|{ascii}|</span>
                    </div>
                  );
                })}
              </div>
            )}
            {viewMode === 'expert' && (
              <div className="h-full flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                   <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center">
                      <Binary size={14} className="mr-2 text-fintech-accent" /> Expert Hex Override
                   </div>
                   <button 
                     onClick={() => {
                        setIsOverrideMode(!isOverrideMode);
                        if (!customHex) setCustomHex(rawString);
                     }}
                     className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${isOverrideMode ? 'bg-fintech-accent text-white shadow-[0_0_10px_var(--fintech-accent-glow)]' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                   >
                      {isOverrideMode ? 'Override Active' : 'Enable Override'}
                   </button>
                </div>
                <textarea 
                  value={isOverrideMode ? customHex : rawString}
                  onChange={(e) => setCustomHex(e.target.value)}
                  readOnly={!isOverrideMode}
                  className={`w-full flex-1 bg-black border rounded p-4 font-mono text-xs leading-relaxed focus:outline-none transition-all ${isOverrideMode ? 'border-fintech-accent/50 text-fintech-accent shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-white/5 text-gray-600 grayscale opacity-50 cursor-not-allowed'}`}
                  placeholder="Paste raw hex stream here..."
                />
                <div className="text-[9px] text-gray-600 italic">
                  Tip: Enabling override allows you to manually manipulate bit-fields or inject intentional malformed packets for switch robustness testing.
                </div>
              </div>
            )}
          </div>

          {/* Bitmap Analysis */}
          <div className="mt-3 h-28 bg-black/40 border border-white/5 rounded-lg overflow-hidden flex flex-col flex-shrink-0">
            <div className="px-3 py-1.5 border-b border-white/5 bg-white/5 text-[9px] font-bold text-gray-400 uppercase tracking-wider flex justify-between">
              <span>Bitmap: {bitmapHex}</span>
              <span>{activeDEs.length} active DEs</span>
            </div>
            <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-16 gap-px">
                {Array.from({length: 64}).map((_, i) => {
                  const isActive = activeDEs.includes(i+1);
                  return (
                    <div key={i} className={'text-[7px] font-mono text-center py-px rounded ' + (isActive ? 'bg-fintech-accent/20 text-fintech-accent' : 'bg-gray-900 text-gray-700')} title={'DE' + (i+1) + (DE_DEFINITIONS[String(i+1).padStart(3,'0')] ? ': ' + DE_DEFINITIONS[String(i+1).padStart(3,'0')].name : '')}>
                      {i+1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}


