import { accountNode, programNode } from '@codama/nodes';
import { extendVisitor, nonNullableIdentityVisitor, pipe } from '@codama/visitors-core';

/**
 * Move the given defined types (matched exactly by identifier) out of
 * their programs' `definedTypes` and into new accounts whose data is the
 * defined type's type.
 */
export function transformDefinedTypesIntoAccountsVisitor(definedTypes: string[]) {
    return pipe(nonNullableIdentityVisitor({ keys: ['rootNode', 'programNode'] }), v =>
        extendVisitor(v, {
            visitProgram(program) {
                const typesToExtract = (program.definedTypes ?? []).filter(node =>
                    definedTypes.includes(node.identifier),
                );

                const newDefinedTypes = (program.definedTypes ?? []).filter(
                    node => !definedTypes.includes(node.identifier),
                );

                const newAccounts = typesToExtract.map(node =>
                    accountNode({
                        data: node.type,
                        docs: node.docs,
                        identifier: node.identifier,
                        plugins: node.plugins,
                    }),
                );

                return programNode({
                    ...program,
                    accounts: [...(program.accounts ?? []), ...newAccounts],
                    definedTypes: newDefinedTypes,
                });
            },
        }),
    );
}
