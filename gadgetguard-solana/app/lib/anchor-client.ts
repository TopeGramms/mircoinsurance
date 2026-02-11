import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { RPC_URL, PROGRAM_ID } from "./config";

// You'll need to copy the IDL from target/idl/gadgetguard.json after building
// For now, we'll use a minimal type definition
export interface GadgetGuardProgram {
    pool: any;
    member: any;
    claim: any;
}

let program: Program | null = null;

export function getProgram(provider?: AnchorProvider): Program {
    if (program && !provider) {
        return program;
    }

    // This will be populated after building the program
    // Users need to copy IDL from target/idl/gadgetguard.json
    const idl: Idl = {
        version: "0.1.0",
        name: "gadgetguard",
        instructions: [],
        accounts: [],
    };

    const programInstance = new Program(
        idl,
        PROGRAM_ID,
        provider
    );

    if (!provider) {
        program = programInstance;
    }

    return programInstance;
}

export function derivePoolPda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool")],
        PROGRAM_ID
    );
    return pda;
}

export function derivePoolAuthorityPda(poolPda: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_authority"), poolPda.toBuffer()],
        PROGRAM_ID
    );
    return pda;
}

export function deriveMemberPda(poolPda: PublicKey, memberKey: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("member"), poolPda.toBuffer(), memberKey.toBuffer()],
        PROGRAM_ID
    );
    return pda;
}

export function deriveClaimPda(poolPda: PublicKey, claimId: number): PublicKey {
    const claimIdBuffer = Buffer.alloc(8);
    claimIdBuffer.writeBigUInt64LE(BigInt(claimId));

    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("claim"), poolPda.toBuffer(), claimIdBuffer],
        PROGRAM_ID
    );
    return pda;
}

export async function getConnection(): Promise<Connection> {
    return new Connection(RPC_URL, "confirmed");
}
