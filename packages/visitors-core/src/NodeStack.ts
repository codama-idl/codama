import {
    assertIsNode,
    GetNodeFromKind,
    InstructionNode,
    Node,
    NodeKind,
    ProgramNode,
    REGISTERED_NODE_KINDS,
} from '@codama/nodes';

import { findLastNodeFromPath, NodePath } from './NodePath';

export class NodeStack {
    /**
     * Contains all the node stacks saved during the traversal.
     *
     * - The very last stack is the current stack which is being
     *   used during the traversal.
     * - The other stacks can be used to save and restore the
     *   current stack when jumping to different parts of the tree.
     *
     * There must at least be one stack in the heap at all times.
     */
    private readonly heap: [...Node[][], Node[]];

    constructor(...heap: readonly [...(readonly (readonly Node[])[]), readonly Node[]] | readonly []) {
        this.heap = heap.length === 0 ? [[]] : ([...heap.map(nodes => [...nodes])] as [...Node[][], Node[]]);
    }

    public get stack(): Node[] {
        return this.heap[this.heap.length - 1];
    }

    public push(node: Node): void {
        this.stack.push(node);
    }

    public pop(): Node | undefined {
        return this.stack.pop();
    }

    public peek(): Node | undefined {
        return this.isEmpty() ? undefined : this.stack[this.stack.length - 1];
    }

    public pushStack(newStack: readonly Node[] = []): void {
        this.heap.push([...newStack]);
    }

    public popStack(): readonly Node[] {
        const oldStack = this.heap.pop() as Node[];
        if (this.heap.length === 0) {
            // TODO: Coded error
            throw new Error('The heap of stacks can never be empty.');
        }
        return [...oldStack] as readonly Node[];
    }

    public find<TKind extends NodeKind>(kind: TKind | TKind[]): GetNodeFromKind<TKind> | undefined {
        return findLastNodeFromPath([...this.stack] as unknown as NodePath<GetNodeFromKind<TKind>>, kind);
    }

    public getProgram(): ProgramNode | undefined {
        return this.find('programNode');
    }

    public getInstruction(): InstructionNode | undefined {
        return this.find('instructionNode');
    }

    public all(): readonly Node[] {
        return [...this.stack];
    }

    public getPath<TKind extends NodeKind>(kind?: TKind | TKind[]): NodePath<GetNodeFromKind<TKind>> {
        const node = this.peek();
        assertIsNode(node, kind ?? REGISTERED_NODE_KINDS);
        return [...this.stack] as unknown as NodePath<GetNodeFromKind<TKind>>;
    }

    public isEmpty(): boolean {
        return this.stack.length === 0;
    }

    public clone(): NodeStack {
        return new NodeStack(...this.heap);
    }

    public toString(): string {
        return this.toStringArray().join(' > ');
    }

    public toStringArray(): string[] {
        return this.stack.map((node): string => {
            return 'name' in node ? `[${node.kind}]${node.name}` : `[${node.kind}]`;
        });
    }
}
