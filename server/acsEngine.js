/**
 * server/acsEngine.js
 * Access Control Server (ACS) Engine - Handles Risk Scoring, OTP, and Auth Decisions.
 */

export class ACSEngine {
  /**
   * Simple heuristic risk engine
   */
  static calculateRiskScore(data) {
    let score = 10; // Base score
    
    const amount = parseFloat(data.amount || 0);
    
    // Rule: High amount increases risk
    if (amount > 5000) score += 40;
    if (amount > 10000) score += 30;

    // Rule: Velocity (Mock)
    if (data.velocity > 3) score += 20;

    // Rule: New Device (Mock)
    if (data.isNewDevice) score += 15;

    return Math.min(score, 100);
  }

  static decideFlow(riskScore, forceChallenge = false) {
    if (forceChallenge) return 'CHALLENGE';
    if (riskScore < 40) return 'FRICTIONLESS';
    if (riskScore < 75) return 'CHALLENGE';
    return 'BLOCK';
  }

  static generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
