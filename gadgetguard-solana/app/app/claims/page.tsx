"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getConnection, derivePoolPda, deriveClaimPda } from "@/lib/anchor-client";
import { POOL_CONFIG, getExplorerUrl } from "@/lib/config";

interface Claim {
    id: number;
    claimant: string;
    claimType: string;
    requestedAmount: number;
    evidenceUri: string;
    createdAt: string;
    status: "Pending" | "Approved" | "Rejected" | "Paid";
    yesVotes: number;
    noVotes: number;
    voters: string[];
}

export default function ClaimsPage() {
    const { publicKey, connected } = useWallet();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [voting, setVoting] = useState(false);

    useEffect(() => {
        loadClaims();
    }, []);

    async function loadClaims() {
        try {
            // Fetch all claims from the pool
            // For MVP, showing placeholder data
            setClaims([
                {
                    id: 0,
                    claimant: "7xKD...9pLm",
                    claimType: "Damage",
                    requestedAmount: 50,
                    evidenceUri: "https://evidence.example.com/claim1",
                    createdAt: new Date().toLocaleDateString(),
                    status: "Paid",
                    yesVotes: 2,
                    noVotes: 0,
                    voters: ["voter1", "voter2"],
                },
                {
                    id: 1,
                    claimant: "8yLE...4qMn",
                    claimType: "Theft",
                    requestedAmount: 40,
                    evidenceUri: "https://evidence.example.com/claim2",
                    createdAt: new Date().toLocaleDateString(),
                    status: "Pending",
                    yesVotes: 0,
                    noVotes: 0,
                    voters: [],
                },
            ]);
        } catch (error) {
            console.error("Error loading claims:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleVote(claimId: number, voteYes: boolean) {
        if (!publicKey) return;

        try {
            setVoting(true);

            // TODO: Call vote_claim instruction
            // const tx = await program.methods.voteClaim(voteYes)...

            // Simulate vote
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Reload claims
            await loadClaims();

            alert(`Vote ${voteYes ? "YES" : "NO"} submitted!`);
        } catch (error: any) {
            alert("Error voting: " + error.message);
        } finally {
            setVoting(false);
        }
    }

    async function handleFinalize(claimId: number) {
        try {
            setVoting(true);

            // TODO: Call finalize_claim instruction
            // const tx = await program.methods.finalizeClaim()...

            // Simulate finalization
            await new Promise((resolve) => setTimeout(resolve, 2000));

            await loadClaims();

            alert("Claim finalized!");
        } catch (error: any) {
            alert("Error finalizing: " + error.message);
        } finally {
            setVoting(false);
        }
    }

    function hasVoted(claim: Claim): boolean {
        if (!publicKey) return false;
        return claim.voters.includes(publicKey.toBase58());
    }

    if (loading) {
        return (
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Claims Feed</h1>
                </div>
                <div className="card">
                    <p>Loading claims...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Claims Feed</h1>
                <p className="page-subtitle">Vote on member claims</p>
            </div>

            <div className="info-box">
                <div className="info-box-title">Voting Rules</div>
                <ul className="info-list">
                    <li>• Vote window: {POOL_CONFIG.voteWindowHours} hours from submission</li>
                    <li>• Minimum votes required: {POOL_CONFIG.quorum}</li>
                    <li>• Approval threshold: {POOL_CONFIG.approvalRatio}% YES votes</li>
                    <li>• One vote per member per claim</li>
                </ul>
            </div>

            {claims.length === 0 ? (
                <div className="card">
                    <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        No claims submitted yet
                    </p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Claimant</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Votes</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map((claim) => (
                                <tr key={claim.id}>
                                    <td>#{claim.id}</td>
                                    <td>{claim.claimant}</td>
                                    <td>{claim.claimType}</td>
                                    <td>{claim.requestedAmount.toLocaleString()} USDC</td>
                                    <td>
                                        <span style={{ color: "var(--success)" }}>{claim.yesVotes} YES</span>
                                        {" / "}
                                        <span style={{ color: "var(--error)" }}>{claim.noVotes} NO</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${claim.status.toLowerCase()}`}>
                                            {claim.status}
                                        </span>
                                    </td>
                                    <td>{claim.createdAt}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}
                                                onClick={() => setSelectedClaim(claim)}
                                            >
                                                View
                                            </button>

                                            {connected && claim.status === "Pending" && !hasVoted(claim) && (
                                                <>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem", background: "var(--success)" }}
                                                        onClick={() => handleVote(claim.id, true)}
                                                        disabled={voting}
                                                    >
                                                        YES
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem", background: "var(--error)" }}
                                                        onClick={() => handleVote(claim.id, false)}
                                                        disabled={voting}
                                                    >
                                                        NO
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Claim Details Modal */}
            {selectedClaim && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: "2rem",
                    }}
                    onClick={() => setSelectedClaim(null)}
                >
                    <div
                        className="card"
                        style={{ maxWidth: "600px", width: "100%", margin: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="card-title">
                            Claim #{selectedClaim.id} Details
                            <button
                                onClick={() => setSelectedClaim(null)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-secondary)",
                                    cursor: "pointer",
                                    fontSize: "1.5rem",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <strong>Claimant:</strong>
                            <br />
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                                {selectedClaim.claimant}
                            </span>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <strong>Type:</strong> {selectedClaim.claimType}
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <strong>Requested Amount:</strong> {selectedClaim.requestedAmount.toLocaleString()} USDC
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <strong>Status:</strong>{" "}
                            <span className={`status-badge status-${selectedClaim.status.toLowerCase()}`}>
                                {selectedClaim.status}
                            </span>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <strong>Votes:</strong> {selectedClaim.yesVotes} YES / {selectedClaim.noVotes} NO
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <strong>Evidence:</strong>
                            <br />
                            <a
                                href={selectedClaim.evidenceUri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link"
                            >
                                {selectedClaim.evidenceUri}
                            </a>
                        </div>

                        <div>
                            <strong>Created:</strong> {selectedClaim.createdAt}
                        </div>

                        {selectedClaim.status === "Pending" && connected && (
                            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
                                {!hasVoted(selectedClaim) ? (
                                    <div style={{ display: "flex", gap: "1rem" }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ flex: 1, background: "var(--success)" }}
                                            onClick={() => {
                                                handleVote(selectedClaim.id, true);
                                                setSelectedClaim(null);
                                            }}
                                            disabled={voting}
                                        >
                                            Vote YES
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ flex: 1, background: "var(--error)" }}
                                            onClick={() => {
                                                handleVote(selectedClaim.id, false);
                                                setSelectedClaim(null);
                                            }}
                                            disabled={voting}
                                        >
                                            Vote NO
                                        </button>
                                    </div>
                                ) : (
                                    <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>
                                        You have already voted on this claim
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
