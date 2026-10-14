import {
    type FormattedInstructionNode,
    type FormatOptions,
    getDecodedNodeAtPath,
    getValueLabel,
    isFormattedNode,
} from '@codama/dynamic-codecs';
import type { ParsedInstruction } from '@codama/dynamic-parsers';
import {
    getLastNodeFromPath,
    getTextNodeContent,
    type InterpolatedIntentPart,
    isNode,
    type LinkableDictionary,
    parseInterpolatedIntent,
} from 'codama';

import { getAccountAddress } from './accounts';
/**
 * The interpolated intent of an instruction, with each placeholder replaced by the presentation
 * of its referent: `${data…}` by the formatted value at its path, or its value label for a struct
 * field, and `${accounts.x}` by the formatted address of the account.
 *
 * Returns `null` when the instruction has no interpolated intent, or when a placeholder cannot be
 * presented with confidence: a value that is missing, e.g. an omitted account, that is empty, e.g.
 * an empty list, that is degraded, e.g. an amount whose decimals cannot be resolved, or that reads account data, which is not
 * available. A sentence states its values with confidence, so renderers then fall back to the
 * fields, where degraded values are marked.
 */
export function getInterpolatedIntent(
    formatted: FormattedInstructionNode,
    parsed: ParsedInstruction,
    linkables: LinkableDictionary,
    options: Pick<FormatOptions, 'formatAddress'>,
): string | null {
    const template = getLastNodeFromPath(parsed.path).display?.interpolatedIntent;
    if (template === undefined) return null;
    const texts = parseInterpolatedIntent(getTextNodeContent(template)).map(part =>
        getPartText(part, formatted, parsed, linkables, options),
    );
    return texts.every(text => text !== null) ? texts.join('') : null;
}

function getPartText(
    part: InterpolatedIntentPart,
    formatted: FormattedInstructionNode,
    parsed: ParsedInstruction,
    linkables: LinkableDictionary,
    options: Pick<FormatOptions, 'formatAddress'>,
): string | null {
    if (typeof part === 'string') return part;
    if (isNode(part, 'dataValueNode')) {
        const node = getDecodedNodeAtPath(formatted, part.path, { resolveAccountLink: () => undefined });
        if (!node) return null;
        const valueLabel = isFormattedNode(node, 'structFieldTypeNode') ? getValueLabel(node, linkables) : undefined;
        if (valueLabel !== undefined) return valueLabel;
        // A blank in a sentence is easily misread, as is a degraded value.
        return node.degraded || node.text === '' ? null : node.text;
    }
    if (isNode(part, 'accountValueNode')) {
        const address = getAccountAddress(parsed, part.identifier);
        if (address === undefined) return null;
        return options.formatAddress ? options.formatAddress(address) : address;
    }
    // Account data is not available.
    return null;
}
