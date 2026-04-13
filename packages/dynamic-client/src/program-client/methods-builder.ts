import type { Instruction } from '@solana/instructions';
import type { InstructionNode, RootNode } from 'codama';

import { createIxBuilder } from '../instruction-encoding/instructions';
import type { AccountsInput, ArgumentsInput, EitherSigners, ResolversInput } from '../shared/types';

export class MethodsBuilder {
    private _accounts?: AccountsInput;
    // "either" signers Account names
    private _signers?: EitherSigners;
    // Custom resolver functions for ResolverValueNode
    private _resolvers?: ResolversInput;

    constructor(
        private readonly root: RootNode,
        private readonly ixNode: InstructionNode,
        private readonly args?: ArgumentsInput,
    ) {}

    accounts(accounts: AccountsInput) {
        this._accounts = accounts;
        return this;
    }

    // Explicitly provide Account names which must be Signers.
    // This is to help InstructionAccountNode resolution with ambiguous isSigner: "either". Other signers will be auto-resolved
    signers(signers: EitherSigners) {
        this._signers = signers;
        return this;
    }

    resolvers(resolvers: ResolversInput) {
        this._resolvers = resolvers;
        return this;
    }

    async instruction(): Promise<Instruction> {
        const build = createIxBuilder(this.root, this.ixNode);
        return await build(this.args, this._accounts, this._signers, this._resolvers);
    }
}
