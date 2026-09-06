/**
 * Contract call helpers for the Stellar Stream Hive Soroban contracts.
 *
 * Contract IDs are read from environment variables — they are NOT hardcoded,
 * because the contracts repo (stellar-stream-hive-contract) deploys
 * independently. Until NEXT_PUBLIC_STREAM_CONTRACT_ID /
 * NEXT_PUBLIC_VAULT_CONTRACT_ID / NEXT_PUBLIC_REGISTRY_CONTRACT_ID are set,
 * every function here throws a ContractNotConfiguredError so the UI can show
 * a clear "not yet configured" state instead of a confusing RPC failure.
 *
 * See DEPLOYMENTS.md in https://github.com/Stellar-Hive/stellar-stream-hive-contract
 * for the addresses once they exist.
 */
import {
  Contract,
  TransactionBuilder,
  Address,
  Account,
  Keypair,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
  rpc as SorobanRpc,
} from "@stellar/stellar-sdk";
import { fetchLatestLedgerSnapshot, getSorobanServer, NETWORK_PASSPHRASE } from "./stellar";
import { signWithFreighter } from "./freighter";
import { ledgerToEstimatedDate } from "./streaming";
import type { Stream, StreamStatus, TokenInfo } from "@/types";

export class ContractNotConfiguredError extends Error {
  constructor(public readonly contractName: string) {
    super(
      `${contractName} contract ID is not configured. Set the corresponding NEXT_PUBLIC_*_CONTRACT_ID ` +
        `environment variable once the contract is deployed (see DEPLOYMENTS.md in the ` +
        `stellar-stream-hive-contract repo).`
    );
    this.name = "ContractNotConfiguredError";
  }
}

export function getStreamContractId(): string {
  const id = process.env.NEXT_PUBLIC_STREAM_CONTRACT_ID;
  if (!id) throw new ContractNotConfiguredError("Stream");
  return id;
}

export function getVaultContractId(): string {
  const id = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID;
  if (!id) throw new ContractNotConfiguredError("Vault");
  return id;
}

export function getRegistryContractId(): string {
  const id = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ID;
  if (!id) throw new ContractNotConfiguredError("Registry");
  return id;
}

export function isStreamContractConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_STREAM_CONTRACT_ID;
}

export function isRegistryContractConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ID;
}

/**
 * Builds, simulates, prepares, signs (via Freighter) and submits a contract
 * invocation, polling for the transaction result. Shared by every write
 * operation below so error handling is consistent.
 */
async function invokeContract(
  contractId: string,
  method: string,
  args: ReturnType<typeof nativeToScVal>[],
  sourcePublicKey: string
): Promise<{ hash: string; returnValue: unknown }> {
  const server = getSorobanServer();
  const contract = new Contract(contractId);
  const account = await server.getAccount(sourcePublicKey);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(tx);

  const signedXdr = await signWithFreighter(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: sourcePublicKey,
  });

  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  const hash = sendResult.hash;
  const result = await pollTransaction(server, hash);
  return { hash, returnValue: result };
}

async function pollTransaction(
  server: SorobanRpc.Server,
  hash: string,
  timeoutMs: number = 30_000
): Promise<unknown> {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await server.getTransaction(hash);
    if (response.status === "SUCCESS") {
      return response.returnValue ? scValToNative(response.returnValue) : null;
    }
    if (response.status === "FAILED") {
      throw new Error("Transaction failed on-chain. See Stellar Expert for details.");
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for transaction confirmation.");
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

/**
 * Builds a throwaway source account for read-only simulation calls. Soroban
 * RPC's simulateTransaction does not require the source account to exist or
 * be funded, but it does require a syntactically valid, checksummed address —
 * so we mint a fresh random keypair rather than fabricating a string.
 */
function dummySimulationAccount(): Account {
  return new Account(Keypair.random().publicKey(), "0");
}

/** Reads a stream's on-chain state without requiring a signed transaction (simulation only). */
export async function fetchStreamOnChain(streamId: string): Promise<Stream | null> {
  const contractId = getStreamContractId();
  const server = getSorobanServer();
  const contract = new Contract(contractId);
  const account = dummySimulationAccount();

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_stream", nativeToScVal(streamId, { type: "u64" })))
    .setTimeout(30)
    .build();

  const [sim, ledgerSnapshot] = await Promise.all([
    server.simulateTransaction(tx),
    fetchLatestLedgerSnapshot().catch(() => null),
  ]);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  if (!sim.result?.retval) return null;

  const raw = scValToNative(sim.result.retval) as RawStreamRecord;
  return mapRawStream(streamId, raw, ledgerSnapshot?.ledger, ledgerSnapshot ?? undefined);
}

/** Raw shape returned by the stream contract's get_stream, prior to app-level mapping. */
interface RawStreamRecord {
  sender: string;
  recipient: string;
  token: string;
  amount: bigint | string;
  withdrawn: bigint | string;
  start_ledger: number;
  end_ledger: number;
  cliff_ledger?: number;
  cancellable: boolean;
  cancelled?: boolean;
}

function mapRawStream(
  id: string,
  raw: RawStreamRecord,
  currentLedger?: number,
  ledgerReference?: { ledger: number; timestampMs: number }
): Stream {
  const totalAmount = BigInt(raw.amount).toString();
  const withdrawnAmount = BigInt(raw.withdrawn).toString();
  const status = deriveStatus(raw, currentLedger);

  // Ledger numbers are the on-chain source of truth; wall-clock times are only
  // ever an estimate (derived from a single ledger/timestamp reference point)
  // used for display, e.g. in StreamTimeline's start/end labels.
  const toTime = (ledger: number) =>
    ledgerReference ? ledgerToEstimatedDate(ledger, ledgerReference).getTime() : 0;

  return {
    id,
    sender: raw.sender,
    recipient: raw.recipient,
    token: inferTokenInfo(raw.token),
    totalAmount,
    withdrawnAmount,
    startLedger: raw.start_ledger,
    endLedger: raw.end_ledger,
    cliffLedger: raw.cliff_ledger,
    startTime: toTime(raw.start_ledger),
    endTime: toTime(raw.end_ledger),
    cliffTime: raw.cliff_ledger !== undefined ? toTime(raw.cliff_ledger) : undefined,
    cancellable: raw.cancellable,
    status,
  };
}

function deriveStatus(raw: RawStreamRecord, currentLedger?: number): StreamStatus {
  if (raw.cancelled) return "cancelled";
  if (currentLedger === undefined) return "active";
  if (currentLedger < raw.start_ledger) return "scheduled";
  if (raw.cliff_ledger && currentLedger < raw.cliff_ledger) return "cliff";
  if (currentLedger >= raw.end_ledger) return "completed";
  return "active";
}

function inferTokenInfo(contractId: string): TokenInfo {
  // The registry/token metadata endpoint fills in richer info where available;
  // this is a safe fallback so the UI never crashes on an unrecognized token.
  return { contractId, symbol: "TOKEN", decimals: 7 };
}

/**
 * Approves the Stream contract to transfer up to `amount` of `tokenContractId`
 * on behalf of `owner`, via the standard SAC `approve(from, spender, amount,
 * expiration_ledger)` call. Required before create_stream can pull funds
 * into the stream. `expirationLedger` should be comfortably beyond the
 * stream's end ledger.
 */
export async function approveTokenOnChain(params: {
  tokenContractId: string;
  owner: string;
  amount: bigint;
  expirationLedger: number;
}): Promise<{ hash: string }> {
  const streamContractId = getStreamContractId();
  const args = [
    new Address(params.owner).toScVal(),
    new Address(streamContractId).toScVal(),
    nativeToScVal(params.amount, { type: "i128" }),
    nativeToScVal(params.expirationLedger, { type: "u32" }),
  ];
  const { hash } = await invokeContract(params.tokenContractId, "approve", args, params.owner);
  return { hash };
}

/** Calls create_stream on the Stream contract. Returns the new stream's id and tx hash. */
export async function createStreamOnChain(params: {
  sender: string;
  recipient: string;
  tokenContractId: string;
  totalAmount: bigint;
  startLedger: number;
  endLedger: number;
  cliffLedger?: number;
  cancellable: boolean;
}): Promise<{ streamId: string; hash: string }> {
  const contractId = getStreamContractId();

  const args = [
    new Address(params.sender).toScVal(),
    new Address(params.recipient).toScVal(),
    new Address(params.tokenContractId).toScVal(),
    nativeToScVal(params.totalAmount, { type: "i128" }),
    nativeToScVal(params.startLedger, { type: "u32" }),
    nativeToScVal(params.endLedger, { type: "u32" }),
    nativeToScVal(params.cliffLedger ?? params.startLedger, { type: "u32" }),
    nativeToScVal(params.cancellable, { type: "bool" }),
  ];

  const { hash, returnValue } = await invokeContract(contractId, "create_stream", args, params.sender);
  const streamId = typeof returnValue === "bigint" ? returnValue.toString() : String(returnValue);
  return { streamId, hash };
}

/** Calls withdraw on the Stream contract for the given stream and amount (base units). */
export async function withdrawOnChain(params: {
  streamId: string;
  recipient: string;
  amount: bigint;
}): Promise<{ hash: string }> {
  const contractId = getStreamContractId();
  const args = [
    nativeToScVal(BigInt(params.streamId), { type: "u64" }),
    new Address(params.recipient).toScVal(),
    nativeToScVal(params.amount, { type: "i128" }),
  ];
  const { hash } = await invokeContract(contractId, "withdraw", args, params.recipient);
  return { hash };
}

/** Calls cancel on the Stream contract, settling the split between sender and recipient. */
export async function cancelStreamOnChain(params: {
  streamId: string;
  sender: string;
}): Promise<{ hash: string }> {
  const contractId = getStreamContractId();
  const args = [nativeToScVal(BigInt(params.streamId), { type: "u64" }), new Address(params.sender).toScVal()];
  const { hash } = await invokeContract(contractId, "cancel", args, params.sender);
  return { hash };
}

/**
 * Fetches the withdrawable amount directly from the contract (not the
 * client-side estimate) — used to double-check the exact amount immediately
 * before submitting a withdraw transaction.
 */
export async function fetchWithdrawableOnChain(streamId: string): Promise<bigint> {
  const stream = await fetchStreamOnChain(streamId);
  if (!stream) throw new Error("Stream not found on-chain.");

  const contractId = getStreamContractId();
  const server = getSorobanServer();
  const contract = new Contract(contractId);
  const account = dummySimulationAccount();

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("withdrawable", nativeToScVal(BigInt(streamId), { type: "u64" })))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  if (!sim.result?.retval) return 0n;
  return BigInt(scValToNative(sim.result.retval) as bigint | string);
}
