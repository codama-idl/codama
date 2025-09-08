import { camelCase, isNode, isNodeFilter, PdaNode, PdaSeedNode } from '@codama/nodes';
import { findProgramNodeFromPath, getLastNodeFromPath, NodePath, visit } from '@codama/visitors-core';

import { Fragment, fragment, getDocblockFragment, mergeFragments, RenderScope, use } from '../utils';

export function getPdaFunctionFragment(
    scope: Pick<RenderScope, 'nameApi' | 'typeManifestVisitor'> & {
        pdaPath: NodePath<PdaNode>;
    },
): Fragment {
    const pdaNode = getLastNodeFromPath(scope.pdaPath);
    const seeds = parsePdaSeedNodes(pdaNode.seeds, scope);

    return mergeFragments([getSeedInputTypeFragment(seeds, scope), getFunctionFragment(seeds, scope)], cs =>
        cs.join('\n\n'),
    );
}

function getSeedInputTypeFragment(
    seeds: ParsedPdaSeedNode[],
    scope: Pick<RenderScope, 'nameApi' | 'typeManifestVisitor'> & {
        pdaPath: NodePath<PdaNode>;
    },
): Fragment | undefined {
    const variableSeeds = seeds.filter(isNodeFilter('variablePdaSeedNode'));
    if (variableSeeds.length === 0) return;

    const pdaNode = getLastNodeFromPath(scope.pdaPath);
    const seedTypeName = scope.nameApi.pdaSeedsType(pdaNode.name);
    const seedAttributes = mergeFragments(
        variableSeeds.map(seed => seed.inputAttribute),
        cs => cs.join('\n'),
    );

    return fragment`export type ${seedTypeName} = {\n${seedAttributes}\n};`;
}

function getFunctionFragment(
    seeds: ParsedPdaSeedNode[],
    scope: Pick<RenderScope, 'nameApi' | 'typeManifestVisitor'> & {
        pdaPath: NodePath<PdaNode>;
    },
): Fragment {
    const pdaNode = getLastNodeFromPath(scope.pdaPath);
    const programNode = findProgramNodeFromPath(scope.pdaPath)!;

    const addressType = use('type Address', 'solanaAddresses');
    const pdaType = use('type ProgramDerivedAddress', 'solanaAddresses');
    const getPdaFunction = use('getProgramDerivedAddress', 'solanaAddresses');

    const seedTypeName = scope.nameApi.pdaSeedsType(pdaNode.name);
    const findPdaFunction = scope.nameApi.pdaFindFunction(pdaNode.name);

    const docs = getDocblockFragment(pdaNode.docs ?? [], true);
    const hasVariableSeeds = seeds.filter(isNodeFilter('variablePdaSeedNode')).length > 0;
    const seedArgument = hasVariableSeeds ? `seeds: ${seedTypeName}, ` : '';
    const programAddress = pdaNode.programId ?? programNode.publicKey;
    const encodedSeeds = mergeFragments(
        seeds.map(s => s.encodedValue),
        cs => cs.join(', '),
    );

    return fragment`${docs}export async function ${findPdaFunction}(${seedArgument}config: { programAddress?: ${addressType} | undefined } = {}): Promise<${pdaType}> {
  const { programAddress = '${programAddress}' as ${addressType}<'${programAddress}'> } = config;
  return await ${getPdaFunction}({ programAddress, seeds: [${encodedSeeds}]});
}`;
}

type ParsedPdaSeedNode = PdaSeedNode & {
    encodedValue: Fragment;
    inputAttribute?: Fragment;
};

function parsePdaSeedNodes(seeds: PdaSeedNode[], scope: Pick<RenderScope, 'typeManifestVisitor'>): ParsedPdaSeedNode[] {
    return seeds.map(seed => {
        if (isNode(seed, 'variablePdaSeedNode')) {
            const name = camelCase(seed.name);
            const docs = getDocblockFragment(seed.docs ?? [], true);
            const { encoder, looseType } = visit(seed.type, scope.typeManifestVisitor);
            return {
                ...seed,
                encodedValue: fragment`${encoder}.encode(seeds.${name})`,
                inputAttribute: fragment`${docs}${name}: ${looseType};`,
            };
        }

        if (isNode(seed.value, 'programIdValueNode')) {
            const addressEncoder = use('getAddressEncoder', 'solanaAddresses');
            return { ...seed, encodedValue: fragment`${addressEncoder}().encode(programAddress)` };
        }

        const { encoder } = visit(seed.type, scope.typeManifestVisitor);
        const { value } = visit(seed.value, scope.typeManifestVisitor);
        return { ...seed, encodedValue: fragment`${encoder}.encode(${value})` };
    });
}
