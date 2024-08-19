import { KINOBI_ERROR__LINKED_NODE_NOT_FOUND, KinobiError } from '@kinobi-so/errors';
import {
    AccountLinkNode,
    AccountNode,
    camelCase,
    CamelCaseString,
    DefinedTypeLinkNode,
    DefinedTypeNode,
    isNode,
    LinkNode,
    PdaLinkNode,
    PdaNode,
    ProgramLinkNode,
    ProgramNode,
} from '@kinobi-so/nodes';

import { NodeStack } from './NodeStack';

export type LinkableNode = AccountNode | DefinedTypeNode | PdaNode | ProgramNode;

export const LINKABLE_NODES: LinkableNode['kind'][] = ['accountNode', 'definedTypeNode', 'pdaNode', 'programNode'];

type ProgramDictionary = {
    accounts: Map<string, AccountNode>;
    definedTypes: Map<string, DefinedTypeNode>;
    pdas: Map<string, PdaNode>;
    program: ProgramNode;
};

type ProgramInput = ProgramLinkNode | ProgramNode | string;

function getProgramName(program: ProgramInput): CamelCaseString;
function getProgramName(program: ProgramInput | undefined): CamelCaseString | undefined;
function getProgramName(program: ProgramInput | undefined): CamelCaseString | undefined {
    if (!program) return undefined;
    return typeof program === 'string' ? camelCase(program) : program.name;
}

export class LinkableDictionary {
    readonly programs: Map<string, ProgramDictionary> = new Map();

    readonly stack: NodeStack = new NodeStack();

    private getOrCreateProgramDictionary(node: ProgramNode): ProgramDictionary {
        let programDictionary = this.programs.get(node.name);
        if (!programDictionary) {
            programDictionary = {
                accounts: new Map(),
                definedTypes: new Map(),
                pdas: new Map(),
                program: node,
            };
            this.programs.set(node.name, programDictionary);
        }
        return programDictionary;
    }

    record(node: LinkableNode): this {
        if (isNode(node, 'programNode')) {
            this.getOrCreateProgramDictionary(node);
            return this;
        }

        // Do not record nodes that are outside of a program.
        const program = this.stack.getProgram();
        if (!program) return this;

        const programDictionary = this.getOrCreateProgramDictionary(program);
        if (isNode(node, 'pdaNode')) {
            programDictionary.pdas.set(node.name, node);
        } else if (isNode(node, 'accountNode')) {
            programDictionary.accounts.set(node.name, node);
        } else if (isNode(node, 'definedTypeNode')) {
            programDictionary.definedTypes.set(node.name, node);
        }
        return this;
    }

    getOrThrow(linkNode: ProgramLinkNode): ProgramNode;
    getOrThrow(linkNode: PdaLinkNode): PdaNode;
    getOrThrow(linkNode: AccountLinkNode): AccountNode;
    getOrThrow(linkNode: DefinedTypeLinkNode): DefinedTypeNode;
    getOrThrow(linkNode: LinkNode): LinkableNode {
        const node = this.get(linkNode as ProgramLinkNode) as LinkableNode | undefined;

        if (!node) {
            throw new KinobiError(KINOBI_ERROR__LINKED_NODE_NOT_FOUND, {
                kind: linkNode.kind,
                linkNode,
                name: linkNode.name,
                program: isNode(linkNode, 'pdaLinkNode')
                    ? getProgramName(linkNode.program ?? this.stack.getProgram())
                    : undefined,
            });
        }

        return node;
    }

    get(linkNode: ProgramLinkNode): ProgramNode | undefined;
    get(linkNode: PdaLinkNode): PdaNode | undefined;
    get(linkNode: AccountLinkNode): AccountNode | undefined;
    get(linkNode: DefinedTypeLinkNode): DefinedTypeNode | undefined;
    get(linkNode: LinkNode): LinkableNode | undefined {
        if (isNode(linkNode, 'programLinkNode')) {
            return this.programs.get(linkNode.name)?.program;
        }

        const programName = getProgramName(linkNode.program ?? this.stack.getProgram());
        if (!programName) return undefined;

        const programDictionary = this.programs.get(programName);
        if (!programDictionary) return undefined;

        if (isNode(linkNode, 'pdaLinkNode')) {
            return programDictionary.pdas.get(linkNode.name);
        } else if (isNode(linkNode, 'accountLinkNode')) {
            return programDictionary.accounts.get(linkNode.name);
        } else if (isNode(linkNode, 'definedTypeLinkNode')) {
            return programDictionary.definedTypes.get(linkNode.name);
        }

        return undefined;
    }

    has(linkNode: LinkNode): boolean {
        if (isNode(linkNode, 'programLinkNode')) {
            return this.programs.has(linkNode.name);
        }

        const programName = getProgramName(linkNode.program ?? this.stack.getProgram());
        if (!programName) return false;

        const programDictionary = this.programs.get(programName);
        if (!programDictionary) return false;

        if (isNode(linkNode, 'pdaLinkNode')) {
            return programDictionary.pdas.has(linkNode.name);
        } else if (isNode(linkNode, 'accountLinkNode')) {
            return programDictionary.accounts.has(linkNode.name);
        } else if (isNode(linkNode, 'definedTypeLinkNode')) {
            return programDictionary.definedTypes.has(linkNode.name);
        }

        return false;
    }
}
