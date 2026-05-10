import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class XSDEngine {
  static saveXSDSchema(messageId, schemaObj) {
    const xsdsDir = path.join(__dirname, 'xsds');
    if (!fs.existsSync(xsdsDir)) {
       fs.mkdirSync(xsdsDir, { recursive: true });
    }
    const jsonPath = path.join(xsdsDir, `${messageId}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(schemaObj, null, 2));
  }

  static getXSDSchema(messageId) {
    const jsonPath = path.join(__dirname, 'xsds', `${messageId}.json`);
    if (fs.existsSync(jsonPath)) {
        try {
            return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        } catch (err) {
            console.error(`Failed to parse saved JSON schema for ${messageId}`, err);
        }
    }

    const xsdPath = path.join(__dirname, 'xsds', `${messageId}.xsd`);
    
    // In a full production setup, we would use 'fast-xml-parser' to parse the real XSD file.
    // For this engine simulation, we extract elements dynamically based on message family.
    
    const prefix = messageId.split('.')[0];
    
    // Simulated dynamic schema extraction based on message family
    let elements = [];
    
    // Every ISO 20022 message has a Document root and GrpHdr (Group Header)
    elements.push({ name: 'MsgId', type: 'string', required: true, description: 'Message Identification' });
    elements.push({ name: 'CreDtTm', type: 'datetime', required: true, description: 'Creation Date and Time' });
    
    if (prefix === 'cain') {
        elements.push({ name: 'Hdr', type: 'complex', required: true, description: 'Message Header', subElements: [
            { name: 'MsgFctn', type: 'enum', required: true, description: 'Message Function', options: ['AUTQ', 'AUTP', 'FAUQ', 'FAUP', 'CMPV', 'CNCL'] },
            { name: 'PrtcolVrsn', type: 'string', required: true, description: 'Protocol Version (e.g. 1.0)' },
            { name: 'XchgId', type: 'string', required: true, description: 'Exchange Identification' },
            { name: 'InitgPtyId', type: 'string', required: true, description: 'Initiating Party ID' },
            { name: 'RcptPtyId', type: 'string', required: false, description: 'Recipient Party ID' }
        ]});
        elements.push({ name: 'Envt', type: 'complex', required: true, description: 'Environment Data (Acquirer & Merchant)', subElements: [
            { name: 'AcqrrId', type: 'string', required: true, description: 'Acquirer Identification' },
            { name: 'MrchntId', type: 'string', required: true, description: 'Merchant Identification' },
            { name: 'MrchntCtgyCd', type: 'string', required: true, description: 'Merchant Category Code (MCC)' },
            { name: 'TermnlId', type: 'string', required: true, description: 'Terminal Identification' }
        ]});
        elements.push({ name: 'Cntxt', type: 'complex', required: true, description: 'Context Data (POS Conditions)', subElements: [
            { name: 'PtOfSvcCpblties', type: 'enum', required: true, description: 'POS Capabilities', options: ['CHIP', 'MAGN', 'MANU', 'RFID', 'MOTO'] },
            { name: 'PINNtryCpblty', type: 'enum', required: true, description: 'PIN Entry Capability', options: ['UKNW', 'NTPS', 'PINS'] },
            { name: 'TxInitr', type: 'enum', required: true, description: 'Transaction Initiator', options: ['CARD', 'MERC', 'CUST'] }
        ]});
        elements.push({ name: 'Tx', type: 'complex', required: true, description: 'Transaction Data', subElements: [
            { name: 'TxId', type: 'string', required: true, description: 'Transaction Identification' },
            { name: 'TxTp', type: 'enum', required: true, description: 'Transaction Type', options: ['CRDP', 'CSHB', 'CSHW', 'DEBT', 'RFND'] },
            { name: 'TtlAmt', type: 'string', required: true, description: 'Total Amount (e.g. 1500.00)' },
            { name: 'Ccy', type: 'string', required: true, description: 'Currency (e.g. USD)' }
        ]});
        elements.push({ name: 'Card', type: 'complex', required: true, description: 'Cardholder Data Block', subElements: [
            { name: 'PAN', type: 'string', required: true, description: 'Primary Account Number' },
            { name: 'ExpDt', type: 'string', required: true, description: 'Expiration Date (YYMM)' },
            { name: 'CardSeqNb', type: 'string', required: false, description: 'Card Sequence Number' }
        ]});
    } else if (prefix === 'pacs') {
        elements.push({ name: 'NbOfTxs', type: 'number', required: true, description: 'Number of Transactions' });
        elements.push({ name: 'CtrlSum', type: 'amount', required: false, description: 'Control Sum' });
        elements.push({ name: 'SttlmInf', type: 'complex', required: true, description: 'Settlement Information', subElements: [
            { name: 'SttlmMtd', type: 'enum', required: true, options: ['CLRG', 'INDA', 'INGA', 'COVE'], description: 'Settlement Method' }
        ]});
        elements.push({ name: 'PmtId', type: 'complex', required: true, description: 'Payment Identification', subElements: [
            { name: 'EndToEndId', type: 'string', required: true, description: 'End to End Identification' },
            { name: 'TxId', type: 'string', required: true, description: 'Transaction Identification' },
            { name: 'UETR', type: 'string', required: true, description: 'Unique End-to-end Transaction Reference (UUID)' }
        ]});
        elements.push({ name: 'Amt', type: 'complex', required: true, description: 'Amount Data', subElements: [
            { name: 'IntrBkSttlmAmt', type: 'string', required: true, description: 'Interbank Settlement Amount' },
            { name: 'Ccy', type: 'string', required: true, description: 'Currency Code (e.g. EUR)' }
        ]});
        elements.push({ name: 'ChrgBr', type: 'enum', required: true, description: 'Charge Bearer', options: ['DEBT', 'CRED', 'SHAR', 'SLEV'] });
        elements.push({ name: 'Dbtr', type: 'complex', required: true, description: 'Debtor Information (Sender)', subElements: [
            { name: 'Nm', type: 'string', required: true, description: 'Debtor Name' },
            { name: 'AcctId', type: 'string', required: true, description: 'Debtor IBAN or Account Number' },
            { name: 'AgtBICFI', type: 'string', required: true, description: 'Debtor Agent BICFI' }
        ]});
        elements.push({ name: 'Cdtr', type: 'complex', required: true, description: 'Creditor Information (Receiver)', subElements: [
            { name: 'Nm', type: 'string', required: true, description: 'Creditor Name' },
            { name: 'AcctId', type: 'string', required: true, description: 'Creditor IBAN or Account Number' },
            { name: 'AgtBICFI', type: 'string', required: true, description: 'Creditor Agent BICFI' }
        ]});
    } else if (prefix === 'pain') {
        elements.push({ name: 'GrpHdr', type: 'complex', required: true, description: 'Group Header', subElements: [
            { name: 'MsgId', type: 'string', required: true, description: 'Message Identification' },
            { name: 'NbOfTxs', type: 'number', required: true, description: 'Number of Transactions' },
            { name: 'CtrlSum', type: 'string', required: false, description: 'Control Sum' }
        ]});
        elements.push({ name: 'InitgPty', type: 'complex', required: true, description: 'Initiating Party', subElements: [
            { name: 'Nm', type: 'string', required: true, description: 'Name' },
            { name: 'Id', type: 'string', required: false, description: 'Identification (OrgId/PrvtId)' }
        ]});
        elements.push({ name: 'PmtInf', type: 'complex', required: true, description: 'Payment Information Block', subElements: [
            { name: 'PmtInfId', type: 'string', required: true, description: 'Payment Info ID' },
            { name: 'PmtMtd', type: 'enum', required: true, description: 'Payment Method', options: ['TRF', 'DD', 'CHK', 'TRA'] },
            { name: 'ReqdExctnDt', type: 'date', required: true, description: 'Requested Execution Date' }
        ]});
        elements.push({ name: 'Dbtr', type: 'complex', required: true, description: 'Debtor (Sender) Information', subElements: [
            { name: 'Nm', type: 'string', required: true, description: 'Debtor Name' },
            { name: 'AcctId', type: 'string', required: true, description: 'Debtor Account (IBAN)' },
            { name: 'AgtBICFI', type: 'string', required: true, description: 'Debtor Agent BICFI' }
        ]});
        elements.push({ name: 'Cdtr', type: 'complex', required: true, description: 'Creditor (Receiver) Information', subElements: [
            { name: 'Nm', type: 'string', required: true, description: 'Creditor Name' },
            { name: 'AcctId', type: 'string', required: true, description: 'Creditor Account (IBAN)' },
            { name: 'AgtBICFI', type: 'string', required: true, description: 'Creditor Agent BICFI' }
        ]});
        elements.push({ name: 'TxInf', type: 'complex', required: true, description: 'Transaction Information', subElements: [
            { name: 'EndToEndId', type: 'string', required: true, description: 'End to End Identification' },
            { name: 'InstdAmt', type: 'string', required: true, description: 'Instructed Amount' },
            { name: 'Ccy', type: 'string', required: true, description: 'Currency Code' },
            { name: 'Ustrd', type: 'string', required: false, description: 'Unstructured Remittance Info' }
        ]});
    } else if (prefix === 'auth') {
        elements.push({ name: 'RptgPrd', type: 'complex', required: true, description: 'Reporting Period', subElements: [
            { name: 'FrDt', type: 'date', required: true, description: 'From Date' },
            { name: 'ToDt', type: 'date', required: true, description: 'To Date' }
        ]});
        elements.push({ name: 'RptgInstn', type: 'string', required: true, description: 'Reporting Institution LEI' });
    } else if (prefix === 'camt') {
        elements.push({ name: 'Stmt', type: 'complex', required: true, description: 'Statement Information', subElements: [
            { name: 'Id', type: 'string', required: true, description: 'Statement Identification' },
            { name: 'ElctrncSeqNb', type: 'string', required: false, description: 'Electronic Sequence Number' },
            { name: 'LglSeqNb', type: 'string', required: false, description: 'Legal Sequence Number' }
        ]});
        elements.push({ name: 'Acct', type: 'complex', required: true, description: 'Account Details', subElements: [
            { name: 'Id', type: 'string', required: true, description: 'IBAN or Account ID' },
            { name: 'Ccy', type: 'string', required: true, description: 'Account Currency (e.g. USD)' },
            { name: 'Svcr', type: 'string', required: true, description: 'Servicer BICFI' }
        ]});
        elements.push({ name: 'Bal', type: 'complex', required: true, description: 'Account Balance', subElements: [
            { name: 'Tp', type: 'enum', required: true, description: 'Balance Type', options: ['OPBD', 'CLBD', 'ITBD', 'PRCD'] },
            { name: 'Amt', type: 'string', required: true, description: 'Balance Amount' },
            { name: 'CdtDbtInd', type: 'enum', required: true, description: 'Credit/Debit Indicator', options: ['CRDT', 'DBIT'] },
            { name: 'Dt', type: 'date', required: true, description: 'Balance Date' }
        ]});
        elements.push({ name: 'Ntry', type: 'complex', required: false, description: 'Statement Entry (Transaction)', subElements: [
            { name: 'NtryRef', type: 'string', required: true, description: 'Entry Reference' },
            { name: 'Amt', type: 'string', required: true, description: 'Entry Amount' },
            { name: 'CdtDbtInd', type: 'enum', required: true, description: 'Credit/Debit Indicator', options: ['CRDT', 'DBIT'] },
            { name: 'Sts', type: 'enum', required: true, description: 'Entry Status', options: ['BOOK', 'PDNG', 'INFO'] }
        ]});
    } else {
        // Generic fallback for all other families
        elements.push({ name: 'PmtId', type: 'string', required: true, description: 'Payment Identification' });
        elements.push({ name: 'EndToEndId', type: 'string', required: true, description: 'End to End Identification' });
    }

    return {
        messageId: messageId,
        namespace: `urn:iso:std:iso:20022:tech:xsd:${messageId}`,
        elements: elements,
        parsedFromRealXSD: fs.existsSync(xsdPath) // flag to show if it was real or mock
    };
  }
}
