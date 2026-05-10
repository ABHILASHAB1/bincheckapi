/**
 * server/dsEngine.js
 * Directory Server (DS) Engine - Handles scheme routing and card enrollment.
 */

const SCHEME_ROUTING = [
  { prefix: '5888', scheme: 'mada', acsUrl: 'https://acs.snb.com.sa/3ds2/challenge' },
  { prefix: '9682', scheme: 'mada', acsUrl: 'https://acs.snb.com.sa/3ds2/challenge' },
  { prefix: '4', scheme: 'Visa', acsUrl: 'https://acs.issuer.visa.com/3ds2/challenge' },
  { prefix: '5', scheme: 'Mastercard', acsUrl: 'https://acs.issuer.mastercard.com/3ds2/challenge' }
];

export class DSEngine {
  static lookupEnrollment(pan) {
    const route = SCHEME_ROUTING.find(r => pan.startsWith(r.prefix));
    
    if (!route) {
      return { enrolled: false, scheme: 'Unknown', dsReference: null };
    }

    return {
      enrolled: true,
      scheme: route.scheme,
      acsUrl: route.acsUrl,
      dsReference: `DS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
  }
}
