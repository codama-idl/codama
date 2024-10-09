import {
    assertIsNode,
    camelCase,
    InstructionArgumentNode,
    instructionArgumentNode,
    instructionNode,
    StructFieldTypeNode,
    structFieldTypeNode,
    structTypeNode,
    ValueNode,
} from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@codama/visitors-core';

type StructDefaultValueMap = Record<string, Record<string, StructDefaultValue>>;
type StructDefaultValue = ValueNode | { strategy?: 'omitted' | 'optional'; value: ValueNode } | null;

export function setStructDefaultValuesVisitor(map: StructDefaultValueMap) {
    return bottomUpTransformerVisitor(
        Object.entries(map).flatMap(([stack, defaultValues]): BottomUpNodeTransformerWithSelector[] => {
            const camelCasedDefaultValues = Object.fromEntries(
                Object.entries(defaultValues).map(([key, value]) => [camelCase(key), value]),
            );

            return [
                {
                    select: `${stack}.[structTypeNode]`,
                    transform: node => {
                        assertIsNode(node, 'structTypeNode');
                        const fields = node.fields.map((field): StructFieldTypeNode => {
                            const defaultValue = camelCasedDefaultValues[field.name];
                            if (defaultValue === undefined) return field;
                            if (defaultValue === null) {
                                return structFieldTypeNode({
                                    ...field,
                                    defaultValue: undefined,
                                    defaultValueStrategy: undefined,
                                });
                            }
                            return structFieldTypeNode({
                                ...field,
                                defaultValue: 'kind' in defaultValue ? defaultValue : defaultValue.value,
                                defaultValueStrategy: 'kind' in defaultValue ? undefined : defaultValue.strategy,
                            });
                        });
                        return structTypeNode(fields);
                    },
                },
                {
                    select: ['[instructionNode]', stack],
                    transform: node => {
                        assertIsNode(node, 'instructionNode');
                        const transformArguments = (arg: InstructionArgumentNode): InstructionArgumentNode => {
                            const defaultValue = camelCasedDefaultValues[arg.name];
                            if (defaultValue === undefined) return arg;
                            if (defaultValue === null) {
                                return instructionArgumentNode({
                                    ...arg,
                                    defaultValue: undefined,
                                    defaultValueStrategy: undefined,
                                });
                            }
                            return instructionArgumentNode({
                                ...arg,
                                defaultValue: 'kind' in defaultValue ? defaultValue : defaultValue.value,
                                defaultValueStrategy: 'kind' in defaultValue ? undefined : defaultValue.strategy,
                            });
                        };
                        return instructionNode({
                            ...node,
                            arguments: node.arguments.map(transformArguments),
                            extraArguments: node.extraArguments
                                ? node.extraArguments.map(transformArguments)
                                : undefined,
                        });
                    },
                },
            ];
        }),
    );
}
