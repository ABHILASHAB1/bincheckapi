export const TEST_CARDS = [
  { id: 'TC-V-001', network: 'Visa', pan: '4111111111111111', exp: '12/30', cvv: '123', type: 'Credit', scenario: 'Approved (Standard)', track2: '4111111111111111=301212300000000000' },
  { id: 'TC-V-002', network: 'Visa', pan: '4222222222222222', exp: '12/30', cvv: '123', type: 'Credit', scenario: 'Declined (Insufficient Funds)', track2: '4222222222222222=301212300000000000' },
  { id: 'TC-V-003', network: 'Visa', pan: '4012888888881881', exp: '12/30', cvv: '999', type: 'Credit', scenario: 'Declined (Lost/Stolen)', track2: '4012888888881881=301299900000000000' },
  { id: 'TC-M-001', network: 'Mastercard', pan: '5105105105105100', exp: '12/30', cvv: '123', type: 'Credit', scenario: 'Approved (Standard)', track2: '5105105105105100=301212300000000000' },
  { id: 'TC-M-002', network: 'Mastercard', pan: '5555555555554444', exp: '12/30', cvv: '123', type: 'Credit', scenario: 'Approved (3DS Requires Challenge)', track2: '5555555555554444=301212300000000000' },
  { id: 'TC-M-003', network: 'Mastercard', pan: '5444333322221111', exp: '12/20', cvv: '123', type: 'Debit', scenario: 'Declined (Expired Card)', track2: '5444333322221111=201212300000000000' },
  { id: 'TC-MD-001', network: 'Mada', pan: '4286111111111111', exp: '12/30', cvv: '123', type: 'Debit', scenario: 'Approved (SPG Standard)', track2: '4286111111111111=301212300000000000' },
  { id: 'TC-MD-002', network: 'Mada', pan: '5888499999999999', exp: '12/30', cvv: '123', type: 'Debit', scenario: 'Approved (Contactless limits)', track2: '5888499999999999=301212300000000000' },
  { id: 'TC-A-001', network: 'Amex', pan: '378282246310005', exp: '12/30', cvv: '1234', type: 'Credit', scenario: 'Approved (Standard)', track2: '378282246310005=30121234000000000' }
];

export const SCHEME_PREFIXES = {
  'Visa': ['4111', '4222', '4012'],
  'Mastercard': ['5105', '5444', '5555'],
  'Mada': ['4286', '5888', '4313'],
  'Amex': ['3782', '3412'],
  'Discover': ['6011', '6500']
};
