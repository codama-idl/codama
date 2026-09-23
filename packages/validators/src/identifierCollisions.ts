import type { Node } from '@codama/nodes';
import type { NodeStack } from '@codama/visitors-core';

import { ValidationItem, validationItem } from './ValidationItem';

/**
 * The words of an identifier, as defined by the spec's casing-collision rule:
 * split at underscores (discarding empty segments), between a lowercase
 * letter or digit and an uppercase letter, and between an uppercase letter
 * and an uppercase letter followed by a lowercase letter; then lowercased.
 * A digit never begins a new word on its own.
 */
function getIdentifierWords(identifier: string): string[] {
    return identifier
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
        .split('_')
        .filter(word => word.length > 0)
        .map(word => word.toLowerCase());
}

/** The camelCase form of an identifier: its words, each after the first capitalised. */
function getCamelCaseForm(identifier: string): string {
    return getIdentifierWords(identifier)
        .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join('');
}

/**
 * Report identifiers of a sibling set that are not unique: exact duplicates,
 * and distinct identifiers sharing the same camelCase form. Each duplicate or
 * colliding entry is reported once, against that entry.
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

        const camelCase = getCamelCaseForm(identifier);
        const existing = identifiersByCamelCase.get(camelCase);
        if (existing === undefined) {
            identifiersByCamelCase.set(camelCase, identifier);
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
