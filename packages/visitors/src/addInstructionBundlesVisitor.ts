import { KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_INSTRUCTION_BUNDLE_NAMES, KinobiError } from '@kinobi-so/errors';
import { assertIsNode, camelCase, CamelCaseString, InstructionBundleNode, programNode } from '@kinobi-so/nodes';
import { bottomUpTransformerVisitor } from '@kinobi-so/visitors-core';

export function addInstructionBundlesVisitor(bundles: Record<string, InstructionBundleNode | InstructionBundleNode[]>) {
    return bottomUpTransformerVisitor(
        Object.entries(bundles).map(([uncasedProgramName, newBundlesArrayOrNode]) => {
            const programName = camelCase(uncasedProgramName);
            const newBundles = Array.isArray(newBundlesArrayOrNode) ? newBundlesArrayOrNode : [newBundlesArrayOrNode];
            return {
                select: `[programNode]${programName}`,
                transform: node => {
                    assertIsNode(node, 'programNode');
                    const existingBundleNames: Set<CamelCaseString> =
                        node.instructionBundles ? new Set(node.instructionBundles.map(bundle => bundle.name)) : new Set();
                    const newInstructionBundleNames = new Set(newBundles.map(bundle => bundle.name));
                    const overlappingInstructionBundleNames = new Set([...existingBundleNames].filter(name => newInstructionBundleNames.has(name)));
                    if (overlappingInstructionBundleNames.size > 0) {
                        throw new KinobiError(KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_INSTRUCTION_BUNDLE_NAMES, {
                            duplicatedInstructionBundleNames: [...overlappingInstructionBundleNames],
                            program: node,
                            programName: node.name,
                        });
                    }
                    return programNode({
                        ...node,
                        instructionBundles: [...(node.instructionBundles ?? []), ...newBundles],
                    });
                },
            };
        }),
    );
}
