import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { DiscriminatorNode } from './discriminatorNodes/DiscriminatorNode';
import type { PdaLinkNode } from './linkNodes/PdaLinkNode';
import type { NestedTypeNode } from './typeNodes/NestedTypeNode';
import type { StructTypeNode } from './typeNodes/StructTypeNode';

/**
 * An on-chain account: its name, data structure, optional fixed size, optional PDA, and optional discriminators.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/77974dad-212e-49b1-8e41-5d466c273a02)
 */
export interface AccountNode<
    TData extends NestedTypeNode<StructTypeNode> = NestedTypeNode<StructTypeNode>,
    TPda extends PdaLinkNode | undefined = PdaLinkNode | undefined,
    TDiscriminators extends Array<DiscriminatorNode> | undefined = Array<DiscriminatorNode> | undefined,
> {
    readonly kind: 'accountNode';

    // Data.
    /** The name of the account. */
    readonly name: CamelCaseString;
    /** The size of the account in bytes, when the data length is fixed. */
    readonly size?: number;
    /** Markdown documentation for the account. */
    readonly docs?: Docs;

    // Children.
    /**
     * The struct describing the account data.
     * It must be a struct so its fields can be referenced by other nodes — e.g. `accountFieldValueNode`.
     */
    readonly data: TData;
    /** A link to the PDA the account is derived from, if applicable. */
    readonly pda?: TPda;
    /**
     * Discriminators that distinguish this account from others in the program.
     * When multiple are listed, they are combined with a logical AND.
     */
    readonly discriminators?: TDiscriminators;
}
