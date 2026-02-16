# CI Deploy (Devnet)

This repo includes a GitHub Actions workflow that builds and deploys the Anchor program to Devnet without requiring local Solana/Anchor installs.

## Required Secrets

Add the following repository secrets in GitHub:

- `DEPLOYER_KEYPAIR_JSON`: JSON array for the payer wallet (Devnet SOL needed).
- `PROGRAM_KEYPAIR_JSON`: JSON array for the program keypair. This keeps the Program ID stable across deploys.

Where to add them:

1. GitHub repo ? Settings ? Secrets and variables ? Actions.
2. Click `New repository secret` for each name above.
3. Paste the **raw JSON array** (not base64).

Example (format only):

```json
[12,34,56,...]
```

### Creating keypairs

You only need to do this once, on any machine that has the Solana CLI installed:

```bash
solana-keygen new --no-bip39-passphrase -o deployer.json
solana-keygen new --no-bip39-passphrase -o gadgetguard-keypair.json
```

- `deployer.json` ? `DEPLOYER_KEYPAIR_JSON`
- `gadgetguard-keypair.json` ? `PROGRAM_KEYPAIR_JSON`

## Run the Workflow

1. GitHub repo ? Actions ? `solana-devnet-deploy`.
2. Click `Run workflow`.
3. Wait for the job to finish.

The workflow:

- Installs Solana + Anchor on the runner.
- Writes the two keypairs from secrets.
- Syncs the program ID in `gadgetguard-solana/Anchor.toml` and `gadgetguard-solana/programs/gadgetguard/src/lib.rs` to match the program keypair.
- Builds and deploys to Devnet.
- Prints the deployed Program ID.
- Uploads the IDL artifact from `gadgetguard-solana/target/idl/gadgetguard.json`.

## Outputs

In the Actions log you will see:

- `Deployed Program ID: <...>`
- `IDL path: gadgetguard-solana/target/idl/gadgetguard.json`

You can download the IDL artifact from the workflow run summary.
