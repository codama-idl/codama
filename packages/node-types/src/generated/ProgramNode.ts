import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { Version } from '../Version';
import type { AccountNode } from './AccountNode';
import type { ConstantNode } from './ConstantNode';
import type { DefinedTypeNode } from './DefinedTypeNode';
import type { ErrorNode } from './ErrorNode';
import type { EventNode } from './EventNode';
import type { InstructionNode } from './InstructionNode';
import type { PdaNode } from './PdaNode';
import type { ProgramOrigin } from './shared/programOrigin';

/** A Solana program: its identity, version, accounts, instructions, defined types, PDAs, events, errors, and constants. */
export interface ProgramNode<
    TPdas extends Array<PdaNode> | undefined = Array<PdaNode> | undefined,
    TAccounts extends Array<AccountNode> | undefined = Array<AccountNode> | undefined,
    TInstructions extends Array<InstructionNode> | undefined = Array<InstructionNode> | undefined,
    TDefinedTypes extends Array<DefinedTypeNode> | undefined = Array<DefinedTypeNode> | undefined,
    TErrors extends Array<ErrorNode> | undefined = Array<ErrorNode> | undefined,
    TEvents extends Array<EventNode> | undefined = Array<EventNode> | undefined,
    TConstants extends Array<ConstantNode> | undefined = Array<ConstantNode> | undefined,
> {
    readonly kind: 'programNode';

    // Data.
    /** The name of the program. */
    readonly name: CamelCaseString;
    /** The base58-encoded program ID. */
    readonly publicKey: string;
    /** The version of the program, in semver form. */
    readonly version: Version;
    /** The toolchain that originally generated the program description, if known. */
    readonly origin?: ProgramOrigin;
    /** Markdown documentation for the program. */
    readonly docs?: Docs;

    // Children.
    /** The accounts owned by the program. */
    readonly accounts?: TAccounts;
    /** The instructions exposed by the program. */
    readonly instructions?: TInstructions;
    /** The reusable types defined by the program. */
    readonly definedTypes?: TDefinedTypes;
    /** The PDAs derived by the program. */
    readonly pdas?: TPdas;
    /** The events emitted by the program. */
    readonly events?: TEvents;
    /** The errors returned by the program. */
    readonly errors?: TErrors;
    /** The constants exposed by the program. */
    readonly constants?: TConstants;
}
