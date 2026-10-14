import {
    type DecodedNode,
    type FormatDecodedNodeOptions,
    formatDecodedNode,
    getDecodedNodeAtPath,
} from '@codama/dynamic-codecs';
import {
    getLastNodeFromPath,
    getProvidedScopeFromPath,
    getTextNodeContent,
    type InterpolatedIntentPart,
    isNode,
    parseInterpolatedIntent,
} from 'codama';

import { type DisplayContext, getAccountAddress, getInstructionAccountData, getLinkedAccountData } from './accounts';
import { getInjectedValueResolver } from './injected-values';

/**
 * The interpolated intent of an instruction, with each placeholder replaced by the presentation
 * of its referent: `${data…}` and `${accounts.x.data…}` by the formatted value at their path, or
 * its value label for a struct field, and `${accounts.x}` by the formatted address of the account.
 * Paths crossing account links read the data of the linked accounts. Only the referents of the
 * placeholders are formatted, so the display reads no other value, e.g. the mint of a hidden amount,
 * and values within their fields skipped `always` are not resolved.
 *
 * Returns `null` when the instruction has no interpolated intent, or when a placeholder cannot be
 * presented with confidence: a value that is missing, e.g. an omitted account or account data
 * that is not available, that is empty, e.g. an empty list, or that is degraded, e.g. an amount
 * whose decimals cannot be resolved. A sentence states its values with confidence, so renderers
 * then fall back to the fields, where degraded values are marked.
 */
export function getInterpolatedIntent(context: DisplayContext): string | null {
    const template = getLastNodeFromPath(context.parsed.path).display?.interpolatedIntent;
    if (template === undefined) return null;

    // Referents within linked defined types have paths that skip the instruction, so its scope is given.
    const scope = getProvidedScopeFromPath(context.parsed.path);
    const options: FormatDecodedNodeOptions = {
        ...context.formatOptions,
        linkables: context.linkables,
        resolveInjectedValue: getInjectedValueResolver(context, undefined, scope),
        scope,
    };
    const resolveAccountLink = getLinkedAccountData.bind(null, context);

    const getPartText = (part: InterpolatedIntentPart): string | null => {
        if (typeof part === 'string') return part;
        if (isNode(part, 'accountValueNode')) {
            const address = getAccountAddress(context.parsed, part.identifier);
            if (address === undefined) return null;
            return context.formatOptions.formatAddress ? context.formatOptions.formatAddress(address) : address;
        }
        // Only the referent is formatted, so the accounts that other values read are not fetched.
        let decoded: DecodedNode | undefined;
        if (isNode(part, 'dataValueNode')) {
            decoded = getDecodedNodeAtPath(context.parsed, part.path, { resolveAccountLink });
        } else {
            const account = getInstructionAccountData(context, part.account);
            decoded = account && part.path ? getDecodedNodeAtPath(account, part.path, { resolveAccountLink }) : account;
        }
        const node = decoded && formatDecodedNode(decoded, options);
        // A blank in a sentence is easily misread, as is a degraded value.
        return !node || node.degraded || node.text === '' ? null : node.text;
    };

    const texts = parseInterpolatedIntent(getTextNodeContent(template)).map(getPartText);
    return texts.every(text => text !== null) ? texts.join('') : null;
}
