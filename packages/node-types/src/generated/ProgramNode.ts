import type { IdentifierString } from '../brands';
import type { Version } from '../Version';
import type { AccountNode } from './AccountNode';
import type { ConstantNode } from './ConstantNode';
import type { DefinedTypeNode } from './DefinedTypeNode';
import type { ErrorNode } from './ErrorNode';
import type { EventNode } from './EventNode';
import type { InstructionNode } from './InstructionNode';
import type { PdaNode } from './PdaNode';
import type { PluginNode } from './PluginNode';
import type { TextNode } from './TextNode';

/**
 * A Solana program: its identity, version, accounts, instructions, defined types, PDAs, events, errors, and constants.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/37ec38ea-66df-4c08-81c3-822ef4388580)
 */
export interface ProgramNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TPdas extends Array<PdaNode> | undefined = Array<PdaNode> | undefined,
    TAccounts extends Array<AccountNode> | undefined = Array<AccountNode> | undefined,
    TInstructions extends Array<InstructionNode> | undefined = Array<InstructionNode> | undefined,
    TDefinedTypes extends Array<DefinedTypeNode> | undefined = Array<DefinedTypeNode> | undefined,
    TErrors extends Array<ErrorNode> | undefined = Array<ErrorNode> | undefined,
    TEvents extends Array<EventNode> | undefined = Array<EventNode> | undefined,
    TConstants extends Array<ConstantNode> | undefined = Array<ConstantNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'programNode';

    // Data.
    /** The identifier of the program. */
    readonly identifier: IdentifierString;
    /** The base58-encoded program ID. */
    readonly publicKey: string;
    /** The version of the program, in semver form. */
    readonly version: Version;

    // Children.
    /** Markdown documentation for the program. */
    readonly docs?: TDocs;
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
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
