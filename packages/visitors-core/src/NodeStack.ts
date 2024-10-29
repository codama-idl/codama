import { CODAMA_ERROR__VISITORS__CANNOT_REMOVE_LAST_PATH_IN_NODE_STACK, CodamaError } from '@codama/errors';
import { GetNodeFromKind, Node, NodeKind } from '@codama/nodes';

import { assertIsNodePath, NodePath } from './NodePath';

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
            stack.length === 0
                ? [[]]
                : ([...stack.map(nodes => [...nodes])] as [...MutableNodePath[], MutableNodePath]);
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
}
