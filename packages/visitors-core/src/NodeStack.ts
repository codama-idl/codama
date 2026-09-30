import { CODAMA_ERROR__VISITORS__CANNOT_REMOVE_LAST_PATH_IN_NODE_STACK, CodamaError } from '@codama/errors';
import { GetNodeFromKind, Node, NodeKind } from '@codama/nodes';

import { assertIsNodePath, getLastNodeFromPath, NodePath, nodePathToString } from './NodePath';
import { visit, Visitor } from './visitor';

type MutableNodePath = Node[];

export class NodeStack {
    /**
     * Contains all the node paths saved during the traversal.
     *
     * - The very last path is the current path which is being
     *   used during the traversal.
     * - The other paths can be used to save and restore the
     *   current path when jumping to different parts of the tree.
     *
     * There must at least be one path in the stack at all times.
     */
    private readonly stack: [...MutableNodePath[], MutableNodePath];

    constructor(...stack: readonly [...(readonly NodePath[]), NodePath] | readonly []) {
        this.stack =
            stack.length === 0 ? [[]] : (stack.map(nodes => [...nodes]) as [...MutableNodePath[], MutableNodePath]);
    }

    private get currentPath(): MutableNodePath {
        return this.stack[this.stack.length - 1];
    }

    public push(node: Node): void {
        this.currentPath.push(node);
    }

    public pop(): Node | undefined {
        return this.currentPath.pop();
    }

    public peek(): Node | undefined {
        return this.isEmpty() ? undefined : this.currentPath[this.currentPath.length - 1];
    }

    public pushPath(newPath: NodePath = []): void {
        this.stack.push([...newPath]);
    }

    public popPath(): NodePath {
        if (this.stack.length <= 1) {
            throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_REMOVE_LAST_PATH_IN_NODE_STACK, {
                path: [...this.stack[this.stack.length - 1]],
            });
        }
        return [...this.stack.pop()!];
    }

    /**
     * Run `callback` with `path` as the current path, then restore the
     * previous one, even if `callback` throws. Use it to jump to another
     * part of the tree, e.g. to the definition of a linked node.
     *
     * @example
     * ```ts
     * const fields = stack.withPath(definedTypePath, () => getFields(definedType.type));
     * ```
     */
    public withPath<T>(path: NodePath, callback: () => T): T {
        this.pushPath(path);
        try {
            return callback();
        } finally {
            this.popPath();
        }
    }

    /**
     * Visit the last node of `path` with the rest of `path` as the current
     * path, then restore the previous one, even if the visit throws.
     *
     * The visitor must record its nodes on this stack (e.g. using
     * `recordNodeStackVisitor`), which adds the visited node back to the
     * path. Otherwise, use {@link NodeStack.withPath} instead.
     *
     * @example
     * ```ts
     * const linkedPath = linkables.getPathOrThrow(stack.getPath('definedTypeLinkNode'));
     * return stack.visitPath(linkedPath, self);
     * ```
     */
    public visitPath<TNode extends Node, TReturn>(
        path: NodePath<TNode>,
        visitor: Visitor<TReturn, TNode['kind']>,
    ): TReturn {
        return this.withPath(path.slice(0, -1), () => visit(getLastNodeFromPath(path), visitor));
    }

    public getPath(): NodePath;
    public getPath<TKind extends NodeKind>(kind: TKind | TKind[]): NodePath<GetNodeFromKind<TKind>>;
    public getPath<TKind extends NodeKind>(kind?: TKind | TKind[]): NodePath {
        const path = [...this.currentPath];
        if (kind) {
            assertIsNodePath(path, kind);
        }
        return path;
    }

    public isEmpty(): boolean {
        return this.currentPath.length === 0;
    }

    public clone(): NodeStack {
        return new NodeStack(...this.stack);
    }

    public toString(): string {
        return nodePathToString(this.getPath());
    }
}
