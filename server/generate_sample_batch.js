import fs from 'fs';
import { Base2Engine } from '../src/clearing/visa/base2.js';

const generateSampleBatch = () => {
    const records = [];
    const count = 29;
    const amountPerTx = 4.00;
    
    // 1. Header (TC90)
    records.push(Base2Engine.buildHeader());

    // 2. 29 Transactions with varied TC codes
    for (let i = 0; i < count; i++) {
        const tcs = ['05', '06', '07', '15', '33'];
        const tc = tcs[i % tcs.length];
        
        const tx = {
            tc_code: `TC${tc}`,
            pan: `411122223333${(1000 + i).toString()}`,
            amount: amountPerTx,
            rrn: `RRN${i.toString().padStart(9, '0')}`,
            merchantName: `SAMPLE_MERCHANT_${i}`,
            terminalId: `T-${i.toString().padStart(4, '0')}`
        };

        records.push(Base2Engine.buildTCR0(tx));
    }

    // 3. Batch Trailer (TC91)
    records.push(Base2Engine.buildBatchTrailer(count, count * amountPerTx));

    // 4. File Trailer (TC92)
    records.push(Base2Engine.buildFileTrailer(1, count, count * amountPerTx));

    const content = records.join('\n');
    fs.writeFileSync('sample_visa_batch.txt', content);
    console.log('✅ [GENERATOR] sample_visa_batch.txt created with 29 forensic records.');
};

generateSampleBatch();
