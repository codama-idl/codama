/* eslint-disable no-case-declarations */
import { camelCase, InstructionInputValueNode, isNode, OptionalAccountStrategy } from '@codama/nodes';
import { mapFragmentContent, setFragmentContent } from '@codama/renderers-core';
import { pipe, ResolvedInstructionInput, visit } from '@codama/visitors-core';

import { GlobalFragmentScope } from '../getRenderMapVisitor';
import {
    addFragmentFeatures,
    addFragmentImports,
    Fragment,
    fragment,
    isAsyncDefaultValue,
    mergeFragmentImports,
    mergeFragments,
} from '../utils';

export function getInstructionInputDefaultFragment(
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi' | 'typeManifestVisitor'> & {
        input: ResolvedInstructionInput;
        optionalAccountStrategy: OptionalAccountStrategy;
        useAsync: boolean;
    },
): Fragment {
    const { input, optionalAccountStrategy, asyncResolvers, useAsync, nameApi, typeManifestVisitor, getImportFrom } =
        scope;
    if (!input.defaultValue) {
        return fragment('');
    }

    if (!useAsync && isAsyncDefaultValue(input.defaultValue, asyncResolvers)) {
        return fragment('');
    }

    const { defaultValue } = input;
    const defaultFragment = (renderedValue: string, isWritable?: boolean): Fragment => {
        const inputName = camelCase(input.name);
        if (input.kind === 'instructionAccountNode' && isNode(defaultValue, 'resolverValueNode')) {
            return fragment(`accounts.${inputName} = { ...accounts.${inputName}, ...${renderedValue} };`);
        }
        if (input.kind === 'instructionAccountNode' && isWritable === undefined) {
            return fragment(`accounts.${inputName}.value = ${renderedValue};`);
        }
        if (input.kind === 'instructionAccountNode') {
            return fragment(
                `accounts.${inputName}.value = ${renderedValue};\n` +
                    `accounts.${inputName}.isWritable = ${isWritable ? 'true' : 'false'}`,
            );
        }
        return fragment(`args.${inputName} = ${renderedValue};`);
    };

    switch (defaultValue.kind) {
        case 'accountValueNode':
            const name = camelCase(defaultValue.name);
            if (input.kind === 'instructionAccountNode' && input.resolvedIsSigner && !input.isSigner) {
                return pipe(defaultFragment(`expectTransactionSigner(accounts.${name}.value).address`), f =>
                    addFragmentImports(f, 'shared', ['expectTransactionSigner']),
                );
            }
            if (input.kind === 'instructionAccountNode') {
                return pipe(defaultFragment(`expectSome(accounts.${name}.value)`), f =>
                    addFragmentImports(f, 'shared', ['expectSome']),
                );
            }
            return pipe(defaultFragment(`expectAddress(accounts.${name}.value)`), f =>
                addFragmentImports(f, 'shared', ['expectAddress']),
            );

        case 'pdaValueNode':
            // Inlined PDA value.
            if (isNode(defaultValue.pda, 'pdaNode')) {
                const pdaProgram = defaultValue.pda.programId
                    ? pipe(fragment(`'${defaultValue.pda.programId}' as Address<'${defaultValue.pda.programId}'>`), f =>
                          addFragmentImports(f, 'solanaAddresses', ['type Address']),
                      )
                    : fragment('programAddress');
                const pdaSeeds = defaultValue.pda.seeds.flatMap((seed): Fragment[] => {
                    if (isNode(seed, 'constantPdaSeedNode') && isNode(seed.value, 'programIdValueNode')) {
                        return [
                            pipe(
                                fragment(`getAddressEncoder().encode(${pdaProgram.content})`),
                                f => mergeFragmentImports(f, [pdaProgram.imports]),
                                f => addFragmentImports(f, 'solanaAddresses', ['getAddressEncoder']),
                            ),
                        ];
                    }
                    if (isNode(seed, 'constantPdaSeedNode') && !isNode(seed.value, 'programIdValueNode')) {
                        const typeManifest = visit(seed.type, typeManifestVisitor);
                        const valueManifest = visit(seed.value, typeManifestVisitor);
                        return [
                            pipe(
                                fragment(`${typeManifest.encoder.content}.encode(${valueManifest.value.content})`),
                                f =>
                                    mergeFragmentImports(f, [
                                        typeManifest.encoder.imports,
                                        valueManifest.value.imports,
                                    ]),
                            ),
                        ];
                    }
                    if (isNode(seed, 'variablePdaSeedNode')) {
                        const typeManifest = visit(seed.type, typeManifestVisitor);
                        const valueSeed = defaultValue.seeds.find(s => s.name === seed.name)?.value;
                        if (!valueSeed) return [];
                        if (isNode(valueSeed, 'accountValueNode')) {
                            return [
                                pipe(
                                    fragment(
                                        `${typeManifest.encoder.content}.encode(expectAddress(accounts.${camelCase(valueSeed.name)}.value))`,
                                    ),
                                    f => mergeFragmentImports(f, [typeManifest.encoder.imports]),
                                    f => addFragmentImports(f, 'shared', ['expectAddress']),
                                ),
                            ];
                        }
                        if (isNode(valueSeed, 'argumentValueNode')) {
                            return [
                                pipe(
                                    fragment(
                                        `${typeManifest.encoder.content}.encode(expectSome(args.${camelCase(valueSeed.name)}))`,
                                    ),
                                    f => mergeFragmentImports(f, [typeManifest.encoder.imports]),
                                    f => addFragmentImports(f, 'shared', ['expectSome']),
                                ),
                            ];
                        }
                        const valueManifest = visit(valueSeed, typeManifestVisitor);
                        return [
                            pipe(
                                fragment(`${typeManifest.encoder.content}.encode(${valueManifest.value.content})`),
                                f =>
                                    mergeFragmentImports(f, [
                                        typeManifest.encoder.imports,
                                        valueManifest.value.imports,
                                    ]),
                            ),
                        ];
                    }
                    return [];
                });
                return pipe(
                    mergeFragments([pdaProgram, ...pdaSeeds], ([p, ...s]) => {
                        const programAddress = p === 'programAddress' ? p : `programAddress: ${p}`;
                        return `await getProgramDerivedAddress({ ${programAddress}, seeds: [${s.join(', ')}] })`;
                    }),
                    f => addFragmentImports(f, 'solanaAddresses', ['getProgramDerivedAddress']),
                    f => mapFragmentContent(f, c => defaultFragment(c).content),
                );
            }

            // Linked PDA value.
            const pdaFunction = nameApi.pdaFindFunction(defaultValue.pda.name);
            const pdaArgs = [];
            const pdaSeeds = defaultValue.seeds.map((seed): Fragment => {
                if (isNode(seed.value, 'accountValueNode')) {
                    return pipe(
                        fragment(`${seed.name}: expectAddress(accounts.${camelCase(seed.value.name)}.value)`),
                        f => addFragmentImports(f, 'shared', ['expectAddress']),
                    );
                }
                if (isNode(seed.value, 'argumentValueNode')) {
                    return pipe(fragment(`${seed.name}: expectSome(args.${camelCase(seed.value.name)})`), f =>
                        addFragmentImports(f, 'shared', ['expectSome']),
                    );
                }
                return pipe(visit(seed.value, typeManifestVisitor).value, f =>
                    mapFragmentContent(f, c => `${seed.name}: ${c}`),
                );
            });
            const pdaSeedsFragment = pipe(
                mergeFragments(pdaSeeds, renders => renders.join(', ')),
                f => mapFragmentContent(f, c => `{ ${c} }`),
            );
            if (pdaSeeds.length > 0) {
                pdaArgs.push(pdaSeedsFragment.content);
            }
            const module = getImportFrom(defaultValue.pda);
            return pipe(
                defaultFragment(`await ${pdaFunction}(${pdaArgs.join(', ')})`),
                f => mergeFragmentImports(f, [pdaSeedsFragment.imports]),
                f => addFragmentImports(f, module, [pdaFunction]),
            );

        case 'publicKeyValueNode':
            return pipe(defaultFragment(`'${defaultValue.publicKey}' as Address<'${defaultValue.publicKey}'>`), f =>
                addFragmentImports(f, 'solanaAddresses', ['type Address']),
            );

        case 'programLinkNode':
            const programAddress = nameApi.programAddressConstant(defaultValue.name);
            return pipe(defaultFragment(programAddress, false), f =>
                addFragmentImports(f, getImportFrom(defaultValue), [programAddress]),
            );

        case 'programIdValueNode':
            if (
                optionalAccountStrategy === 'programId' &&
                input.kind === 'instructionAccountNode' &&
                input.isOptional
            ) {
                return fragment('');
            }
            return defaultFragment('programAddress', false);

        case 'identityValueNode':
        case 'payerValueNode':
            return fragment('');

        case 'accountBumpValueNode':
            return pipe(
                defaultFragment(`expectProgramDerivedAddress(accounts.${camelCase(defaultValue.name)}.value)[1]`),
                f => addFragmentImports(f, 'shared', ['expectProgramDerivedAddress']),
            );

        case 'argumentValueNode':
            return pipe(defaultFragment(`expectSome(args.${camelCase(defaultValue.name)})`), f =>
                addFragmentImports(f, 'shared', ['expectSome']),
            );

        case 'resolverValueNode':
            const resolverFunction = nameApi.resolverFunction(defaultValue.name);
            const resolverAwait = useAsync && asyncResolvers.includes(defaultValue.name) ? 'await ' : '';
            return pipe(
                defaultFragment(`${resolverAwait}${resolverFunction}(resolverScope)`),
                f => addFragmentImports(f, getImportFrom(defaultValue), [resolverFunction]),
                f => addFragmentFeatures(f, ['instruction:resolverScopeVariable']),
            );

        case 'conditionalValueNode':
            const ifTrueRenderer = renderNestedInstructionDefault({
                ...scope,
                defaultValue: defaultValue.ifTrue,
            });
            const ifFalseRenderer = renderNestedInstructionDefault({
                ...scope,
                defaultValue: defaultValue.ifFalse,
            });
            if (!ifTrueRenderer && !ifFalseRenderer) {
                return fragment('');
            }
            let conditionalFragment = fragment('');
            if (ifTrueRenderer) {
                conditionalFragment = mergeFragments([conditionalFragment, ifTrueRenderer], c => c[0]);
            }
            if (ifFalseRenderer) {
                conditionalFragment = mergeFragments([conditionalFragment, ifFalseRenderer], c => c[0]);
            }
            const negatedCondition = !ifTrueRenderer;
            let condition = 'true';

            if (isNode(defaultValue.condition, 'resolverValueNode')) {
                const conditionalResolverFunction = nameApi.resolverFunction(defaultValue.condition.name);
                const module = getImportFrom(defaultValue.condition);
                conditionalFragment = pipe(
                    conditionalFragment,
                    f => addFragmentImports(f, module, [conditionalResolverFunction]),
                    f => addFragmentFeatures(f, ['instruction:resolverScopeVariable']),
                );
                const conditionalResolverAwait =
                    useAsync && asyncResolvers.includes(defaultValue.condition.name) ? 'await ' : '';
                condition = `${conditionalResolverAwait}${conditionalResolverFunction}(resolverScope)`;
                condition = negatedCondition ? `!${condition}` : condition;
            } else {
                const comparedInputName = isNode(defaultValue.condition, 'accountValueNode')
                    ? `accounts.${camelCase(defaultValue.condition.name)}.value`
                    : `args.${camelCase(defaultValue.condition.name)}`;
                if (defaultValue.value) {
                    const comparedValue = visit(defaultValue.value, typeManifestVisitor).value;
                    conditionalFragment = mergeFragments([conditionalFragment, comparedValue], c => c[0]);
                    const operator = negatedCondition ? '!==' : '===';
                    condition = `${comparedInputName} ${operator} ${comparedValue.content}`;
                } else {
                    condition = negatedCondition ? `!${comparedInputName}` : comparedInputName;
                }
            }

            if (ifTrueRenderer && ifFalseRenderer) {
                return setFragmentContent(
                    conditionalFragment,
                    `if (${condition}) {\n${ifTrueRenderer.content}\n} else {\n${ifFalseRenderer.content}\n}`,
                );
            }

            return setFragmentContent(
                conditionalFragment,
                `if (${condition}) {\n${ifTrueRenderer ? ifTrueRenderer.content : ifFalseRenderer?.content}\n}`,
            );

        default:
            const valueManifest = visit(defaultValue, typeManifestVisitor).value;
            return pipe(valueManifest, f => mapFragmentContent(f, c => defaultFragment(c).content));
    }
}

function renderNestedInstructionDefault(
    scope: Parameters<typeof getInstructionInputDefaultFragment>[0] & {
        defaultValue: InstructionInputValueNode | undefined;
    },
): Fragment | undefined {
    const { input, defaultValue } = scope;
    if (!defaultValue) return undefined;
    return getInstructionInputDefaultFragment({
        ...scope,
        input: { ...input, defaultValue },
    });
}
