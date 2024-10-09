import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';
import {
    AccountLinkNode,
    DefinedTypeLinkNode,
    InstructionLinkNode,
    PdaLinkNode,
    ProgramLinkNode,
    ResolverValueNode,
} from '@codama/nodes';

export type LinkOverrides = {
    accounts?: Record<string, string>;
    definedTypes?: Record<string, string>;
    instructions?: Record<string, string>;
    pdas?: Record<string, string>;
    programs?: Record<string, string>;
    resolvers?: Record<string, string>;
};

type OverridableNodes =
    | AccountLinkNode
    | DefinedTypeLinkNode
    | InstructionLinkNode
    | PdaLinkNode
    | ProgramLinkNode
    | ResolverValueNode;

export type GetImportFromFunction = (node: OverridableNodes, fallback?: string) => string;

export function getImportFromFactory(overrides: LinkOverrides): GetImportFromFunction {
    const linkOverrides = {
        accounts: overrides.accounts ?? {},
        definedTypes: overrides.definedTypes ?? {},
        instructions: overrides.instructions ?? {},
        pdas: overrides.pdas ?? {},
        programs: overrides.programs ?? {},
        resolvers: overrides.resolvers ?? {},
    };

    return (node: OverridableNodes) => {
        const kind = node.kind;
        switch (kind) {
            case 'accountLinkNode':
                return linkOverrides.accounts[node.name] ?? 'generatedAccounts';
            case 'definedTypeLinkNode':
                return linkOverrides.definedTypes[node.name] ?? 'generatedTypes';
            case 'instructionLinkNode':
                return linkOverrides.instructions[node.name] ?? 'generatedInstructions';
            case 'pdaLinkNode':
                return linkOverrides.pdas[node.name] ?? 'generatedAccounts';
            case 'programLinkNode':
                return linkOverrides.programs[node.name] ?? 'generatedPrograms';
            case 'resolverValueNode':
                return linkOverrides.resolvers[node.name] ?? 'hooked';
            default:
                throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                    expectedKinds: [
                        'AccountLinkNode',
                        'DefinedTypeLinkNode',
                        'InstructionLinkNode',
                        'PdaLinkNode',
                        'ProgramLinkNode',
                        'resolverValueNode',
                    ],
                    kind: kind satisfies never,
                    node,
                });
        }
    };
}
