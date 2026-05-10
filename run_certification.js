import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * mada/SAMA Certification Runner
 * Validates the platform against formal SPG-4 compliance vectors.
 */
async function runCertification() {
  console.log('🎖️ [CERTIFICATION] Initiating SAMA SPG-4 Validation Phase...');
  
  const suitePath = path.join(process.cwd(), 'mada_certification_suite.json');
  const suite = JSON.parse(fs.readFileSync(suitePath, 'utf8'));
  
  const results = [];
  const API_ENDPOINT = 'http://localhost:3001/api/v1/simulate';

  for (const test of suite) {
    console.log(`📡 [CERT_NODE] Executing ${test.id}: ${test.description}...`);
    
    try {
      const startTime = Date.now();
      const res = await axios.post(API_ENDPOINT, {
         mti: test.fields.mti,
         amount: test.fields.4 || '0',
         card: { pan: '4557001234567890', expiry: '2412' }, // Mapping test fields
         fields: test.fields
      });

      const latency = Date.now() - startTime;
      const actualCode = res.data.response?.['39'] || 'XX';
      const isPassed = actualCode === test.expected;

      results.push({
        id: test.id,
        description: test.description,
        expected: test.expected,
        actual: actualCode,
        latency,
        status: isPassed ? 'PASSED' : 'FAILED'
      });

      if (isPassed) console.log(`  ✅ Result: ${actualCode} (Latency: ${latency}ms)`);
      else console.error(`  ❌ Result: ${actualCode} (Expected: ${test.expected})`);

    } catch (err) {
      console.error(`  ⚠️ [CERT_NODE] ${test.id} Request Error:`, err.message);
      results.push({ id: test.id, status: 'ERROR', error: err.message });
    }
  }

  // Final Report Generation
  const report = {
    title: 'mada/SAMA SPG-4 Certification Report',
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'PASSED').length,
      failed: results.filter(r => r.status !== 'PASSED').length
    },
    details: results
  };

  const reportPath = path.join(process.cwd(), 'certification_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('--------------------------------------------------');
  console.log(`🏁 [CERTIFICATION] Complete. Passed: ${report.summary.passed}/${report.summary.total}`);
  console.log(`📂 Full Report: ${reportPath}`);
}

runCertification();
