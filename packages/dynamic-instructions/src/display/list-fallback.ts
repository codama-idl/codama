import {
    type DisplaySkip,
    getLastNodeFromPath,
    type InstructionArgumentNode,
    isNode,
    type NodePath,
    type StructTypeNode,
    titleCase,
} from 'codama';

import { isObjectRecord } from '../shared/util';
import { formatArgumentValue, type FormattedArgumentValue } from './format-argument-value';
import { unwrapOptionValue } from './option-value';
import { resolveDisplayType } from './resolve-display-type';
import type { DisplayContext, DisplayField } from './types';

/**
 * Builds the fallback display: a flat, ordered list of labelled fields for an instruction's
 * arguments and accounts.
 *
 * Honours each member's display metadata — `skip` (hidden when `'always'`, or when
 * `'whenInjected'` and the value was surfaced through the provide/inject graph), `label`
 * overrides, and struct `flatten`/`flattenPrefix`. The instruction's intent/title is not
 * included here; the caller composes it around this list.
 */
export async function listFallback(displayContext: DisplayContext): Promise<DisplayField[]> {
    const instruction = getLastNodeFromPath(displayContext.parsedInstruction.path);
    const argumentFieldGroups = await Promise.all(
        (instruction.arguments ?? []).map(argument => argumentFields(argument, displayContext)),
    );
    return [...argumentFieldGroups.flat(), ...accountFields(displayContext)];
}

/** Produces the display fields for a single instruction argument (one field, or many when flattened). */
async function argumentFields(
    argument: InstructionArgumentNode,
    displayContext: DisplayContext,
): Promise<DisplayField[]> {
    if (isSkipped(argument.display?.skip, argument.name, displayContext)) return [];

    const value = (displayContext.parsedInstruction.data as Record<string, unknown>)[argument.name];
    const ownerPath: NodePath = [...displayContext.parsedInstruction.path, argument];
    const resolved = resolveDisplayType(argument.type, ownerPath, displayContext);

    // Flattening reads the struct's fields, so option wrappers are unwrapped first; an absent
    // (`None`) struct cannot be flattened and renders as a single `none` field instead.
    const unwrapped = unwrapOptionValue(value);
    if (
        argument.display?.flatten &&
        !unwrapped.none &&
        isNode(resolved.type, 'structTypeNode') &&
        isObjectRecord(unwrapped.value)
    ) {
        return await flattenedFields(
            resolved.type,
            resolved.ownerPath,
            unwrapped.value,
            argument.display.flattenPrefix,
            displayContext,
        );
    }

    const label = argument.display?.label ?? titleCase(argument.name);
    const formatted = await formatArgumentValue(argument.type, ownerPath, value, displayContext);
    return [{ label, value: markIfDegraded(formatted) }];
}

/** Lifts a struct's fields into the parent list, prefixing each label and reading nested values. */
async function flattenedFields(
    struct: StructTypeNode,
    structPath: NodePath,
    value: Record<string, unknown>,
    prefix: string | undefined,
    displayContext: DisplayContext,
): Promise<DisplayField[]> {
    const visibleFields = (struct.fields ?? []).filter(
        field => !isSkipped(field.display?.skip, field.name, displayContext),
    );
    return await Promise.all(
        visibleFields.map(async field => {
            const label = `${prefix ?? ''}${field.display?.label ?? titleCase(field.name)}`;
            const formatted = await formatArgumentValue(
                field.type,
                [...structPath, field],
                value[field.name],
                displayContext,
            );
            return { label, value: markIfDegraded(formatted) };
        }),
    );
}

/**
 * Renders a formatted value, marking amounts whose scale failed to resolve so a raw integer
 * cannot be mistaken for a scaled amount (see `FormattedArgumentValue`).
 */
function markIfDegraded(formatted: FormattedArgumentValue): string {
    return formatted.degraded ? `${formatted.text} (raw)` : formatted.text;
}

/** Produces the display fields for the instruction's accounts. */
function accountFields(displayContext: DisplayContext): DisplayField[] {
    const instruction = getLastNodeFromPath(displayContext.parsedInstruction.path);
    return (instruction.accounts ?? []).flatMap(account => {
        if (isSkipped(account.display?.skip, account.name, displayContext)) return [];
        const address = displayContext.parsedInstruction.accounts.find(a => a.name === account.name)?.address;
        if (!address) return [];
        const label = account.display?.label ?? titleCase(account.name);
        return [{ label, value: address }];
    });
}

/**
 * Determines whether a member is hidden from the fallback list given its `skip` strategy.
 * `'always'` always hides; `'whenInjected'` hides when the member's value was surfaced elsewhere
 * through the provide/inject graph (see `consumedMemberNames`); `'never'`/absent shows.
 */
function isSkipped(skip: DisplaySkip | undefined, name: string, displayContext: DisplayContext): boolean {
    if (skip === 'always') return true;
    if (skip === 'whenInjected') return displayContext.consumedMemberNames.has(name);
    return false;
}
