/**
 * src/iso/bitmap.js
 * Logic for generating and parsing Primary and Secondary Bitmaps.
 */
export class Bitmap {
    static generate(elements) {
        let bits = new Array(128).fill(0);
        Object.keys(elements).forEach(key => {
            const field = parseInt(key, 10);
            if (field > 1) bits[field - 1] = 1;
        });

        // Set bit 1 if secondary bitmap is needed
        if (Object.keys(elements).some(k => parseInt(k, 10) > 64)) {
            bits[0] = 1;
        }

        let hex = '';
        for (let i = 0; i < bits.length; i += 4) {
            hex += parseInt(bits.slice(i, i + 4).join(''), 2).toString(16).toUpperCase();
        }
        
        // Return 16 or 32 chars based on bit 1
        return bits[0] === 1 ? hex : hex.slice(0, 16);
    }

    static parse(hex) {
        let bits = '';
        for (let i = 0; i < hex.length; i++) {
            bits += parseInt(hex[i], 16).toString(2).padStart(4, '0');
        }
        return bits.split('').map(Number);
    }
}
