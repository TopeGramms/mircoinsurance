"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getConnection, derivePoolPda, deriveMemberPda } from "@/lib/anchor-client";
import { POOL_CONFIG } from "@/lib/config";

interface MemberData {
    depositedAmount: number;
    claimLimit: number;
    lastClaimTs: number;
    active: boolean;
}

export default function PoolPage() {
    const { publicKey, connected } = useWallet();
    const [memberData, setMemberData] = useState<MemberData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);

    useEffect(() => {
        if (connected && publicKey) {
            loadMemberData();
        } else {
            setLoading(false);
        }
    }, [connected, publicKey]);

    async function loadMemberData() {
        if (!publicKey) return;

        try {
            const connection = await getConnection();
            const poolPda = derivePoolPda();
            const memberPda = deriveMemberPda(poolPda, publicKey);

            const memberAccountInfo = await connection.getAccountInfo(memberPda);

            if (memberAccountInfo) {
                // Parse member data (deserialize using Anchor)
                // Placeholder data for MVP
                setMemberData({
                    depositedAmount: 100,
                    claimLimit: 50,
                    lastClaimTs: 0,
                    active: true,
                });
                setIsMember(true);
            } else {
                setIsMember(false);
            }
        } catch (error) {
            console.error("Error loading member data:", error);
        } finally {
            setLoading(false);
        }
    }

    function formatAmount(amount: number): string {
        return amount.toLocaleString();
    }

    if (!connected) {
        return (
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">My Coverage</h1>
                </div>
                <div className="card">
                    <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        Please connect your wallet to view your coverage
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">My Coverage</h1>
                </div>
                <div className="card">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isMember) {
        return (
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">My Coverage</h1>
                </div>
                <div className="card">
                    <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
                        You are not a member of the pool yet.
                    </p>
                    <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
                        To join, you'll need to call the join_pool instruction from the CLI or use a custom UI component.
                    </p>
                    <button className="btn btn-primary" disabled>
                        Join Pool (CLI Required)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">My Coverage</h1>
                <p className="page-subtitle">Your deposit and claim eligibility</p>
            </div>

            {/* Coverage Stats */}
            <div className="card-grid">
                <div className="stat-card">
                    <div className="stat-label">Your Deposit</div>
                    <div className="stat-value">{formatAmount(memberData?.depositedAmount || 0)}</div>
                    <div className="stat-sublabel">USDC tokens</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Available Claim Limit</div>
                    <div className="stat-value">{formatAmount(memberData?.claimLimit || 0)}</div>
                    <div className="stat-sublabel">
                        {POOL_CONFIG.maxClaimPct}% of your deposit
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Membership Status</div>
                    <div className="stat-value">
                        {memberData?.active ? "Active" : "Inactive"}
                    </div>
                    <div className="stat-sublabel">
                        {memberData?.active ? "You can submit claims" : "Inactive"}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Last Claim</div>
                    <div className="stat-value">
                        {memberData?.lastClaimTs && memberData.lastClaimTs > 0
                            ? new Date(memberData.lastClaimTs * 1000).toLocaleDateString()
                            : "Never"}
                    </div>
                    <div className="stat-sublabel">Claim history</div>
                </div>
            </div>

            {/* Coverage Info */}
            <div className="card">
                <div className="card-title">Coverage Details</div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>
                        What's Covered
                    </h3>
                    <ul style={{ color: "var(--text-secondary)", paddingLeft: "1.5rem" }}>
                        <li>Device damage from accidents</li>
                        <li>Theft protection</li>
                        <li>Loss coverage</li>
                    </ul>
                </div>

                <div>
                    <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>
                        How to Claim
                    </h3>
                    <ol style={{ color: "var(--text-secondary)", paddingLeft: "1.5rem" }}>
                        <li>Submit claim with evidence (photo, police report, etc.)</li>
                        <li>Other members vote YES or NO within {POOL_CONFIG.voteWindowHours} hours</li>
                        <li>If {POOL_CONFIG.approvalRatio}% vote YES, claim is approved</li>
                        <li>Approved claims are paid out automatically</li>
                    </ol>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="card">
                <div className="card-title">Actions</div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <a href="/actions" className="btn btn-primary">
                        Deposit More
                    </a>
                    <a href="/submit-claim" className="btn btn-secondary">
                        Submit Claim
                    </a>
                    <a href="/actions?tab=withdraw" className="btn btn-secondary">
                        Withdraw
                    </a>
                </div>
            </div>
        </div>
    );
}
