import React from 'react';

/**
 * BitmapVisualizer
 * Enterprise-grade tool for decoding and visualizing ISO 8583 Bitmaps.
 */
export default function BitmapVisualizer({ hex }) {
    if (!hex) return null;

    // Convert Hex to Binary
    const binary = hex.split('').map(char => 
        parseInt(char, 16).toString(2).padStart(4, '0')
    ).join('');

    const bits = binary.split('').map(Number);

    return (
        <div className="flex flex-col space-y-4 font-mono">
            <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Hex Bitmap</span>
                <span className="text-Fintech-accent font-black tracking-widest">{hex}</span>
            </div>
            
            {/* Binary Grid */}
            <div className="grid grid-cols-8 gap-1">
                {bits.map((bit, i) => (
                    <div 
                        key={i}
                        title={`Field ${i + 1}`}
                        className={`
                            h-6 flex items-center justify-center text-[10px] rounded-sm transition-all
                            ${bit === 1 ? 'bg-fintech-accent text-white font-black' : 'bg-white/5 text-gray-700'}
                        `}
                    >
                        {bit}
                    </div>
                ))}
            </div>

            <div className="text-[9px] text-gray-600 italic">
                Active Bits: {bits.filter(b => b === 1).length} fields present in payload.
            </div>
        </div>
    );
}
