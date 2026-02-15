/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL: string
  readonly VITE_PROGRAM_ID: string
  readonly VITE_POOL_ADDRESS?: string
  readonly VITE_TEST_MINT_ADDRESS?: string
  readonly VITE_TEST_MINT_DECIMALS?: string
  readonly VITE_VOTE_WINDOW_SECS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
