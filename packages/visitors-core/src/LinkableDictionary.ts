import { CODAMA_ERROR__LINKED_NODE_NOT_FOUND, CODAMA_ERROR__UNRECOGNIZED_NODE_KIND, CodamaError } from '@codama/errors';
import {
    AccountNode,
    DefinedTypeNode,
    IdentifierString,
    InstructionAccountNode,
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
    | InstructionNode
    | PdaNode
    | ProgramNode;

export const LINKABLE_NODES: LinkableNode['kind'][] = [
    'accountNode',
    'definedTypeNode',
    'instructionAccountNode',
    'instructionNode',
    'pdaNode',
    'programNode',
];

export type GetLinkableFromLinkNode<TLinkNode extends LinkNode> = {
    accountLinkNode: AccountNode;
    definedTypeLinkNode: DefinedTypeNode;
    instructionAccountLinkNode: InstructionAccountNode;
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
            programDictionary.accounts.set(linkableNode.identifier, linkablePath);
        } else if (isNodePath(linkablePath, 'definedTypeNode')) {
            programDictionary.definedTypes.set(linkableNode.identifier, linkablePath);
        } else if (isNodePath(linkablePath, 'pdaNode')) {
            programDictionary.pdas.set(linkableNode.identifier, linkablePath);
        } else if (instructionDictionary && isNodePath(linkablePath, 'instructionAccountNode')) {
            instructionDictionary.accounts.set(linkableNode.identifier, linkablePath);
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
                name: linkNode.identifier,
                path: linkPath,
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
            return programDictionary.accounts.get(linkNode.identifier) as LinkablePath;
        } else if (isNode(linkNode, 'definedTypeLinkNode')) {
            return programDictionary.definedTypes.get(linkNode.identifier) as LinkablePath;
        } else if (isNode(linkNode, 'instructionAccountLinkNode')) {
            return instructionDictionary?.accounts.get(linkNode.identifier) as LinkablePath;
        } else if (isNode(linkNode, 'instructionLinkNode')) {
            return instructionDictionary?.instruction as LinkablePath;
        } else if (isNode(linkNode, 'pdaLinkNode')) {
            return programDictionary.pdas.get(linkNode.identifier) as LinkablePath;
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

    /**
     * List the paths of every recorded linkable node of the given kind, in
     * recording order, across all programs.
     *
     * Only nodes recorded beforehand (via `recordPath` or the
     * `getRecordLinkablesVisitor`) are returned: the tree itself is not
     * traversed.
     *
     * @example
     * ```ts
     * linkables.getRecordedPathsOfKind('accountNode'); // [[root, programA, accountA], [root, programB, accountB]]
     * ```
     */
    getRecordedPathsOfKind<TKind extends LinkableNode['kind']>(
        kind: TKind,
    ): NodePath<Extract<LinkableNode, { kind: TKind }>>[] {
        type Paths = NodePath<Extract<LinkableNode, { kind: TKind }>>[];
        const programs = [...this.programs.values()];
        const linkableKind: LinkableNode['kind'] = kind;
        switch (linkableKind) {
            case 'programNode':
                return programs.map(program => program.program) as Paths;
            case 'accountNode':
                return programs.flatMap(program => [...program.accounts.values()]) as Paths;
            case 'definedTypeNode':
                return programs.flatMap(program => [...program.definedTypes.values()]) as Paths;
            case 'pdaNode':
                return programs.flatMap(program => [...program.pdas.values()]) as Paths;
            case 'instructionNode':
                return programs.flatMap(program =>
                    [...program.instructions.values()].map(instruction => instruction.instruction),
                ) as Paths;
            case 'instructionAccountNode':
                return programs.flatMap(program =>
                    [...program.instructions.values()].flatMap(instruction => [...instruction.accounts.values()]),
                ) as Paths;
            default: {
                // Fails to type-check if a linkable kind is not handled above.
                const unhandledKind: never = linkableKind;
                throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_NODE_KIND, { kind: unhandledKind });
            }
        }
    }

    has(linkPath: NodePath<LinkNode>): boolean {
        const linkNode = getLastNodeFromPath(linkPath);
        const programDictionary = this.getProgramDictionary(linkPath);
        if (!programDictionary) return false;
        const instructionDictionary = this.getInstructionDictionary(programDictionary, linkPath);

        if (isNode(linkNode, 'accountLinkNode')) {
            return programDictionary.accounts.has(linkNode.identifier);
        } else if (isNode(linkNode, 'definedTypeLinkNode')) {
            return programDictionary.definedTypes.has(linkNode.identifier);
        } else if (isNode(linkNode, 'instructionAccountLinkNode')) {
            return !!instructionDictionary && instructionDictionary.accounts.has(linkNode.identifier);
        } else if (isNode(linkNode, 'instructionLinkNode')) {
            return programDictionary.instructions.has(linkNode.identifier);
        } else if (isNode(linkNode, 'pdaLinkNode')) {
            return programDictionary.pdas.has(linkNode.identifier);
        } else if (isNode(linkNode, 'programLinkNode')) {
            return true;
        }

        return false;
    }

    private getOrCreateProgramDictionary(linkablePath: NodePath<LinkableNode>): ProgramDictionary | undefined {
        const linkableNode = getLastNodeFromPath(linkablePath);
        const programNode = isNode(linkableNode, 'programNode') ? linkableNode : findProgramNodeFromPath(linkablePath);
        if (!programNode) return undefined;

        let programDictionary = this.programs.get(programNode.identifier);
        if (!programDictionary) {
            programDictionary = {
                accounts: new Map(),
                definedTypes: new Map(),
                instructions: new Map(),
                pdas: new Map(),
                program: getNodePathUntilLastNode(linkablePath, 'programNode')!,
            };
            this.programs.set(programNode.identifier, programDictionary);
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

        let instructionDictionary = programDictionary.instructions.get(instructionNode.identifier);
        if (!instructionDictionary) {
            instructionDictionary = {
                accounts: new Map(),
                instruction: getNodePathUntilLastNode(linkablePath, 'instructionNode')!,
            };
            programDictionary.instructions.set(instructionNode.identifier, instructionDictionary);
        }

        return instructionDictionary;
    }

    private getProgramDictionary(linkPath: NodePath<LinkNode>): ProgramDictionary | undefined {
        const linkNode = getLastNodeFromPath(linkPath);
        let programName: IdentifierString | undefined = undefined;
        if (isNode(linkNode, 'programLinkNode')) {
            programName = linkNode.identifier;
        } else if ('program' in linkNode) {
            programName = linkNode.program?.identifier;
        } else if ('instruction' in linkNode) {
            programName = linkNode.instruction?.program?.identifier;
        }
        programName = programName ?? findProgramNodeFromPath(linkPath)?.identifier;

        return programName ? this.programs.get(programName) : undefined;
    }

    private getInstructionDictionary(
        programDictionary: ProgramDictionary,
        linkPath: NodePath<LinkNode>,
    ): InstructionDictionary | undefined {
        const linkNode = getLastNodeFromPath(linkPath);
        let instructionName: IdentifierString | undefined = undefined;
        if (isNode(linkNode, 'instructionLinkNode')) {
            instructionName = linkNode.identifier;
        } else if ('instruction' in linkNode) {
            instructionName = linkNode.instruction?.identifier;
        }
        instructionName = instructionName ?? findInstructionNodeFromPath(linkPath)?.identifier;

        return instructionName ? programDictionary.instructions.get(instructionName) : undefined;
    }
}
