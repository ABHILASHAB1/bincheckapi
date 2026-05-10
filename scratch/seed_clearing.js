/**
 * scratch/seed_clearing.js
 * Seeding the database with diverse transactions for clearing testing.
 */
import fetch from 'node-fetch';

const cards = [
  { pan: '9682010000001234', scheme: 'mada', currency: '682' },
  { pan: '4111222233334444', scheme: 'Visa', currency: '840' },
  { pan: '5500111122223333', scheme: 'MC', currency: '840' }
];

async function seed() {
    console.log('🌱 [SEEDER] Initiating batch injection for clearing test...');
    
    for (let i = 0; i < 50; i++) {
        const card = cards[i % cards.length];
        const payload = {
            mti: '0200',
            elements: {
                '002': card.pan,
                '003': '000000',
                '004': (Math.floor(100 + Math.random() * 50000)).toString().padStart(12, '0'),
                '007': new Date().toISOString().slice(5, 10).replace('-', '') + '120000',
                '011': Math.floor(100000 + Math.random() * 900000).toString(),
                '037': Math.floor(100000000000 + Math.random() * 900000000000).toString(),
                '049': card.currency
            }
        };

        try {
            await fetch('http://localhost:3001/api/transmit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (i % 10 === 0) console.log(`✅ [SEEDER] Injected ${i} transactions...`);
        } catch (e) {
            console.error('❌ [SEEDER] Injection Failed:', e.message);
        }
    }
    console.log('🚀 [SEEDER] Batch Injection Complete. 50 Traces Online.');
}

seed();
