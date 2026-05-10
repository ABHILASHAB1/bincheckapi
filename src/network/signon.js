/**
 * src/network/signon.js
 * 0800 Network Management Sign-On.
 */
import { Builder } from '../iso/builder.js';

export class SignOn {
    static buildRequest(stan) {
        return Builder.pack({
            mti: '0800',
            elements: {
                '007': new Date().toISOString().replace(/-/g, '').replace(/:/g, '').replace(/T/g, '').slice(4, 14),
                '011': stan || '000001',
                '070': '001' // Sign On
            }
        });
    }
}
