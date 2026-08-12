import { AccountRole } from '@solana/instructions';
import {
    type DisplaySkip,
    getLastNodeFromPath,
    type InstructionArgumentNode,
    isNode,
    type NodePath,
    type StructTypeNode,
    titleCase,
    type TypeNode,
} from 'codama';

import { isObjectRecord } from '../shared/util';
import { formatArgumentValue } from './format-argument-value';
import { unwrapOptionValue } from './option-value';
import { resolveDisplayType } from './resolve-display-type';
import type { DisplayContext, DisplayField } from './types';

/**
 * Builds the fallback display: a flat, ordered list of labelled fields for an instruction's
 * arguments, accounts, and remaining accounts.
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
    return [...argumentFieldGroups.flat(), ...accountFields(displayContext), ...remainingAccountFields(displayContext)];
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
    return await memberFields(label, argument.type, ownerPath, value, displayContext);
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
    const fieldGroups = await Promise.all(
        visibleFields.map(async field => {
            const label = `${prefix ?? ''}${field.display?.label ?? titleCase(field.name)}`;
            return await memberFields(label, field.type, [...structPath, field], value[field.name], displayContext);
        }),
    );
    return fieldGroups.flat();
}

/**
 * Produces the display fields for one labelled member.
 *
 * Address arrays expand into one field per element — addresses are individually verified on
 * signing screens, matching how named and remaining accounts each get their own field — with
 * `#n`-numbered labels when there are several. Everything else renders as a single field
 * through {@link formatArgumentValue} (which renders non-address arrays compactly and marks
 * degraded amounts).
 */
async function memberFields(
    label: string,
    type: TypeNode,
    ownerPath: NodePath,
    value: unknown,
    displayContext: DisplayContext,
): Promise<DisplayField[]> {
    const resolved = resolveDisplayType(type, ownerPath, displayContext);
    const unwrapped = unwrapOptionValue(value);
    if (!unwrapped.none && isNode(resolved.type, 'arrayTypeNode') && Array.isArray(unwrapped.value)) {
        const itemType = resolved.type.item;
        const item = resolveDisplayType(itemType, resolved.ownerPath, displayContext);
        if (isNode(item.type, 'publicKeyTypeNode')) {
            const elements = unwrapped.value;
            return await Promise.all(
                elements.map(async (element, index) => ({
                    label: elements.length > 1 ? `${label} #${index + 1}` : label,
                    value: (await formatArgumentValue(itemType, resolved.ownerPath, element, displayContext)).text,
                })),
            );
        }
    }
    const formatted = await formatArgumentValue(type, ownerPath, value, displayContext);
    return [{ label, value: formatted.text }];
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
 * Produces the display fields for the instruction's remaining accounts.
 *
 * The instruction node describes remaining accounts as ordered groups
 * (`instructionRemainingAccountsNode`); the parsed instruction carries the concrete trailing
 * metas unsplit. Each non-final group consumes the run of metas whose signer role matches its
 * `isSigner` flag; the final group takes everything left. Each group honours its display
 * metadata (`label` override, `skip`) and numbers its entries when it holds more than one.
 */
function remainingAccountFields(displayContext: DisplayContext): DisplayField[] {
    const instruction = getLastNodeFromPath(displayContext.parsedInstruction.path);
    const groups = instruction.remainingAccounts ?? [];
    const metas = displayContext.parsedInstruction.remainingAccounts ?? [];
    if (groups.length === 0 || metas.length === 0) return [];

    let cursor = 0;
    return groups.flatMap((group, groupIndex) => {
        const taken: string[] = [];
        const isLastGroup = groupIndex === groups.length - 1;
        while (cursor < metas.length && (isLastGroup || signerMatches(group.isSigner, metas[cursor].role))) {
            taken.push(metas[cursor].address);
            cursor += 1;
        }

        const name = isNode(group.value, 'argumentValueNode') ? group.value.name : undefined;
        if (isSkipped(group.display?.skip, name ?? '', displayContext)) return [];
        const label = group.display?.label ?? (name ? titleCase(name) : 'Remaining Accounts');
        return taken.map((address, index) => ({
            label: taken.length > 1 ? `${label} #${index + 1}` : label,
            value: address,
        }));
    });
}

/** Whether an account meta's role satisfies a remaining-accounts group's `isSigner` flag. */
function signerMatches(isSigner: boolean | 'either' | undefined, role: AccountRole): boolean {
    if (isSigner === 'either') return true;
    const signs = role === AccountRole.READONLY_SIGNER || role === AccountRole.WRITABLE_SIGNER;
    return (isSigner ?? false) === signs;
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
