import { camelCase } from '@codama/fragments/casing';
import type { InstructionNode, Node, ProgramNode } from '@codama/nodes';
import type { NodePath, NodeStack } from '@codama/visitors-core';

import { ValidationItem, validationItem } from './ValidationItem';

/**
 * Report identifiers of a sibling set that are not unique: exact duplicates,
 * and distinct identifiers sharing the same camelCase form (the spec's
 * casing-collision rule, whose word split `camelCase` implements). Each
 * duplicate or colliding entry is reported once, against that entry.
 *
 * @param label - What the entries are, e.g. `Struct field`.
 * @param context - Appended to the message to name the scope, e.g. ` in instruction "transfer"`.
 */
export function getIdentifierCollisionItems(
    entries: readonly (Node & { readonly identifier?: string })[],
    label: string,
    context: string,
    stack: NodeStack,
): ValidationItem[] {
    const items: ValidationItem[] = [];
    const identifiersByCamelCase = new Map<string, string>();

    entries.forEach(entry => {
        const identifier = entry.identifier;
        if (!identifier) return;

        const camelCaseForm = camelCase(identifier);
        const existing = identifiersByCamelCase.get(camelCaseForm);
        if (existing === undefined) {
            identifiersByCamelCase.set(camelCaseForm, identifier);
            return;
        }

        const message =
            existing === identifier
                ? `${label} identifier "${identifier}" is not unique${context}.`
                : `${label} identifier "${identifier}" collides with "${existing}" once converted to camelCase${context}.`;
        items.push(validationItem('error', message, [...stack.getPath(), entry]));
    });

    return items;
}

/**
 * Report instructions whose identifier collides with another instruction
 * of the same program, at any nesting level: exact duplicates, and
 * distinct identifiers sharing the same camelCase form. Instructions are
 * linked by identifier within their program, so instruction links and
 * instruction account links would otherwise resolve to the wrong one, and
 * renderers flatten sub-instructions into one file per instruction named
 * after its case-converted identifier.
 *
 * Instructions are walked depth-first, parents before their
 * sub-instructions, and each colliding instruction is reported once,
 * against that instruction and the first identifier sharing its camelCase
 * form. Collisions with an earlier sibling are left to
 * {@link getIdentifierCollisionItems} so they are not reported twice.
 *
 * @param program - The program whose instructions are checked.
 * @param stack - The stack whose current path leads to the program.
 */
export function getNestedInstructionCollisionItems(program: ProgramNode, stack: NodeStack): ValidationItem[] {
    const items: ValidationItem[] = [];
    const identifiersByCamelCase = new Map<string, string>();
    const siblingSetsByCamelCase = new Map<string, Set<readonly InstructionNode[]>>();
    const context = ` across the instructions and sub-instructions of program "${program.identifier}"`;

    const visitInstructions = (siblings: readonly InstructionNode[], parentPath: NodePath) => {
        siblings.forEach(instruction => {
            const path: NodePath<InstructionNode> = [...parentPath, instruction];
            const identifier = instruction.identifier;
            if (identifier) {
                const camelCaseForm = camelCase(identifier);
                const existing = identifiersByCamelCase.get(camelCaseForm);
                const siblingSets = siblingSetsByCamelCase.get(camelCaseForm);
                if (existing === undefined || siblingSets === undefined) {
                    identifiersByCamelCase.set(camelCaseForm, identifier);
                    siblingSetsByCamelCase.set(camelCaseForm, new Set([siblings]));
                } else {
                    if (!siblingSets.has(siblings)) {
                        const message =
                            existing === identifier
                                ? `Instruction identifier "${identifier}" is not unique${context}.`
                                : `Instruction identifier "${identifier}" collides with "${existing}" once converted to camelCase${context}.`;
                        items.push(validationItem('error', message, path));
                    }
                    siblingSets.add(siblings);
                }
            }
            visitInstructions(instruction.subInstructions ?? [], path);
        });
    };
    visitInstructions(program.instructions ?? [], stack.getPath());

    return items;
}
