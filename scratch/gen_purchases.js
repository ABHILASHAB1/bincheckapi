import fs from 'fs';
import { Base2Engine } from '../src/clearing/visa/base2.js';

const generateCustomBatch = () => {
    const records = [];
    
    // Header
    records.push(Base2Engine.buildTCR0({
        tc: '90',
        pan: '0000000000000000',
        amount: 0,
        currency: '840'
    }));

    // Purchase 1
    records.push(Base2Engine.buildTCR0({
        tc: '05',
        pan: '4111222233331111',
        amount: 15000, // 150.00
        currency: '840'
    }));

    // Purchase 2
    records.push(Base2Engine.buildTCR0({
        tc: '05',
        pan: '4406000000009999',
        amount: 25000, // 250.00
        currency: '840'
    }));

    // Trailer
    records.push(Base2Engine.buildTCR0({
        tc: '92',
        pan: '0000000000000000',
        amount: 40000,
        currency: '840'
    }));

    const content = records.join('\n') + '\n';
    fs.writeFileSync('VISA_BASE2_PURCHASES.txt', content);
    console.log('✅ Created VISA_BASE2_PURCHASES.txt with 2 purchases.');
};

generateCustomBatch();
