import { camelCase } from '@codama/fragments/casing';
import type { Node } from '@codama/nodes';
import type { NodeStack } from '@codama/visitors-core';

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
        items.push(validationItem('error', message, entry, stack));
    });

    return items;
}
