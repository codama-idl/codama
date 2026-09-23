import { CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE, CodamaError } from '@codama/errors';
import {
    assertIsNode,
    type GetNodeFromKind,
    type IdentifierString,
    type InjectedValueNode,
    isNode,
    type Node,
    type NodeKind,
    type ProvidedNode,
} from '@codama/nodes';

import { bottomUpTransformerVisitor } from './bottomUpTransformerVisitor';
import { visit } from './visitor';

/** A node an injection resolved to, with the frame depth its own injections resolve against. */
type Resolution = { depth: number; node: Node; provider?: ProvidedNode };

/**
 * The lexical scope of `providedNode`s visible at a point of the tree,
 * used to resolve `injectedValueNode`s.
 *
 * Each `instructionNode` carrying `provides` contributes one frame (the
 * only host of `provides` today). Resolution is lexical: the innermost
 * frame providing a key wins and outer frames remain visible — e.g. a
 * sub-instruction may shadow a key provided by its parent. Frames are
 * independent of the {@link NodeStack}, so following links (e.g. into a
 * defined type) keeps the frames of the consuming instruction in scope.
 *
 * @see {@link recordProvidedScopeVisitor} to fill a scope during a traversal.
 */
export class ProvidedScope {
    private readonly frames: (readonly ProvidedNode[])[];

    constructor(...frames: readonly (readonly ProvidedNode[])[]) {
        this.frames = frames.map(frame => [...frame]);
    }

    /** Open a new innermost frame with the given providers. */
    public push(provides: readonly ProvidedNode[]): void {
        this.frames.push([...provides]);
    }

    /** Close the innermost frame. */
    public pop(): void {
        this.frames.pop();
    }

    /** The innermost provider for the given key, if any. */
    public get(key: IdentifierString): ProvidedNode | undefined {
        return this.find(key, this.frames.length)?.provider;
    }

    /**
     * Resolve every `injectedValueNode` within `node` — itself included —
     * and return the result, which never contains an injection.
     *
     * An injection resolves to the innermost provided node for its key. A
     * provided node is resolved against the frames outside the one
     * providing it, so a provider may re-inject its own key. The
     * injection's `fallback` is used when no frame provides the key, or
     * when the provided chain dead-ends. Resolution is all-or-nothing: if
     * any injection within `node` resolves to nothing, `undefined` is
     * returned rather than a partially resolved value. A `node` containing
     * no injection is returned as-is.
     *
     * The root result must be one of `kinds`: a provided node that is not
     * throws `CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE`, any other
     * node throws `CODAMA_ERROR__UNEXPECTED_NODE_KIND`. Nested
     * injections are checked by the node that holds them.
     */
    public resolve<TKind extends NodeKind>(
        node: Node,
        options: { kinds: TKind[] },
    ): Exclude<GetNodeFromKind<TKind>, InjectedValueNode> | undefined {
        const depth = this.frames.length;
        const resolution = isNode(node, 'injectedValueNode') ? this.lookup(node, depth) : { depth, node };
        if (!resolution) return undefined;
        if (!isNode(resolution.node, options.kinds)) {
            if (resolution.provider) {
                throw new CodamaError(CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE, {
                    expectedKinds: options.kinds,
                    key: resolution.provider.identifier,
                    providedKind: resolution.node.kind,
                    provider: resolution.provider,
                });
            }
            assertIsNode(resolution.node, options.kinds);
        }
        const resolved = this.resolveWithin(resolution.node, resolution.depth);
        return (resolved ?? undefined) as Exclude<GetNodeFromKind<TKind>, InjectedValueNode> | undefined;
    }

    public clone(): ProvidedScope {
        return new ProvidedScope(...this.frames);
    }

    /** Find the node an injection stands for, searching frames strictly below `depth`. */
    private lookup(node: InjectedValueNode, depth: number): Resolution | undefined {
        const found = this.find(node.key, depth);
        if (found) {
            const { depth: providerDepth, provider } = found;
            if (!isNode(provider.node, 'injectedValueNode')) {
                return { depth: providerDepth, node: provider.node, provider };
            }
            const chained = this.lookup(provider.node, providerDepth);
            if (chained) return { ...chained, provider: chained.provider ?? provider };
        }
        if (node.fallback === undefined) return undefined;
        return isNode(node.fallback, 'injectedValueNode')
            ? this.lookup(node.fallback, depth)
            : { depth, node: node.fallback };
    }

    /**
     * Replace every injection nested within `node`, resolving against frames
     * strictly below `depth`. Returns `null` when any of them is unresolvable,
     * and `node` itself when it contains none.
     */
    private resolveWithin(node: Node, depth: number): Node | null {
        let replaced = false;
        let unresolvable = false;
        const visitor = bottomUpTransformerVisitor([
            child => {
                if (unresolvable || !isNode(child, 'injectedValueNode')) return child;
                replaced = true;
                const resolution = this.lookup(child, depth);
                const resolved = resolution ? this.resolveWithin(resolution.node, resolution.depth) : null;
                if (resolved === null) unresolvable = true;
                return resolved;
            },
        ]);
        const result = visit(node, visitor);
        if (unresolvable) return null;
        return replaced ? result : node;
    }

    /** Search frames strictly below `depth`, innermost first. */
    private find(key: IdentifierString, depth: number): { depth: number; provider: ProvidedNode } | undefined {
        for (let index = depth - 1; index >= 0; index--) {
            const provider = this.frames[index].find(p => p.identifier === key);
            if (provider) return { depth: index, provider };
        }
        return undefined;
    }
}
