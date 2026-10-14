import { formatDecodedNode, formatInteger } from '@codama/dynamic-codecs';
import type { ParsedInstruction } from '@codama/dynamic-parsers';
import { getLastNodeFromPath, getLinkablesFromNode, getTextNodeContent, type RootNode, titleCase } from 'codama';

import { getDisplayFields } from './fields';
import { getInjectedValueResolver } from './injected-values';
import { getInterpolatedIntent } from './interpolated-intent';
import type { GetInstructionDisplayOptions, InstructionDisplay } from './types';

/**
 * Present a parsed instruction to humans, e.g. to clear sign it: its intent, its interpolated
 * intent and the rows of its fallback list. Values are formatted with the formatters of
 * `@codama/dynamic-codecs`, whose options it accepts, and injected values of display nodes, e.g.
 * the `decimals` of an amount, resolve from the `provides` of the instruction.
 *
 * Amounts whose decimals cannot be resolved are written as their raw value followed by `(raw)`
 * in the rows, so they cannot be mistaken for scaled amounts, and make the interpolated intent
 * `null`.
 *
 * @example
 * ```ts
 * const parsed = parseInstruction(root, instruction);
 * const display = parsed && getInstructionDisplayFromParsedInstruction(root, parsed, {
 *     formatAddress: address => names.get(address) ?? address,
 * });
 * // { intent: 'Transfer', interpolatedIntent: 'Transfer 1.5 USDC to Alice', fields: [{ label: 'Amount', value: '1.5 USDC' }, …] }
 * ```
 */
export function getInstructionDisplayFromParsedInstruction(
    root: RootNode,
    parsed: ParsedInstruction,
    options: GetInstructionDisplayOptions = {},
): InstructionDisplay {
    const { linkables = getLinkablesFromNode(root), ...formatOptions } = options;
    const resolveInjectedValue = getInjectedValueResolver(parsed, linkables);
    const formatted = formatDecodedNode(parsed, { ...formatOptions, resolveInjectedValue });

    // The rows mark the amounts that cannot be scaled, rather than presenting their raw value as is.
    const formatIntegerOrRaw = formatOptions.formatInteger ?? formatInteger;
    const marked = formatDecodedNode(parsed, {
        ...formatOptions,
        formatInteger: (decoded, integerOptions) =>
            formatIntegerOrRaw(decoded, integerOptions) ?? `${decoded.value} (raw)`,
        resolveInjectedValue,
    });

    const instruction = getLastNodeFromPath(parsed.path);
    const intent = instruction.display?.intent;
    return {
        fields: getDisplayFields(marked, parsed, linkables, formatOptions),
        intent: intent === undefined ? titleCase(instruction.identifier) : getTextNodeContent(intent),
        interpolatedIntent: getInterpolatedIntent(formatted, parsed, linkables, formatOptions),
    };
}
