import React, { createContext, useContext, useState, useEffect } from 'react';
import { detectScheme, executeSchemeModule, loadISOConfig, buildISO8583Message } from '../data/iso8583';
import { TEST_CARDS } from '../data/testCards';
import { PulseEngine } from '../utils/pulseEngine';

export const SimulationContext = createContext();

// useSimulation lives in ./useSimulation.js to fix Vite HMR:
// "Could not Fast Refresh: useSimulation export is incompatible"
// Vite requires all exports in a file to be of the same category (all components OR all hooks/utils).
// Re-exporting here keeps all 20+ consumer files working without changes.
export { useSimulation } from './useSimulation';


const generateId = () => `tx-${Math.floor(1000 + Math.random() * 9000)}`;
const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
};

// mada BIN prefixes (known Saudi-issued domestic debit BINs)
// Per mada SPG: Domestic Saudi transactions must route via mada switch
const MADA_BIN_PREFIXES = [
  '440647', '440795', '446404', '446393', '439954', '407197',
  '457865', '457997', '468540', '468541', '468542', '468543',
  '484783', '489317', '489318', '489319', '490980', '493428',
  '504300', '506968', '508160', '585265', '588845', '588846',
  '588847', '588848', '588849', '588850', '588851', '636120',
  '968201', '968202', '968203', '968204', '968205', '968206',
  '968207', '968208', '968209', '968210', '968211', '968212',
];

// detectScheme is imported from iso8583

const getCurrencyForScheme = (scheme, currencyCode) => {
  if (scheme === 'mada') return 'SAR';
  if (currencyCode === '682') return 'SAR';
  if (currencyCode === '840') return 'USD';
  if (currencyCode === '978') return 'EUR';
  return currencyCode;
};

const INITIAL_NODES = [
  { id: 'req', label: 'Request Initiated', status: 'pending', time: '0ms' },
  { id: 'pack', label: 'ISO 8583 Pack', status: 'pending', time: '' },
  { id: 'route', label: 'Switch Routing', status: 'pending', time: '' },
  { id: 'scheme', label: 'Scheme Validation', status: 'pending', time: '' },
  { id: 'auth', label: 'Auth Decision', status: 'pending', time: '' },
  { id: 'crypto', label: 'Crypto Check', status: 'pending', time: '' },
  { id: '3ds', label: '3DS Check', status: 'skip', time: 'N/A' },
  { id: 'resp', label: 'Response Gen', status: 'pending', time: '' },
  { id: 'settle', label: 'Settlement Queue', status: 'pending', time: '' },
];

export const SimulationProvider = ({ children }) => {
  const [marketPulse, setMarketPulse] = useState(PulseEngine.generateMarketPulse());
  const [opsPulse, setOpsPulse] = useState(PulseEngine.generateOpsPulse());
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setMarketPulse(PulseEngine.generateMarketPulse());
      setOpsPulse(PulseEngine.generateOpsPulse());
      
      // Occasionally add a new live event
      if (Math.random() > 0.6) {
        setLiveEvents(prev => [PulseEngine.generateTxEvent(), ...prev].slice(0, 50));
      }
    }, 3000);

    return () => clearInterval(pulseInterval);
  }, []);

  const [transactions, setTransactions] = useState([
    { 
      id: 'tx-8821', pan: '4111 **** **** 1111', amt: '$124.50', status: 'approved', scheme: 'Visa', time: '14:22:01.045', latency: 124, mti: '0100', pos: '051', procCode: '000000',
      rawHex: '003C 0100 F23A0011 4111222233331111 000000 000000012450',
      parsedReq: { MTI: '0100', elements: { '002': '4111222233331111', '003': '000000', '004': '000000012450', '022': '051' } },
      parsedRes: { MTI: '0110', elements: { '002': '4111222233331111', '003': '000000', '004': '000000012450', '038': '829102', '039': '00' } }
    },
    { 
      id: 'tx-8820', pan: '5500 **** **** 4444', amt: '$8,200.00', status: 'declined', scheme: 'MC', time: '14:21:58.922', latency: 85, mti: '0100', pos: '051', procCode: '000000',
      rawHex: '003C 0100 F23A0011 5500111122224444 000000 000000820000',
      parsedReq: { MTI: '0100', elements: { '002': '5500111122224444', '003': '000000', '004': '000000820000', '022': '051' } },
      parsedRes: { MTI: '0110', elements: { '002': '5500111122224444', '003': '000000', '004': '000000820000', '039': '51' } }
    },
    { 
      id: 'tx-8819', pan: '9682 **** **** 0001', amt: 'SAR 500.00', status: 'approved', scheme: 'mada', time: '14:21:30.100', latency: 95, mti: '0200', pos: '051', procCode: '000000',
      rawHex: '003C 0200 F23A0011 9682010000000001 000000 000000050000',
      parsedReq: { MTI: '0200', elements: { '002': '9682010000000001', '003': '000000', '004': '000000050000', '022': '051' } },
      parsedRes: { MTI: '0210', elements: { '002': '9682010000000001', '003': '000000', '004': '000000050000', '038': '104928', '039': '00' } }
    },
  ]);
  const [activeTrace, setActiveTrace] = useState(null);
  const [traceNodes, setTraceNodes] = useState(INITIAL_NODES);
  
  const [systemHealth, setSystemHealth] = useState({
    authSuccess: 98.4,
    avgResponse: 124,
    queueDepth: 42,
    alerts: [
      { time: '14:21:58.922', msg: 'MC Risk Block (RC:51)', desc: 'Tx tx-8820 declined via velocity.' }
    ]
  });

  const [tcpConfig, setTcpConfig] = useState({
    host: '127.0.0.1',
    port: '8583',
    timeout: '30000',
    keepAlive: true,
    useTLS: false,
    certificate: '',
    privateKey: '',
    caChain: ''
  });

  const [tcpStatus, setTcpStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [tcpPing, setTcpPing] = useState(0);

  // Dynamic active network connections
  const [activeConnections, setActiveConnections] = useState(['mada', 'Visa']);

  const [isoFields, setIsoFields] = useState({
    mti: '0100',
    pan: '4111222233334444',
    procCode: '000000',
    amount: '000000012450',
    date: '0502142201',
    stan: '123456',
    expDate: '2512',
    posEntry: '051',
    acquirerId: '443322',
    currency: '840'
  });

  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [theme, setTheme] = useState('default'); // 'default', 'mada', 'visa', 'mastercard'
  const [lang, setLang] = useState('en'); // 'en', 'ar'
  const [isInfinityMode, setIsInfinityMode] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalConfig, setTerminalConfig] = useState({
    amount: '',
    txType: 'PURCHASE',
    remitCountry: 'SAR_INR'
  });

  // Database Logs & Intelligence Streams
  const [dbLogs, setDbLogs] = useState([]);
  const [marketStream, setMarketStream] = useState([]);
  const [fxRates, setFxRates] = useState([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [vaultCards, setVaultCards] = useState([]);
  
  // Fraud & Security Metrics
  const [fraudStats, setFraudStats] = useState({
    analyzed: 0,
    blocked: 0,
    avgRisk: 0,
    activeAlerts: 0,
    latestThreats: []
  });
  const [gatewayWebhooks, setGatewayWebhooks] = useState([]);

  // Fetch initial logs from DB
  const fetchDbLogs = () => {
    fetch('/api/logs?limit=50')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDbLogs(data.logs);
          // Seed fraud stats from historical data if needed
          const blockedCount = data.logs.filter(l => (l.parsed_response?.elements?.['39'] || l.resp_code) !== '00').length;
          setFraudStats(prev => ({
            ...prev,
            analyzed: data.logs.length,
            blocked: blockedCount,
            avgRisk: 15 // Initial baseline
          }));
        }
        setIsSyncing(false);
      })
      .catch(err => console.error("Sync Error:", err));
  };

  const fetchFxRates = () => {
    fetch('/api/v1/fx/rates')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFxRates(data.rates);
        }
      })
      .catch(err => console.error("FX Sync Error:", err));
  };

  let _vaultRefreshTimer = null;
  const refreshVault = () => {
    clearTimeout(_vaultRefreshTimer);
    _vaultRefreshTimer = setTimeout(() => {
      fetch('/api/v1/vault/cards')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.cards)) {
            setVaultCards(data.cards);
          }
        })
        .catch(err => console.warn('[Vault] Sync skipped (offline?):', err.message));
    }, 300);
  };

  React.useEffect(() => {
    fetchDbLogs();
    fetchFxRates();
    refreshVault();
    
    // ngrok Bypass: Pre-fetch to set bypass cookie for EventSource
    fetch('/api/stream', {
       headers: { 'ngrok-skip-browser-warning': 'true' }
    }).catch(e => console.warn('Bypass check failed', e));

    const eventSource = new EventSource('/api/stream');
    
    eventSource.onopen = () => console.log('📡 [SSE] Stream Connection Established.');
    eventSource.onerror = (e) => console.error('❌ [SSE] Stream Error:', e);

    eventSource.addEventListener('iso_log', (e) => {
      const data = JSON.parse(e.data);
      console.log('📡 [SSE] Incoming ISO Log:', data.id, data.status);
      
      // Update global logs
      setDbLogs(prev => [data, ...prev].slice(0, 100));

      // Update fraud intelligence
      if (data.risk_score !== undefined) {
        setFraudStats(prev => ({
          analyzed: prev.analyzed + 1,
          blocked: prev.blocked + (data.risk_score > 75 ? 1 : 0),
          avgRisk: Math.floor((prev.avgRisk * prev.analyzed + data.risk_score) / (prev.analyzed + 1)),
          activeAlerts: prev.activeAlerts + (data.risk_score > 60 ? 1 : 0),
          latestThreats: [data, ...prev.latestThreats].slice(0, 50)
        }));
      }
    });

    eventSource.addEventListener('fx_tick', (e) => {
      const data = JSON.parse(e.data);
      if (data && data.rates) {
        setFxRates(data.rates);
      }
    });

    eventSource.addEventListener('market_update', (e) => {
      const data = JSON.parse(e.data);
      setMarketStream(prev => [{
        id: data.id,
        type: data.impact,
        msg: data.message,
        time: 'Just now',
        corridor: data.corridor
      }, ...prev].slice(0, 10));
    });
    
    eventSource.addEventListener('webhook_sent', (e) => {
      const data = JSON.parse(e.data);
      setGatewayWebhooks(prev => [data, ...prev].slice(0, 20));
    });

    return () => eventSource.close();
  }, []);

  // Infinity Mode Loop
  React.useEffect(() => {
    let interval;
    if (isInfinityMode) {
      interval = setInterval(() => {
        const card = TEST_CARDS[Math.floor(Math.random() * TEST_CARDS.length)];
        const mti = Math.random() > 0.8 ? '0400' : '0100';
        runTransaction({
          pan: card.pan,
          amount: Math.floor(100 + Math.random() * 50000).toString().padStart(12, '0'),
          mti: mti,
          procCode: '000000',
          posEntry: '051',
          currency: card.network === 'mada' ? '682' : '840'
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isInfinityMode]);

  const translations = {
    en: { 
      dashboard: 'Dashboard', 
      gateway: 'Payment Gateway',
      'iso-builder': 'ISO 8583 Builder', 
      'iso-20022': 'ISO 20022 Builder', 
      simulator: 'Transaction Simulator', 
      'load-test': 'Load Test Engine', 
      crypto: 'Cryptography Lab', 
      scheme: 'Scheme Rules', 
      '3ds': '3DS Flow', 
      'test-cards': 'Card Vault', 
      'bin-checker': 'BIN Checker', 
      'tcp-config': 'TCP Config', 
      settlement: 'Settlement', 
      logs: 'Audit Logs', 
      settings: 'Settings', 
      diff: 'Message Diff',
      explorer: 'Data Explorer',
      compliance: 'Compliance Audit',
      admin: 'Admin Panel',
      run: 'Run Transaction'
    },
    ar: { 
      dashboard: 'لوحة التحكم', 
      gateway: 'بوابة الدفع',
      'iso-builder': 'باني ISO 8583', 
      'iso-20022': 'باني ISO 20022', 
      simulator: 'محاكي العمليات', 
      'load-test': 'محرك اختبار الحمل', 
      crypto: 'مختبر التشفير', 
      scheme: 'قواعد الشبكات', 
      '3ds': 'مسار 3DS', 
      'test-cards': 'خزنة البطاقات', 
      'bin-checker': 'فاحص البين', 
      'tcp-config': 'إعدادات TCP', 
      settlement: 'التسوية', 
      logs: 'سجل العمليات', 
      settings: 'الإعدادات', 
      diff: 'مقارنة الرسائل',
      explorer: 'مستكشف البيانات',
      compliance: 'تدقيق الامتثال',
      admin: 'لوحة التحكم للمشرف',
      run: 'تنفيذ عملية'
    }
  };

  const t = translations[lang];

  // Sync theme with body class
  React.useEffect(() => {
    const body = document.body;
    body.classList.remove('theme-mada', 'theme-visa', 'theme-mastercard');
    if (theme !== 'default') {
      body.classList.add(`theme-${theme}`);
    }

    // Handle RTL and Fonts
    body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    body.style.fontFamily = lang === 'ar' ? "'IBM Plex Sans Arabic', sans-serif" : "'Inter', sans-serif";
  }, [theme, lang]);

  // Core Simulation Engine
  const runTransaction = (customData = null) => {
    const data = customData || isoFields;
    
    const panStr = data.pan.toString().replace(/\s/g, '');
    const scheme = detectScheme(panStr);
    const maskedPan = `${panStr.substring(0,4)} **** **** ${panStr.substring(panStr.length-4)}`;
    
    const amountVal = parseInt(data.amount) / 100;
    const currCode = data.currency || (scheme === 'mada' ? '682' : '840');
    const currLabel = getCurrencyForScheme(scheme, currCode);
    const formattedAmt = currLabel + ' ' + amountVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // mada SPG: MTI 0200 is mandatory for financial purchase (not 0100 pre-auth)
    const effectiveMTI = data.mti || (scheme === 'mada' ? '0200' : '0100');

    // Build full ISO message object to validate dynamically
    const config = loadISOConfig(scheme);
    const txData = { '000': effectiveMTI };
    if (data.pan) txData['002'] = data.pan;
    if (data.procCode) txData['003'] = data.procCode;
    if (data.amount) txData['004'] = data.amount;
    if (data.date) txData['007'] = data.date;
    if (data.stan) txData['011'] = data.stan;
    if (data.posEntry) txData['022'] = data.posEntry;
    if (data.pinBlock) txData['052'] = data.pinBlock;
    if (data.track2) txData['035'] = data.track2;
    if (data.emvData) txData['055'] = data.emvData;
    if (data.rrn) txData['037'] = data.rrn;
    if (data.time) txData['012'] = data.time;
    if (data.dateLocal) txData['013'] = data.dateLocal;
    if (data.expDate) txData['014'] = data.expDate;
    if (data.mcc) txData['018'] = data.mcc;
    if (data.posCondition) txData['025'] = data.posCondition;
    if (data.acquirerId) txData['032'] = data.acquirerId;
    if (data.terminalId) txData['041'] = data.terminalId;
    if (data.merchantId) txData['042'] = data.merchantId;
    if (data.merchantName) txData['043'] = data.merchantName;
    if (data.madaEcom) txData['060'] = data.madaEcom;
    if (data.usageCode) txData['123'] = data.usageCode;
    txData['049'] = currCode; // Enforce currency mapped

    const msgObj = buildISO8583Message(config, txData);
    const validationResult = executeSchemeModule(scheme, msgObj);

    const isEcom = data.posEntry === '812';
    const fail3DS = isEcom && amountVal > 5000;
    
    // Compute simulation rules early to determine final approval status for the mock response
    const declineAtSchemeLocal = maskedPan.includes('0000');
    const declineAtAuthLocal = amountVal > 10000 || data.procCode === '999999';
    const isApproved = validationResult.valid && !declineAtAuthLocal && !fail3DS && !declineAtSchemeLocal;

    let threeDSLogs = data.threeDSLogs || null;
    if (isEcom && !threeDSLogs) {
      threeDSLogs = [
        { step: 'Directory Server (DS) Lookup', status: 'success', detail: 'Card Enrolled' },
        { step: 'AReq / ARes Verification', status: 'success', detail: 'Frictionless flow evaluated' },
        { step: 'ACS Challenge Request', status: fail3DS ? 'error' : 'success', detail: fail3DS ? 'OTP Timeout / Risk Block' : 'Authentication Successful' },
        { step: 'CAVV Cryptogram Validation', status: fail3DS ? 'skip' : 'success', detail: fail3DS ? '-' : 'Cryptogram verified via scheme' }
      ];
    }

    const mockResMTI = effectiveMTI === '0100' ? '0110' : (effectiveMTI === '0200' ? '0210' : '0410');
    
    // mada Partial Approval Trigger (If amount is 99.99)
    const isPartialApproval = data.amount === '000000009999';
    const approvedAmount = isPartialApproval ? '000000005000' : data.amount;

    const mockParsedRes = {
      MTI: mockResMTI,
      elements: {
        ...msgObj.elements,
        '006': isPartialApproval ? approvedAmount : undefined, // Field 6 used for partial amount
        '038': isApproved ? Math.floor(100000 + Math.random() * 900000).toString() : undefined,
        '039': isApproved ? '00' : '51'
      }
    };

    const newTx = {
      id: generateId(),
      pan: maskedPan,
      amt: formattedAmt,
      status: 'pending',
      scheme: scheme,
      type: validationResult.type,
      validation: validationResult,
      time: getCurrentTime(),
      latency: 0,
      mti: effectiveMTI,
      pos: data.posEntry,
      procCode: data.procCode,
      rawAmount: amountVal,
      currency: currCode,
      rawHex: '00' + Math.floor(Math.random() * 100) + ' ' + effectiveMTI + ' ' + (msgObj.bitmap || 'F23A...'), // Mock hex string
      threeDSLogs: threeDSLogs,
      parsedReq: msgObj,
      parsedRes: mockParsedRes
    };

    setTransactions(prev => [newTx, ...prev].slice(0, 50));
    setActiveTrace(newTx);
    
    // Asynchronous network transmission
    if (validationResult.valid || data.isOverride) {
      // Create payload matching what backend packer expects
      const payload = data.isOverride 
        ? { isRawOverride: true, rawHex: data.rawHexOverride, tcpConfig }
        : { mti: effectiveMTI, elements: txData, pin: data.pin, tcpConfig };
      
      fetch('/api/transmit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      }).then(res => res.json())
        .then(apiRes => {
          if (apiRes.success) {
            setTransactions(prev => prev.map(t => t.id === newTx.id ? { ...t, rawHex: apiRes.rawRx, parsedRes: apiRes.decoded } : t));
            setActiveTrace(prev => prev?.id === newTx.id ? { ...prev, rawHex: apiRes.rawRx, parsedRes: apiRes.decoded } : prev);
          }
        }).catch(err => console.error("TCP Bridge Failed:", err));
    }

    simulateNodes(newTx);
  };

  const simulateNodes = (tx) => {
    let currentNodes = INITIAL_NODES.map(n => ({...n}));
    const isEcom = tx.pos === '812';
    
    // Setup 3DS node initial state based on E-com
    if (isEcom) {
      currentNodes[6] = { ...currentNodes[6], status: 'pending', time: '' };
      if (tx.scheme === 'mada') {
        currentNodes[6].label = 'mada 3DS / SPG Secure';
      } else if (tx.scheme === 'Visa') {
        currentNodes[6].label = 'Visa Secure / 3DS';
      } else if (tx.scheme === 'MC') {
        currentNodes[6].label = 'Mastercard Identity Check';
      }
    } else {
      currentNodes[6] = { ...currentNodes[6], status: 'skip', time: 'N/A' };
      if (tx.scheme === 'mada') {
        currentNodes[6].label = '3DS (N/A for mada POS)';
      }
    }

    // mada-specific: Update node labels for mada routing
    if (tx.scheme === 'mada') {
      currentNodes[2] = { ...currentNodes[2], label: 'mada Switch Routing' };
      currentNodes[3] = { ...currentNodes[3], label: 'mada SPG Validation' };
    }
    
    setTraceNodes(currentNodes);
    
    let isDeclined = false;

    // Simulation rules
    const declineAtScheme = tx.pan.includes('0000');
    const declineAtAuth = tx.rawAmount > 10000 || tx.procCode === '999999';
    const fail3DS = isEcom && tx.rawAmount > 5000; // Mock rule: high amount e-com fails 3DS
    
    // mada SPG Rule: Contactless (071) Limit (300 SAR)
    const isMadaContactlessLimit = tx.scheme === 'mada' && tx.pos === '071' && tx.rawAmount > 300;

    const steps = [
      { id: 'req', delay: 10, check: () => true },
      { id: 'pack', delay: 15, check: () => true },
      { id: 'route', delay: 30, check: () => true },
      { id: 'scheme', delay: 40, check: () => {
        if (declineAtScheme) return false;
        if (isMadaContactlessLimit) return false;
        if (!tx.validation.valid) return false;
        return true;
      }, failMsg: isMadaContactlessLimit ? 'Mada Rule: Limit Exceeded. Step-up to Chip required.' : (declineAtScheme ? 'Invalid PAN length or structure.' : (tx.validation.errors[0] || 'Scheme validation failed.')) },
      { id: '3ds', delay: isEcom ? 60 : 0, skip: !isEcom, check: () => !fail3DS, failMsg: '3DS Authentication Failed / Step-up Timeout.' },
      { id: 'auth', delay: 80, check: () => !declineAtAuth, failMsg: 'Insufficient Funds / Risk Block (RC:51).' },
      { id: 'crypto', delay: 90, check: () => true },
      { id: 'resp', delay: 110, check: () => true },
      { id: 'settle', delay: 120, queue: true }
    ];

    steps.forEach((step) => {
      const baseDelay = step.delay;
      
      setTimeout(() => {
        setTraceNodes(prev => {
          const newNodes = [...prev];
          const nodeIdx = newNodes.findIndex(n => n.id === step.id);
          
          if (isDeclined && step.id !== 'resp') {
            if (step.id !== 'settle') newNodes[nodeIdx].status = 'skip';
            return newNodes;
          }

          if (step.skip) {
             newNodes[nodeIdx].status = 'skip';
             return newNodes;
          }

          if (step.queue) {
             newNodes[nodeIdx].status = 'pending';
             newNodes[nodeIdx].time = 'Queued';
             finalizeTx(tx.id, isDeclined ? 'declined' : 'approved', baseDelay);
             return newNodes;
          }

          const passed = step.check ? step.check() : true;
          if (!passed) {
             isDeclined = true;
             newNodes[nodeIdx].status = 'error';
             newNodes[nodeIdx].msg = step.failMsg;
          } else {
             newNodes[nodeIdx].status = 'success';
          }
          newNodes[nodeIdx].time = `+${baseDelay}ms`;
          
          return newNodes;
        });
      }, baseDelay * (1 / speedMultiplier));
    });
  };

  const finalizeTx = (id, finalStatus, latency) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: finalStatus, latency: latency } : t));
    
    setSystemHealth(prev => {
      const total = transactions.length + 1;
      const approvals = transactions.filter(t => t.status === 'approved').length + (finalStatus === 'approved' ? 1 : 0);
      const newAuthRate = (approvals / total) * 100;
      
      const newAlerts = [...prev.alerts];
      if (finalStatus === 'declined') {
        newAlerts.unshift({ time: getCurrentTime(), msg: 'Decline Spike Detected', desc: 'Tx ' + id + ' failed validation.' });
      }

      return {
        ...prev,
        authSuccess: total > 0 ? newAuthRate : 100,
        avgResponse: Math.floor((prev.avgResponse * transactions.length + latency) / total) || latency,
        queueDepth: finalStatus === 'approved' ? prev.queueDepth + 1 : prev.queueDepth,
        alerts: newAlerts.slice(0, 5)
      };
    });
  };

  return (
    <SimulationContext.Provider value={{
      transactions,
      activeTrace,
      traceNodes,
      systemHealth,
      isoFields,
      setIsoFields,
      runTransaction,
      speedMultiplier,
      setSpeedMultiplier,
      detectScheme,
      tcpConfig,
      setTcpConfig,
      tcpStatus,
      setTcpStatus,
      tcpPing,
      setTcpPing,
      activeConnections,
      setActiveConnections,
      theme,
      setTheme,
      lang,
      setLang,
      t,
      isInfinityMode,
      setIsInfinityMode,
      showTerminal,
      setShowTerminal,
      terminalConfig,
      setTerminalConfig,
      openTerminal: (config = null) => {
        if (config) setTerminalConfig(prev => ({ ...prev, ...config }));
        setShowTerminal(true);
      },
      dbLogs,
      marketStream,
      fxRates,
      fraudStats,
      isSyncing,
      refreshLogs: fetchDbLogs,
      vaultCards,
      refreshVault,
      gatewayWebhooks,
      setGatewayWebhooks,
      marketPulse,
      opsPulse,
      liveEvents
    }}>
      {children}
    </SimulationContext.Provider>
  );
};
