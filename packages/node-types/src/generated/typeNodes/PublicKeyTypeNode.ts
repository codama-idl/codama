import type { AccountLinkNode } from '../linkNodes/AccountLinkNode';
import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';

/** A 32-byte Solana public key. */
export interface PublicKeyTypeNode<
    TAccountLink extends AccountLinkNode | undefined = AccountLinkNode | undefined,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'publicKeyTypeNode';

    // Children.
    /**
     * A reference to the data layout of the account this address points to.
     * Path expressions crossing this public key continue into the linked account's decoded data — e.g. `mint.decimals` reads the `decimals` of the mint whose address is in the `mint` field. Resolving such paths requires reading the account state at presentation time; when the account is missing or its data cannot be decoded with the linked layout, the path is unresolved and its consumer falls back as usual.
     * The link's optional `program` allows cross-program references via the root's `additionalPrograms`.
     */
    readonly accountLink?: TAccountLink;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
