"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { POOL_CONFIG, getExplorerUrl } from "@/lib/config";

type ClaimType = "Damage" | "Theft" | "Loss";

export default function SubmitClaimPage() {
    const { publicKey, connected } = useWallet();

    const [claimType, setClaimType] = useState<ClaimType>("Damage");
    const [requestedAmount, setRequestedAmount] = useState("");
    const [evidenceUri, setEvidenceUri] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [txSignature, setTxSignature] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Mock user claim limit (in production, fetch from member account)
    const userClaimLimit = 50;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!publicKey || !requestedAmount || !evidenceUri) return;

        const amount = parseFloat(requestedAmount);

        // Validation
        if (amount <= 0) {
            setError("Amount must be greater than 0");
            return;
        }

        if (amount > userClaimLimit) {
            setError(`Amount exceeds your claim limit of ${userClaimLimit} USDC`);
            return;
        }

        if (evidenceUri.length > 200) {
            setError("Evidence URI must be 200 characters or less");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // TODO: Call submit_claim instruction
            // const tx = await program.methods.submitClaim(
            //   claimType === "Damage" ? { damage: {} } : claimType === "Theft" ? { theft: {} } : { loss: {} },
            //   new BN(amount * 1_000_000), // assuming 6 decimals
            //   evidenceUri
            // )...

            // Simulate transaction
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const mockSignature = "claim_" + Date.now();
            setTxSignature(mockSignature);

            // Reset form
            setRequestedAmount("");
            setEvidenceUri("");
            setClaimType("Damage");
        } catch (err: any) {
            setError(err.message || "Failed to submit claim");
        } finally {
            setSubmitting(false);
        }
    }

    if (!connected) {
        return (
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Submit Claim</h1>
                </div>
                <div className="card">
                    <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        Please connect your wallet to submit a claim
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Submit Claim</h1>
                <p className="page-subtitle">Request payout from the protection pool</p>
            </div>

            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                {/* Info Box */}
                <div className="info-box">
                    <div className="info-box-title">Claim Requirements</div>
                    <ul className="info-list">
                        <li>• Amount must not exceed your claim limit ({userClaimLimit} USDC)</li>
                        <li>• Provide clear evidence (photo, police report, receipt)</li>
                        <li>• Members will vote within {POOL_CONFIG.voteWindowHours} hours</li>
                        <li>• {POOL_CONFIG.approvalRatio}% approval needed for payout</li>
                    </ul>
                </div>

                {/* Form */}
                <div className="card">
                    <div className="card-title">Claim Details</div>

                    <form onSubmit={handleSubmit}>
                        {/* Claim Type */}
                        <div className="form-group">
                            <label className="form-label">Claim Type</label>
                            <select
                                className="form-select"
                                value={claimType}
                                onChange={(e) => setClaimType(e.target.value as ClaimType)}
                                disabled={submitting}
                            >
                                <option value="Damage">Device Damage</option>
                                <option value="Theft">Device Theft</option>
                                <option value="Loss">Device Loss</option>
                            </select>
                            <p className="form-hint">
                                {claimType === "Damage" && "Accidental damage to your insured device"}
                                {claimType === "Theft" && "Device was stolen (police report required)"}
                                {claimType === "Loss" && "Device was lost or misplaced"}
                            </p>
                        </div>

                        {/* Requested Amount */}
                        <div className="form-group">
                            <label className="form-label">Requested Amount (USDC)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0.00"
                                value={requestedAmount}
                                onChange={(e) => setRequestedAmount(e.target.value)}
                                disabled={submitting}
                                step="0.01"
                                max={userClaimLimit}
                            />
                            <p className="form-hint">
                                Max claim: {userClaimLimit} USDC ({POOL_CONFIG.maxClaimPct}% of your deposit)
                            </p>
                        </div>

                        {/* Evidence URI */}
                        <div className="form-group">
                            <label className="form-label">Evidence URL</label>
                            <input
                                type="url"
                                className="form-input"
                                placeholder="https://..."
                                value={evidenceUri}
                                onChange={(e) => setEvidenceUri(e.target.value)}
                                disabled={submitting}
                                maxLength={200}
                            />
                            <p className="form-hint">
                                Link to photos, police report, or other supporting documentation (max 200 chars)
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div
                                style={{
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid var(--error)",
                                    borderRadius: "8px",
                                    padding: "1rem",
                                    marginBottom: "1.5rem",
                                    color: "var(--error)",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: "100%" }}
                            disabled={
                                !requestedAmount ||
                                !evidenceUri ||
                                parseFloat(requestedAmount) <= 0 ||
                                submitting
                            }
                        >
                            {submitting ? "Submitting..." : "Submit Claim"}
                        </button>
                    </form>

                    {/* Success Message */}
                    {txSignature && (
                        <div
                            style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                border: "1px solid var(--success)",
                                borderRadius: "8px",
                                padding: "1rem",
                                marginTop: "1.5rem",
                            }}
                        >
                            <div style={{ color: "var(--success)", fontWeight: 600, marginBottom: "0.5rem" }}>
                                ✅ Claim Submitted Successfully!
                            </div>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                                Your claim is now pending. Members will vote within {POOL_CONFIG.voteWindowHours} hours.
                            </p>
                            <a
                                href={getExplorerUrl(txSignature)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link"
                                style={{ fontSize: "0.875rem" }}
                            >
                                View transaction on Solana Explorer →
                            </a>
                            <div style={{ marginTop: "1rem" }}>
                                <a href="/claims" className="btn btn-secondary" style={{ width: "100%" }}>
                                    View All Claims
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* What Happens Next */}
                <div className="card">
                    <div className="card-title">What Happens Next?</div>

                    <ol style={{ color: "var(--text-secondary)", paddingLeft: "1.5rem" }}>
                        <li style={{ marginBottom: "0.5rem" }}>
                            Your claim enters <strong>Pending</strong> status
                        </li>
                        <li style={{ marginBottom: "0.5rem" }}>
                            Pool members have {POOL_CONFIG.voteWindowHours} hours to vote YES or NO
                        </li>
                        <li style={{ marginBottom: "0.5rem" }}>
                            Minimum {POOL_CONFIG.quorum} votes required (quorum)
                        </li>
                        <li style={{ marginBottom: "0.5rem" }}>
                            If ≥{POOL_CONFIG.approvalRatio}% vote YES, claim is <strong>Approved</strong>
                        </li>
                        <li>
                            Approved claims are paid out automatically to your wallet
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
