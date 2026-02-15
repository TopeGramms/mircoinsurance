/**
 * Risk assessment logic for claims.
 * @param {Object} claimData - Data about the claim and user.
 * @param {number} userStreak - The user's payment streak in months.
 * @returns {boolean} - True if approved, false otherwise.
 */
function assessRisk(claimData, userStreak) {
    console.log(`Assessing risk for user with streak: ${userStreak}`);
    
    // Rule 1: User must have paid at least 2 months
    if (userStreak < 2) {
        console.log("Rejected: Insufficient payment streak.");
        return false;
    }

    // Rule 2: Simple check on estimated cost (mock logic)
    // e.g., reject if cost > 1000 USDC for MVP
    if (claimData.estimatedCost > 1000 * 10**6) {
        console.log("Rejected: Cost too high for MVP.");
        return false;
    }

    console.log("Approved.");
    return true;
}

module.exports = { assessRisk };
