import { accountNode, assertIsNode, programNode } from '@codama/nodes';
import { extendVisitor, nonNullableIdentityVisitor, pipe } from '@codama/visitors-core';

export function transformDefinedTypesIntoAccountsVisitor(definedTypes: string[]) {
    return pipe(nonNullableIdentityVisitor(['rootNode', 'programNode']), v =>
        extendVisitor(v, {
            visitProgram(program) {
                const typesToExtract = program.definedTypes.filter(node => definedTypes.includes(node.name));

                const newDefinedTypes = program.definedTypes.filter(node => !definedTypes.includes(node.name));

                const newAccounts = typesToExtract.map(node => {
                    assertIsNode(node.type, 'structTypeNode');
                    return accountNode({
                        ...node,
                        data: node.type,
                        discriminators: [],
                        size: undefined,
                    });
                });

                return programNode({
                    ...program,
                    accounts: [...program.accounts, ...newAccounts],
                    definedTypes: newDefinedTypes,
                });
            },
        }),
    );
}
