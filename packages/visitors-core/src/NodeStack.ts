import { GetNodeFromKind, isNodeFilter, Node, NodeKind, ProgramNode } from '@kinobi-so/nodes';

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
        return this.stack.find(isNodeFilter(kind));
    }

    public getProgram(): ProgramNode | undefined {
        return this.find('programNode');
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
