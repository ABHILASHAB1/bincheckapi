/**
 * src/transactions/reversal.js
 * ISO 8583 Reversal Advice (0420) & Response (0430) Engine.
 */
import { Builder } from '../iso/builder.js';

export class ReversalEngine {
    /**
     * Create a Reversal Advice (0420) from an original request.
     */
    static createAdvice(originalRequest) {
        console.log(`🔄 [REVERSAL] Generating 0420 Advice for STAN ${originalRequest.elements['011']}`);
        
        return Builder.pack({
            mti: '0420',
            elements: {
                ...originalRequest.elements,
                '039': '17', // Reversal/Cancel
                '090': originalRequest.mti + originalRequest.elements['011'] // Original Data Elements (Mock)
            }
        });
    }

    static handleResponse(decoded) {
        if (decoded.mti === '0430') {
            console.log('✅ [REVERSAL] Reversal Confirmed by Host (0430).');
            return true;
        }
        return false;
    }
}
