export const translateXmlTo8583 = (messageId, dynamicData, bankingData = {}) => {
   const iso8583 = {
      mti: '0200', // Default financial request
      elements: {},
      stan: Math.floor(Math.random() * 900000) + 100000 + ''
   };

   try {
      // Basic mapping heuristics based on standard CBPR+ / Target2 patterns
      if (messageId.startsWith('pacs.008')) {
         // Customer Credit Transfer
         const grpHdr = dynamicData['GrpHdr'] || {};
         const cdtTrfTxInf = dynamicData['CdtTrfTxInf'] || {};

         iso8583.mti = '0200';
         iso8583.elements['003'] = '000000'; // Processing Code

         // Amount mapping (InterbankSettlementAmount)
         const amount = cdtTrfTxInf['IntrBkSttlmAmt'] || grpHdr['TtlIntrBkSttlmAmt'] || '0';
         iso8583.elements['004'] = amount.toString().replace(/\D/g, '').padStart(12, '0');

         // Transmission DateTime
         const creDtTm = grpHdr['CreDtTm'] || new Date().toISOString();
         const dt = new Date(creDtTm);
         iso8583.elements['007'] = `${(dt.getMonth() + 1).toString().padStart(2, '0')}${dt.getDate().toString().padStart(2, '0')}${dt.getHours().toString().padStart(2, '0')}${dt.getMinutes().toString().padStart(2, '0')}${dt.getSeconds().toString().padStart(2, '0')}`;

         iso8583.elements['011'] = iso8583.stan; // STAN
         
         // BIC Mappings (Acquiring/Forwarding Institution)
         const senderBic = bankingData.senderBic || 'SIMUSA01XXX';
         const receiverBic = bankingData.receiverBic || 'TARGETSA02XXX';
         
         iso8583.elements['032'] = senderBic.substring(0, 11); // Acquiring Inst ID
         iso8583.elements['033'] = receiverBic.substring(0, 11); // Forwarding Inst ID

         iso8583.elements['041'] = (bankingData.instructionId || 'CBPR1234').substring(0, 8); // Terminal ID
         iso8583.elements['049'] = '682'; // Default SAR Currency

         // PAN mapping from Debtor Account
         const dbtrAcct = cdtTrfTxInf['DbtrAcct'] || '';
         if (dbtrAcct) {
            iso8583.elements['002'] = dbtrAcct.replace(/\D/g, '').substring(0, 19);
         } else {
            iso8583.elements['002'] = '4000001234567890';
         }

         // SWIFT gpi Tracking (UETR) mapping to DE 127 or similar custom field
         iso8583.elements['127'] = bankingData.uetr || '';
         
         // Fee Engine Mapping (OUR / SHA / BEN)
         const feeMap = { 'OUR': '01', 'SHA': '02', 'BEN': '03' };
         iso8583.elements['028'] = feeMap[bankingData.chargeBearer || 'SHA'];

         // DE 104 - Transaction Description (EndToEndId)
         iso8583.elements['104'] = cdtTrfTxInf['EndToEndId'] || bankingData.instructionId || 'CBPR+ Transfer';
      }
      else if (messageId.startsWith('cain.001')) {
         // Acquirer Financial Authorization
         const hdr = dynamicData['Hdr'] || {};
         const tx = dynamicData['Tx'] || {};

         iso8583.mti = '0100'; // Auth Request
         iso8583.elements['003'] = tx['TxTp'] === 'PURCHASE' ? '000000' : '010000';
         iso8583.elements['004'] = (tx['TxAmt'] || '0').toString().replace(/\D/g, '').padStart(12, '0');
         iso8583.elements['011'] = iso8583.stan;
         iso8583.elements['032'] = (bankingData.senderBic || 'TERM0001').substring(0, 11);
         iso8583.elements['041'] = (hdr['InitgPty'] || 'TERM0001').substring(0, 8);

         const pan = dynamicData['Card']?.['Pan'] || '';
         if (pan) iso8583.elements['002'] = pan;
      }
      else {
         // Generic Fallback Mapper
         iso8583.mti = '0200';
         iso8583.elements['003'] = '000000';
         iso8583.elements['011'] = iso8583.stan;
         iso8583.elements['127'] = bankingData.uetr || '';

         let foundAmt = false;
         for (const [key, val] of Object.entries(dynamicData)) {
            if (typeof val === 'object') {
               for (const [subKey, subVal] of Object.entries(val)) {
                  if (subKey.toLowerCase().includes('amt')) {
                     iso8583.elements['004'] = subVal.toString().replace(/\D/g, '').padStart(12, '0');
                     foundAmt = true;
                     break;
                  }
               }
            }
         }
         if (!foundAmt) iso8583.elements['004'] = '000000000000';
         iso8583.elements['104'] = `Translated ${messageId}`;
      }

      // Final sanitization
      const finalElements = {};
      Object.keys(iso8583.elements).forEach(k => {
         const paddedKey = k.toString().padStart(3, '0');
         if (iso8583.elements[k]) {
            finalElements[paddedKey] = iso8583.elements[k];
         }
      });
      iso8583.elements = finalElements;

      return iso8583;
   } catch (err) {
      console.error("CBPR+ Translation Error", err);
      return null;
   }
};
