import { CodamaError } from '@codama/errors';
import { isNode, REGISTERED_NODE_KINDS } from '@codama/nodes';
import {
    extendVisitor,
    getResolvedInstructionInputsVisitor,
    LinkableDictionary,
    mergeVisitor,
    NodeStack,
    pipe,
    ProvidedScope,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    recordProvidedScopeVisitor,
    ResolvedInstructionInput,
    visit,
    Visitor,
} from '@codama/visitors-core';

import { getIdentifierCollisionItems } from './identifierCollisions';
import { ValidationItem, validationItem } from './ValidationItem';

export function getValidationItemsVisitor(): Visitor<readonly ValidationItem[]> {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();
    const scope = new ProvidedScope();

    return pipe(
        mergeVisitor(
            () => [] as readonly ValidationItem[],
            (_, items) => items.flat(),
        ),
        v =>
            extendVisitor(v, {
                visitAccount(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.identifier) {
                        items.push(validationItem('error', 'Account has no identifier.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitDefinedType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.identifier) {
                        items.push(validationItem('error', 'Defined type has no identifier.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitDefinedTypeLink(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.identifier) {
                        items.push(
                            validationItem('error', 'Pointing to a defined type with no identifier.', node, stack),
                        );
                    } else if (!linkables.has(stack.getPath(node.kind))) {
                        items.push(
                            validationItem(
                                'error',
                                `Pointing to a missing defined type named "${node.identifier}"`,
                                node,
                                stack,
                            ),
                        );
                    }
                    return [...items, ...next(node)];
                },

                visitEnumType(node, { next }) {
                    const items = [] as ValidationItem[];
                    const variants = node.variants ?? [];
                    if (variants.length === 0) {
                        items.push(validationItem('warn', 'Enum has no variants.', node, stack));
                    }
                    items.push(...getIdentifierCollisionItems(variants, 'Enum variant', '', stack));
                    return [...items, ...next(node)];
                },

                visitEnumVariantType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.identifier) {
                        items.push(validationItem('error', 'Enum variant has no identifier.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitError(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.identifier) {
                        items.push(validationItem('error', 'Error has no identifier.', node, stack));
                    }
                    if (typeof node.code !== 'number') {
                        items.push(validationItem('error', 'Error has no code.', node, stack));
                    }
                    if (!node.message) {
                        items.push(validationItem('warn', 'Error has no message.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitInjectedValue(node, { next }) {
                    const items = [] as ValidationItem[];
                    // Only injections consumed within an instruction have a
                    // known final context to resolve against. Injections
                    // within a provided node or another injection's fallback
                    // are resolved as part of the value that consumes them.
                    const ancestors = stack.getPath().slice(0, -1);
                    const isWithinInstruction = ancestors.some(ancestor => isNode(ancestor, 'instructionNode'));
                    const isNested = ancestors.some(ancestor =>
                        isNode(ancestor, ['providedNode', 'injectedValueNode']),
                    );
                    if (isWithinInstruction && !isNested) {
                        if (scope.resolve(node, { kinds: REGISTERED_NODE_KINDS }) === undefined) {
                            items.push(
                                validationItem(
                                    'error',
                                    `Injected value "${node.key}" is not provided and has no fallback.`,
                                    node,
                                    stack,
                                ),
                            );
                        }
                    }
                    return [...items, ...next(node)];
                },

                visitInstruction(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.identifier) {
                        items.push(validationItem('error', 'Instruction has no identifier.', node, stack));
                    }
                    (node.accounts ?? []).forEach(account => {
                        if (!account.identifier) {
                            items.push(validationItem('error', 'Instruction account has no identifier.', node, stack));
                        }
                    });

                    // Check for identifier collisions within the instruction.
                    const context = ` in instruction "${node.identifier}"`;
                    items.push(
                        ...getIdentifierCollisionItems(node.accounts ?? [], 'Instruction account', context, stack),
                        ...getIdentifierCollisionItems(
                            node.remainingAccounts ?? [],
                            'Instruction remaining accounts',
                            context,
                            stack,
                        ),
                        ...getIdentifierCollisionItems(node.provides ?? [], 'Provided value', context, stack),
                        ...getIdentifierCollisionItems(node.subInstructions ?? [], 'Sub-instruction', context, stack),
                    );

                    // Resolve the default values of the instruction's inputs,
                    // reporting cycles and invalid dependencies. The resolver
                    // records the instruction itself onto its stack and scope,
                    // so it receives the instruction's ancestors only.
                    const outerScope = scope.clone();
                    if ((node.provides ?? []).length > 0) outerScope.pop();
                    const resolverVisitor = getResolvedInstructionInputsVisitor(linkables, {
                        scope: outerScope,
                        stack: new NodeStack(stack.getPath().slice(0, -1)),
                    });
                    let inputs: ResolvedInstructionInput[] = [];
                    try {
                        inputs = visit(node, resolverVisitor);
                    } catch (error) {
                        if (!(error instanceof CodamaError)) throw error;
                        items.push(validationItem('error', error.message, node, stack));
                    }

                    // A bump can only be derived from an account that is not a signer.
                    inputs.forEach(input => {
                        if (!('path' in input) || !isNode(input.resolvedDefaultValue, 'accountBumpValueNode')) return;
                        const bumpAccount = input.resolvedDefaultValue.identifier;
                        const account = (node.accounts ?? []).find(a => a.identifier === bumpAccount);
                        if (account && account.isSigner !== false) {
                            items.push(
                                validationItem(
                                    'error',
                                    `Data field "${input.path}" cannot default to the bump of the "${bumpAccount}" ` +
                                        'account as it may be a signer.',
                                    node,
                                    stack,
                                ),
                            );
                        }
                    });

                    return [...items, ...next(node)];
                },

                visitPda(node, { next }) {
                    const seeds = (node.seeds ?? []).filter(seed => isNode(seed, 'variablePdaSeedNode'));
                    const context = ` in PDA "${node.identifier}"`;
                    return [...getIdentifierCollisionItems(seeds, 'PDA seed', context, stack), ...next(node)];
                },

                visitProgram(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.identifier) {
                        items.push(validationItem('error', 'Program has no identifier.', node, stack));
                    }
                    if (!node.publicKey) {
                        items.push(validationItem('error', 'Program has no public key.', node, stack));
                    }
                    if (!node.version) {
                        items.push(validationItem('warn', 'Program has no version.', node, stack));
                    }

                    // Check for identifier collisions within each collection of the program.
                    const context = ` in program "${node.identifier}"`;
                    items.push(
                        ...getIdentifierCollisionItems(node.accounts ?? [], 'Account', context, stack),
                        ...getIdentifierCollisionItems(node.instructions ?? [], 'Instruction', context, stack),
                        ...getIdentifierCollisionItems(node.definedTypes ?? [], 'Defined type', context, stack),
                        ...getIdentifierCollisionItems(node.pdas ?? [], 'PDA', context, stack),
                        ...getIdentifierCollisionItems(node.events ?? [], 'Event', context, stack),
                        ...getIdentifierCollisionItems(node.errors ?? [], 'Error', context, stack),
                        ...getIdentifierCollisionItems(node.constants ?? [], 'Constant', context, stack),
                    );
                    return [...items, ...next(node)];
                },

                visitRoot(node, { next }) {
                    const programs = [node.program, ...(node.additionalPrograms ?? [])];
                    return [...getIdentifierCollisionItems(programs, 'Program', '', stack), ...next(node)];
                },

                visitStructFieldType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.identifier) {
                        items.push(validationItem('error', 'Struct field has no identifier.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitStructType(node, { next }) {
                    return [
                        ...getIdentifierCollisionItems(node.fields ?? [], 'Struct field', '', stack),
                        ...next(node),
                    ];
                },

                visitText(node, { next }) {
                    const items = [] as ValidationItem[];
                    if ((node.plugins ?? []).length === 0) {
                        items.push(
                            validationItem(
                                'info',
                                'Text node has no plugins; use a plain string instead.',
                                node,
                                stack,
                            ),
                        );
                    }
                    return [...items, ...next(node)];
                },

                visitTupleType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if ((node.items ?? []).length === 0) {
                        items.push(validationItem('warn', 'Tuple has no items.', node, stack));
                    }
                    return [...items, ...next(node)];
                },
            }),
        // Pipe stages run outermost-first, i.e. in reverse of their listing here:
        //   pipe(init, g, h, i) => i(h(g(init)))   -- i is the outer layer, runs first
        // so these record the node (onto the stack and scope, and into linkables)
        // BEFORE the extendVisitor logic above runs and reads that state.
        v => recordNodeStackVisitor(v, stack),
        v => recordProvidedScopeVisitor(v, scope),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
