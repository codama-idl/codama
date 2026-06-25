import {
    getLastNodeFromPath,
    type InstructionArgumentNode,
    isNode,
    type NodePath,
    type StructTypeNode,
    titleCase,
} from 'codama';

import { isObjectRecord } from '../shared/util';
import { formatArgumentValue, resolveDisplayType } from './format-argument-value';
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
    const instruction = getLastNodeFromPath(displayContext.instructionPath);
    const argumentFieldGroups = await Promise.all(
        instruction.arguments.map(argument => argumentFields(argument, displayContext)),
    );
    return [...argumentFieldGroups.flat(), ...accountFields(displayContext)];
}

/** Produces the display fields for a single instruction argument (one field, or many when flattened). */
async function argumentFields(
    argument: InstructionArgumentNode,
    displayContext: DisplayContext,
): Promise<DisplayField[]> {
    if (isSkipped(argument.display?.skip, argument.name, displayContext)) return [];

    const value = displayContext.data[argument.name];
    const ownerPath: NodePath = [...displayContext.instructionPath, argument];
    const resolved = resolveDisplayType(argument.type, ownerPath, displayContext);

    if (argument.display?.flatten && isNode(resolved.type, 'structTypeNode') && isObjectRecord(value)) {
        return await flattenedFields(
            resolved.type,
            resolved.ownerPath,
            value,
            argument.display.flattenPrefix,
            displayContext,
        );
    }

    const label = argument.display?.label ?? titleCase(argument.name);
    return [{ label, value: await formatArgumentValue(argument.type, ownerPath, value, displayContext) }];
}

/** Lifts a struct's fields into the parent list, prefixing each label and reading nested values. */
async function flattenedFields(
    struct: StructTypeNode,
    structPath: NodePath,
    value: Record<string, unknown>,
    prefix: string | undefined,
    displayContext: DisplayContext,
): Promise<DisplayField[]> {
    const visibleFields = struct.fields.filter(field => !isSkipped(field.display?.skip, field.name, displayContext));
    return await Promise.all(
        visibleFields.map(async field => {
            const label = `${prefix ?? ''}${field.display?.label ?? titleCase(field.name)}`;
            const formatted = await formatArgumentValue(
                field.type,
                [...structPath, field],
                value[field.name],
                displayContext,
            );
            return { label, value: formatted };
        }),
    );
}

/** Produces the display fields for the instruction's accounts. */
function accountFields(displayContext: DisplayContext): DisplayField[] {
    const instruction = getLastNodeFromPath(displayContext.instructionPath);
    return instruction.accounts.flatMap(account => {
        if (isSkipped(account.display?.skip, account.name, displayContext)) return [];
        const address = displayContext.accountAddresses.get(account.name);
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
function isSkipped(
    skip: 'always' | 'never' | 'whenInjected' | undefined,
    name: string,
    displayContext: DisplayContext,
): boolean {
    if (skip === 'always') return true;
    if (skip === 'whenInjected') return displayContext.consumedMemberNames.has(name);
    return false;
}
