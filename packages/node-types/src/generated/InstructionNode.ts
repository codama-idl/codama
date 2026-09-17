import type { IdentifierString } from '../brands';
import type { DiscriminatorNode } from './discriminatorNodes/DiscriminatorNode';
import type { InstructionDisplayNode } from './displayNodes/InstructionDisplayNode';
import type { InstructionAccountNode } from './InstructionAccountNode';
import type { InstructionByteDeltaNode } from './InstructionByteDeltaNode';
import type { InstructionRemainingAccountsNode } from './InstructionRemainingAccountsNode';
import type { InstructionStatusNode } from './InstructionStatusNode';
import type { PluginNode } from './PluginNode';
import type { ProvidedNode } from './ProvidedNode';
import type { OptionalAccountStrategy } from './shared/optionalAccountStrategy';
import type { TextNode } from './TextNode';
import type { TypeNode } from './typeNodes/TypeNode';

type SelfInstructionNode = InstructionNode;

/**
 * A program instruction: its accounts, data, byte-delta hints, discriminators, optional status, and optional sub-instructions.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/0d8edced-cfa4-4500-b80c-ebc56181a338)
 */
export interface InstructionNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TAccounts extends Array<InstructionAccountNode> | undefined = Array<InstructionAccountNode> | undefined,
    TData extends TypeNode | undefined = TypeNode | undefined,
    TRemainingAccounts extends Array<InstructionRemainingAccountsNode> | undefined =
        | Array<InstructionRemainingAccountsNode>
        | undefined,
    TByteDeltas extends Array<InstructionByteDeltaNode> | undefined = Array<InstructionByteDeltaNode> | undefined,
    TDiscriminators extends Array<DiscriminatorNode> | undefined = Array<DiscriminatorNode> | undefined,
    TSubInstructions extends Array<SelfInstructionNode> | undefined = Array<SelfInstructionNode> | undefined,
    TStatus extends InstructionStatusNode | undefined = InstructionStatusNode | undefined,
    TProvides extends Array<ProvidedNode> | undefined = Array<ProvidedNode> | undefined,
    TDisplay extends InstructionDisplayNode | undefined = InstructionDisplayNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'instructionNode';

    // Data.
    /** The identifier of the instruction. */
    readonly identifier: IdentifierString;
    /**
     * How absent optional accounts are represented when serialising the instruction.
     * When absent, `programId` is assumed.
     */
    readonly optionalAccountStrategy?: OptionalAccountStrategy;

    // Children.
    /** Markdown documentation for the instruction. */
    readonly docs?: TDocs;
    /** The accounts the instruction operates on, in order. */
    readonly accounts?: TAccounts;
    /**
     * The type describing the serialised instruction data — any type node, including a `definedTypeLinkNode`. Typically a struct whose fields are the instruction arguments.
     * When absent, the instruction serialises no data.
     * Contextual defaults use the inject/provide pattern: a field default may be an `injectedValueNode` whose key is fulfilled by the `provides` list of the instruction.
     */
    readonly data?: TData;
    /** Variable-length tails of accounts appended after the named account slots. */
    readonly remainingAccounts?: TRemainingAccounts;
    /**
     * Byte-size adjustments applied when computing rent or buffer size — for instructions that resize accounts.
     * All deltas are added together, unless their `subtract` attribute is set.
     */
    readonly byteDeltas?: TByteDeltas;
    /**
     * Discriminators that distinguish this instruction from others.
     * When multiple are listed, they are combined with a logical AND.
     */
    readonly discriminators?: TDiscriminators;
    /** The lifecycle status of the instruction. */
    readonly status?: TStatus;
    /** Nested instructions that split this instruction into distinct scenarios — e.g. one sub-instruction per version of the instruction. */
    readonly subInstructions?: TSubInstructions;
    /**
     * Named nodes exposed to consumers in the surrounding scope.
     * Each entry pairs with an `injectedValueNode` that references it by key, so reusable types can pull contextual values without naming siblings directly.
     * IDLs must be self-contained: every injection key in scope must resolve to a provided entry or carry a fallback.
     */
    readonly provides?: TProvides;
    /** Display metadata describing how the instruction is presented. */
    readonly display?: TDisplay;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
