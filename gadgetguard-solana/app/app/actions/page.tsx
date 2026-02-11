"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSearchParams } from "next/navigation";
import { getExplorerUrl } from "@/lib/config";

type Tab = "deposit" | "withdraw";

export default function ActionsPage() {
    const { publicKey, connected } = useWallet();
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get("tab") as Tab) || "deposit";

    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [amount, setAmount] = useState("");
    const [txStatus, setTxStatus] = useState<{
        status: "idle" | "signing" | "sent" | "confirmed" | "error";
        signature?: string;
        error?: string;
    }>({ status: "idle" });

    async function handleDeposit() {
        if (!publicKey || !amount) return;

        try {
            setTxStatus({ status: "signing" });

            // TODO: Call deposit instruction using Anchor
            // const tx = await program.methods.deposit(...)

            // Simulate transaction
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const mockSignature = "mock_signature_" + Date.now();
            setTxStatus({ status: "sent", signature: mockSignature });

            // Simulate confirmation
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setTxStatus({ status: "confirmed", signature: mockSignature });

            setAmount("");
        } catch (error: any) {
            setTxStatus({ status: "error", error: error.message });
        }
    }

    async function handleWithdraw() {
        if (!publicKey || !amount) return;

        try {
            setTxStatus({ status: "signing" });

            // TODO: Call withdraw instruction using Anchor
            // const tx = await program.methods.withdraw(...)

            // Simulate transaction
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const mockSignature = "mock_signature_" + Date.now();
            setTxStatus({ status: "sent", signature: mockSignature });

            await new Promise((resolve) => setTimeout(resolve, 2000));
            setTxStatus({ status: "confirmed", signature: mockSignature });

            setAmount("");
        } catch (error: any) {
            setTxStatus({ status: "error", error: error.message });
        }
    }

    function resetTxStatus() {
        setTxStatus({ status: "idle" });
    }

    if (!connected) {
        return (
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Deposit & Withdraw</h1>
                </div>
                <div className="card">
                    <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        Please connect your wallet to continue
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Deposit & Withdraw</h1>
                <p className="page-subtitle">Manage your pool balance</p>
            </div>

            <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === "deposit" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("deposit");
                            resetTxStatus();
                        }}
                    >
                        Deposit
                    </button>
                    <button
                        className={`tab ${activeTab === "withdraw" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("withdraw");
                            resetTxStatus();
                        }}
                    >
                        Withdraw
                    </button>
                </div>

                {/* Deposit Tab */}
                {activeTab === "deposit" && (
                    <div>
                        <div className="info-box">
                            <div className="info-box-title">Deposit Info</div>
                            <ul className="info-list">
                                <li>• Deposits increase your claim limit by 50%</li>
                                <li>• Tokens are held in pool vault (PDA-controlled)</li>
                                <li>• You'll need USDC tokens and SOL for gas</li>
                            </ul>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Amount (USDC)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={txStatus.status !== "idle"}
                            />
                            <p className="form-hint">
                                Your claim limit will increase by {amount ? (parseFloat(amount) * 0.5).toFixed(2) : "0"} USDC
                            </p>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: "100%" }}
                            onClick={handleDeposit}
                            disabled={!amount || parseFloat(amount) <= 0 || txStatus.status !== "idle"}
                        >
                            {txStatus.status === "signing" && "Awaiting signature..."}
                            {txStatus.status === "sent" && "Transaction sent..."}
                            {txStatus.status === "confirmed" && "Confirmed!"}
                            {txStatus.status === "idle" && "Deposit"}
                        </button>
                    </div>
                )}

                {/* Withdraw Tab */}
                {activeTab === "withdraw" && (
                    <div>
                        <div className="info-box">
                            <div className="info-box-title">Withdraw Info</div>
                            <ul className="info-list">
                                <li>• Withdrawing reduces your claim limit</li>
                                <li>• Cannot withdraw with pending claims (MVP rule)</li>
                                <li>• Tokens returned to your wallet</li>
                            </ul>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Amount (USDC)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={txStatus.status !== "idle"}
                            />
                            <p className="form-hint">
                                Your claim limit will decrease by {amount ? (parseFloat(amount) * 0.5).toFixed(2) : "0"} USDC
                            </p>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: "100%" }}
                            onClick={handleWithdraw}
                            disabled={!amount || parseFloat(amount) <= 0 || txStatus.status !== "idle"}
                        >
                            {txStatus.status === "signing" && "Awaiting signature..."}
                            {txStatus.status === "sent" && "Transaction sent..."}
                            {txStatus.status === "confirmed" && "Confirmed!"}
                            {txStatus.status === "idle" && "Withdraw"}
                        </button>
                    </div>
                )}

                {/* Transaction Status */}
                {txStatus.signature && (
                    <div className="tx-status">
                        <div className="tx-status-title">
                            {txStatus.status === "sent" && "📡 Transaction Sent"}
                            {txStatus.status === "confirmed" && "✅ Transaction Confirmed"}
                        </div>
                        <a
                            href={getExplorerUrl(txStatus.signature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tx-link"
                        >
                            View on Solana Explorer →
                        </a>
                    </div>
                )}

                {txStatus.error && (
                    <div className="tx-status" style={{ borderColor: "var(--error)" }}>
                        <div className="tx-status-title" style={{ color: "var(--error)" }}>
                            ❌ Transaction Failed
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                            {txStatus.error}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
