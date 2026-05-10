import net from 'net';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function check() {
  console.log('🔍 STARTING REAL DIAGNOSTICS...\n');

  // 1. Check if DB file exists
  const dbPath = path.join(__dirname, 'bins.sqlite');
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`✅ DATABASE FILE FOUND: ${dbPath} (${stats.size} bytes)`);
  } else {
    console.log(`❌ DATABASE FILE MISSING: ${dbPath}`);
  }

  // 2. Check if Port 3001 is reachable
  console.log('\n📡 Testing API Connectivity...');
  try {
    const res = await axios.get('http://127.0.0.1:3001/health', { timeout: 2000 });
    console.log(`✅ API IS UP: Status ${res.status}`);
  } catch (err) {
    console.log(`❌ API IS DOWN: ${err.message}`);
    if (err.code === 'ECONNREFUSED') {
       console.log('   Reason: No process is listening on Port 3001.');
    }
  }

  // 3. Check if TCP Switch Port 8583 is reachable
  console.log('\n🔌 Testing TCP Switch Connectivity (Port 8583)...');
  const client = new net.Socket();
  client.setTimeout(1000);
  client.connect(8583, '127.0.0.1', () => {
    console.log('✅ TCP SWITCH PORT 8583 IS OPEN.');
    client.destroy();
  });
  client.on('error', (err) => {
    console.log(`❌ TCP SWITCH PORT 8583 IS CLOSED: ${err.message}`);
  });

  // 4. Check if Vite Port 5173 is reachable
  console.log('\n🌐 Testing Frontend Connectivity (Port 5173)...');
  try {
    const res = await axios.get('http://127.0.0.1:5173', { timeout: 2000 });
    console.log(`✅ FRONTEND IS UP: Status ${res.status}`);
  } catch (err) {
    console.log(`❌ FRONTEND IS DOWN: ${err.message}`);
  }

  console.log('\n--- RECOMMENDATIONS ---');
  console.log('1. If API is down, run: node server/index.js');
  console.log('2. If Database is small/missing, run: npm run seed');
  console.log('3. If everything is up but the website says offline, check your browser console for CORS errors.');
}

check();
