"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getConnection, derivePoolPda } from "@/lib/anchor-client";
import { POOL_CONFIG, getExplorerUrl } from "@/lib/config";
import Link from "next/link";

interface PoolStats {
    tvl: number;
    members: number;
    paidOut: number;
    claimCount: number;
}

interface Claim {
    id: number;
    claimant: string;
    amount: number;
    status: string;
    createdAt: string;
}

export default function Home() {
    const { connected } = useWallet();
    const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
    const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPoolData();
    }, []);

    async function loadPoolData() {
        try {
            const connection = await getConnection();
            const poolPda = derivePoolPda();

            // Fetch pool account
            const poolAccountInfo = await connection.getAccountInfo(poolPda);

            if (poolAccountInfo) {
                // Parse pool data (you'll need to deserialize properly using Anchor)
                // For now, showing placeholder data
                setPoolStats({
                    tvl: 300,
                    members: 3,
                    paidOut: 50,
                    claimCount: 2,
                });

                // Fetch recent claims
                // In production, you'd query claim PDAs
                setRecentClaims([
                    {
                        id: 0,
                        claimant: "Member1...",
                        amount: 50,
                        status: "Paid",
                        createdAt: new Date().toLocaleDateString(),
                    },
                    {
                        id: 1,
                        claimant: "Member2...",
                        amount: 40,
                        status: "Rejected",
                        createdAt: new Date().toLocaleDateString(),
                    },
                ]);
            } else {
                // Pool not initialized
                setPoolStats({
                    tvl: 0,
                    members: 0,
                    paidOut: 0,
                    claimCount: 0,
                });
            }
        } catch (error) {
            console.error("Error loading pool data:", error);
        } finally {
            setLoading(false);
        }
    }

    function formatAmount(amount: number): string {
        return amount.toLocaleString();
    }

    if (loading) {
        return (
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Loading...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Protection Pool Overview</h1>
                <p className="page-subtitle">
                    Decentralized freelancer protection on Solana
                </p>
            </div>

            {/* Pool Rules */}
            <div className="info-box">
                <div className="info-box-title">Pool Rules</div>
                <ul className="info-list">
                    <li>• Max claim: {POOL_CONFIG.maxClaimPct}% of your deposit</li>
                    <li>• Vote window: {POOL_CONFIG.voteWindowHours} hours</li>
                    <li>• Minimum votes (quorum): {POOL_CONFIG.quorum}</li>
                    <li>• Approval threshold: {POOL_CONFIG.approvalRatio}%</li>
                </ul>
            </div>

            {/* Pool Stats */}
            <div className="card-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Value Locked</div>
                    <div className="stat-value">{formatAmount(poolStats?.tvl || 0)}</div>
                    <div className="stat-sublabel">USDC tokens</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Total Members</div>
                    <div className="stat-value">{poolStats?.members || 0}</div>
                    <div className="stat-sublabel">Active participants</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Total Paid Out</div>
                    <div className="stat-value">{formatAmount(poolStats?.paidOut || 0)}</div>
                    <div className="stat-sublabel">In approved claims</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Total Claims</div>
                    <div className="stat-value">{poolStats?.claimCount || 0}</div>
                    <div className="stat-sublabel">Submitted to date</div>
                </div>
            </div>

            {/* Recent Claims */}
            <div className="card">
                <div className="card-title">
                    Recent Claims
                    <Link href="/claims" className="link">
                        View all →
                    </Link>
                </div>

                {recentClaims.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Claim ID</th>
                                    <th>Claimant</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentClaims.map((claim) => (
                                    <tr key={claim.id}>
                                        <td>#{claim.id}</td>
                                        <td>
                                            <span className="link">{claim.claimant}</span>
                                        </td>
                                        <td>{formatAmount(claim.amount)} USDC</td>
                                        <td>
                                            <span className={`status-badge status-${claim.status.toLowerCase()}`}>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td>{claim.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: "var(--text-secondary)" }}>
                        No claims submitted yet
                    </p>
                )}
            </div>

            {/* Quick Actions */}
            {connected && (
                <div className="card">
                    <div className="card-title">Quick Actions</div>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        <Link href="/actions" className="btn btn-primary">
                            Deposit Tokens
                        </Link>
                        <Link href="/submit-claim" className="btn btn-secondary">
                            Submit Claim
                        </Link>
                        <Link href="/claims" className="btn btn-secondary">
                            Vote on Claims
                        </Link>
                    </div>
                </div>
            )}

            {!connected && (
                <div className="card">
                    <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        Connect your wallet to interact with the pool
                    </p>
                </div>
            )}
        </div>
    );
}
