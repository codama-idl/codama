import {
    type DisplaySkip,
    getLastNodeFromPath,
    type InstructionArgumentNode,
    isNode,
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
    const instruction = getLastNodeFromPath(displayContext.parsedInstruction.path);
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

    const value = (displayContext.parsedInstruction.data as Record<string, unknown>)[argument.name];
    const resolvedType = resolveDisplayType(argument.type, displayContext);
    const structType = isNode(resolvedType, 'structTypeNode') ? resolvedType : undefined;

    if (argument.display?.flatten && structType && isObjectRecord(value)) {
        return await flattenedFields(structType, value, argument.display.flattenPrefix, displayContext);
    }

    const label = argument.display?.label ?? titleCase(argument.name);
    return [{ label, value: await formatArgumentValue(argument.type, value, displayContext) }];
}

/** Lifts a struct's fields into the parent list, prefixing each label and reading nested values. */
async function flattenedFields(
    struct: StructTypeNode,
    value: Record<string, unknown>,
    prefix: string | undefined,
    displayContext: DisplayContext,
): Promise<DisplayField[]> {
    const visibleFields = struct.fields.filter(field => !isSkipped(field.display?.skip, field.name, displayContext));
    return await Promise.all(
        visibleFields.map(async field => {
            const label = `${prefix ?? ''}${field.display?.label ?? titleCase(field.name)}`;
            const formatted = await formatArgumentValue(field.type, value[field.name], displayContext);
            return { label, value: formatted };
        }),
    );
}

/** Produces the display fields for the instruction's accounts. */
function accountFields(displayContext: DisplayContext): DisplayField[] {
    const instruction = getLastNodeFromPath(displayContext.parsedInstruction.path);
    return instruction.accounts.flatMap(account => {
        if (isSkipped(account.display?.skip, account.name, displayContext)) return [];
        const address = displayContext.parsedInstruction.accounts.find(a => a.name === account.name)?.address;
        if (!address) return [];
        const label = account.display?.label ?? titleCase(account.name);
        return [{ label, value: address }];
    });
}

/**
 * Determines whether a member is hidden from the fallback list given its `skip` strategy.
 * `'always'` always hides; `'whenInjected'` hides when a provider exposes the member's name
 * (its value is surfaced elsewhere through the provide/inject graph); `'never'`/absent shows.
 */
function isSkipped(skip: DisplaySkip | undefined, name: string, displayContext: DisplayContext): boolean {
    if (skip === 'always') return true;
    if (skip === 'whenInjected') return displayContext.provides.has(name);
    return false;
}
