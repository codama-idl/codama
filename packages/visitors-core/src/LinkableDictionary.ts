import { CODAMA_ERROR__LINKED_NODE_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    AccountNode,
    CamelCaseString,
    DefinedTypeNode,
    InstructionAccountNode,
    InstructionArgumentNode,
    InstructionNode,
    isNode,
    LinkNode,
    PdaNode,
    ProgramNode,
} from '@codama/nodes';

import {
    findInstructionNodeFromPath,
    findProgramNodeFromPath,
    getLastNodeFromPath,
    getNodePathUntilLastNode,
    isNodePath,
    NodePath,
} from './NodePath';

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

export type GetLinkableFromLinkNode<TLinkNode extends LinkNode> = {
    accountLinkNode: AccountNode;
    definedTypeLinkNode: DefinedTypeNode;
    instructionAccountLinkNode: InstructionAccountNode;
    instructionArgumentLinkNode: InstructionArgumentNode;
    instructionLinkNode: InstructionNode;
    pdaLinkNode: PdaNode;
    programLinkNode: ProgramNode;
}[TLinkNode['kind']];

type ProgramDictionary = {
    accounts: Map<string, NodePath<AccountNode>>;
    definedTypes: Map<string, NodePath<DefinedTypeNode>>;
    instructions: Map<string, InstructionDictionary>;
    pdas: Map<string, NodePath<PdaNode>>;
    program: NodePath<ProgramNode>;
};

type InstructionDictionary = {
    accounts: Map<string, NodePath<InstructionAccountNode>>;
    arguments: Map<string, NodePath<InstructionArgumentNode>>;
    instruction: NodePath<InstructionNode>;
};

export class LinkableDictionary {
    readonly programs: Map<string, ProgramDictionary> = new Map();

    recordPath(linkablePath: NodePath<LinkableNode>): this {
        const linkableNode = getLastNodeFromPath(linkablePath);
        const programDictionary = this.getOrCreateProgramDictionary(linkablePath);
        if (!programDictionary) return this; // Do not record nodes that are outside of a program.
        const instructionDictionary = this.getOrCreateInstructionDictionary(programDictionary, linkablePath);

        if (isNodePath(linkablePath, 'accountNode')) {
            programDictionary.accounts.set(linkableNode.name, linkablePath);
        } else if (isNodePath(linkablePath, 'definedTypeNode')) {
            programDictionary.definedTypes.set(linkableNode.name, linkablePath);
        } else if (isNodePath(linkablePath, 'pdaNode')) {
            programDictionary.pdas.set(linkableNode.name, linkablePath);
        } else if (instructionDictionary && isNodePath(linkablePath, 'instructionAccountNode')) {
            instructionDictionary.accounts.set(linkableNode.name, linkablePath);
        } else if (instructionDictionary && isNodePath(linkablePath, 'instructionArgumentNode')) {
            instructionDictionary.arguments.set(linkableNode.name, linkablePath);
        }

        return this;
    }

    getPathOrThrow<TLinkNode extends LinkNode>(
        linkPath: NodePath<TLinkNode>,
    ): NodePath<GetLinkableFromLinkNode<TLinkNode>> {
        const linkablePath = this.getPath(linkPath);

        if (!linkablePath) {
            const linkNode = getLastNodeFromPath(linkPath);
            throw new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
                kind: linkNode.kind,
                linkNode,
                name: linkNode.name,
                path: linkablePath,
            });
        }

        return linkablePath;
    }

    getPath<TLinkNode extends LinkNode>(
        linkPath: NodePath<TLinkNode>,
    ): NodePath<GetLinkableFromLinkNode<TLinkNode>> | undefined {
        const linkNode = getLastNodeFromPath(linkPath);
        const programDictionary = this.getProgramDictionary(linkPath);
        if (!programDictionary) return undefined;
        const instructionDictionary = this.getInstructionDictionary(programDictionary, linkPath);
        type LinkablePath = NodePath<GetLinkableFromLinkNode<TLinkNode>> | undefined;

        if (isNode(linkNode, 'accountLinkNode')) {
            return programDictionary.accounts.get(linkNode.name) as LinkablePath;
        } else if (isNode(linkNode, 'definedTypeLinkNode')) {
            return programDictionary.definedTypes.get(linkNode.name) as LinkablePath;
        } else if (isNode(linkNode, 'instructionAccountLinkNode')) {
            return instructionDictionary?.accounts.get(linkNode.name) as LinkablePath;
        } else if (isNode(linkNode, 'instructionArgumentLinkNode')) {
            return instructionDictionary?.arguments.get(linkNode.name) as LinkablePath;
        } else if (isNode(linkNode, 'instructionLinkNode')) {
            return instructionDictionary?.instruction as LinkablePath;
        } else if (isNode(linkNode, 'pdaLinkNode')) {
            return programDictionary.pdas.get(linkNode.name) as LinkablePath;
        } else if (isNode(linkNode, 'programLinkNode')) {
            return programDictionary.program as LinkablePath;
        }

        return undefined;
    }

    getOrThrow<TLinkNode extends LinkNode>(linkPath: NodePath<TLinkNode>): GetLinkableFromLinkNode<TLinkNode> {
        return getLastNodeFromPath(this.getPathOrThrow(linkPath));
    }

    get<TLinkNode extends LinkNode>(linkPath: NodePath<TLinkNode>): GetLinkableFromLinkNode<TLinkNode> | undefined {
        const path = this.getPath(linkPath);
        return path ? getLastNodeFromPath(path) : undefined;
    }

    has(linkPath: NodePath<LinkNode>): boolean {
        const linkNode = getLastNodeFromPath(linkPath);
        const programDictionary = this.getProgramDictionary(linkPath);
        if (!programDictionary) return false;
        const instructionDictionary = this.getInstructionDictionary(programDictionary, linkPath);

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

    private getOrCreateProgramDictionary(linkablePath: NodePath<LinkableNode>): ProgramDictionary | undefined {
        const linkableNode = getLastNodeFromPath(linkablePath);
        const programNode = isNode(linkableNode, 'programNode') ? linkableNode : findProgramNodeFromPath(linkablePath);
        if (!programNode) return undefined;

        let programDictionary = this.programs.get(programNode.name);
        if (!programDictionary) {
            programDictionary = {
                accounts: new Map(),
                definedTypes: new Map(),
                instructions: new Map(),
                pdas: new Map(),
                program: getNodePathUntilLastNode(linkablePath, 'programNode')!,
            };
            this.programs.set(programNode.name, programDictionary);
        }

        return programDictionary;
    }

    private getOrCreateInstructionDictionary(
        programDictionary: ProgramDictionary,
        linkablePath: NodePath<LinkableNode>,
    ): InstructionDictionary | undefined {
        const linkableNode = getLastNodeFromPath(linkablePath);
        const instructionNode = isNode(linkableNode, 'instructionNode')
            ? linkableNode
            : findInstructionNodeFromPath(linkablePath);
        if (!instructionNode) return undefined;

        let instructionDictionary = programDictionary.instructions.get(instructionNode.name);
        if (!instructionDictionary) {
            instructionDictionary = {
                accounts: new Map(),
                arguments: new Map(),
                instruction: getNodePathUntilLastNode(linkablePath, 'instructionNode')!,
            };
            programDictionary.instructions.set(instructionNode.name, instructionDictionary);
        }

        return instructionDictionary;
    }

    private getProgramDictionary(linkPath: NodePath<LinkNode>): ProgramDictionary | undefined {
        const linkNode = getLastNodeFromPath(linkPath);
        let programName: CamelCaseString | undefined = undefined;
        if (isNode(linkNode, 'programLinkNode')) {
            programName = linkNode.name;
        } else if ('program' in linkNode) {
            programName = linkNode.program?.name;
        } else if ('instruction' in linkNode) {
            programName = linkNode.instruction?.program?.name;
        }
        programName = programName ?? findProgramNodeFromPath(linkPath)?.name;

        return programName ? this.programs.get(programName) : undefined;
    }

    private getInstructionDictionary(
        programDictionary: ProgramDictionary,
        linkPath: NodePath<LinkNode>,
    ): InstructionDictionary | undefined {
        const linkNode = getLastNodeFromPath(linkPath);
        let instructionName: CamelCaseString | undefined = undefined;
        if (isNode(linkNode, 'instructionLinkNode')) {
            instructionName = linkNode.name;
        } else if ('instruction' in linkNode) {
            instructionName = linkNode.instruction?.name;
        }
        instructionName = instructionName ?? findInstructionNodeFromPath(linkPath)?.name;

        return instructionName ? programDictionary.instructions.get(instructionName) : undefined;
    }
}
