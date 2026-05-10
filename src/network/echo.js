/**
 * src/network/echo.js
 * 0800 Network Management Auto-Echo (30s Keepalive).
 */
import { Builder } from '../iso/builder.js';

export class Echo {
    static buildRequest(stan) {
        return Builder.pack({
            mti: '0800',
            elements: {
                '007': new Date().toISOString().replace(/-/g, '').replace(/:/g, '').replace(/T/g, '').slice(4, 14),
                '011': stan || Math.floor(100000 + Math.random() * 899999).toString().padStart(6, '0'),
                '070': '301' // Echo Test
            }
        });
    }
}
