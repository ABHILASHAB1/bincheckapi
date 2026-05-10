/**
 * scripts/test_mada_ecom.js
 * Professional ISO 8583 TCP Client for mada eCommerce Testing (ESM Version).
 * 
 * This script demonstrates how to pack and send a compliant mada 
 * eCommerce 0100 message directly to the Simulator's TCP Switch.
 */

import net from 'net';

// Configuration
const HOST = '127.0.0.1';
const PORT = 8583;

/**
 * Basic ISO 8583 Message Packer
 * (Simplified version of the internal Builder for standalone usage)
 */
function buildMadaEcomMessage() {
  const mti = "0100";
  const rrn = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
  
  // Field Mapping for mada eCommerce (Requirement Mapping)
  const elements = {
    '002': '5888450012345678',          // PAN
    '003': '000000',                    // Proc Code
    '004': '000000010000',              // Amount (100.00 SAR)
    '007': '0509123045',                // Date (MMDDHHMMSS)
    '011': '123456',                    // STAN
    '012': '123045',                    // Time
    '013': '0509',                      // Local Date
    '018': '5999',                      // MCC (E-commerce)
    '022': '010',                       // POS Entry Mode
    '025': '59',                        // POS Condition (Ecom)
    '032': '123456',                    // Acquirer ID
    '037': rrn,                         // RRN
    '041': 'ECOMTERM01',                // Terminal ID
    '042': 'MERCHANT000001',            // Merchant ID
    '043': 'ONLINE STORE SAUDI ARABIA'.padEnd(40, ' '), // Merchant Info
    '049': '682',                       // Currency (SAR)
    '060': '008MADAECOM',               // Private Data (LLLVAR format)
    '123': '004ECOM'                    // Usage Code (LLLVAR format)
  };

  // Mock Bitmap (Hex)
  const bitmap = "F238448108E180000000000000000010"; 
  
  // Assemble Message
  let body = "";
  Object.keys(elements).sort().forEach(key => {
    body += elements[key];
  });

  return Buffer.from(mti + bitmap + body, 'utf8');
}

console.log(`🔌 [TCP] Connecting to ISO Simulator at ${HOST}:${PORT}...`);

const client = new net.Socket();

client.connect(PORT, HOST, () => {
  console.log('✅ [TCP] Connected to Switch.');

  const message = buildMadaEcomMessage();
  console.log(`📡 [TCP] Sending mada 0100 Message (${message.length} bytes)...`);
  client.write(message);
});

client.on('data', data => {
  console.log('📥 [TCP] Received Response from Switch:');
  console.log('--- RAW DATA ---');
  console.log(data.toString());
  console.log('----------------');
  
  const mti = data.toString().substring(0, 4);
  if (mti === '0110') {
    console.log('✅ [TCP] Transaction AUTHORIZED (0110 Response)');
  } else {
    console.log('⚠️ [TCP] Received non-0110 response.');
  }

  client.destroy(); 
});

client.on('close', () => {
  console.log('🔌 [TCP] Connection closed.');
});

client.on('error', err => {
  console.error(`❌ [TCP] Connection Error: ${err.message}`);
});
