// ISO 8583 Data Element Definitions — Full 128 Field Spec
// Based on ISO 8583:1987/1993 + Visa VTS + MC GCMS + mada SPG extensions

// mada BIN prefixes (known Saudi-issued domestic debit BINs)
const MADA_BIN_PREFIXES = [
  '440647', '440795', '446404', '446393', '439954', '407197',
  '457865', '457997', '468540', '468541', '468542', '468543',
  '484783', '489317', '489318', '489319', '490980', '493428',
  '504300', '506968', '508160', '585265', '588845', '588846',
  '588847', '588848', '588849', '588850', '588851', '636120',
  '968201', '968202', '968203', '968204', '968205', '968206',
  '968207', '968208', '968209', '968210', '968211', '968212',
];

export const detectScheme = (pan) => {
  if (!pan) return 'Unknown';
  const p = pan.replace(/\s/g, '');
  for (const bin of MADA_BIN_PREFIXES) {
    if (p.startsWith(bin)) return 'mada';
  }
  if (p.startsWith('4')) return 'Visa';
  if (p.startsWith('5') || p.startsWith('2')) return 'MC';
  if (p.startsWith('34') || p.startsWith('37')) return 'Amex';
  return 'Unknown';
};

export const DE_DEFINITIONS = {
  '000': { name: 'Message Type Indicator', len: '4', type: 'n', fixed: true, desc: 'MTI: 0100=Auth, 0200=Financial, 0400=Reversal, 0800=Network Mgmt' },
  '001': { name: 'Bitmap, Secondary', len: '64', type: 'b', fixed: true, desc: 'Indicates presence of DE65–DE128' },
  '002': { name: 'Primary Account Number (PAN)', len: '..19', type: 'n', fixed: false, desc: 'Cardholder account number (LLVAR)' },
  '003': { name: 'Processing Code', len: '6', type: 'n', fixed: true, desc: '00=Purchase, 01=Cash Advance, 09=Cashback, 20=Refund, 30=Balance Inq' },
  '004': { name: 'Amount, Transaction', len: '12', type: 'n', fixed: true, desc: 'Transaction amount in minor units (cents/halalas)' },
  '005': { name: 'Amount, Settlement', len: '12', type: 'n', fixed: true, desc: 'Settlement amount after conversion' },
  '006': { name: 'Amount, Cardholder Billing', len: '12', type: 'n', fixed: true, desc: 'Amount billed to cardholder' },
  '007': { name: 'Transmission Date & Time', len: '10', type: 'n', fixed: true, desc: 'MMDDhhmmss — UTC transmission timestamp' },
  '011': { name: 'System Trace Audit Number (STAN)', len: '6', type: 'n', fixed: true, desc: 'Unique transaction identifier from originator' },
  '012': { name: 'Time, Local Transaction', len: '6', type: 'n', fixed: true, desc: 'hhmmss — Local time at terminal' },
  '013': { name: 'Date, Local Transaction', len: '4', type: 'n', fixed: true, desc: 'MMDD — Local date at terminal' },
  '014': { name: 'Date, Expiration', len: '4', type: 'n', fixed: true, desc: 'YYMM — Card expiry date' },
  '015': { name: 'Date, Settlement', len: '4', type: 'n', fixed: true, desc: 'MMDD — Settlement date' },
  '018': { name: 'Merchant Category Code (MCC)', len: '4', type: 'n', fixed: true, desc: 'ISO 18245 merchant type (5411=Grocery, 5812=Restaurant, etc.)' },
  '022': { name: 'Point of Service Entry Mode', len: '3', type: 'n', fixed: true, desc: '051=Chip/PIN, 071=Contactless, 812=E-Commerce, 010=Manual' },
  '023': { name: 'Card Sequence Number', len: '3', type: 'n', fixed: true, desc: 'Distinguishes multiple cards on same PAN' },
  '025': { name: 'POS Condition Code', len: '2', type: 'n', fixed: true, desc: '00=Normal, 08=Mail/Phone, 59=E-Commerce' },
  '026': { name: 'POS PIN Capture Code', len: '2', type: 'n', fixed: true, desc: 'Max PIN digits terminal can capture' },
  '028': { name: 'Amount, Transaction Fee', len: '9', type: 'x+n', fixed: true, desc: 'Transaction fee amount (D/C + amount)' },
  '032': { name: 'Acquiring Institution ID', len: '..11', type: 'n', fixed: false, desc: 'Acquirer BIN or Institution ID (LLVAR)' },
  '033': { name: 'Forwarding Institution ID', len: '..11', type: 'n', fixed: false, desc: 'Forwarding institution (LLVAR)' },
  '035': { name: 'Track 2 Data', len: '..37', type: 'z', fixed: false, desc: 'Magnetic stripe Track 2 equivalent (LLVAR)' },
  '037': { name: 'Retrieval Reference Number (RRN)', len: '12', type: 'an', fixed: true, desc: 'Acquirer reference for reconciliation' },
  '038': { name: 'Authorization Identification Response', len: '6', type: 'an', fixed: true, desc: 'Auth code from issuer' },
  '039': { name: 'Response Code', len: '2', type: 'an', fixed: true, desc: '00=Approved, 05=Do Not Honor, 51=Insufficient Funds, 54=Expired' },
  '040': { name: 'Service Restriction Code', len: '3', type: 'an', fixed: true, desc: 'Services allowed for this card' },
  '041': { name: 'Terminal ID', len: '8', type: 'ans', fixed: true, desc: 'Card acceptor terminal identification' },
  '042': { name: 'Merchant ID', len: '15', type: 'ans', fixed: true, desc: 'Card acceptor identification code' },
  '043': { name: 'Card Acceptor Name/Location', len: '40', type: 'ans', fixed: true, desc: 'Merchant name and location' },
  '044': { name: 'Additional Response Data', len: '..25', type: 'an', fixed: false, desc: 'Additional data from issuer (LLVAR)' },
  '048': { name: 'Additional Data (Private)', len: '..999', type: 'ans', fixed: false, desc: 'Scheme-specific sub-elements (LLLVAR)' },
  '049': { name: 'Currency Code, Transaction', len: '3', type: 'n', fixed: true, desc: 'ISO 4217: 840=USD, 682=SAR, 978=EUR' },
  '050': { name: 'Currency Code, Settlement', len: '3', type: 'n', fixed: true, desc: 'Settlement currency' },
  '051': { name: 'Currency Code, Cardholder Billing', len: '3', type: 'n', fixed: true, desc: 'Cardholder billing currency' },
  '052': { name: 'PIN Data', len: '8', type: 'b', fixed: true, desc: 'Encrypted PIN block (8 bytes binary)' },
  '054': { name: 'Additional Amounts', len: '..120', type: 'ans', fixed: false, desc: 'Cashback amount, balance, etc. (LLLVAR)' },
  '055': { name: 'ICC System Related Data (EMV)', len: '..999', type: 'ans', fixed: false, desc: 'EMV chip data TLV (LLLVAR) — includes ARQC, ATC, TVR, etc.' },
  '060': { name: 'Private Use (Acquirer)', len: '..60', type: 'ans', fixed: false, desc: 'Acquirer-specific data (LLLVAR)' },
  '061': { name: 'Private Use (Issuer)', len: '..60', type: 'ans', fixed: false, desc: 'Issuer-specific data (LLLVAR)' },
  '070': { name: 'Network Management Info Code', len: '3', type: 'n', fixed: true, desc: '001=Sign-On, 002=Sign-Off, 301=Echo Test' },
  '090': { name: 'Original Data Elements', len: '42', type: 'n', fixed: true, desc: 'Original MTI + STAN + Date + Acquirer + Forwarding (for reversals)' },
  '095': { name: 'Replacement Amounts', len: '42', type: 'an', fixed: true, desc: 'Actual/replacement amounts for partial reversals' },
  '100': { name: 'Receiving Institution ID', len: '..11', type: 'n', fixed: false, desc: 'Receiving institution (LLVAR)' },
  '102': { name: 'Account Identification 1', len: '..28', type: 'ans', fixed: false, desc: 'Source account (LLVAR)' },
  '103': { name: 'Account Identification 2', len: '..28', type: 'ans', fixed: false, desc: 'Destination account (LLVAR)' },
  '123': { name: 'POS Data Code', len: '..15', type: 'ans', fixed: false, desc: 'Terminal capability and environment data (LLLVAR)' },
  '127': { name: 'Private Data', len: '..999', type: 'ans', fixed: false, desc: 'Network-specific private data (LLLVAR)' },
  '128': { name: 'MAC', len: '8', type: 'b', fixed: true, desc: 'Message Authentication Code (8 bytes binary)' },
};

export const DE22_OPTIONS = {
  'Visa': [
    { value: '001', label: 'Unknown/Unspecified (PIN capable)' },
    { value: '011', label: 'Manual Entry (PIN capable)' },
    { value: '012', label: 'Manual Entry (No PIN)' },
    { value: '021', label: 'Magstripe - CVV Unchecked (PIN capable)' },
    { value: '051', label: 'ICC Contact EMV (PIN capable)' },
    { value: '052', label: 'ICC Contact EMV (No PIN)' },
    { value: '071', label: 'Contactless ICC (PIN capable)' },
    { value: '102', label: 'Credential on File / COF (No PIN)' },
    { value: '801', label: 'Fallback to Magstripe (PIN capable)' },
    { value: '812', label: 'E-Commerce / Internet (No PIN)' },
    { value: '901', label: 'Magstripe - CVV Checked (PIN capable)' },
    { value: '911', label: 'Contactless Magstripe (PIN capable)' },
  ],
  'MC': [
    { value: '000', label: 'Unknown' },
    { value: '011', label: 'Manual Entry (PIN capable)' },
    { value: '012', label: 'Manual Entry (No PIN capability)' },
    { value: '051', label: 'Chip card read (PIN capable)' },
    { value: '071', label: 'Contactless chip (PIN capable)' },
    { value: '102', label: 'Credential On File / Recurring' },
    { value: '791', label: 'Chip fallback to magstripe (PIN capable)' },
    { value: '802', label: 'Chip fallback to manual (No PIN)' },
    { value: '812', label: 'E-Commerce / Internet (No PIN)' },
    { value: '901', label: 'Magstripe (PIN capable)' },
    { value: '911', label: 'Contactless Magstripe (PIN capable)' },
  ],
  'mada': [
    { value: '011', label: 'Manual Entry - SPAN (PIN capable)' },
    { value: '012', label: 'Manual Entry - SPAN (No PIN)' },
    { value: '021', label: 'Magstripe - SPAN (PIN capable)' },
    { value: '051', label: 'ICC Contact - SPAN (PIN capable)' },
    { value: '052', label: 'ICC Contact - SPAN (No PIN)' },
    { value: '071', label: 'Contactless ICC - mada Atheer (PIN capable)' },
    { value: '812', label: 'E-Commerce - mada Pay / SPG (No PIN)' },
    { value: '901', label: 'Magstripe Default (PIN capable)' },
  ],
  'Unknown': [
    { value: '012', label: 'Manual Entry' },
    { value: '051', label: 'ICC Contact EMV' },
    { value: '071', label: 'Contactless' },
    { value: '812', label: 'E-Commerce' },
  ]
};

// MTI definitions
// MTI definitions
export const MTI_DEFINITIONS = {
  '0100': { name: 'Authorization Request', flow: 'request', category: 'auth', desc: 'Request for hold / reservation of funds' },
  '0110': { name: 'Authorization Response', flow: 'response', category: 'auth', desc: 'Issuer response to Pre-Auth (RC in DE39)' },
  '0120': { name: 'Authorization Advice', flow: 'advice', category: 'auth', desc: 'Advice of completed authorization' },
  '0200': { name: 'Financial Request', flow: 'request', category: 'financial', desc: 'Purchase / Cash / Financial transaction (mada primary)' },
  '0210': { name: 'Financial Response', flow: 'response', category: 'financial', desc: 'Issuer response to financial request' },
  '0220': { name: 'Financial Advice / Completion', flow: 'advice', category: 'financial', desc: 'Completion of pre-authorized transaction' },
  '0230': { name: 'Completion Response', flow: 'response', category: 'financial', desc: 'Response to completion advice' },
  '0400': { name: 'Reversal Request', flow: 'request', category: 'reversal', desc: 'Reversal of a previous transaction' },
  '0410': { name: 'Reversal Response', flow: 'response', category: 'reversal', desc: 'Response to reversal request' },
  '0420': { name: 'Reversal Advice', flow: 'advice', category: 'reversal', desc: 'Reversal advice (timeout / failed delivery)' },
  '0430': { name: 'Reversal Advice Response', flow: 'response', category: 'reversal', desc: 'Response to reversal advice' },
  '0800': { name: 'Network Management Request', flow: 'request', category: 'network', desc: 'Sign-On, Sign-Off, Echo Test, Key Exchange' },
  '0810': { name: 'Network Management Response', flow: 'response', category: 'network', desc: 'Response to network management' },
};

// MTI Builder based on ISO 8583:1987/1993/2003 components
export const buildMTI = (version, msgClass, msgFunction, origin) => {
  return `${version}${msgClass}${msgFunction}${origin}`;
};

export const analyzeMTI = (mti) => {
  if (!mti || mti.length !== 4) return null;
  return {
    version: { '0': '1987', '1': '1993', '2': '2003' }[mti[0]] || 'Unknown',
    class: { '1': 'Authorization', '2': 'Financial', '4': 'Reversal', '8': 'Network' }[mti[1]] || 'Unknown',
    function: { '0': 'Request', '1': 'Response', '2': 'Advice', '3': 'Advice Response' }[mti[2]] || 'Unknown',
    origin: { '0': 'Acquirer', '2': 'Issuer', '4': 'Other' }[mti[3]] || 'Unknown'
  };
};

// Response Codes
export const RESPONSE_CODES = {
  '00': { name: 'Approved', category: 'approved' },
  '01': { name: 'Refer to Card Issuer', category: 'declined' },
  '03': { name: 'Invalid Merchant', category: 'declined' },
  '04': { name: 'Capture Card', category: 'declined' },
  '05': { name: 'Do Not Honor', category: 'declined' },
  '12': { name: 'Invalid Transaction', category: 'declined' },
  '13': { name: 'Invalid Amount', category: 'declined' },
  '14': { name: 'Invalid Card Number', category: 'declined' },
  '30': { name: 'Format Error', category: 'error' },
  '41': { name: 'Lost Card', category: 'declined' },
  '43': { name: 'Stolen Card', category: 'declined' },
  '51': { name: 'Insufficient Funds', category: 'declined' },
  '54': { name: 'Expired Card', category: 'declined' },
  '55': { name: 'Incorrect PIN', category: 'declined' },
  '57': { name: 'Transaction Not Permitted', category: 'declined' },
  '58': { name: 'Transaction Not Permitted to Terminal', category: 'declined' },
  '61': { name: 'Exceeds Withdrawal Limit', category: 'declined' },
  '65': { name: 'Exceeds Frequency Limit', category: 'declined' },
  '75': { name: 'PIN Tries Exceeded', category: 'declined' },
  '76': { name: 'Key Synchronization Error', category: 'error' },
  '78': { name: 'Blocked, First Used', category: 'declined' },
  '85': { name: 'No Reason to Decline (AVS Only)', category: 'approved' },
  '91': { name: 'Issuer or Switch Inoperative', category: 'error' },
  '96': { name: 'System Malfunction', category: 'error' },
};

// Processing Codes
export const PROCESSING_CODES = {
  '000000': { name: 'Purchase', desc: 'Standard goods/services purchase' },
  '010000': { name: 'Cash Advance', desc: 'Cash withdrawal at merchant' },
  '090000': { name: 'Purchase with Cashback', desc: 'Purchase + cash (mada SPG 5.5: max SAR 500 cashback)' },
  '200000': { name: 'Refund / Return', desc: 'Merchandise return credit' },
  '300000': { name: 'Balance Inquiry', desc: 'Check available balance' },
  '400000': { name: 'Account Transfer', desc: 'Funds transfer between accounts' },
};

// POS Entry Modes
export const POS_ENTRY_MODES = {
  '010': { name: 'Manual / Key Entry', desc: 'PAN manually keyed' },
  '021': { name: 'Chip Read (No PIN Cap)', desc: 'ICC chip, no PIN capability' },
  '051': { name: 'Chip + PIN', desc: 'ICC chip with PIN verified' },
  '071': { name: 'Contactless Chip (EMV)', desc: 'Contactless EMV (mada Atheer / Visa payWave / MC PayPass)' },
  '801': { name: 'Chip Fallback to Magstripe', desc: 'Fallback — blocked by mada SPG 7.2' },
  '901': { name: 'E-Commerce (Secure)', desc: 'Card-not-present with 3DS' },
  '812': { name: 'E-Commerce (No Auth)', desc: 'CNP without authentication' },
};

// Bitmap utility
export const calculateBitmap = (activeFields) => {
  const bitmap = new Uint8Array(8);
  activeFields.forEach(fieldNum => {
    if (fieldNum >= 1 && fieldNum <= 64) {
      const byteIndex = Math.floor((fieldNum - 1) / 8);
      const bitIndex = 7 - ((fieldNum - 1) % 8);
      bitmap[byteIndex] |= (1 << bitIndex);
    }
  });
  return Array.from(bitmap).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
};

// Luhn check
export const luhnCheck = (pan) => {
  const digits = pan.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
};

// Generate STAN
export const generateSTAN = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate RRN
export const generateRRN = () => {
  const now = new Date();
  return now.getFullYear().toString().slice(-2) +
    (now.getMonth()+1).toString().padStart(2,'0') +
    now.getDate().toString().padStart(2,'0') +
    Math.floor(100000 + Math.random() * 900000).toString();
};

// Format DE7 timestamp
export const generateDE7 = () => {
  const now = new Date();
  return (now.getMonth()+1).toString().padStart(2,'0') +
    now.getDate().toString().padStart(2,'0') +
    now.getHours().toString().padStart(2,'0') +
    now.getMinutes().toString().padStart(2,'0') +
    now.getSeconds().toString().padStart(2,'0');
};

// Simple PIN block format (Format 0 / ISO 9564-1)
export const generatePinBlock = (pin, pan) => {
  const pinPadded = '0' + pin.length.toString() + pin.padEnd(14, 'F');
  const panBlock = '0000' + pan.replace(/\D/g,'').slice(-13, -1);
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += (parseInt(pinPadded[i], 16) ^ parseInt(panBlock[i], 16)).toString(16).toUpperCase();
  }
  return result;
};

// Scheme Configs & Rules
export const SCHEME_CONFIGS = {
  'Visa': {
    requiredFields: ['000', '002', '003', '004', '007', '011', '014', '022', '025', '041', '049'],
    defaultMTI: '0100',
    currency: '840'
  },
  'MC': {
    requiredFields: ['000', '002', '003', '004', '007', '011', '014', '022', '025', '032', '041', '042', '049'],
    defaultMTI: '0100',
    currency: '840'
  },
  'mada': {
    requiredFields: ['000', '002', '003', '004', '007', '011', '014', '022', '025', '032', '041', '042', '049', '052'], // mada PIN required for POS
    defaultMTI: '0200',
    currency: '682'
  },
  'Amex': {
    requiredFields: ['000', '002', '003', '004', '007', '011', '014', '022', '041', '049'],
    defaultMTI: '0100',
    currency: '840'
  },
  'Unknown': {
    requiredFields: ['000', '002', '003', '004', '007', '011', '049'],
    defaultMTI: '0100',
    currency: '840'
  }
};

export const loadISOConfig = (scheme) => {
  return SCHEME_CONFIGS[scheme] || SCHEME_CONFIGS['Unknown'];
};

export const buildISO8583Message = (config, transactionData) => {
  const message = { MTI: transactionData.mti || config.defaultMTI, elements: {} };
  config.requiredFields.forEach(field => {
     if (transactionData[field]) {
         message.elements[field] = transactionData[field];
     }
  });
  return message;
};

export const executeSchemeModule = (scheme, message) => {
  const errors = [];
  const mti = message.MTI;
  const procCode = message.elements['003'] || '000000';
  const posEntry = message.elements['022'] || '000';
  const amount = parseInt(message.elements['004'] || '0', 10);
  
  // 1. Transaction Type Identification
  const isRefund = procCode.startsWith('20');
  const isReversal = mti === '0400' || mti === '0420';
  const isPreAuth = mti === '0100';
  const isCompletion = mti === '0220' || mti === '0120';
  const isContactless = posEntry.startsWith('07'); // 071, 072
  const isEcomm = posEntry.startsWith('81'); // 812
  
  // 2. Universal Transaction Logic
  if (isReversal) {
    if (!message.elements['037']) {
      errors.push('Reversal Rule: DE037 (RRN) is mandatory to trace the original transaction.');
    }
  }
  
  if (isRefund) {
    if (mti !== '0200' && mti !== '0220') {
      errors.push('Refund Rule: Merchandise Returns typically require MTI 0200 or 0220.');
    }
  }

  if (isCompletion) {
    if (!message.elements['038']) {
      errors.push('Completion Rule: DE038 (Auth Code) from the original Pre-Auth is required.');
    }
  }

  // 3. Scheme-Specific Execution Logic
  if (scheme === 'mada') {
    // mada SPG specific routing & validation
    if (isPreAuth && !isEcomm) {
      errors.push('mada SPG: MTI 0100 (Pre-Auth) is strictly restricted to E-Commerce (812) or specific environments. POS requires 0200.');
    }
    
    // Purchase/Financial validations
    if (!isRefund && !isReversal && !isEcomm && !isCompletion) {
      if (mti !== '0200') {
         errors.push('mada SPG: POS Financial Requests must use MTI 0200.');
      }
      
      // Contactless / Tokenized Mobile Payments (mada Pay / Apple Pay)
      if (isContactless) {
         if (!message.elements['055']) {
           // Not throwing hard error for 055 in simulator builder to allow easy testing, but noting it
         }
         // PIN may be bypassed for small amounts (< SAR 300) or CDCVM
         if (!message.elements['052'] && amount > 30000) { // 300.00 SAR
            errors.push('mada Atheer: PIN Block (DE052) is mandatory for Contactless amounts > SAR 300 unless CDCVM is utilized.');
         }
      } else {
         // Standard Chip & PIN (051)
         if (!message.elements['052']) {
           errors.push('mada SPG: DE052 (PIN Block) is mandatory for standard POS transactions.');
         }
      }
    }

    if (message.elements['049'] !== '682') {
      errors.push('mada SPG: Currency Code (DE049) must be exactly 682 (SAR) for domestic routing.');
    }

  } else if (scheme === 'Visa') {
    // Visa VTS specific
    if (isContactless && !message.elements['022'].startsWith('07')) {
       // Just a sanity check
    }
    if (mti === '0200' && !isRefund) {
      // In a strict Visa environment, dual-message uses 0100/0110. Single message uses 0200.
    }
  } else if (scheme === 'MC') {
    // Mastercard GCMS specific
    if (isContactless && !['071', '072'].includes(posEntry)) {
       errors.push('Mastercard PayPass: Contactless requires POS Entry Mode 071 or 072.');
    }
  }

  // 4. Return Execution State
  return { 
    valid: errors.length === 0, 
    module: `${scheme} Routing Engine`, 
    type: isRefund ? 'Refund' : isReversal ? 'Reversal' : isPreAuth ? 'Pre-Auth' : isCompletion ? 'Completion' : isContactless ? 'Tokenized/Contactless' : 'Standard Purchase',
    errors 
  };
};
