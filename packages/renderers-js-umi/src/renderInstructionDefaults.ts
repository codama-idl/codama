/* eslint-disable no-case-declarations */
import { camelCase, InstructionInputValueNode, isNode, pascalCase } from '@kinobi-so/nodes';
import { ResolvedInstructionInput, visit } from '@kinobi-so/visitors-core';

import { ContextMap } from './ContextMap';
import { getTypeManifestVisitor } from './getTypeManifestVisitor';
import { ImportMap } from './ImportMap';

export function renderInstructionDefaults(
    input: ResolvedInstructionInput,
    typeManifestVisitor: ReturnType<typeof getTypeManifestVisitor>,
    optionalAccountStrategy: 'omitted' | 'programId',
    argObject: string,
): {
    imports: ImportMap;
    interfaces: ContextMap;
    render: string;
} {
    const imports = new ImportMap();
    const interfaces = new ContextMap();

    if (!input.defaultValue) {
        return { imports, interfaces, render: '' };
    }

    const { defaultValue } = input;
    const render = (
        renderedValue: string,
        isWritable?: boolean,
    ): {
        imports: ImportMap;
        interfaces: ContextMap;
        render: string;
    } => {
        const inputName = camelCase(input.name);
        if (input.kind === 'instructionAccountNode' && isNode(defaultValue, 'resolverValueNode')) {
            return {
                imports,
                interfaces,
                render: `resolvedAccounts.${inputName} = { ...resolvedAccounts.${inputName}, ...${renderedValue} };`,
            };
        }
        if (input.kind === 'instructionAccountNode' && isWritable === undefined) {
            return {
                imports,
                interfaces,
                render: `resolvedAccounts.${inputName}.value = ${renderedValue};`,
            };
        }
        if (input.kind === 'instructionAccountNode') {
            return {
                imports,
                interfaces,
                render:
                    `resolvedAccounts.${inputName}.value = ${renderedValue};\n` +
                    `resolvedAccounts.${inputName}.isWritable = ${isWritable ? 'true' : 'false'}`,
            };
        }
        return {
            imports,
            interfaces,
            render: `${argObject}.${inputName} = ${renderedValue};`,
        };
    };

    switch (defaultValue.kind) {
        case 'accountValueNode':
            const name = camelCase(defaultValue.name);
            if (input.kind === 'instructionAccountNode') {
                imports.add('shared', 'expectSome');
                if (input.resolvedIsSigner && !input.isSigner) {
                    return render(`expectSome(resolvedAccounts.${name}.value).publicKey`);
                }
                return render(`expectSome(resolvedAccounts.${name}.value)`);
            }
            imports.add('shared', 'expectPublicKey');
            return render(`expectPublicKey(resolvedAccounts.${name}.value)`);
        case 'pdaValueNode':
            // Inlined PDA value.
            if (isNode(defaultValue.pda, 'pdaNode')) {
                const pdaProgram = defaultValue.pda.programId
                    ? `context.programs.getPublicKey('${defaultValue.pda.programId}', '${defaultValue.pda.programId}')`
                    : 'programId';
                const pdaSeeds = defaultValue.pda.seeds.flatMap((seed): string[] => {
                    if (isNode(seed, 'constantPdaSeedNode') && isNode(seed.value, 'programIdValueNode')) {
                        imports
                            .add('umiSerializers', 'publicKey')
                            .addAlias('umiSerializers', 'publicKey', 'publicKeySerializer');
                        return [`publicKeySerializer().serialize(${pdaProgram})`];
                    }
                    if (isNode(seed, 'constantPdaSeedNode') && !isNode(seed.value, 'programIdValueNode')) {
                        const typeManifest = visit(seed.type, typeManifestVisitor);
                        const valueManifest = visit(seed.value, typeManifestVisitor);
                        imports.mergeWith(typeManifest.serializerImports);
                        imports.mergeWith(valueManifest.valueImports);
                        return [`${typeManifest.serializer}.serialize(${valueManifest.value})`];
                    }
                    if (isNode(seed, 'variablePdaSeedNode')) {
                        const typeManifest = visit(seed.type, typeManifestVisitor);
                        const valueSeed = defaultValue.seeds.find(s => s.name === seed.name)?.value;
                        if (!valueSeed) return [];
                        if (isNode(valueSeed, 'accountValueNode')) {
                            imports.mergeWith(typeManifest.serializerImports);
                            imports.add('shared', 'expectPublicKey');
                            return [
                                `${typeManifest.serializer}.serialize(expectPublicKey(resolvedAccounts.${camelCase(valueSeed.name)}.value))`,
                            ];
                        }
                        if (isNode(valueSeed, 'argumentValueNode')) {
                            imports.mergeWith(typeManifest.serializerImports);
                            imports.add('shared', 'expectSome');
                            return [
                                `${typeManifest.serializer}.serialize(expectSome(${argObject}.${camelCase(valueSeed.name)}))`,
                            ];
                        }
                        const valueManifest = visit(valueSeed, typeManifestVisitor);
                        imports.mergeWith(typeManifest.serializerImports);
                        imports.mergeWith(valueManifest.valueImports);
                        return [`${typeManifest.serializer}.serialize(${valueManifest.value})`];
                    }
                    return [];
                });

                return render(`context.eddsa.findPda(${pdaProgram}, [${pdaSeeds.join(', ')}])`);
            }

            // Linked PDA value.
            const pdaFunction = `find${pascalCase(defaultValue.pda.name)}Pda`;
            const pdaImportFrom = defaultValue.pda.importFrom ?? 'generatedAccounts';
            imports.add(pdaImportFrom, pdaFunction);
            interfaces.add('eddsa');
            const pdaArgs = ['context'];
            const pdaSeeds = defaultValue.seeds.map((seed): string => {
                if (isNode(seed.value, 'accountValueNode')) {
                    imports.add('shared', 'expectPublicKey');
                    return `${seed.name}: expectPublicKey(resolvedAccounts.${camelCase(seed.value.name)}.value)`;
                }
                if (isNode(seed.value, 'argumentValueNode')) {
                    imports.add('shared', 'expectSome');
                    return `${seed.name}: expectSome(${argObject}.${camelCase(seed.value.name)})`;
                }
                const valueManifest = visit(seed.value, typeManifestVisitor);
                imports.mergeWith(valueManifest.valueImports);
                return `${seed.name}: ${valueManifest.value}`;
            });
            if (pdaSeeds.length > 0) {
                pdaArgs.push(`{ ${pdaSeeds.join(', ')} }`);
            }
            return render(`${pdaFunction}(${pdaArgs.join(', ')})`);
        case 'publicKeyValueNode':
            if (!defaultValue.identifier) {
                imports.add('umi', 'publicKey');
                return render(`publicKey('${defaultValue.publicKey}')`);
            }
            interfaces.add('programs');
            return render(
                `context.programs.getPublicKey('${defaultValue.identifier}', '${defaultValue.publicKey}')`,
                false,
            );
        case 'programLinkNode':
            const importFrom = defaultValue.importFrom ?? 'generatedPrograms';
            const functionName = `get${pascalCase(defaultValue.name)}ProgramId`;
            imports.add(importFrom, functionName);
            return render(`${functionName}(context)`, false);
        case 'programIdValueNode':
            if (
                optionalAccountStrategy === 'programId' &&
                input.kind === 'instructionAccountNode' &&
                input.isOptional
            ) {
                return { imports, interfaces, render: '' };
            }
            return render('programId', false);
        case 'identityValueNode':
            interfaces.add('identity');
            if (input.kind === 'instructionAccountNode' && input.isSigner !== false) {
                return render('context.identity');
            }
            return render('context.identity.publicKey');
        case 'payerValueNode':
            interfaces.add('payer');
            if (input.kind === 'instructionAccountNode' && input.isSigner !== false) {
                return render('context.payer');
            }
            return render('context.payer.publicKey');
        case 'accountBumpValueNode':
            imports.add('shared', 'expectPda');
            return render(`expectPda(resolvedAccounts.${camelCase(defaultValue.name)}.value)[1]`);
        case 'argumentValueNode':
            imports.add('shared', 'expectSome');
            return render(`expectSome(${argObject}.${camelCase(defaultValue.name)})`);
        case 'resolverValueNode':
            const resolverName = camelCase(defaultValue.name);
            const isWritable = input.kind === 'instructionAccountNode' && input.isWritable ? 'true' : 'false';
            imports.add(defaultValue.importFrom ?? 'hooked', resolverName);
            interfaces.add(['eddsa', 'identity', 'payer']);
            return render(`${resolverName}(context, resolvedAccounts, ${argObject}, programId, ${isWritable})`);
        case 'conditionalValueNode':
            const ifTrueRenderer = renderNestedInstructionDefault(
                input,
                typeManifestVisitor,
                optionalAccountStrategy,
                defaultValue.ifTrue,
                argObject,
            );
            const ifFalseRenderer = renderNestedInstructionDefault(
                input,
                typeManifestVisitor,
                optionalAccountStrategy,
                defaultValue.ifFalse,
                argObject,
            );
            if (!ifTrueRenderer && !ifFalseRenderer) {
                return { imports, interfaces, render: '' };
            }
            if (ifTrueRenderer) {
                imports.mergeWith(ifTrueRenderer.imports);
                interfaces.mergeWith(ifTrueRenderer.interfaces);
            }
            if (ifFalseRenderer) {
                imports.mergeWith(ifFalseRenderer.imports);
                interfaces.mergeWith(ifFalseRenderer.interfaces);
            }
            const negatedCondition = !ifTrueRenderer;
            let condition = 'true';

            if (isNode(defaultValue.condition, 'resolverValueNode')) {
                const conditionalResolverName = camelCase(defaultValue.condition.name);
                const conditionalIsWritable =
                    input.kind === 'instructionAccountNode' && input.isWritable ? 'true' : 'false';
                imports.add(defaultValue.condition.importFrom ?? 'hooked', conditionalResolverName);
                interfaces.add(['eddsa', 'identity', 'payer']);
                condition = `${conditionalResolverName}(context, resolvedAccounts, ${argObject}, programId, ${conditionalIsWritable})`;
                condition = negatedCondition ? `!${condition}` : condition;
            } else {
                const comparedInputName = isNode(defaultValue.condition, 'accountValueNode')
                    ? `resolvedAccounts.${camelCase(defaultValue.condition.name)}.value`
                    : `${argObject}.${camelCase(defaultValue.condition.name)}`;
                if (defaultValue.value) {
                    const comparedValue = visit(defaultValue.value, typeManifestVisitor);
                    imports.mergeWith(comparedValue.valueImports);
                    const operator = negatedCondition ? '!==' : '===';
                    condition = `${comparedInputName} ${operator} ${comparedValue.value}`;
                } else {
                    condition = negatedCondition ? `!${comparedInputName}` : comparedInputName;
                }
            }

            if (ifTrueRenderer && ifFalseRenderer) {
                return {
                    imports,
                    interfaces,
                    render: `if (${condition}) {\n${ifTrueRenderer.render}\n} else {\n${ifFalseRenderer.render}\n}`,
                };
            }

            return {
                imports,
                interfaces,
                render: `if (${condition}) {\n${ifTrueRenderer ? ifTrueRenderer.render : ifFalseRenderer?.render}\n}`,
            };
        default:
            const valueManifest = visit(defaultValue, typeManifestVisitor);
            imports.mergeWith(valueManifest.valueImports);
            return render(valueManifest.value);
    }
}

function renderNestedInstructionDefault(
    input: ResolvedInstructionInput,
    typeManifestVisitor: ReturnType<typeof getTypeManifestVisitor>,
    optionalAccountStrategy: 'omitted' | 'programId',
    defaultValue: InstructionInputValueNode | undefined,
    argObject: string,
):
    | {
          imports: ImportMap;
          interfaces: ContextMap;
          render: string;
      }
    | undefined {
    if (!defaultValue) return undefined;
    return renderInstructionDefaults(
        { ...input, defaultValue },
        typeManifestVisitor,
        optionalAccountStrategy,
        argObject,
    );
}
