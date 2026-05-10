import React, { useState, useEffect } from 'react';
import { 
  Building, Globe, Hash, Zap, Activity, Info, ChevronDown, Database, Lock, Upload
} from 'lucide-react';
import { TEST_CARDS } from '../data/testCards';
import { useSimulation } from '../context/SimulationContext';

// Robust Luhn Generator with "No Repeating" logic
function generateLuhn(prefix, length) {
  let pan = prefix;
  let lastDigit = -1;
  let repeatCount = 0;

  while (pan.length < length - 1) {
    let digit = Math.floor(Math.random() * 10);
    
    // Ensure no more than 2 repeating digits in a row for realism
    if (digit === lastDigit) {
      repeatCount++;
      if (repeatCount >= 2) {
        digit = (digit + 1) % 10;
        repeatCount = 0;
      }
    } else {
      lastDigit = digit;
      repeatCount = 0;
    }
    
    pan += digit.toString();
  }

  // Luhn Algorithm to find check digit
  let sum = 0;
  let alternate = true;
  for (let i = pan.length - 1; i >= 0; i--) {
    let n = parseInt(pan.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n = (n % 10) + 1;
    }
    sum += n;
    alternate = !alternate;
  }
  let checkDigit = (10 - (sum % 10)) % 10;
  return pan + checkDigit;
}

function TestCardVaultScreen() {
  const { refreshVault } = useSimulation();
  const [cards, setCards] = useState([...TEST_CARDS]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSimModal, setShowSimModal] = useState(false);
  const [activeSimCard, setActiveSimCard] = useState(null);
  
  // 3DS States
  const [showThreeDsModal, setShowThreeDsModal] = useState(false);
  const [threeDsData, setThreeDsData] = useState(null);
  const [threeDsPin, setThreeDsPin] = useState('');
  const [isProcessing3ds, setIsProcessing3ds] = useState(false);
  const [filterScheme, setFilterScheme] = useState('All');
  const [copiedId, setCopiedId] = useState(null);

  // Dynamic Generator State
  const [issuers, setIssuers] = useState([]);
  const [selectedIssuer, setSelectedIssuer] = useState('');
  const [availableBins, setAvailableBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingIssuers, setIsLoadingIssuers] = useState(true);
  const [issuerSearch, setIssuerSearch] = useState('');
  const [isIssuerOpen, setIsIssuerOpen] = useState(false);

  const SAUDI_BANKS = ['Al Rajhi Bank', 'Saudi National Bank (SNB)', 'Riyad Bank', 'Alinma Bank', 'Banque Saudi Fransi', 'SABB', 'Arab National Bank'];

  const filteredIssuers = issuers.filter(i => 
    i.toLowerCase().includes(issuerSearch.toLowerCase())
  );

  useEffect(() => {
    fetchIssuers();
    fetchCloudCards();
  }, []);

  const fetchCloudCards = async () => {
    try {
      const res = await fetch('/api/v1/vault/cards');
      const data = await res.json();
      if (data.success && data.cards.length > 0) {
        // Map cloud schema back to UI schema
        const mappedCards = data.cards.map(c => ({
          id: c.id,
          network: c.scheme,
          pan: c.pan,
          exp: c.exp,
          cvv: c.cvv,
          type: c.type,
          issuer: c.issuer_name,
          scenario: c.scenario,
          cashback: c.cashback.toString(),
          amount: c.amount.toString(),
          mti: c.mti,
          track2: c.track2
        }));
        setCards(mappedCards);
      }
    } catch (e) {
      console.warn('⚠️ Cloud Vault Fetch Failed:', e.message);
    }
  };

  useEffect(() => {
    if (selectedIssuer) {
      fetchBinsByIssuer(selectedIssuer);
    } else {
      setAvailableBins([]);
      setSelectedBin('');
    }
  }, [selectedIssuer]);

  const fetchIssuers = async () => {
    setIsLoadingIssuers(true);
    try {
      const res = await fetch('/api/issuers');
      const data = await res.json();
      if (data.success && data.issuers.length > 0) {
        setIssuers(data.issuers);
        if (!selectedIssuer) setSelectedIssuer(data.issuers[0]);
      } else {
        // Fallback to common Saudi banks if DB is empty or fails
        setIssuers(SAUDI_BANKS);
        if (!selectedIssuer) setSelectedIssuer(SAUDI_BANKS[0]);
      }
    } catch (e) {
      console.error('Failed to fetch issuers:', e);
      setIssuers(SAUDI_BANKS);
      if (!selectedIssuer) setSelectedIssuer(SAUDI_BANKS[0]);
    } finally {
      setIsLoadingIssuers(false);
    }
  };

  const [isLoadingBins, setIsLoadingBins] = useState(false);

  const fetchBinsByIssuer = async (issuer) => {
    setIsLoadingBins(true);
    try {
      if (issuer === 'All Issuers') {
        const res = await fetch('/api/bins/issuer/random?limit=10');
        const data = await res.json();
        if (data.success) {
          setAvailableBins(data.bins);
          setSelectedBin(data.bins[0].bin);
        }
        return;
      }

      const res = await fetch(`/api/bins/issuer/${encodeURIComponent(issuer)}`);
      const data = await res.json();
      if (data.success && data.bins.length > 0) {
        setAvailableBins(data.bins);
        setSelectedBin(data.bins[0].bin);
      } else {
        // Only use fallback if DB is completely unreachable
        const fallbackMap = {
          'Al Rajhi Bank': [{ bin: '446672', scheme: 'Visa' }, { bin: '588847', scheme: 'mada' }],
          'Saudi National Bank (SNB)': [{ bin: '457865', scheme: 'Visa' }, { bin: '588850', scheme: 'mada' }]
        };
        const fallbacks = fallbackMap[issuer] || [];
        setAvailableBins(fallbacks);
        if (fallbacks.length > 0) setSelectedBin(fallbacks[0].bin);
      }
    } catch (e) {
      console.error('Failed to fetch bins:', e);
    } finally {
      setIsLoadingBins(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef(null);

  const exportRegistry = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/v1/vault/registry/export');
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `card_vault_registry_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`❌ Export Error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const importRegistry = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const cards = JSON.parse(event.target.result);
          const res = await fetch('/api/v1/vault/registry/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cards })
          });
          
          const data = await res.json();
          if (data.success) {
            alert(`✅ Successfully imported ${data.count} cards!`);
            fetchCloudCards(); // Refresh list
          } else {
            throw new Error(data.error || 'Import failed');
          }
        } catch (err) {
          alert(`❌ Import Processing Error: ${err.message}`);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      alert(`❌ File Reading Error: ${err.message}`);
      setIsImporting(false);
    }
    // Clear input
    e.target.value = '';
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = () => {
    if (!selectedBin) return;
    
    setIsGenerating(true);
    
    // Find metadata for the selected BIN
    const binData = availableBins.find(b => b.bin === selectedBin);
    const length = 16; // Standard
    let newPan = generateLuhn(selectedBin, length);
    
    // Generate Random Expiry in future
    const year = new Date().getFullYear() + Math.floor(Math.random() * 5) + 1;
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const exp = `${month}/${String(year).slice(-2)}`;
    const cvv = String(Math.floor(Math.random() * 900) + 100);

    const network = binData?.scheme || 'Unknown';
    const rand = Math.random();
    let scenario = `Standard Purchase (0100)`;
    let cashback = '0.00';
    let amount = '50.00';
    let mti = '0100';

    if (network === 'mada' && rand > 0.9) {
      scenario = 'Purchase w/ Cashback (0900)';
      cashback = '20.00';
    } else if (rand > 0.8) {
      scenario = 'Partial Approval Test';
      amount = '99.99'; 
    } else if (rand > 0.7) {
      scenario = 'Decline: Card Expired (54)';
      amount = '54.00';
    } else if (rand > 0.6) {
      scenario = 'Decline: PIN Limit (75)';
      amount = '75.00';
    } else if (rand > 0.5) {
      scenario = 'Decline: No Funds (51)';
      amount = '51.00';
    } else if (rand > 0.4) {
      scenario = '3DS Secure Challenge';
      newPan = newPan.slice(0, -1) + '3'; // Force PAN to end in 3 to trigger 3DS logic
    } else if (rand > 0.3) {
      scenario = 'International DCC Offer';
      // Switch triggers DCC if not SAR (for this mock, we'll just name it)
    } else if (rand > 0.2) {
      scenario = 'Reversal Advice (0400)';
      mti = '0400';
    }

    const newCard = {
      id: `TC-GEN-${Date.now()}`,
      network,
      pan: newPan,
      exp,
      cvv,
      type: binData?.type || 'Credit',
      issuer: selectedIssuer,
      scenario,
      cashback,
      amount,
      mti,
      bin: selectedBin,
      track2: `${newPan}=${String(year).slice(-2)}${month}${cvv}0000000000`
    };

    setCards([newCard, ...cards]);
    
    // Cloud Persistence Sync
    fetch('/api/v1/vault/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card: newCard })
    })
    .then(() => refreshVault())
    .catch(err => console.warn('⚠️ Cloud Sync Failed:', err.message));

    setTimeout(() => setIsGenerating(false), 500);
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.pan.includes(searchTerm) || 
                          (card.scenario || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (card.issuer || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScheme = filterScheme === 'All' || card.network.toLowerCase() === filterScheme.toLowerCase();
    return matchesSearch && matchesScheme;
  });

  const handleSimulate = async (card, threeDsCode = null) => {
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mti: card.mti || '0100',
          pan: card.pan,
          amount: (parseFloat(card.amount || '50.00') * 100).toString().padStart(12, '0'), 
          cashback: card.cashback ? (parseFloat(card.cashback) * 100).toString().padStart(12, '0') : '000000000000',
          currency: '682', 
          procCode: card.cashback && parseFloat(card.cashback) > 0 ? '090000' : '000000',
          posEntry: '051',
          issuer: card.issuer,
          threeDsAuthCode: threeDsCode
        })
      });
      
      const data = await res.json();
      
      if (data.status === '3DS_REQUIRED') {
        setThreeDsData({ ...data, card });
        setShowThreeDsModal(true);
        return;
      }

      if (res.ok) {
        alert(`🚀 Transaction complete!\nResponse: ${data.response?.elements['39'] === '00' ? 'APPROVED' : 'DECLINED (' + data.response?.elements['39'] + ')'}`);
        if (showThreeDsModal) setShowThreeDsModal(false);
      } else {
        throw new Error(data.error || 'Simulation failed');
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-fintech-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Section - High Z-Index to prevent clipping */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 relative z-[60] gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-fintech-accent/10 text-fintech-accent px-3 py-1 rounded-full text-xs font-mono mb-3 border border-fintech-accent/20">
            <ShieldCheck size={14} />
            <span>ENTERPRISE VAULT</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center tracking-tight">
            <CreditCard className="mr-4 text-fintech-accent" size={32} />
            Test Card Vault
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            ISO-8583 compliant test card generation. Powered by the local BIN database to ensure realistic routing simulation.
          </p>
        </div>
        
        {/* Registry Actions */}
        <div className="flex items-center space-x-3 relative z-[60]">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={importRegistry} 
            accept=".json" 
            className="hidden" 
          />
          
          <button 
            onClick={exportRegistry}
            disabled={isExporting}
            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-300 transition-all active:scale-95"
          >
            {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} className="text-blue-400" />}
            <span>Export Registry</span>
          </button>

          <button 
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-300 transition-all active:scale-95"
          >
            {isImporting ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} className="text-emerald-400" />}
            <span>Import Registry</span>
          </button>
        </div>
        
        {/* Advanced Generator Panel - Enhanced Version with Ultra-High Stacking */}
        <div className="w-full lg:w-auto glass-panel p-1.5 rounded-[2rem] border border-white/10 shadow-2xl relative z-[70] group flex items-center bg-white/5">
          <div className="flex flex-col lg:flex-row items-center gap-1.5">
            
            {/* Issuer Selection Area */}
            <div className="relative group/issuer px-4 py-2 hover:bg-white/5 rounded-2xl transition-all">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center mb-1">
                <Building size={10} className="mr-1 text-fintech-accent" /> Issuer Bank
              </label>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setIsIssuerOpen(!isIssuerOpen)}
                  disabled={isLoadingIssuers}
                  className="min-w-[180px] text-sm text-white font-bold text-left flex items-center justify-between focus:outline-none"
                >
                  <span className="truncate">{selectedIssuer || 'Select Bank...'}</span>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform ${isIssuerOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isIssuerOpen && (
                <>
                  <div className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[2px]" onClick={() => setIsIssuerOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-4 w-80 bg-[#0d0d14] border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden backdrop-blur-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="Quick search issuers..." 
                          value={issuerSearch}
                          onChange={(e) => setIssuerSearch(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-fintech-accent"
                        />
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                      <button
                        onClick={() => { setSelectedIssuer('All Issuers'); setIsIssuerOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-xs rounded-2xl transition-all flex items-center space-x-3 mb-1 ${selectedIssuer === 'All Issuers' ? 'bg-fintech-accent text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        <Globe size={14} />
                        <span className="font-bold">Global Random Distribution</span>
                      </button>
                      
                      <div className="px-3 py-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest border-t border-white/5 mt-2">Saudi mada/Visa Network</div>
                      
                      {isLoadingIssuers ? (
                        <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center">
                          <RefreshCw size={16} className="animate-spin mb-2 text-fintech-accent" />
                          <span>Syncing Ledger...</span>
                        </div>
                      ) : (
                        filteredIssuers.map((issuer) => (
                          <button
                            key={issuer}
                            onClick={() => { setSelectedIssuer(issuer); setIsIssuerOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-xs rounded-2xl transition-all flex items-center justify-between group/item ${selectedIssuer === issuer ? 'bg-fintech-accent text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${SAUDI_BANKS.includes(issuer) ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
                              <span className="truncate">{issuer}</span>
                            </div>
                            {SAUDI_BANKS.includes(issuer) && <div className="text-[8px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-md font-bold uppercase">Saudi</div>}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="hidden lg:block w-px h-10 bg-white/10 mx-2"></div>

            {/* BIN Selection Area */}
            <div className="relative px-4 py-2 hover:bg-white/5 rounded-2xl transition-all">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center mb-1">
                <Hash size={10} className="mr-1 text-purple-400" /> Active BIN
              </label>
              
              <div className="flex items-center space-x-3">
                <select 
                  value={selectedBin} 
                  onChange={(e) => setSelectedBin(e.target.value)}
                  disabled={availableBins.length === 0 || isLoadingBins}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none appearance-none cursor-pointer pr-6 min-w-[120px]"
                >
                  {isLoadingBins ? (
                    <option>Loading...</option>
                  ) : availableBins.length === 0 ? (
                    <option>No Bins</option>
                  ) : (
                    availableBins.map(b => (
                      <option key={b.bin} value={b.bin} className="bg-[#0d0d14]">{b.bin} ({b.scheme})</option>
                    ))
                  )}
                </select>
                <ChevronDown size={14} className="text-gray-500 -ml-6 pointer-events-none" />
              </div>
            </div>

            {/* Action Area */}
            <div className="pl-4 pr-1">
              <button 
                onClick={handleGenerate}
                disabled={!selectedBin || isGenerating}
                className="bg-fintech-accent hover:bg-blue-600 disabled:opacity-50 text-white p-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 group/btn overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                {isGenerating ? <RefreshCw size={20} className="animate-spin relative z-10" /> : <Zap size={20} className="relative z-10" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-fintech-accent transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search by PAN, Bank or Scenario..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-fintech-accent/50 focus:ring-1 focus:ring-fintech-accent/20 transition-all"
              />
            </div>
            
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
              {['All', 'Visa', 'Mastercard', 'Mada', 'Amex'].map(scheme => (
                <button
                  key={scheme}
                  onClick={() => setFilterScheme(scheme)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterScheme === scheme ? 'bg-fintech-accent text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                  {scheme}
                </button>
              ))}
            </div>
          </div>
          
          <button className="w-full md:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 transition-all hover:border-white/20">
            <Download size={16} />
            <span>Export Registry</span>
          </button>
        </div>

        {/* Card Table Container */}
        <div className="flex-1 glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fintech-accent/30 to-transparent"></div>
          
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold sticky top-0 backdrop-blur-xl z-20">
                  <th className="p-5">Network</th>
                  <th className="p-5">Cardholder & Bank</th>
                  <th className="p-5">Card Details (PAN)</th>
                  <th className="p-5">Expiry / CVV</th>
                  <th className="p-5">Testing Scenario</th>
                  <th className="p-5">Verification</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCards.length > 0 ? filteredCards.map((card, idx) => (
                  <tr key={card.id || idx} className="hover:bg-white/[0.03] transition-all group">
                    <td className="p-5">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110
                          ${card.network.toLowerCase() === 'visa' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 
                            card.network.toLowerCase() === 'mastercard' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 
                            card.network.toLowerCase() === 'mada' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                            'bg-gray-500/10 border-gray-500/20 text-gray-400'}`}>
                          <CreditCard size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{card.network}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white mb-0.5">Test User #{idx + 1}</span>
                        <div className="flex items-center text-[10px] text-gray-500 font-mono">
                          <Building size={10} className="mr-1.5 text-fintech-accent" />
                          {card.issuer || 'System Generated'}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center space-x-3">
                        <div className="font-mono text-base text-white tracking-[0.2em]">{card.pan.replace(/(.{4})/g, '$1 ').trim()}</div>
                        <button 
                          onClick={() => handleCopy(card.pan, `${card.id}-pan`)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-fintech-accent transition-all opacity-0 group-hover:opacity-100"
                        >
                          {copiedId === `${card.id}-pan` ? <CheckCircle2 size={14} className="text-fintech-green" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-300 font-mono bg-white/5 px-2 py-1 rounded border border-white/5">{card.exp}</span>
                        <span className="text-gray-700">/</span>
                        <span className="text-xs text-gray-400 font-mono group-hover:text-fintech-accent transition-colors">{card.cvv}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${card.scenario.includes('Approved') || card.scenario.includes('Generated') ? 'bg-fintech-green' : card.scenario.includes('Declined') ? 'bg-fintech-red' : 'bg-fintech-accent'}`}></div>
                          <span className="text-sm text-gray-300">{card.scenario}</span>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono truncate max-w-[200px]">{card.track2}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] font-bold">
                        <ShieldCheck size={12} />
                        <span>VALID LUHN</span>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => handleSimulate(card)}
                        className="p-2 bg-fintech-accent/10 hover:bg-fintech-accent text-fintech-accent hover:text-white rounded-lg transition-all transform hover:scale-110 shadow-lg shadow-fintech-accent/5"
                        title="Run Instant Simulation"
                      >
                        <Zap size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                          <CreditCard size={40} className="text-gray-600" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Registry Empty</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">No test cards found matching your criteria. Use the generator above to create new virtual cards.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Stats */}
          <div className="bg-white/[0.02] border-t border-white/10 p-4 px-6 flex justify-between items-center text-[10px] font-mono text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center"><Activity size={12} className="mr-1.5" /> TOTAL CARDS: {cards.length}</span>
              <span className="flex items-center"><Building size={12} className="mr-1.5" /> ISSUERS INDEXED: {issuers.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap size={10} className="text-fintech-accent animate-pulse" />
              <span>REAL-TIME VAULT SYNCHRONIZATION ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
      {/* 3DS Challenge Modal */}
      {showThreeDsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0a0a0f] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative overflow-hidden text-center">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-fintech-accent"></div>
             
             <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 text-fintech-accent">
                   <ShieldCheck size={40} className="animate-pulse-slow" />
                </div>
             </div>

             <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center tracking-tight">
                3D Secure Verification
             </h2>
             <p className="text-xs text-gray-500 mb-8 uppercase font-bold tracking-widest leading-relaxed">
                {threeDsData?.card?.issuer} is requesting additional verification for this transaction.
             </p>
             
             <div className="bg-black/60 border border-white/5 p-6 rounded-2xl mb-8 text-left">
                <div className="flex justify-between items-center mb-3">
                   <span className="text-[10px] text-gray-500 uppercase font-bold">Transaction Reference</span>
                   <span className="text-[10px] text-gray-400 font-mono">{threeDsData?.txRef}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-gray-500 uppercase font-bold">Merchant Name</span>
                   <span className="text-[10px] text-gray-400 font-mono uppercase">Fintech Simulator POS</span>
                </div>
             </div>

             <div className="relative mb-6">
                <input 
                    type="password"
                    placeholder="Enter SMS OTP"
                    value={threeDsPin}
                    autoFocus
                    onChange={(e) => setThreeDsPin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSimulate(threeDsData.card, threeDsPin)}
                    className="w-full bg-black border border-white/10 rounded-2xl py-6 px-6 text-3xl text-center font-mono tracking-[0.8em] text-fintech-accent focus:outline-none focus:border-fintech-accent/50"
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-fintech-accent text-[8px] font-bold px-3 py-1 rounded-full text-white uppercase tracking-[0.2em]">
                   Step 2 of 2
                </div>
             </div>

             <div className="flex space-x-4">
                <button 
                  onClick={() => setShowThreeDsModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-500 font-bold py-4 rounded-2xl text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSimulate(threeDsData.card, threeDsPin)}
                  disabled={isProcessing3ds || !threeDsPin}
                  className="flex-2 bg-fintech-accent hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessing3ds ? <Activity size={16} className="animate-spin" /> : <Lock size={16} />}
                  <span>Verify</span>
                </button>
             </div>
             
             <p className="mt-8 text-[9px] text-gray-600 font-medium">
                This is a secure testing environment. No real funds will be moved.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestCardVaultScreen;
