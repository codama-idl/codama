import { camelCase, isNodeFilter, Node, ProgramNode } from '@kinobi-so/nodes';

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

    public getProgram(): ProgramNode | undefined {
        return this.stack.find(isNodeFilter('programNode'));
    }

    public all(): Node[] {
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

    public matchesWithNames(names: string[]): boolean {
        const remainingNames = [...names].map(camelCase);
        this.stack.forEach(node => {
            const nodeName = (node as { name?: string }).name;
            if (nodeName && remainingNames.length > 0 && remainingNames[0] === camelCase(nodeName)) {
                remainingNames.shift();
            }
        });

        return remainingNames.length === 0;
    }
}
