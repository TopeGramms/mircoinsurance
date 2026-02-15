import { useCallback, useEffect, useMemo, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  BN,
  TOKEN_PROGRAM_ID,
  SystemProgram,
  claimStatusLabel,
  deriveClaimPda,
  deriveMemberPda,
  derivePoolAuthorityPda,
  derivePoolPda,
  ensureAta,
  getProgram,
  toClaimVariant,
} from "./lib/solana";
import {
  POOL_ADDRESS,
  TEST_MINT_ADDRESS,
  VOTE_WINDOW_SECS,
  explorerUrl,
  formatTokenAmount,
  parseUiAmount,
} from "./lib/env";

type Tab = "overview" | "actions" | "claims" | "submit";
type TxStage = "idle" | "sending" | "confirmed" | "error";

type ClaimRow = {
  id: bigint;
  claimant: string;
  claimType: string;
  requestedAmount: bigint;
  createdTs: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  yesVotes: number;
  noVotes: number;
  evidenceUri: string;
};

function bnToBigInt(value: BN | bigint | number): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  return BigInt(value.toString());
}

function shorten(key: string): string {
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export default function App() {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  const [tab, setTab] = useState<Tab>("overview");
  const [mintAddress, setMintAddress] = useState<PublicKey | null>(TEST_MINT_ADDRESS);

  const [poolFound, setPoolFound] = useState(false);
  const [tvl, setTvl] = useState<bigint>(0n);
  const [memberCount, setMemberCount] = useState(0);
  const [paidOut, setPaidOut] = useState<bigint>(0n);
  const [claimCount, setClaimCount] = useState(0);
  const [memberDeposit, setMemberDeposit] = useState<bigint>(0n);
  const [memberClaimLimit, setMemberClaimLimit] = useState<bigint>(0n);
  const [claims, setClaims] = useState<ClaimRow[]>([]);

  const [amountUi, setAmountUi] = useState("100");
  const [withdrawUi, setWithdrawUi] = useState("10");
  const [claimAmountUi, setClaimAmountUi] = useState("20");
  const [claimType, setClaimType] = useState<"damage" | "theft" | "loss">("damage");
  const [evidenceUri, setEvidenceUri] = useState("");

  const [txStage, setTxStage] = useState<TxStage>("idle");
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poolAddress = useMemo(() => POOL_ADDRESS || derivePoolPda()[0], []);
  const poolAuthority = useMemo(() => derivePoolAuthorityPda(poolAddress)[0], [poolAddress]);

  useEffect(() => {
    if (mintAddress) return;
    fetch("/mint.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.mint) {
          setMintAddress(new PublicKey(data.mint));
        }
      })
      .catch(() => {
        setMintAddress(null);
      });
  }, [mintAddress]);

  const refresh = useCallback(async () => {
    if (!anchorWallet || !wallet.publicKey) return;
    if (!mintAddress) return;

    const program = getProgram(wallet.wallet, wallet.publicKey);

    const poolAccount = await program.account.pool.fetchNullable(poolAddress);
    if (!poolAccount) {
      setPoolFound(false);
      return;
    }

    setPoolFound(true);
    setTvl(bnToBigInt(poolAccount.totalDeposits));
    setMemberCount(Number(poolAccount.memberCount));
    setPaidOut(bnToBigInt(poolAccount.totalPaidOut));
    const onchainClaimCount = Number(poolAccount.claimCount);
    setClaimCount(onchainClaimCount);

    const [memberPda] = deriveMemberPda(poolAddress, wallet.publicKey);
    const member = await program.account.member.fetchNullable(memberPda);
    setMemberDeposit(member ? bnToBigInt(member.depositedAmount) : 0n);
    setMemberClaimLimit(member ? bnToBigInt(member.claimLimit) : 0n);

    const ids = Array.from({ length: onchainClaimCount }, (_, i) => i)
      .slice(-20)
      .reverse();

    const claimRows = await Promise.all(
      ids.map(async (id) => {
        const [claimPda] = deriveClaimPda(poolAddress, BigInt(id));
        const claim = await program.account.claim.fetchNullable(claimPda);
        if (!claim) return null;

        return {
          id: bnToBigInt(claim.claimId),
          claimant: claim.claimant.toBase58(),
          claimType: Object.keys(claim.claimType)[0]?.toUpperCase() || "DAMAGE",
          requestedAmount: bnToBigInt(claim.requestedAmount),
          createdTs: Number(claim.createdTs),
          status: claimStatusLabel(claim.status),
          yesVotes: Number(claim.yesVotes),
          noVotes: Number(claim.noVotes),
          evidenceUri: claim.evidenceUri,
        } as ClaimRow;
      })
    );

    setClaims(claimRows.filter((c): c is ClaimRow => c !== null));
  }, [anchorWallet, mintAddress, poolAddress, wallet.publicKey, wallet.wallet]);

  useEffect(() => {
    refresh().catch((e) => setError((e as Error).message));
  }, [refresh]);

  const runAction = useCallback(
    async (label: string, fn: () => Promise<string>) => {
      setError(null);
      setTxSig(null);
      setTxStage("sending");
      try {
        const sig = await fn();
        setTxSig(sig);
        setTxStage("confirmed");
        await refresh();
      } catch (e) {
        setTxStage("error");
        setError(`${label} failed: ${(e as Error).message}`);
      }
    },
    [refresh]
  );

  const joinPool = async () => {
    if (!wallet.publicKey || !anchorWallet) throw new Error("Connect wallet first");
    const program = getProgram(wallet.wallet, wallet.publicKey);
    const [memberPda] = deriveMemberPda(poolAddress, wallet.publicKey);

    return program.methods
      .joinPool()
      .accounts({
        member: memberPda,
        pool: poolAddress,
        user: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  };

  const deposit = async () => {
    if (!wallet.publicKey || !anchorWallet || !mintAddress) throw new Error("Connect wallet first");
    const amount = parseUiAmount(amountUi);
    if (amount <= 0n) throw new Error("Deposit amount must be positive");

    const program = getProgram(wallet.wallet, wallet.publicKey);
    const [memberPda] = deriveMemberPda(poolAddress, wallet.publicKey);

    const { ata: memberAta } = await ensureAta(wallet, mintAddress, wallet.publicKey, false);
    const { ata: vaultAta } = await ensureAta(wallet, mintAddress, poolAuthority, true);

    return program.methods
      .deposit(new BN(amount.toString()))
      .accounts({
        member: memberPda,
        pool: poolAddress,
        memberTokenAccount: memberAta,
        poolVault: vaultAta,
        poolAuthority,
        user: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  };

  const withdraw = async () => {
    if (!wallet.publicKey || !anchorWallet || !mintAddress) throw new Error("Connect wallet first");
    const amount = parseUiAmount(withdrawUi);
    if (amount <= 0n) throw new Error("Withdraw amount must be positive");

    const program = getProgram(wallet.wallet, wallet.publicKey);
    const [memberPda] = deriveMemberPda(poolAddress, wallet.publicKey);

    const { ata: memberAta } = await ensureAta(wallet, mintAddress, wallet.publicKey, false);
    const { ata: vaultAta } = await ensureAta(wallet, mintAddress, poolAuthority, true);

    return program.methods
      .withdraw(new BN(amount.toString()))
      .accounts({
        member: memberPda,
        pool: poolAddress,
        memberTokenAccount: memberAta,
        poolVault: vaultAta,
        poolAuthority,
        user: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  };

  const submitClaim = async () => {
    if (!wallet.publicKey || !anchorWallet || !mintAddress) throw new Error("Connect wallet first");
    if (evidenceUri.length === 0 || evidenceUri.length > 200) {
      throw new Error("Evidence URL is required (max 200 chars)");
    }

    const amount = parseUiAmount(claimAmountUi);
    if (amount <= 0n) throw new Error("Claim amount must be positive");
    if (amount > memberClaimLimit) throw new Error("Claim amount exceeds your claim limit");

    const program = getProgram(wallet.wallet, wallet.publicKey);
    const [memberPda] = deriveMemberPda(poolAddress, wallet.publicKey);
    const [claimPda] = deriveClaimPda(poolAddress, BigInt(claimCount));
    const { ata: vaultAta } = await ensureAta(wallet, mintAddress, poolAuthority, true);

    return program.methods
      .submitClaim(toClaimVariant(claimType), new BN(amount.toString()), evidenceUri)
      .accounts({
        claim: claimPda,
        member: memberPda,
        pool: poolAddress,
        poolVault: vaultAta,
        poolAuthority,
        user: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  };

  const voteClaim = async (id: bigint, voteYes: boolean) => {
    if (!wallet.publicKey || !anchorWallet) throw new Error("Connect wallet first");
    const program = getProgram(wallet.wallet, wallet.publicKey);
    const [memberPda] = deriveMemberPda(poolAddress, wallet.publicKey);
    const [claimPda] = deriveClaimPda(poolAddress, id);

    return program.methods
      .voteClaim(voteYes)
      .accounts({
        claim: claimPda,
        member: memberPda,
        pool: poolAddress,
        user: wallet.publicKey,
      })
      .rpc();
  };

  const finalizeClaim = async (claim: ClaimRow) => {
    if (!wallet.publicKey || !anchorWallet || !mintAddress) throw new Error("Connect wallet first");
    const program = getProgram(wallet.wallet, wallet.publicKey);
    const [claimPda] = deriveClaimPda(poolAddress, claim.id);
    const claimant = new PublicKey(claim.claimant);

    const { ata: vaultAta } = await ensureAta(wallet, mintAddress, poolAuthority, true);
    const { ata: claimantAta } = await ensureAta(wallet, mintAddress, claimant, false);

    return program.methods
      .finalizeClaim()
      .accounts({
        claim: claimPda,
        pool: poolAddress,
        poolVault: vaultAta,
        claimantTokenAccount: claimantAta,
        poolAuthority,
        claimant,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  };

  const getTestTokensCommand = wallet.publicKey
    ? `cd scripts && npm install && npm run mint-to -- ${mintAddress?.toBase58() || "<MINT_ADDRESS>"} ${wallet.publicKey.toBase58()} 1000`
    : "Connect wallet to generate command";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>GadgetGuard Devnet Pool</h1>
          <p>Freelancer device protection via pooled governance</p>
        </div>
        <WalletMultiButton />
      </header>

      <section className="meta-row">
        <span>Program: <a href={explorerUrl(poolAddress.toBase58(), "address")} target="_blank" rel="noreferrer">{shorten(poolAddress.toBase58())}</a></span>
        <span>Mint: {mintAddress ? <a href={explorerUrl(mintAddress.toBase58(), "address")} target="_blank" rel="noreferrer">{shorten(mintAddress.toBase58())}</a> : "not set"}</span>
      </section>

      <nav className="tabs">
        {(["overview", "actions", "claims", "submit"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
            {t === "overview" ? "Overview" : t === "actions" ? "Actions" : t === "claims" ? "Claims Feed" : "Submit Claim"}
          </button>
        ))}
      </nav>

      {error && <div className="alert error">{error}</div>}
      {txSig && (
        <div className="alert success">
          Tx {txStage}: <a href={explorerUrl(txSig)} target="_blank" rel="noreferrer">{txSig}</a>
        </div>
      )}

      {tab === "overview" && (
        <section className="panel">
          <div className="stats-grid">
            <article>
              <label>Pool TVL</label>
              <strong>{formatTokenAmount(tvl)}</strong>
            </article>
            <article>
              <label>Members</label>
              <strong>{memberCount}</strong>
            </article>
            <article>
              <label>Total Paid Out</label>
              <strong>{formatTokenAmount(paidOut)}</strong>
            </article>
            <article>
              <label>Claims</label>
              <strong>{claimCount}</strong>
            </article>
          </div>

          <div className="stats-grid compact">
            <article>
              <label>Your Deposit</label>
              <strong>{formatTokenAmount(memberDeposit)}</strong>
            </article>
            <article>
              <label>Your Claim Limit</label>
              <strong>{formatTokenAmount(memberClaimLimit)}</strong>
            </article>
          </div>

          <div className="block">
            <h3>Last 5 claims</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Claimant</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, 5).map((c) => (
                  <tr key={c.id.toString()}>
                    <td>#{c.id.toString()}</td>
                    <td>{shorten(c.claimant)}</td>
                    <td>{formatTokenAmount(c.requestedAmount)}</td>
                    <td><span className={`tag ${c.status.toLowerCase()}`}>{c.status}</span></td>
                  </tr>
                ))}
                {claims.length === 0 && (
                  <tr>
                    <td colSpan={4}>No claims yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "actions" && (
        <section className="panel">
          <div className="block">
            <h3>1. Join Pool</h3>
            <button disabled={!wallet.connected || txStage === "sending" || !poolFound} onClick={() => runAction("Join pool", joinPool)}>
              Join
            </button>
          </div>

          <div className="block">
            <h3>2. Get Test Tokens</h3>
            <p>Run this command in repo root terminal:</p>
            <code>{getTestTokensCommand}</code>
          </div>

          <div className="grid-2">
            <div className="block">
              <h3>3. Deposit</h3>
              <p>Flow: ensure user ATA, ensure vault ATA, on-chain transfer + deposit accounting.</p>
              <input value={amountUi} onChange={(e) => setAmountUi(e.target.value)} placeholder="Amount" />
              <button disabled={!wallet.connected || txStage === "sending" || !mintAddress} onClick={() => runAction("Deposit", deposit)}>
                Deposit
              </button>
            </div>
            <div className="block">
              <h3>4. Withdraw</h3>
              <input value={withdrawUi} onChange={(e) => setWithdrawUi(e.target.value)} placeholder="Amount" />
              <button disabled={!wallet.connected || txStage === "sending" || !mintAddress} onClick={() => runAction("Withdraw", withdraw)}>
                Withdraw
              </button>
            </div>
          </div>
        </section>
      )}

      {tab === "claims" && (
        <section className="panel">
          <div className="block">
            <h3>Claims Feed</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Votes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => {
                  const voteWindowOpen = Date.now() / 1000 < c.createdTs + VOTE_WINDOW_SECS;
                  return (
                    <tr key={c.id.toString()}>
                      <td>#{c.id.toString()}</td>
                      <td>{c.claimType}</td>
                      <td>{formatTokenAmount(c.requestedAmount)}</td>
                      <td>{c.yesVotes}/{c.noVotes}</td>
                      <td><span className={`tag ${c.status.toLowerCase()}`}>{c.status}</span></td>
                      <td className="actions">
                        <button disabled={!wallet.connected || txStage === "sending" || c.status !== "PENDING"} onClick={() => runAction("Vote yes", () => voteClaim(c.id, true))}>Yes</button>
                        <button disabled={!wallet.connected || txStage === "sending" || c.status !== "PENDING"} onClick={() => runAction("Vote no", () => voteClaim(c.id, false))}>No</button>
                        <button disabled={!wallet.connected || txStage === "sending" || c.status !== "PENDING" || voteWindowOpen} onClick={() => runAction("Finalize", () => finalizeClaim(c))}>Finalize</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "submit" && (
        <section className="panel">
          <div className="block form">
            <h3>Submit Claim</h3>
            <label>Claim Type</label>
            <select value={claimType} onChange={(e) => setClaimType(e.target.value as "damage" | "theft" | "loss")}>
              <option value="damage">Damage</option>
              <option value="theft">Theft</option>
              <option value="loss">Loss</option>
            </select>

            <label>Requested Amount</label>
            <input value={claimAmountUi} onChange={(e) => setClaimAmountUi(e.target.value)} />
            <small>Current limit: {formatTokenAmount(memberClaimLimit)}</small>

            <label>Evidence URL</label>
            <input value={evidenceUri} onChange={(e) => setEvidenceUri(e.target.value)} placeholder="https://..." />

            <button disabled={!wallet.connected || txStage === "sending" || !mintAddress} onClick={() => runAction("Submit claim", submitClaim)}>
              Submit Claim
            </button>
          </div>
        </section>
      )}

      {!poolFound && (
        <div className="alert error">
          Pool account not found at {poolAddress.toBase58()}. Initialize the pool first.
        </div>
      )}
    </div>
  );
}
