import { KINOBI_ERROR__LINKED_NODE_NOT_FOUND, KinobiError } from '@kinobi-so/errors';
import {
    AccountLinkNode,
    AccountNode,
    CamelCaseString,
    DefinedTypeLinkNode,
    DefinedTypeNode,
    InstructionAccountLinkNode,
    InstructionAccountNode,
    InstructionArgumentLinkNode,
    InstructionArgumentNode,
    InstructionLinkNode,
    InstructionNode,
    isNode,
    LinkNode,
    PdaLinkNode,
    PdaNode,
    ProgramLinkNode,
    ProgramNode,
} from '@kinobi-so/nodes';

import { NodeStack } from './NodeStack';

export type LinkableNode =
    | AccountNode
    | DefinedTypeNode
    | InstructionAccountNode
    | InstructionArgumentNode
    | InstructionNode
    | PdaNode
    | ProgramNode;

export const LINKABLE_NODES: LinkableNode['kind'][] = [
    'accountNode',
    'definedTypeNode',
    'instructionAccountNode',
    'instructionArgumentNode',
    'instructionNode',
    'pdaNode',
    'programNode',
];

type ProgramDictionary = {
    accounts: Map<string, AccountNode>;
    definedTypes: Map<string, DefinedTypeNode>;
    instructions: Map<string, InstructionDictionary>;
    pdas: Map<string, PdaNode>;
    program: ProgramNode;
};

type InstructionDictionary = {
    accounts: Map<string, InstructionAccountNode>;
    arguments: Map<string, InstructionArgumentNode>;
    instruction: InstructionNode;
};

export class LinkableDictionary {
    readonly programs: Map<string, ProgramDictionary> = new Map();

    readonly stack: NodeStack = new NodeStack();

    record(node: LinkableNode): this {
        const programDictionary = this.getOrCreateProgramDictionary(node);
        if (!programDictionary) return this; // Do not record nodes that are outside of a program.
        const instructionDictionary = this.getOrCreateInstructionDictionary(programDictionary, node);

        if (isNode(node, 'accountNode')) {
            programDictionary.accounts.set(node.name, node);
        } else if (isNode(node, 'definedTypeNode')) {
            programDictionary.definedTypes.set(node.name, node);
        } else if (isNode(node, 'pdaNode')) {
            programDictionary.pdas.set(node.name, node);
        } else if (instructionDictionary && isNode(node, 'instructionAccountNode')) {
            instructionDictionary.accounts.set(node.name, node);
        } else if (instructionDictionary && isNode(node, 'instructionArgumentNode')) {
            instructionDictionary.arguments.set(node.name, node);
        }

        return this;
    }

    getOrThrow(linkNode: AccountLinkNode): AccountNode;
    getOrThrow(linkNode: DefinedTypeLinkNode): DefinedTypeNode;
    getOrThrow(linkNode: InstructionAccountLinkNode): InstructionAccountNode;
    getOrThrow(linkNode: InstructionArgumentLinkNode): InstructionArgumentNode;
    getOrThrow(linkNode: InstructionLinkNode): InstructionNode;
    getOrThrow(linkNode: PdaLinkNode): PdaNode;
    getOrThrow(linkNode: ProgramLinkNode): ProgramNode;
    getOrThrow(linkNode: LinkNode): LinkableNode {
        const node = this.get(linkNode as ProgramLinkNode) as LinkableNode | undefined;

        if (!node) {
            throw new KinobiError(KINOBI_ERROR__LINKED_NODE_NOT_FOUND, {
                kind: linkNode.kind,
                linkNode,
                name: linkNode.name,
                program: isNode(linkNode, 'pdaLinkNode')
                    ? (linkNode.program ?? this.stack.getProgram())?.name
                    : undefined,
            });
        }

        return node;
    }

    get(linkNode: AccountLinkNode): AccountNode | undefined;
    get(linkNode: DefinedTypeLinkNode): DefinedTypeNode | undefined;
    get(linkNode: InstructionAccountLinkNode): InstructionAccountNode | undefined;
    get(linkNode: InstructionArgumentLinkNode): InstructionArgumentNode | undefined;
    get(linkNode: InstructionLinkNode): InstructionNode | undefined;
    get(linkNode: PdaLinkNode): PdaNode | undefined;
    get(linkNode: ProgramLinkNode): ProgramNode | undefined;
    get(linkNode: LinkNode): LinkableNode | undefined {
        const programDictionary = this.getProgramDictionary(linkNode);
        if (!programDictionary) return undefined;
        const instructionDictionary = this.getInstructionDictionary(programDictionary, linkNode);

        if (isNode(linkNode, 'accountLinkNode')) {
            return programDictionary.accounts.get(linkNode.name);
        } else if (isNode(linkNode, 'definedTypeLinkNode')) {
            return programDictionary.definedTypes.get(linkNode.name);
        } else if (isNode(linkNode, 'instructionAccountLinkNode')) {
            return instructionDictionary?.accounts.get(linkNode.name);
        } else if (isNode(linkNode, 'instructionArgumentLinkNode')) {
            return instructionDictionary?.arguments.get(linkNode.name);
        } else if (isNode(linkNode, 'instructionLinkNode')) {
            return instructionDictionary?.instruction;
        } else if (isNode(linkNode, 'pdaLinkNode')) {
            return programDictionary.pdas.get(linkNode.name);
        } else if (isNode(linkNode, 'programLinkNode')) {
            return programDictionary.program;
        }

        return undefined;
    }

    has(linkNode: LinkNode): boolean {
        const programDictionary = this.getProgramDictionary(linkNode);
        if (!programDictionary) return false;
        const instructionDictionary = this.getInstructionDictionary(programDictionary, linkNode);

        if (isNode(linkNode, 'accountLinkNode')) {
            return programDictionary.accounts.has(linkNode.name);
        } else if (isNode(linkNode, 'definedTypeLinkNode')) {
            return programDictionary.definedTypes.has(linkNode.name);
        } else if (isNode(linkNode, 'instructionAccountLinkNode')) {
            return !!instructionDictionary && instructionDictionary.accounts.has(linkNode.name);
        } else if (isNode(linkNode, 'instructionArgumentLinkNode')) {
            return !!instructionDictionary && instructionDictionary.arguments.has(linkNode.name);
        } else if (isNode(linkNode, 'instructionLinkNode')) {
            return programDictionary.instructions.has(linkNode.name);
        } else if (isNode(linkNode, 'pdaLinkNode')) {
            return programDictionary.pdas.has(linkNode.name);
        } else if (isNode(linkNode, 'programLinkNode')) {
            return true;
        }

        return false;
    }

    private getOrCreateProgramDictionary(node: LinkableNode): ProgramDictionary | undefined {
        const programNode = isNode(node, 'programNode') ? node : this.stack.getProgram();
        if (!programNode) return undefined;

        let programDictionary = this.programs.get(programNode.name);
        if (!programDictionary) {
            programDictionary = {
                accounts: new Map(),
                definedTypes: new Map(),
                instructions: new Map(),
                pdas: new Map(),
                program: programNode,
            };
            this.programs.set(programNode.name, programDictionary);
        }

        return programDictionary;
    }

    private getOrCreateInstructionDictionary(
        programDictionary: ProgramDictionary,
        node: LinkableNode,
    ): InstructionDictionary | undefined {
        const instructionNode = isNode(node, 'instructionNode') ? node : this.stack.getInstruction();
        if (!instructionNode) return undefined;

        let instructionDictionary = programDictionary.instructions.get(instructionNode.name);
        if (!instructionDictionary) {
            instructionDictionary = {
                accounts: new Map(),
                arguments: new Map(),
                instruction: instructionNode,
            };
            programDictionary.instructions.set(instructionNode.name, instructionDictionary);
        }

        return instructionDictionary;
    }

    private getProgramDictionary(linkNode: LinkNode): ProgramDictionary | undefined {
        let programName: CamelCaseString | undefined = undefined;
        if (isNode(linkNode, 'programLinkNode')) {
            programName = linkNode.name;
        } else if ('program' in linkNode) {
            programName = linkNode.program?.name;
        } else if ('instruction' in linkNode) {
            programName = linkNode.instruction?.program?.name;
        }
        programName = programName ?? this.stack.getProgram()?.name;

        return programName ? this.programs.get(programName) : undefined;
    }

    private getInstructionDictionary(
        programDictionary: ProgramDictionary,
        linkNode: LinkNode,
    ): InstructionDictionary | undefined {
        let instructionName: CamelCaseString | undefined = undefined;
        if (isNode(linkNode, 'instructionLinkNode')) {
            instructionName = linkNode.name;
        } else if ('instruction' in linkNode) {
            instructionName = linkNode.instruction?.name;
        }
        instructionName = instructionName ?? this.stack.getInstruction()?.name;

        return instructionName ? programDictionary.instructions.get(instructionName) : undefined;
    }
}
