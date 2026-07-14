// Payout Engine for ISO 20022 wire simulation

export const calculateNetPayout = (baseAmount, rate, spread, flatCommission) => {
    // 1. Convert everything to numbers to prevent string concatenation bugs
    const amount = Number(baseAmount);
    const fxRate = Number(rate);
    const spreadPct = Number(spread);
    const flatFee = Number(flatCommission);

    if (isNaN(amount) || isNaN(fxRate)) {
        throw new Error("Invalid base amount or rate");
    }

    // 2. Calculate the dynamic spread fee (taken in the base currency)
    const spreadFeeBase = amount * spreadPct;

    // 3. Calculate total fees in base currency
    const totalFeesBase = spreadFeeBase + flatFee;

    // 4. Calculate Net Base Amount before FX conversion
    const netBaseAmount = amount - totalFeesBase;

    // 5. Calculate Final Destination Settlement Amount
    // If fees eat the entire amount, settlement is 0
    let settledAmount = 0;
    if (netBaseAmount > 0) {
        settledAmount = netBaseAmount * fxRate;
    }

    return {
        grossBaseAmount: amount,
        activeFxRate: fxRate,
        appliedSpreadPct: spreadPct,
        spreadFeeBase,
        flatFeeBase: flatFee,
        totalFeesBase,
        netBaseAmount: netBaseAmount > 0 ? netBaseAmount : 0,
        settledAmount
    };
};
