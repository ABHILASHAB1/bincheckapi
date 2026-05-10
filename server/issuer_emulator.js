/**
 * server/issuer_emulator.js
 * Forensic Issuer Emulator - Simulates a Visa Authorization Host.
 * Uses native project IsoPacker for message handling.
 */

import net from 'net';
import { IsoPacker } from './isoPacker.js';

const PORT = 8584;

// Configurable Forensic Rules
const RULES = {
  // Map PAN Suffixes to Response Codes
  panRules: [
    { suffix: '51', code: '51', label: 'Insufficient Funds' },
    { suffix: '05', code: '05', label: 'Do Not Honor' },
    { suffix: '14', code: '14', label: 'Invalid Card Number' }
  ],
  amountLimit: 1000000, // $10,000.00 (12 digits, 2 decimals implied)
};

const server = net.createServer((socket) => {
  console.log('🏦 [ISSUER] Incoming Authorization Handshake...');

  socket.on('data', (data) => {
    try {
      // 1. Unpack Request
      const request = IsoPacker.unpack(data);
      if (!request) throw new Error('Invalid ISO 8583 Message Structure');

      const { mti, elements } = request;
      const pan = elements['2'] || 'UNKNOWN';
      const amount = parseInt(elements['4'] || '0');
      const stan = elements['11'] || '000000';

      console.log(`📥 [ISSUER] RECV ${mti} | PAN: ${pan.slice(0,6)}...${pan.slice(-4)} | AMT: ${amount} | STAN: ${stan}`);

      // 2. Determine Response Code (DE39)
      let responseCode = '00'; // Default: Approved
      let ruleLabel = 'Approved';

      // Forensic Matcher: Trim PAN to handle any field padding
      const cleanPan = pan.trim();

      // Check Amount Rule
      if (amount > RULES.amountLimit) {
        responseCode = '05';
        ruleLabel = 'Decline (Over Limit)';
      }

      // Check PAN Rules (Forensic overrides)
      const panRule = RULES.panRules.find(r => cleanPan.endsWith(r.suffix));
      if (panRule) {
        responseCode = panRule.code;
        ruleLabel = panRule.label;
        console.log(`🚫 [ISSUER_RULE_MATCH] Card ${cleanPan} matched forensic suffix '${panRule.suffix}' -> Returning ${responseCode} (${ruleLabel})`);
      } else {
        console.log(`✅ [ISSUER_RULE_MATCH] Card ${cleanPan} approved.`);
      }

      console.log(`⚙️  [ISSUER] Applying Rule Engine -> ${ruleLabel} (${responseCode})`);

      // 3. Build Response (0200 -> 0210)
      const responseMti = mti.substring(0, 2) + '10' + mti.substring(4);
      const responseElements = { ...elements };
      
      // Mandatory Response Fields
      responseElements['39'] = responseCode;
      
      // Remove fields that shouldn't be in response if necessary (simplified)
      // Usually responses contain most of the request fields + DE39

      const responseBuffer = IsoPacker.pack({
        mti: responseMti,
        elements: responseElements
      });

      socket.write(responseBuffer);
      console.log(`📤 [ISSUER] SENT ${responseMti} | RC: ${responseCode}`);

    } catch (err) {
      console.error('❌ [ISSUER] Processing Exception:', err.message);
    }
  });

  socket.on('error', (err) => console.error('🏦 [ISSUER] Socket Panic:', err.message));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(`🏦  VISA ISSUER EMULATOR ACTIVE ON PORT ${PORT}`);
  console.log(`===================================================`);
  console.log(`RULES:`);
  console.log(` - PAN ending in 51 -> Insufficient Funds`);
  console.log(` - PAN ending in 05 -> Do Not Honor`);
  console.log(` - Amount > $10,000.00 -> Declined`);
  console.log(`===================================================`);
});
