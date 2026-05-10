import net from 'net';
import { IsoPacker } from './server/isoPacker.js';

class PaymentClient {
  constructor(host = '127.0.0.1', port = 8583) {
    this.host = host;
    this.port = port;
    this.socket = null;
    this.isConnected = false;
    this.echoInterval = null;
    this.reconnectTimeout = null;
    this.pendingReversals = []; // Queue for failed reversals
  }

  connect() {
    console.log(`🔌 [CLIENT] Connecting to ${this.host}:${this.port}...`);
    this.socket = new net.Socket();

    this.socket.connect(this.port, this.host, () => {
      console.log('✅ [CLIENT] Socket Connected.');
      this.isConnected = true;
      this.performSignOn();
      this.startEchoPulse();
      this.processPendingReversals();
    });

    this.socket.on('data', (data) => this.handleResponse(data));
    
    this.socket.on('close', () => {
      console.warn('⚠️ [CLIENT] Connection closed.');
      this.isConnected = false;
      this.stopEchoPulse();
      this.scheduleReconnect();
    });

    this.socket.on('error', (err) => {
      console.error('❌ [CLIENT] Socket Error:', err.message);
    });
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) return;
    console.log('🔄 [CLIENT] Reconnecting in 5 seconds...');
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 5000);
  }

  send(mti, elements) {
    if (!this.isConnected) {
      console.error(`🚫 [CLIENT] Cannot send ${mti}: Not connected.`);
      if (mti === '0400') this.pendingReversals.push({ mti, elements });
      return;
    }
    const buffer = IsoPacker.pack({ mti, elements });
    this.socket.write(buffer);
    console.log(`📤 [CLIENT] Sent ${mti}`);
  }

  // --- Handshake Logic ---
  
  performSignOn() {
    console.log('🔐 [CLIENT] Performing 0800 Sign-On...');
    this.send('0800', {
      '007': this.getTransmissionTime(),
      '011': '000001',
      '070': '001' // NMIC: Sign-On
    });
  }

  startEchoPulse() {
    this.echoInterval = setInterval(() => {
      console.log('💓 [CLIENT] Sending 0800 Echo Pulse...');
      this.send('0800', {
        '007': this.getTransmissionTime(),
        '011': Math.floor(Math.random() * 999999).toString().padStart(6, '0'),
        '070': '301' // NMIC: Echo Test
      });
    }, 30000);
  }

  stopEchoPulse() {
    if (this.echoInterval) clearInterval(this.echoInterval);
  }

  processPendingReversals() {
    if (this.pendingReversals.length > 0) {
      console.log(`📦 [CLIENT] Resending ${this.pendingReversals.length} pending reversals...`);
      while (this.pendingReversals.length > 0) {
        const rev = this.pendingReversals.shift();
        this.send(rev.mti, rev.elements);
      }
    }
  }

  // --- Response Handler ---

  handleResponse(data) {
    try {
      const decoded = IsoPacker.unpack(data);
      console.log(`📥 [CLIENT] Received ${decoded.mti} | Resp Code: ${decoded.elements['039']}`);
    } catch (e) {
      console.error('❌ [CLIENT] Parse Error:', e.message);
    }
  }

  getTransmissionTime() {
    return new Date().toISOString().replace(/[-:T]/g, '').slice(4, 14);
  }
}

// Start the persistent client
const client = new PaymentClient();
client.connect();

// Simulate a financial transaction after 5 seconds
setTimeout(() => {
  console.log('💳 [CLIENT] Triggering mada Financial Transaction (0200)...');
  client.send('0200', {
    '002': '9682011234567890', // mada BIN
    '003': '000000',
    '004': '000000001245',
    '007': new Date().toISOString().replace(/[-:T]/g, '').slice(4, 14),
    '011': '123456',
    '022': '001',
    '049': '682' // SAR
  });
}, 5000);
