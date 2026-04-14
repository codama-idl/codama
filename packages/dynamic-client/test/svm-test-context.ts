import {
    type Address,
    address,
    appendTransactionMessageInstructions,
    compileTransaction,
    createAddressWithSeed,
    createTransactionMessage,
    generateKeyPairSigner,
    type Instruction,
    type KeyPairSigner,
    lamports,
    pipe,
    setTransactionMessageFeePayerSigner,
    signTransactionWithSigners,
} from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS as TOKEN_PROGRAM_ADDR } from '@solana-program/token';
import {
    ASSOCIATED_TOKEN_PROGRAM_ADDRESS as ASSOCIATED_TOKEN_PROGRAM_ADDR,
    TOKEN_2022_PROGRAM_ADDRESS as T2022_PROGRAM_ADDR,
} from '@solana-program/token-2022';
import { FailedTransactionMetadata, LiteSVM, type TransactionMetadata } from 'litesvm';

/**
 * Encoded account data returned from SVM.
 */
export type EncodedAccount = {
    readonly data: Uint8Array;
    readonly executable: boolean;
    readonly lamports: bigint;
    readonly owner: Address;
    readonly rentEpoch?: bigint;
};

/**
 * Configuration options for the SVM test context.
 */
export type SvmTestContextConfig = {
    /** Include standard builtins */
    readonly builtins?: boolean;
    /** Include standard SPL programs (Token, Token-2022, ATA, etc.). Default: false. */
    readonly defaultPrograms?: boolean;
    /** Include standard precompiles (ed25519, secp256k1). Default: false. */
    readonly precompiles?: boolean;
    /** Include standard sysvars (clock, rent, etc.). Default: false. */
    readonly sysvars?: boolean;
};

/**
 * Test context that encapsulates LiteSVM and provides a clean Solana Kit API.
 *
 * Purpose:
 * -  Hides LiteSVM implementation details and exposes Solana Kit types (Address, Instruction)
 * - Manages account lifecycle and signing internally
 * - Provides declarative test helpers (fundAccount, sendInstruction)
 *
 * Tests work exclusively with Address types while the context handles
 * keypair management and transaction building behind the scenes.
 * Use the config parameter to include additional programs.
 */
export class SvmTestContext {
    private readonly svm: LiteSVM;
    private readonly accounts: Map<Address, KeyPairSigner>;
    private currentSlot: bigint;

    readonly TOKEN_2022_PROGRAM_ADDRESS: Address = T2022_PROGRAM_ADDR;
    readonly TOKEN_PROGRAM_ADDRESS: Address = TOKEN_PROGRAM_ADDR;
    readonly ASSOCIATED_TOKEN_PROGRAM_ADDRESS: Address = ASSOCIATED_TOKEN_PROGRAM_ADDR;
    readonly SYSTEM_PROGRAM_ADDRESS = address('11111111111111111111111111111111');
    readonly SYSVAR_RENT_ADDRESS = address('SysvarRent111111111111111111111111111111111');
    readonly SYSVAR_INSTRUCTIONS_ADDRESS = address('Sysvar1nstructions1111111111111111111111111');
    readonly BPF_LOADER_UPGRADEABLE = address('BPFLoaderUpgradeab1e11111111111111111111111');
    readonly TOKEN_2022_NATIVE_MINT = address('9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP');

    constructor(config: SvmTestContextConfig = {}) {
        let svm = new LiteSVM();
        if (config.defaultPrograms) {
            svm = svm.withDefaultPrograms();
        }
        if (config.precompiles) {
            svm = svm.withPrecompiles();
        }
        if (config.sysvars) {
            svm = svm.withSysvars();
        }
        if (config.builtins) {
            svm = svm.withBuiltins();
        }
        this.svm = svm;
        this.accounts = new Map();
        this.currentSlot = BigInt(0);
    }

    /** Creates a new keypair signer */
    static generateKeypair(): Promise<KeyPairSigner> {
        return generateKeyPairSigner();
    }

    /** Generates a new Address */
    static async generateAddress(): Promise<Address> {
        const signer = await SvmTestContext.generateKeypair();
        return signer.address;
    }

    /** Creates a new keypair, stores it in the context, and returns its address. */
    async createAccount(): Promise<Address> {
        const signer = await generateKeyPairSigner();
        this.accounts.set(signer.address, signer);
        return signer.address;
    }

    /** Creates an account and airdrops the given lamports to it. */
    async createFundedAccount(amount: bigint = BigInt(10e9)): Promise<Address> {
        const addr = await this.createAccount();
        this.svm.airdrop(addr, lamports(amount));
        return addr;
    }

    /** Derives an address from base + seed + programId (createWithSeed). Does not store a keypair. */
    async createAccountWithSeed(base: Address, seed: string, programId: Address): Promise<Address> {
        return await createAddressWithSeed({ baseAddress: base, programAddress: programId, seed });
    }

    /** Airdrops lamports to an account. Account must have been created via this context. */
    airdrop(account: Address, amount: bigint = BigInt(1e9)): void {
        this.svm.airdrop(account, lamports(amount));
    }

    /** Airdrops lamports to any address on-chain (e.g. PDAs without stored keypairs). */
    airdropToAddress(account: Address, amount: bigint = BigInt(1e9)): void {
        this.svm.airdrop(account, lamports(amount));
    }

    /**
     * Sets account data directly on any address.
     * @param account - The account address to set
     * @param accountData - The account data including lamports, data, owner, executable
     */
    setAccount(
        account: Address,
        accountData: {
            readonly data: Uint8Array;
            readonly executable?: boolean;
            readonly lamports: bigint;
            readonly owner: Address;
        },
    ): void {
        this.svm.setAccount({
            address: account,
            data: accountData.data,
            executable: accountData.executable ?? false,
            lamports: lamports(accountData.lamports),
            programAddress: accountData.owner,
            space: BigInt(accountData.data.length),
        });
    }

    /** Returns the account's lamport balance, or null if the account is unknown to the SVM. */
    getBalance(account: Address): bigint | null {
        const balance = this.svm.getBalance(account);
        return balance !== null ? BigInt(balance) : null;
    }

    /** Same as getBalance but returns 0n when the account is missing. */
    getBalanceOrZero(account: Address): bigint {
        return this.getBalance(account) ?? BigInt(0);
    }

    /** Fetches full account data (lamports, owner, data, executable). Returns null if not found. */
    fetchEncodedAccount(account: Address): EncodedAccount | null {
        const accountInfo = this.svm.getAccount(account);

        if (!accountInfo.exists) {
            return null;
        }

        return {
            data: new Uint8Array(accountInfo.data),
            executable: accountInfo.executable,
            lamports: BigInt(accountInfo.lamports),
            owner: accountInfo.programAddress,
        };
    }

    /** Like fetchEncodedAccount but throws if the account does not exist. */
    requireEncodedAccount(account: Address): EncodedAccount {
        const encodedAccount = this.fetchEncodedAccount(account);
        if (!encodedAccount) {
            throw new Error(`Account ${account} does not exist`);
        }
        return encodedAccount;
    }

    /** Builds, signs, and sends a transaction with a single instruction. Signers must be context-owned. */
    async sendInstruction(instruction: Instruction, signers: Address[]): Promise<TransactionMetadata> {
        return await this.buildAndSend([instruction], signers);
    }

    /** Builds, signs, and sends a transaction with multiple instructions. Signers must be context-owned. */
    async sendInstructions(instructions: Instruction[], signers: Address[]): Promise<TransactionMetadata> {
        return await this.buildAndSend(instructions, signers);
    }

    /** Warps the SVM to the specified slot. */
    warpToSlot(slot: bigint): void {
        this.currentSlot = slot;
        this.svm.warpToSlot(slot);
    }

    /** Advances the SVM by the specified number of slots (default: 1). */
    advanceSlots(count: bigint = BigInt(1)): void {
        this.currentSlot += count;
        this.svm.warpToSlot(this.currentSlot);
        this.svm.expireBlockhash();
    }

    /** Loads a Solana program from a .so file. */
    loadProgram(programAddress: Address, programPath: string): void {
        this.svm.addProgramFromFile(programAddress, programPath);
    }

    /** Calculates the minimum balance required to make an account with the given data length rent-exempt. */
    getMinimumBalanceForRentExemption(dataLen: bigint): bigint {
        return this.svm.minimumBalanceForRentExemption(dataLen);
    }

    /** Returns the underlying LiteSVM instance for direct use when needed. Consider using the public methods instead. */
    getSvm(): LiteSVM {
        return this.svm;
    }

    private async buildAndSend(instructions: Instruction[], signers: Address[]): Promise<TransactionMetadata> {
        if (signers.length === 0) {
            throw new Error('At least one signer is required');
        }

        const keypairSigners = signers.map(addr => {
            const signer = this.accounts.get(addr);
            if (!signer) {
                throw new Error(`Signer ${addr} not found in context`);
            }
            return signer;
        });

        const tx = pipe(
            createTransactionMessage({ version: 0 }),
            message => setTransactionMessageFeePayerSigner(keypairSigners[0], message),
            message => this.svm.setTransactionMessageLifetimeUsingLatestBlockhash(message),
            message => appendTransactionMessageInstructions(instructions, message),
            message => compileTransaction(message),
        );
        const signedTx = await signTransactionWithSigners(keypairSigners, tx);

        const result = this.svm.sendTransaction(signedTx);

        if (result instanceof FailedTransactionMetadata) {
            console.error('Transaction failed, logs:\n', result.meta().prettyLogs());
            throw new Error(`Transaction failed: ${result.toString()}`);
        }

        return result;
    }
}
