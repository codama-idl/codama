import { camelCase, isDataEnum, isNode, Node, pascalCase, resolveNestedTypeNode, titleCase } from '@codama/nodes';
import { ValidationItem, validationItem } from '@codama/validators';
import { extendVisitor, mergeVisitor, NodeStack, pipe, recordNodeStackVisitor, Visitor } from '@codama/visitors-core';

export function getValidationItemsVisitor(): Visitor<readonly ValidationItem[]> {
    const exportMap: Map<string, { exportType: string; node: Node; stack: NodeStack }> = new Map();
    const stack = new NodeStack();

    const isEponymousExport = (node: Node, exportName: string): boolean =>
        exportName === ('name' in node ? node.name : '');

    const getNodeTitle = (node: Node): string => {
        const name = 'name' in node ? node.name : '';
        const type = titleCase(node.kind.slice(0, -4)).toLowerCase();
        return `"${name}" ${type}`;
    };

    const checkExportConflicts = (node: Node, exports: Record<string, string>): readonly ValidationItem[] => {
        const items = [] as ValidationItem[];
        const conflictingNodes: Node[] = [];
        Object.entries(exports).forEach(([exportName, exportType]) => {
            // Checks for conflicts.
            const exportConflict = exportMap.get(exportName);
            if (!exportConflict) {
                exportMap.set(exportName, { exportType, node, stack: stack.clone() });
                return;
            }

            // Avoids throwing many similar error for the same kind of conflict.
            const conflictingNode = exportConflict.node;
            if (conflictingNodes.includes(conflictingNode)) return;
            conflictingNodes.push(conflictingNode);

            // Constructs the error message.
            let exportDetails = '';
            let conflictExportDetails = '';
            if (!isEponymousExport(node, exportName)) {
                exportDetails = `exports a "${exportName}" ${exportType} that `;
            }
            if (!isEponymousExport(conflictingNode, exportName)) {
                conflictExportDetails = `"${exportName}" ${exportConflict.exportType} exported by the `;
            }
            const message =
                `The ${getNodeTitle(node)} ${exportDetails}` +
                `conflicts with the ${conflictExportDetails}` +
                `${getNodeTitle(conflictingNode)}.\n` +
                `|> Conflicting stack: ${exportConflict.stack}.`;
            items.push(validationItem('error', message, node, stack));
        });
        return items;
    };

    return pipe(
        mergeVisitor(
            () => [] as readonly ValidationItem[],
            (_, items) => items.flat(),
        ),
        v => recordNodeStackVisitor(v, stack),
        v =>
            extendVisitor(v, {
                visitAccount(node, { next }) {
                    const items = [] as ValidationItem[];
                    const pascalCaseName = pascalCase(node.name);
                    const exports = {
                        [pascalCaseName]: 'type',
                        [`${pascalCaseName}AccountData`]: 'type',
                        [`${pascalCaseName}AccountDataArgs`]: 'type',
                        [`fetch${pascalCaseName}`]: 'function',
                        [`safeFetch${pascalCaseName}`]: 'function',
                        [`deserialize${pascalCaseName}`]: 'function',
                        [`get${pascalCaseName}AccountDataSerializer`]: 'function',
                        [`get${pascalCaseName}GpaBuilder`]: 'function',
                        [`get${pascalCaseName}Size`]: 'function',
                    };
                    items.push(...checkExportConflicts(node, exports));

                    const reservedAccountFields = new Set(['publicKey', 'header']);
                    const invalidFields = resolveNestedTypeNode(node.data)
                        .fields.map(field => field.name)
                        .filter(name => reservedAccountFields.has(name));
                    if (invalidFields.length > 0) {
                        const x = invalidFields.join(', ');
                        const message =
                            invalidFields.length === 1
                                ? `Account field [${x}] is reserved. Please rename it.`
                                : `Account fields [${x}] are reserved. Please rename them.`;
                        items.push(validationItem('error', message, node, stack));
                    }
                    return [...items, ...next(node)];
                },

                visitDefinedType(node, { next }) {
                    const items = [] as ValidationItem[];
                    const camelCaseName = camelCase(node.name);
                    const pascalCaseName = pascalCase(node.name);
                    items.push(
                        ...checkExportConflicts(node, {
                            [pascalCaseName]: 'type',
                            [`${pascalCaseName}Args`]: 'type',
                            [`fetch${pascalCaseName}`]: 'function',
                            ...(isNode(node.type, 'enumTypeNode') && isDataEnum(node.type)
                                ? {
                                      [camelCaseName]: 'function',
                                      [`is${pascalCaseName}`]: 'function',
                                  }
                                : {}),
                        }),
                    );
                    return [...items, ...next(node)];
                },

                visitError(node, { next }) {
                    const items = [] as ValidationItem[];
                    items.push(
                        ...checkExportConflicts(node, {
                            [`${pascalCase(node.name)}Error`]: 'class',
                        }),
                    );
                    return [...items, ...next(node)];
                },

                visitInstruction(node, { next }) {
                    const items = [] as ValidationItem[];
                    const camelCaseName = camelCase(node.name);
                    const pascalCaseName = pascalCase(node.name);
                    const pascalCaseData = `${pascalCaseName}InstructionData`;
                    const pascalCaseExtra = `${pascalCaseName}InstructionExtra`;
                    items.push(
                        ...checkExportConflicts(node, {
                            [camelCaseName]: 'function',
                            [`${pascalCaseName}InstructionAccounts`]: 'type',
                            [`${pascalCaseName}InstructionArgs`]: 'type',
                            [`${pascalCaseData}`]: 'type',
                            [`${pascalCaseData}Args`]: 'type',
                            [`get${pascalCaseData}Serializer`]: 'function',
                            [`${pascalCaseExtra}Args`]: 'type',
                        }),
                    );
                    return [...items, ...next(node)];
                },

                visitProgram(node, { next }) {
                    const items = [] as ValidationItem[];
                    const pascalCaseName = pascalCase(node.name);
                    items.push(
                        ...checkExportConflicts(node, {
                            [`get${pascalCaseName}Program`]: 'function',
                            [`get${pascalCaseName}ErrorFromCode`]: 'function',
                            [`get${pascalCaseName}ErrorFromName`]: 'function',
                        }),
                    );
                    return [...items, ...next(node)];
                },
            }),
    );
}
