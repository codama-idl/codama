import { GetNodeFromKind, InstructionNode, isNode, Node, NodeKind, ProgramNode } from '@codama/nodes';

export class NodeStack {
    private readonly stack: Node[];

    constructor(stack: Node[] = []) {
        this.stack = [...stack];
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

    public find<TKind extends NodeKind>(kind: TKind | TKind[]): GetNodeFromKind<TKind> | undefined {
        for (let index = this.stack.length - 1; index >= 0; index--) {
            const node = this.stack[index];
            if (isNode(node, kind)) return node;
        }
        return undefined;
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

    public isEmpty(): boolean {
        return this.stack.length === 0;
    }

    public clone(): NodeStack {
        return new NodeStack(this.stack);
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
