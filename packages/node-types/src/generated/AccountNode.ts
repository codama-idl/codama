import type { IdentifierString } from '../brands';
import type { DiscriminatorNode } from './discriminatorNodes/DiscriminatorNode';
import type { PdaLinkNode } from './linkNodes/PdaLinkNode';
import type { PluginNode } from './PluginNode';
import type { TextNode } from './TextNode';
import type { TypeNode } from './typeNodes/TypeNode';

/**
 * An on-chain account: its identifier, data type, optional fixed size, optional PDA, and optional discriminators.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/77974dad-212e-49b1-8e41-5d466c273a02)
 */
export interface AccountNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TData extends TypeNode = TypeNode,
    TPda extends PdaLinkNode | undefined = PdaLinkNode | undefined,
    TDiscriminators extends Array<DiscriminatorNode> | undefined = Array<DiscriminatorNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'accountNode';

    // Data.
    /** The identifier of the account. */
    readonly identifier: IdentifierString;
    /** The size of the account in bytes, when the data length is fixed. */
    readonly size?: number;

    // Children.
    /** Markdown documentation for the account. */
    readonly docs?: TDocs;
    /**
     * The type describing the account data — any type node, including a `definedTypeLinkNode` to share or reuse a defined type.
     * Nodes that reference account fields by name — e.g. `accountDataValueNode` or `fieldDiscriminatorNode` — are only valid when this type resolves to a struct (following links).
     */
    readonly data: TData;
    /** A link to the PDA the account is derived from, if applicable. */
    readonly pda?: TPda;
    /**
     * Discriminators that distinguish this account from others in the program.
     * When multiple are listed, they are combined with a logical AND.
     */
    readonly discriminators?: TDiscriminators;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
