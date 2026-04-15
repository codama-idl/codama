import {
    CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    CodamaError,
    logWarn,
} from '@codama/errors';
import {
    accountValueNode,
    argumentValueNode,
    camelCase,
    constantPdaSeedNodeFromBytes,
    InstructionArgumentNode,
    isNode,
    PdaSeedNode,
    PdaSeedValueNode,
    pdaSeedValueNode,
    publicKeyTypeNode,
    stringTypeNode,
    TypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { getBase58Codec } from '@solana/codecs';

import { IdlV01Seed, IdlV01TypeDef } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes';
import type { GenericsV01 } from './unwrapGenerics';

export function pdaSeedNodeFromAnchorV01(
    seed: IdlV01Seed,
    instructionArguments: InstructionArgumentNode[],
    prefix?: string,
    idlTypes: IdlV01TypeDef[] = [],
    generics: GenericsV01 = { constArgs: {}, typeArgs: {}, types: {} },
): Readonly<{ definition: PdaSeedNode; value?: PdaSeedValueNode }> | undefined {
    const kind = seed.kind;

    switch (kind) {
        case 'const':
            return {
                definition: constantPdaSeedNodeFromBytes('base58', getBase58Codec().decode(new Uint8Array(seed.value))),
            };
        case 'account': {
            const pathParts = seed.path.split('.');
            const [accountName] = pathParts;
            const prefixedAccountName = prefix ? `${prefix}_${accountName}` : accountName;

            if (pathParts.length > 1) {
                const accountTypeName = seed.account ?? accountName;
                const rootType = typeNodeFromAnchorV01({ defined: { name: accountTypeName } }, generics);
                const resolved = resolveNestedFieldType(rootType, pathParts.slice(1), idlTypes, generics);
                if (!resolved) {
                    logWarn(`Could not resolve nested account path "${seed.path}" for PDA seed.`);
                    return undefined;
                }
                const combinedName = camelCase(`${prefixedAccountName}_${pathParts[pathParts.length - 1]}`);
                return {
                    definition: variablePdaSeedNode(combinedName, resolved),
                    value: pdaSeedValueNode(combinedName, accountValueNode(prefixedAccountName)),
                };
            }

            return {
                definition: variablePdaSeedNode(prefixedAccountName, publicKeyTypeNode()),
                value: pdaSeedValueNode(prefixedAccountName, accountValueNode(prefixedAccountName)),
            };
        }
        case 'arg': {
            const pathParts = seed.path.split('.');
            const argumentName = camelCase(pathParts.length > 1 ? pathParts.slice(1).join('_') : pathParts[0]);

            let argumentType: TypeNode;
            if (pathParts.length > 1) {
                const rootArgName = camelCase(pathParts[0]);
                const rootArgNode = instructionArguments.find(({ name }) => name === rootArgName);
                if (!rootArgNode) {
                    throw new CodamaError(CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: pathParts[0] });
                }
                const resolved = resolveNestedFieldType(rootArgNode.type, pathParts.slice(1), idlTypes, generics);
                if (!resolved) {
                    logWarn(`Could not resolve nested arg path "${seed.path}" for PDA seed.`);
                    return undefined;
                }
                argumentType = resolved;
            } else {
                const argumentNode = instructionArguments.find(({ name }) => name === argumentName);
                if (!argumentNode) {
                    throw new CodamaError(CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: pathParts[0] });
                }
                argumentType = argumentNode.type;
            }

            // Anchor uses unprefixed strings for PDA seeds.
            if (
                isNode(argumentType, 'sizePrefixTypeNode') &&
                isNode(argumentType.type, 'stringTypeNode') &&
                argumentType.type.encoding === 'utf8' &&
                isNode(argumentType.prefix, 'numberTypeNode') &&
                argumentType.prefix.format === 'u32'
            ) {
                argumentType = stringTypeNode('utf8');
            }

            if (pathParts.length > 1) {
                return {
                    definition: variablePdaSeedNode(argumentName, argumentType),
                    value: pdaSeedValueNode(argumentName, argumentValueNode(argumentName)),
                };
            }

            return {
                definition: variablePdaSeedNode(argumentName, argumentType),
                value: pdaSeedValueNode(argumentName, argumentValueNode(argumentName)),
            };
        }
        default:
            throw new CodamaError(CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
    }
}

function resolveNestedFieldType(
    rootType: TypeNode,
    fieldPath: string[],
    idlTypes: IdlV01TypeDef[],
    generics: GenericsV01,
): TypeNode | undefined {
    let currentType = rootType;

    for (const fieldName of fieldPath) {
        const target = camelCase(fieldName);

        // Resolve type links before handling struct/tuple field lookup.
        if (isNode(currentType, 'definedTypeLinkNode')) {
            const linkName = currentType.name;
            const typeDef = idlTypes.find(t => camelCase(t.name) === linkName);
            if (!typeDef) return undefined;
            currentType = typeNodeFromAnchorV01(typeDef.type, generics);
        }

        if (isNode(currentType, 'structTypeNode')) {
            const field = currentType.fields.find(f => f.name === target);
            if (!field) return undefined;
            currentType = field.type;
            continue;
        }

        if (isNode(currentType, 'tupleTypeNode')) {
            const index = Number(fieldName);
            if (Number.isNaN(index) || index < 0 || index >= currentType.items.length) return undefined;
            currentType = currentType.items[index];
            continue;
        }

        return undefined;
    }

    return currentType;
}
