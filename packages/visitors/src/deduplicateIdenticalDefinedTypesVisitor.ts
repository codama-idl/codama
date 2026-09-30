import {
    assertIsNode,
    DefinedTypeNode,
    definedTypeLinkNode,
    getAllPrograms,
    IdentifierString,
    Node,
    programLinkNode,
    ProgramNode,
} from '@codama/nodes';
import {
    bottomUpTransformerVisitor,
    deleteNodesVisitor,
    findProgramNodeFromPath,
    getUniqueHashStringVisitor,
    NodeSelector,
    rootNodeVisitor,
    visit,
} from '@codama/visitors-core';

type DefinedTypeWithProgram = {
    program: ProgramNode;
    type: DefinedTypeNode;
};

/**
 * Remove defined types that are identical (ignoring docs) across programs,
 * keeping the copy from the first program they appear in, and repoint the
 * links to removed copies at the kept one.
 *
 * Two same-named types only count as identical if every defined type they
 * reference without an explicit program is itself deduplicated across the
 * same programs, since those references resolve per program.
 */
export function deduplicateIdenticalDefinedTypesVisitor() {
    return rootNodeVisitor(root => {
        const allPrograms = getAllPrograms(root);
        const typeMap = new Map<IdentifierString, DefinedTypeWithProgram[]>();

        // Fill the type map with all defined types.
        allPrograms.forEach(program => {
            (program.definedTypes ?? []).forEach(type => {
                const list = typeMap.get(type.identifier) ?? [];
                typeMap.set(type.identifier, [...list, { program, type }]);
            });
        });

        // Remove all types that are not duplicated.
        typeMap.forEach((list, name) => {
            if (list.length <= 1) typeMap.delete(name);
        });

        // Remove duplicates whose types are not equal.
        const hashVisitor = getUniqueHashStringVisitor({ removeDocs: true });
        typeMap.forEach((list, name) => {
            const hashes = list.map(item => visit(item.type, hashVisitor));
            if (!hashes.every(hash => hash === hashes[0])) typeMap.delete(name);
        });

        // Remove duplicates referencing, without an explicit program, a type
        // that is not itself deduplicated across the same programs.
        let changed = true;
        while (changed) {
            changed = false;
            typeMap.forEach((list, name) => {
                const programs = list.map(item => item.program.identifier);
                const isSafe = getUnqualifiedDefinedTypeLinks(list[0].type).every(reference => {
                    const referencePrograms = (typeMap.get(reference) ?? []).map(item => item.program.identifier);
                    return programs.every(program => referencePrograms.includes(program));
                });
                if (!isSafe) {
                    typeMap.delete(name);
                    changed = true;
                }
            });
        }

        if (typeMap.size === 0) return root;

        // Order each list by program index: the first item is kept, the others are removed.
        const keptPrograms = new Map<`${IdentifierString}.${IdentifierString}`, IdentifierString>();
        const deleteSelectors: NodeSelector[] = [];
        typeMap.forEach((list, name) => {
            const [kept, ...removed] = [...list].sort(
                (a, b) => allPrograms.indexOf(a.program) - allPrograms.indexOf(b.program),
            );
            removed.forEach(({ program }) => {
                keptPrograms.set(`${program.identifier}.${name}`, kept.program.identifier);
                deleteSelectors.push(`[programNode]${program.identifier}.[definedTypeNode]${name}`);
            });
        });

        // Repoint links to removed types at the kept ones.
        const repointedRoot = visit(
            root,
            bottomUpTransformerVisitor([
                {
                    select: '[definedTypeLinkNode]',
                    transform: (link, stack) => {
                        assertIsNode(link, 'definedTypeLinkNode');
                        const program =
                            link.program?.identifier ?? findProgramNodeFromPath(stack.getPath())?.identifier;
                        if (!program) return link;
                        const keptProgram = keptPrograms.get(`${program}.${link.identifier}`);
                        if (!keptProgram) return link;
                        return definedTypeLinkNode(link.identifier, { ...link, program: programLinkNode(keptProgram) });
                    },
                },
            ]),
        );

        // Delete the removed types.
        assertIsNode(repointedRoot, 'rootNode');
        const newRoot = visit(repointedRoot, deleteNodesVisitor(deleteSelectors));
        assertIsNode(newRoot, 'rootNode');
        return newRoot;
    });
}

function getUnqualifiedDefinedTypeLinks(node: Node): IdentifierString[] {
    const identifiers = new Set<IdentifierString>();
    visit(
        node,
        bottomUpTransformerVisitor([
            {
                select: '[definedTypeLinkNode]',
                transform: link => {
                    assertIsNode(link, 'definedTypeLinkNode');
                    if (!link.program) identifiers.add(link.identifier);
                    return link;
                },
            },
        ]),
    );
    return [...identifiers];
}
