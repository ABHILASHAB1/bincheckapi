import React, { useState } from 'react';
import { ShieldCheck, Plus, ToggleLeft, ToggleRight, Trash2, ChevronDown, ChevronRight, Globe2, AlertTriangle, Play, Zap } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

// Rules modeled after real Visa VTS / MC GCMS specifications
const INITIAL_RULES = [
  // === VISA RULES ===
  { id: 1, name: 'Visa Floor Limit – Chip (VTS 5.2.1)', scheme: 'Visa', field: 'DE4', condition: '<=', value: '25000', action: 'APPROVE_OFFLINE', enabled: true, priority: 1,
    ref: 'Visa Transaction Specification 5.2.1 – Floor limit processing for ICC chip transactions. Below floor = offline approval permitted.' },
  { id: 3, name: 'Visa CNP Decline – Mismatched AVS (VTS 10.3)', scheme: 'Visa', field: 'DE22', condition: '==', value: '812', action: 'DECLINE', enabled: true, priority: 3,
    ref: 'Visa Transaction Specification 10.3 – Card-Not-Present (POS 812) with no AVS match must decline per issuer mandate.' },
  { id: 5, name: 'Force 3DS on E-Commerce (Visa Secure 2.2)', scheme: 'Visa', field: 'DE22', condition: 'IN', value: '901,010,812', action: 'FORCE_3DS', enabled: true, priority: 5,
    ref: 'Visa Secure 2.2 / EMV 3DS mandate – All e-commerce POS entry modes must attempt 3DS authentication for liability shift.' },
  { id: 8, name: 'Visa Fallback Decline (VTS 5.4.2)', scheme: 'Visa', field: 'DE22', condition: '==', value: '801', action: 'DECLINE', enabled: true, priority: 8,
    ref: 'VTS 5.4.2 – Chip-to-magnetic stripe fallback (POS 801). Many issuers decline fallback per EMV migration mandate.' },
  { id: 10, name: 'Visa STIP Processing (VTS 3.1)', scheme: 'Visa', field: 'DE39', condition: '==', value: '91', action: 'STIP_APPROVE', enabled: true, priority: 10,
    ref: 'VTS 3.1 – Stand-In Processing. When issuer unavailable (RC 91), VisaNet performs STIP using risk parameters.' },
  // === MASTERCARD RULES ===
  { id: 2, name: 'MC Auth Mandate – High Value (GCMS M217)', scheme: 'MC', field: 'DE4', condition: '>', value: '10000', action: 'REQUIRE_ONLINE_AUTH', enabled: true, priority: 2,
    ref: 'Mastercard GCMS Manual Rule M217 – Transactions above $100 USD equivalent require online authorization.' },
  { id: 4, name: 'MC Contactless CVM Limit (GCMS M320)', scheme: 'MC', field: 'DE22', condition: '==', value: '071', action: 'CVM_REQUIRED_IF_OVER_LIMIT', enabled: true, priority: 4,
    ref: 'Mastercard GCMS M320 – Contactless transactions (POS 071) above CVM limit require PIN/signature verification.' },
  { id: 7, name: 'MC Recurring Flag (GCMS DE48 SE22)', scheme: 'MC', field: 'DE48', condition: 'CONTAINS', value: 'RECURRING', action: 'FLAG_REVIEW', enabled: false, priority: 7,
    ref: 'Mastercard DE48 Subelement 22 – Payment Account Reference for recurring. Issuer may flag for manual review per GCMS guidelines.' },
  { id: 9, name: 'MC Cross-Border Fee (GCMS IPM 5.8)', scheme: 'MC', field: 'DE49', condition: '!=', value: 'ACQUIRER_CURRENCY', action: 'APPLY_CROSS_BORDER_FEE', enabled: true, priority: 9,
    ref: 'Mastercard IPM Manual 5.8 – Cross-border assessment fee applied when txn currency differs from acquirer settlement currency.' },
  // === SHARED RULES ===
  { id: 6, name: 'Decline Expired Cards (ISO 8583 DE14)', scheme: 'Both', field: 'DE14', condition: '<', value: 'CURRENT_DATE', action: 'DECLINE', enabled: true, priority: 6,
    ref: 'ISO 8583:1987 Field 14 – Expiration date YYMM. If card expired, issuer must decline with RC 54 (Expired Card).' },
  // === MADA SPG RULES ===
  { id: 11, name: 'mada Domestic Routing Mandate (SPG 3.1)', scheme: 'mada', field: 'DE49', condition: '==', value: '682', action: 'ROUTE_DOMESTIC', enabled: true, priority: 11,
    ref: 'mada SPG 3.1 – All domestic Saudi transactions with currency SAR (682) must be routed through the mada switch. SAMA mandates domestic priority routing over international schemes for co-branded cards.' },
  { id: 12, name: 'mada Purchase MTI Mandate (SPG 4.2)', scheme: 'mada', field: 'DE3', condition: '==', value: '000000', action: 'REQUIRE_MTI_0200', enabled: true, priority: 12,
    ref: 'mada SPG 4.2 – Purchase transactions (DE3=000000) must use MTI 0200 (Financial Request), not 0100 (Auth-only). mada does not support standalone pre-authorization for debit.' },
  { id: 13, name: 'mada Atheer Contactless Limit (SPG 5.3)', scheme: 'mada', field: 'DE4', condition: '>', value: '30000', action: 'CVM_REQUIRED_IF_OVER_LIMIT', enabled: true, priority: 13,
    ref: 'mada SPG 5.3 (Atheer) – Contactless (tap) transactions exceeding SAR 300.00 require CVM (PIN). Below SAR 300 = no CVM required (CDCVM or NoCVM).' },
  { id: 14, name: 'mada Currency Must Be SAR (SPG 3.4)', scheme: 'mada', field: 'DE49', condition: '!=', value: '682', action: 'DECLINE', enabled: true, priority: 14,
    ref: 'mada SPG 3.4 – Transaction currency (DE49) must be 682 (SAR) for all domestic mada transactions. Non-SAR currency will be declined by the mada switch.' },
  { id: 15, name: 'mada Reversal Must Match Original (SPG 6.1)', scheme: 'mada', field: 'DE3', condition: 'IN', value: '200000,400000', action: 'REQUIRE_DE90_MATCH', enabled: true, priority: 15,
    ref: 'mada SPG 6.1 – Reversal (MTI 0400/0420) and refund transactions must carry DE90 (Original Data Elements) matching the original STAN, amount, and date. Mismatch causes rejection.' },
  { id: 19, name: 'mada Nafath Identity Verification (SAMA 2024)', scheme: 'mada', field: 'DE4', condition: '>', value: '2000000', action: 'REQUIRE_NAFATH_AUTH', enabled: true, priority: 19,
    ref: 'SAMA 2024 Mandate – High value transactions (> SAR 20,000) may require additional identity verification via the Nafath integration for specific card profiles.' },
  { id: 20, name: 'mada Merchant Category Restriction (SPG 9.2)', scheme: 'mada', field: 'DE18', condition: 'IN', value: '7995,6012', action: 'DECLINE', enabled: true, priority: 20,
    ref: 'mada SPG 9.2 – Specific MCCs (e.g., 7995 Gambling) are strictly blocked for all mada domestic debit cards per Sharia compliance and SAMA regulations.' },
];

const ACTIONS = ['APPROVE_OFFLINE', 'REQUIRE_ONLINE_AUTH', 'DECLINE', 'CVM_REQUIRED_IF_OVER_LIMIT', 'FORCE_3DS', 'FLAG_REVIEW', 'STIP_APPROVE', 'APPLY_CROSS_BORDER_FEE', 'ROUTE_DOMESTIC', 'REQUIRE_MTI_0200', 'REQUIRE_DE90_MATCH', 'ENFORCE_CASHBACK_LIMIT'];
const FIELDS = ['DE2', 'DE3', 'DE4', 'DE7', 'DE11', 'DE14', 'DE22', 'DE32', 'DE39', 'DE41', 'DE42', 'DE48', 'DE49', 'DE55'];
const CONDITIONS = ['==', '!=', '>', '<', '>=', '<=', 'IN', 'CONTAINS'];

function SchemeRulesScreen() {
  const { isoFields, runTransaction } = useSimulation();
  const [rules, setRules] = useState(INITIAL_RULES);
  const [expandedRule, setExpandedRule] = useState(null);
  const [filterScheme, setFilterScheme] = useState('All');
  const [testResult, setTestResult] = useState(null);

  const toggleRule = (id) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteRule = (id) => setRules(prev => prev.filter(r => r.id !== id));
  const updateRule = (id, key, val) => setRules(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));

  const addRule = () => {
    const newId = Math.max(...rules.map(r => r.id), 0) + 1;
    setRules(prev => [...prev, { id: newId, name: 'New Rule', scheme: 'Both', field: 'DE4', condition: '==', value: '', action: 'DECLINE', enabled: false, priority: newId, ref: '' }]);
    setExpandedRule(newId);
  };

  // Evaluate rules against current ISO fields
  const evaluateRules = () => {
    const activeRules = rules.filter(r => r.enabled).sort((a, b) => a.priority - b.priority);
    const results = [];
    for (const rule of activeRules) {
      let fieldVal = '';
      if (rule.field === 'DE4') fieldVal = isoFields.amount;
      else if (rule.field === 'DE22') fieldVal = isoFields.posEntry;
      else if (rule.field === 'DE14') fieldVal = isoFields.expDate;
      else if (rule.field === 'DE49') fieldVal = isoFields.currency;
      else if (rule.field === 'DE2') fieldVal = isoFields.pan;
      else fieldVal = '';

      let matched = false;
      if (rule.condition === '==' && fieldVal === rule.value) matched = true;
      else if (rule.condition === '!=' && fieldVal !== rule.value) matched = true;
      else if (rule.condition === '>' && parseFloat(fieldVal) > parseFloat(rule.value)) matched = true;
      else if (rule.condition === '<' && parseFloat(fieldVal) < parseFloat(rule.value)) matched = true;
      else if (rule.condition === '<=' && parseFloat(fieldVal) <= parseFloat(rule.value)) matched = true;
      else if (rule.condition === '>=' && parseFloat(fieldVal) >= parseFloat(rule.value)) matched = true;
      else if (rule.condition === 'IN' && rule.value.split(',').map(v => v.trim()).includes(fieldVal)) matched = true;
      else if (rule.condition === 'CONTAINS' && fieldVal.includes(rule.value)) matched = true;

      results.push({ rule, matched, fieldVal });
    }
    setTestResult(results);
  };

  const filtered = filterScheme === 'All' ? rules : rules.filter(r => r.scheme === filterScheme || r.scheme === 'Both');

  return (
    <div className="h-full w-full flex overflow-hidden p-6 gap-6">
      
      {/* Left: Rule List */}
      <div className="flex-1 flex flex-col glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
        <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center">
            <ShieldCheck size={16} className="mr-2 text-yellow-500" />
            Scheme Rules Engine
            <span className="ml-3 text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-gray-400">{rules.length} rules</span>
          </h2>
          <div className="flex items-center space-x-3">
            <div className="flex bg-black/50 p-0.5 rounded-md border border-white/10">
              {['All', 'Visa', 'MC', 'mada', 'Both'].map(s => (
                <button key={s} onClick={() => setFilterScheme(s)}
                  className={'text-[10px] px-2 py-1 rounded transition-colors ' + (filterScheme === s ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300')}
                >{s}</button>
              ))}
            </div>
            <button onClick={addRule} className="btn-primary text-xs py-1 px-3 flex items-center">
              <Plus size={12} className="mr-1" /> Add Rule
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map((rule) => {
            const isExpanded = expandedRule === rule.id;
            const actionColor = rule.action === 'DECLINE' ? 'text-fintech-red' : (rule.action.includes('APPROVE') || rule.action.includes('STIP') ? 'text-fintech-green' : 'text-fintech-yellow');
            const testMatch = testResult?.find(r => r.rule.id === rule.id);

            return (
              <div key={rule.id} className={'rounded-lg border transition-all ' +
                (testMatch?.matched ? 'bg-fintech-yellow/5 border-fintech-yellow/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : '') +
                (!testMatch && rule.enabled ? 'bg-black/20 border-white/5' : '') +
                (!rule.enabled ? 'bg-black/10 border-white/3 opacity-50' : '')
              }>
                <div className="p-3 flex items-center justify-between cursor-pointer" onClick={() => setExpandedRule(isExpanded ? null : rule.id)}>
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {isExpanded ? <ChevronDown size={14} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-200 truncate">{rule.name}</span>
                        <span className={'text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ' + (rule.scheme === 'Visa' ? 'bg-blue-500/10 text-blue-400' : (rule.scheme === 'MC' ? 'bg-red-500/10 text-red-400' : (rule.scheme === 'mada' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400')))}>{rule.scheme}</span>
                        {testMatch?.matched && <span className="text-[9px] bg-fintech-yellow/20 text-fintech-yellow px-1.5 py-0.5 rounded flex-shrink-0">TRIGGERED</span>}
                      </div>
                      <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                        IF {rule.field} {rule.condition} "{rule.value}" → <span className={actionColor}>{rule.action}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleRule(rule.id); }} className="text-gray-400 hover:text-white">
                      {rule.enabled ? <ToggleRight size={20} className="text-fintech-green" /> : <ToggleLeft size={20} className="text-gray-600" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteRule(rule.id); }} className="text-gray-600 hover:text-fintech-red transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3">
                    {rule.ref && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded p-2 text-[10px] text-blue-300 flex items-start">
                        <Globe2 size={12} className="mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                        <span>{rule.ref}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Rule Name</label>
                        <input type="text" value={rule.name} onChange={(e) => updateRule(rule.id, 'name', e.target.value)}
                          className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1 px-2 text-xs text-gray-200 font-mono focus:outline-none focus:border-fintech-accent" /></div>
                      <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Scheme</label>
                        <select value={rule.scheme} onChange={(e) => updateRule(rule.id, 'scheme', e.target.value)}
                          className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1 px-2 text-xs text-gray-200 focus:outline-none focus:border-fintech-accent">
                          <option>Visa</option><option>MC</option><option>mada</option><option>Both</option>
                        </select></div>
                      <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Field</label>
                        <select value={rule.field} onChange={(e) => updateRule(rule.id, 'field', e.target.value)}
                          className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1 px-2 text-xs text-gray-200 focus:outline-none focus:border-fintech-accent">
                          {FIELDS.map(f => <option key={f}>{f}</option>)}
                        </select></div>
                      <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Condition</label>
                        <select value={rule.condition} onChange={(e) => updateRule(rule.id, 'condition', e.target.value)}
                          className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1 px-2 text-xs text-gray-200 focus:outline-none focus:border-fintech-accent">
                          {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                        </select></div>
                      <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Value</label>
                        <input type="text" value={rule.value} onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                          className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1 px-2 text-xs text-gray-200 font-mono focus:outline-none focus:border-fintech-accent" /></div>
                      <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Action</label>
                        <select value={rule.action} onChange={(e) => updateRule(rule.id, 'action', e.target.value)}
                          className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1 px-2 text-xs text-gray-200 focus:outline-none focus:border-fintech-accent">
                          {ACTIONS.map(a => <option key={a}>{a}</option>)}
                        </select></div>
                    </div>
                    <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Scheme Reference</label>
                      <textarea value={rule.ref || ''} onChange={(e) => updateRule(rule.id, 'ref', e.target.value)} rows={2}
                        className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1 px-2 text-[10px] text-gray-300 font-mono focus:outline-none focus:border-fintech-accent resize-none" /></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Evaluation & Priority */}
      <div className="w-[30%] flex flex-col glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
        <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center">
            <Zap size={16} className="mr-2 text-orange-400" />
            Rule Tester
          </h2>
          <button onClick={evaluateRules} className="btn-primary text-xs py-1 px-3 flex items-center">
            <Play size={12} className="mr-1" fill="currentColor" /> Evaluate
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Current Message Summary */}
          <div className="bg-black/30 border border-white/5 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">Current ISO Message (from Builder)</div>
            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex justify-between"><span className="text-gray-500">MTI</span><span className="text-gray-300">{isoFields.mti || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">DE4 (Amount)</span><span className="text-gray-300">{isoFields.amount || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">DE22 (POS)</span><span className="text-gray-300">{isoFields.posEntry || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">DE14 (Exp)</span><span className="text-gray-300">{isoFields.expDate || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">DE49 (Currency)</span><span className="text-gray-300">{isoFields.currency || '-'}</span></div>
            </div>
          </div>

          {/* Results */}
          {testResult ? (
            <div className="space-y-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Evaluation Results</div>
              {testResult.map((r, idx) => (
                <div key={r.rule.id} className={'p-3 rounded-lg border ' + (r.matched ? 'border-fintech-yellow/30 bg-fintech-yellow/5' : 'border-white/5 bg-black/20')}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-gray-500">#{idx + 1}</span>
                    {r.matched
                      ? <span className="text-[9px] font-bold bg-fintech-yellow/20 text-fintech-yellow px-1.5 py-0.5 rounded">MATCH</span>
                      : <span className="text-[9px] bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">NO MATCH</span>
                    }
                  </div>
                  <div className="text-xs text-gray-300">{r.rule.name}</div>
                  <div className="text-[10px] font-mono text-gray-500 mt-1">
                    {r.rule.field}={r.fieldVal || '(empty)'} {r.matched ? '→' : '≠'} {r.rule.value}
                  </div>
                  {r.matched && (
                    <div className={'mt-1 text-[10px] font-bold ' + (r.rule.action === 'DECLINE' ? 'text-fintech-red' : 'text-fintech-yellow')}>
                      Action: {r.rule.action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle size={32} className="mx-auto mb-2 text-gray-600" />
              <p className="text-xs text-gray-500">Click "Evaluate" to test your ISO message against all active rules.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SchemeRulesScreen;
