import { CODAMA_ERROR__LINKED_NODE_NOT_FOUND, CodamaError } from '@codama/errors';
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
} from '@codama/nodes';

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

    record(node: LinkableNode, stack: NodeStack): this {
        const programDictionary = this.getOrCreateProgramDictionary(node, stack);
        if (!programDictionary) return this; // Do not record nodes that are outside of a program.
        const instructionDictionary = this.getOrCreateInstructionDictionary(programDictionary, node, stack);

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

    getOrThrow(linkNode: AccountLinkNode, stack: NodeStack): AccountNode;
    getOrThrow(linkNode: DefinedTypeLinkNode, stack: NodeStack): DefinedTypeNode;
    getOrThrow(linkNode: InstructionAccountLinkNode, stack: NodeStack): InstructionAccountNode;
    getOrThrow(linkNode: InstructionArgumentLinkNode, stack: NodeStack): InstructionArgumentNode;
    getOrThrow(linkNode: InstructionLinkNode, stack: NodeStack): InstructionNode;
    getOrThrow(linkNode: PdaLinkNode, stack: NodeStack): PdaNode;
    getOrThrow(linkNode: ProgramLinkNode, stack: NodeStack): ProgramNode;
    getOrThrow(linkNode: LinkNode, stack: NodeStack): LinkableNode {
        const node = this.get(linkNode as ProgramLinkNode, stack) as LinkableNode | undefined;

        if (!node) {
            throw new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
                kind: linkNode.kind,
                linkNode,
                name: linkNode.name,
                stack: stack.all(),
            });
        }

        return node;
    }

    get(linkNode: AccountLinkNode, stack: NodeStack): AccountNode | undefined;
    get(linkNode: DefinedTypeLinkNode, stack: NodeStack): DefinedTypeNode | undefined;
    get(linkNode: InstructionAccountLinkNode, stack: NodeStack): InstructionAccountNode | undefined;
    get(linkNode: InstructionArgumentLinkNode, stack: NodeStack): InstructionArgumentNode | undefined;
    get(linkNode: InstructionLinkNode, stack: NodeStack): InstructionNode | undefined;
    get(linkNode: PdaLinkNode, stack: NodeStack): PdaNode | undefined;
    get(linkNode: ProgramLinkNode, stack: NodeStack): ProgramNode | undefined;
    get(linkNode: LinkNode, stack: NodeStack): LinkableNode | undefined {
        const programDictionary = this.getProgramDictionary(linkNode, stack);
        if (!programDictionary) return undefined;
        const instructionDictionary = this.getInstructionDictionary(programDictionary, linkNode, stack);

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

    has(linkNode: LinkNode, stack: NodeStack): boolean {
        const programDictionary = this.getProgramDictionary(linkNode, stack);
        if (!programDictionary) return false;
        const instructionDictionary = this.getInstructionDictionary(programDictionary, linkNode, stack);

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

    private getOrCreateProgramDictionary(node: LinkableNode, stack: NodeStack): ProgramDictionary | undefined {
        const programNode = isNode(node, 'programNode') ? node : stack.getProgram();
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
        stack: NodeStack,
    ): InstructionDictionary | undefined {
        const instructionNode = isNode(node, 'instructionNode') ? node : stack.getInstruction();
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

    private getProgramDictionary(linkNode: LinkNode, stack: NodeStack): ProgramDictionary | undefined {
        let programName: CamelCaseString | undefined = undefined;
        if (isNode(linkNode, 'programLinkNode')) {
            programName = linkNode.name;
        } else if ('program' in linkNode) {
            programName = linkNode.program?.name;
        } else if ('instruction' in linkNode) {
            programName = linkNode.instruction?.program?.name;
        }
        programName = programName ?? stack.getProgram()?.name;

        return programName ? this.programs.get(programName) : undefined;
    }

    private getInstructionDictionary(
        programDictionary: ProgramDictionary,
        linkNode: LinkNode,
        stack: NodeStack,
    ): InstructionDictionary | undefined {
        let instructionName: CamelCaseString | undefined = undefined;
        if (isNode(linkNode, 'instructionLinkNode')) {
            instructionName = linkNode.name;
        } else if ('instruction' in linkNode) {
            instructionName = linkNode.instruction?.name;
        }
        instructionName = instructionName ?? stack.getInstruction()?.name;

        return instructionName ? programDictionary.instructions.get(instructionName) : undefined;
    }
}
