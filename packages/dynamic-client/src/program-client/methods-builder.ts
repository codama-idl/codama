import type { AccountsInput, DataInput, EitherSigners } from '@codama/dynamic-instructions';
import { createInstructionsBuilder } from '@codama/dynamic-instructions';
import type { Instruction } from '@solana/instructions';
import type { InstructionNode, NodePath } from 'codama';

/**
 * Fluent builder for a single instruction of a program client, created by
 * `client.methods.<instruction>(data)`.
 */
export class MethodsBuilder {
    private _accounts?: AccountsInput;
    // The accounts of `isSigner: 'either'` slots that must sign.
    private _signers?: EitherSigners;

    constructor(
        private readonly path: NodePath<InstructionNode>,
        private readonly data?: DataInput,
    ) {}

    /** Provide the instruction accounts, including remaining accounts as address lists under their identifier. */
    accounts(accounts: AccountsInput) {
        this._accounts = accounts;
        return this;
    }

    /**
     * Name the accounts with an ambiguous `isSigner: 'either'` that must sign.
     * Other signers are resolved from the IDL.
     */
    signers(signers: EitherSigners) {
        this._signers = signers;
        return this;
    }

    async instruction(): Promise<Instruction> {
        const build = createInstructionsBuilder(this.path);
        return await build({ accounts: this._accounts, data: this.data, signers: this._signers });
    }
}
