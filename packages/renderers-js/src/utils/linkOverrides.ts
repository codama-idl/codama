import { KINOBI_ERROR__UNEXPECTED_NODE_KIND, KinobiError } from '@kinobi-so/errors';
import { LINK_NODES, LinkNode, ResolverValueNode } from '@kinobi-so/nodes';

import { ParsedCustomDataOptions } from './customData';

export type LinkOverrides = {
    accounts?: Record<string, string>;
    definedTypes?: Record<string, string>;
    pdas?: Record<string, string>;
    programs?: Record<string, string>;
    resolvers?: Record<string, string>;
};

export type GetImportFromFunction = (node: LinkNode | ResolverValueNode, fallback?: string) => string;

export function getImportFromFactory(
    overrides: LinkOverrides,
    customAccountData: ParsedCustomDataOptions,
    customInstructionData: ParsedCustomDataOptions,
): GetImportFromFunction {
    const customDataOverrides = Object.fromEntries(
        [...customAccountData.values(), ...customInstructionData.values()].map(({ importFrom, importAs }) => [
            importAs,
            importFrom,
        ]),
    );
    const linkOverrides = {
        accounts: overrides.accounts ?? {},
        definedTypes: { ...customDataOverrides, ...overrides.definedTypes },
        pdas: overrides.pdas ?? {},
        programs: overrides.programs ?? {},
        resolvers: overrides.resolvers ?? {},
    };

    return (node: LinkNode | ResolverValueNode) => {
        const kind = node.kind;
        switch (kind) {
            case 'accountLinkNode':
                return linkOverrides.accounts[node.name] ?? 'generatedAccounts';
            case 'definedTypeLinkNode':
                return linkOverrides.definedTypes[node.name] ?? 'generatedTypes';
            case 'pdaLinkNode':
                return linkOverrides.pdas[node.name] ?? 'generatedPdas';
            case 'programLinkNode':
                return linkOverrides.programs[node.name] ?? 'generatedPrograms';
            case 'resolverValueNode':
                return linkOverrides.resolvers[node.name] ?? 'hooked';
            default:
                throw new KinobiError(KINOBI_ERROR__UNEXPECTED_NODE_KIND, {
                    expectedKinds: [...LINK_NODES, 'resolverValueNode'],
                    kind: kind satisfies never,
                    node,
                });
        }
    };
}