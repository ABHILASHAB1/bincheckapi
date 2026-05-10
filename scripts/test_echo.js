/**
 * scripts/test_echo.js
 * Network Management (0800) Echo Test Script.
 */

import net from 'net';

const HOST = '127.0.0.1';
const PORT = 8583;

function buildEchoMessage() {
  const mti = "0800";
  // Primary Bitmap: 8000000000000000 (Bit 1 set for Secondary)
  // Secondary Bitmap: 0040000000000000 (Bit 70 set for NM Information Code)
  const bitmap = "80000000000000000040000000000000"; 
  const elements = {
    '070': '301' // Echo Test
  };

  return Buffer.from(mti + bitmap + elements['070'], 'utf8');
}

console.log(`🔌 [TCP] Sending 0800 Echo Test to ${HOST}:${PORT}...`);

const client = new net.Socket();

client.connect(PORT, HOST, () => {
  const message = buildEchoMessage();
  client.write(message);
});

client.on('data', data => {
  console.log('📥 [TCP] Received Response:');
  const raw = data.toString();
  console.log(raw);
  
  if (raw.startsWith('0810')) {
    console.log('✅ [TCP] Echo Test Successful (MTI 0810, Approved)');
  }
  client.destroy();
});

client.on('error', err => console.error('❌ [TCP] Error:', err.message));
