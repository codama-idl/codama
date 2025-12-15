import { camelCase, getAllInstructionArguments, isNode } from '@codama/nodes';
import {
    extendVisitor,
    getResolvedInstructionInputsVisitor,
    LinkableDictionary,
    mergeVisitor,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    visit,
    Visitor,
} from '@codama/visitors-core';

import { ValidationItem, validationItem } from './ValidationItem';

export function getValidationItemsVisitor(): Visitor<readonly ValidationItem[]> {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    return pipe(
        mergeVisitor(
            () => [] as readonly ValidationItem[],
            (_, items) => items.flat(),
        ),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
        v => recordNodeStackVisitor(v, stack),
        v =>
            extendVisitor(v, {
                visitAccount(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.name) {
                        items.push(validationItem('error', 'Account has no name.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitDefinedType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.name) {
                        items.push(validationItem('error', 'Defined type has no name.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitDefinedTypeLink(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.name) {
                        items.push(validationItem('error', 'Pointing to a defined type with no name.', node, stack));
                    } else if (!linkables.has(stack.getPath(node.kind))) {
                        items.push(
                            validationItem(
                                'error',
                                `Pointing to a missing defined type named "${node.name}"`,
                                node,
                                stack,
                            ),
                        );
                    }
                    return [...items, ...next(node)];
                },

                visitEnumEmptyVariantType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.name) {
                        items.push(validationItem('error', 'Enum variant has no name.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitEnumStructVariantType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.name) {
                        items.push(validationItem('error', 'Enum variant has no name.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitEnumTupleVariantType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.name) {
                        items.push(validationItem('error', 'Enum variant has no name.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitEnumType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (node.variants.length === 0) {
                        items.push(validationItem('warn', 'Enum has no variants.', node, stack));
                    }
                    node.variants.forEach(variant => {
                        if (!variant.name) {
                            items.push(validationItem('error', 'Enum variant has no name.', node, stack));
                        }
                    });
                    return [...items, ...next(node)];
                },

                visitError(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.name) {
                        items.push(validationItem('error', 'Error has no name.', node, stack));
                    }
                    if (typeof node.code !== 'number') {
                        items.push(validationItem('error', 'Error has no code.', node, stack));
                    }
                    if (!node.message) {
                        items.push(validationItem('warn', 'Error has no message.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitInstruction(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.name) {
                        items.push(validationItem('error', 'Instruction has no name.', node, stack));
                    }

                    // Check for duplicate account names.
                    const accountNameHistogram = new Map<string, number>();
                    node.accounts.forEach(account => {
                        if (!account.name) {
                            items.push(validationItem('error', 'Instruction account has no name.', node, stack));
                            return;
                        }
                        const count = (accountNameHistogram.get(account.name) ?? 0) + 1;
                        accountNameHistogram.set(account.name, count);
                        // Only throw an error once per duplicated names.
                        if (count === 2) {
                            items.push(
                                validationItem(
                                    'error',
                                    `Account name "${account.name}" is not unique in instruction "${node.name}".`,
                                    node,
                                    stack,
                                ),
                            );
                        }
                    });

                    // Check for cyclic dependencies in account defaults.
                    const cyclicCheckVisitor = getResolvedInstructionInputsVisitor();
                    try {
                        visit(node, cyclicCheckVisitor);
                    } catch (error) {
                        items.push(validationItem('error', (error as Error).message, node, stack));
                    }

                    // Check args.
                    const names = getAllInstructionArguments(node).map(({ name }) => camelCase(name));
                    const duplicates = names.filter((e, i, a) => a.indexOf(e) !== i);
                    const uniqueDuplicates = [...new Set(duplicates)];
                    const hasConflictingNames = uniqueDuplicates.length > 0;
                    if (hasConflictingNames) {
                        items.push(
                            validationItem(
                                'error',
                                `The names of the following instruction arguments are conflicting: ` +
                                    `[${uniqueDuplicates.join(', ')}].`,
                                node,
                                stack,
                            ),
                        );
                    }

                    // Check arg defaults.
                    getAllInstructionArguments(node).forEach(argument => {
                        const { defaultValue } = argument;
                        if (isNode(defaultValue, 'accountBumpValueNode')) {
                            const defaultAccount = node.accounts.find(account => account.name === defaultValue.name);
                            if (defaultAccount && defaultAccount.isSigner !== false) {
                                items.push(
                                    validationItem(
                                        'error',
                                        `Argument ${argument.name} cannot default to the bump attribute of ` +
                                            `the [${defaultValue.name}] account as it may be a Signer.`,
                                        node,
                                        stack,
                                    ),
                                );
                            }
                        }
                    });

                    return [...items, ...next(node)];
                },

                visitProgram(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.name) {
                        items.push(validationItem('error', 'Program has no name.', node, stack));
                    }
                    if (!node.publicKey) {
                        items.push(validationItem('error', 'Program has no public key.', node, stack));
                    }
                    if (!node.version) {
                        items.push(validationItem('warn', 'Program has no version.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitStructFieldType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (!node.name) {
                        items.push(validationItem('error', 'Struct field has no name.', node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitStructType(node, { next }) {
                    const items = [] as ValidationItem[];

                    // Check for duplicate field names.
                    const fieldNameHistogram = new Map<string, number>();
                    node.fields.forEach(field => {
                        if (!field.name) return; // Handled by TypeStructField
                        const count = (fieldNameHistogram.get(field.name) ?? 0) + 1;
                        fieldNameHistogram.set(field.name, count);
                        // Only throw an error once per duplicated names.
                        if (count === 2) {
                            items.push(
                                validationItem(
                                    'error',
                                    `Struct field name "${field.name}" is not unique.`,
                                    field,
                                    stack,
                                ),
                            );
                        }
                    });
                    return [...items, ...next(node)];
                },

                visitTupleType(node, { next }) {
                    const items = [] as ValidationItem[];
                    if (node.items.length === 0) {
                        items.push(validationItem('warn', 'Tuple has no items.', node, stack));
                    }
                    return [...items, ...next(node)];
                },
            }),
    );
}
