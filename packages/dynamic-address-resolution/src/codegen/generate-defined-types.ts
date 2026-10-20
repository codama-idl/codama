import {
    type DefinedTypeNode,
    getLastNodeFromPath,
    getLinkablesFromNode,
    type NodePath,
    type RootNode,
    type TypeNode,
} from 'codama';

import { getDefinedTypeAliasName, getTypeScriptType } from './codama-type-to-ts';
import { collectPdaNodesFromIdl } from './collect-pda-nodes';
import { getVariableSeedNodes, getVariableSeedTypePath } from './generate-pda-types';

/**
 * Generate the type aliases of the recursive defined types that the types of
 * `generateResolutionInputTypes` and `generatePdaTypes` reference by name, since
 * inlining them would never end. Emit them once alongside these types. Returns
 * an empty string when they reference no recursive type.
 *
 * @example
 * ```ts
 * // Given `node = struct { next: option<link(node)> }`, used by the data of an instruction.
 * generateDefinedTypes(idl); // 'export type NodeArgs = { next?: NodeArgs | null };\n\n'
 * ```
 */
export function generateDefinedTypes(idl: RootNode): string {
    const linkables = getLinkablesFromNode(idl);
    const aliases = new Map<DefinedTypeNode, NodePath<DefinedTypeNode>>();
    const onAlias = (path: NodePath<DefinedTypeNode>) => {
        const definedType = getLastNodeFromPath(path);
        if (!aliases.has(definedType)) aliases.set(definedType, path);
    };

    // Collect the aliases referenced by the instruction data and PDA seed types. These type paths
    // must mirror every `codamaTypeToTS` call site of the other generators, namely the instruction
    // data of `generateResolutionInputTypes` and the variable PDA seeds of `generatePdaTypes`, or
    // the aliases they reference would never be emitted. Update them together.
    const typePaths: NodePath<TypeNode>[] = [
        ...(idl.program.instructions ?? []).flatMap(ix => (ix.data ? [[idl, idl.program, ix, ix.data] as const] : [])),
        ...[...collectPdaNodesFromIdl(idl).values()].flatMap(pda =>
            getVariableSeedNodes(pda).map(seed => getVariableSeedTypePath(idl, pda, seed)),
        ),
    ];
    for (const typePath of typePaths) {
        getTypeScriptType(typePath, { definedTypes: [], linkables, onAlias });
    }

    // Aliases may reference other aliases, which maps iterate over once added.
    let output = '';
    for (const [definedType, path] of aliases) {
        const type = getTypeScriptType([...path, definedType.type], {
            definedTypes: [definedType],
            linkables,
            onAlias,
        });
        output += `export type ${getDefinedTypeAliasName(path)} = ${type};\n\n`;
    }
    return output;
}
