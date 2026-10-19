import {
    type DefinedTypeLinkNode,
    type DefinedTypeNode,
    findProgramNodeFromPath,
    getLastNodeFromPath,
    getLinkablesFromNode,
    isNode,
    type LinkableDictionary,
    type NodePath,
    pascalCase,
    type TypeNode,
} from 'codama';

import { OPTIONAL_NODE_KINDS } from '../shared/nodes';

/**
 * Convert a Codama type to the TypeScript type of the values its codec
 * encodes, e.g. `integerTypeNode('u64')` gives `number | bigint`.
 *
 * Linked types are resolved from the given path, following the program of
 * their link if any, and inlined. Recursive types are referenced by the name
 * of their alias instead, e.g. `NodeArgs`, which `generateDefinedTypes` emits.
 * Links that do not resolve give `unknown`.
 *
 * @param path - The path of the type from the root node, e.g. `[root, program, instruction, instruction.data]`.
 * @param linkables - The linkable nodes of the tree, recorded from the root of the path unless given.
 *
 * @example
 * ```ts
 * codamaTypeToTS([root, program, instruction, instruction.data]); // '{ amount: number | bigint }'
 * ```
 */
export function codamaTypeToTS(
    path: NodePath<TypeNode>,
    linkables: LinkableDictionary = getLinkablesFromNode(path[0]),
): string {
    return getTypeScriptType(path, { definedTypes: [], linkables });
}

/**
 * The name of the alias of a recursive defined type, from its path. Defined
 * types of the main program are named after their identifier, e.g. `NodeArgs`,
 * and those of additional programs are prefixed with the name of their
 * program, e.g. `OtherProgramNodeArgs`.
 */
export function getDefinedTypeAliasName(path: NodePath<DefinedTypeNode>): string {
    const definedType = getLastNodeFromPath(path);
    const program = findProgramNodeFromPath(path);
    const isMainProgram = isNode(path[0], 'rootNode') && path[0].program === program;
    const prefix = program && !isMainProgram ? pascalCase(program.identifier) : '';
    return `${prefix}${pascalCase(definedType.identifier)}Args`;
}

export type TypeScriptTypeContext = {
    /** The defined types being inlined, from the outermost one, used to detect recursion. */
    definedTypes: readonly DefinedTypeNode[];
    linkables: LinkableDictionary;
    /** Called with the path of every recursive defined type referenced by its alias. */
    onAlias?: (path: NodePath<DefinedTypeNode>) => void;
};

/** Implementation of {@link codamaTypeToTS}, also used to collect the aliases of recursive types. */
export function getTypeScriptType(path: NodePath<TypeNode>, ctx: TypeScriptTypeContext): string {
    const type = getLastNodeFromPath(path);
    const toTS = (childPath: readonly [...NodePath, TypeNode]) =>
        getTypeScriptType(childPath as NodePath<TypeNode>, ctx);

    switch (type.kind) {
        case 'integerTypeNode':
        case 'fixedPointTypeNode':
        case 'dateTimeTypeNode':
        case 'durationTypeNode':
            return 'number | bigint';
        case 'floatTypeNode':
            return 'number';
        case 'publicKeyTypeNode':
            return 'Address';
        case 'stringTypeNode':
            return 'string';
        case 'booleanTypeNode':
            return 'boolean';
        case 'optionTypeNode':
        case 'remainderOptionTypeNode':
        case 'zeroableOptionTypeNode':
            return `${toTS([...path, type.item])} | null`;
        case 'bytesTypeNode':
            return 'Uint8Array';
        case 'structTypeNode': {
            // Omitted fields always encode their default value, and fields with a default value may be omitted.
            const fields = (type.fields ?? [])
                .filter(field => field.defaultValueStrategy !== 'omitted' || field.defaultValue === undefined)
                .map(field => {
                    const isOptional =
                        field.defaultValue !== undefined || OPTIONAL_NODE_KINDS.includes(field.type.kind);
                    return `${field.identifier}${isOptional ? '?' : ''}: ${toTS([...path, field, field.type])}`;
                });
            return fields.length === 0 ? '{}' : `{ ${fields.join('; ')} }`;
        }
        case 'enumTypeNode': {
            const variants = type.variants ?? [];
            if (variants.length === 0) return 'unknown /** empty variants in enumTypeNode */';
            // Variants without data may be encoded from their identifier.
            if (variants.every(variant => variant.data === undefined)) {
                return variants.map(variant => `'${variant.identifier}'`).join(' | ');
            }
            return variants
                .map(variant =>
                    variant.data === undefined
                        ? `{ __kind: '${variant.identifier}' }`
                        : `{ __kind: '${variant.identifier}'; data: ${toTS([...path, variant, variant.data])} }`,
                )
                .join(' | ');
        }
        case 'tupleTypeNode': {
            const items = (type.items ?? []).map(item => toTS([...path, item]));
            return `[${items.join(', ')}]`;
        }
        case 'arrayTypeNode':
        case 'setTypeNode': {
            const itemType = toTS([...path, type.item]);
            const needsParens = itemType.includes(' | ') || itemType.includes(' & ');
            return needsParens ? `(${itemType})[]` : `${itemType}[]`;
        }
        case 'mapTypeNode':
            return `Record<string, ${toTS([...path, type.value])}>`;
        case 'definedTypeLinkNode': {
            const definedTypePath = ctx.linkables.getPath(path as NodePath<DefinedTypeLinkNode>);
            if (!definedTypePath) return 'unknown /** DefinedTypeNode not found for definedTypeLinkNode */';
            const definedType = getLastNodeFromPath(definedTypePath);
            // A defined type linking back to itself is referenced by its alias, so its type is finite.
            if (ctx.definedTypes.includes(definedType)) {
                ctx.onAlias?.(definedTypePath);
                return getDefinedTypeAliasName(definedTypePath);
            }
            return getTypeScriptType([...definedTypePath, definedType.type], {
                ...ctx,
                definedTypes: [...ctx.definedTypes, definedType],
            });
        }
        default:
            type['kind'] satisfies never;
            return 'unknown';
    }
}
