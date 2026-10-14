import {
    type DecodedAccountNode,
    type FormattedAccountNode,
    formatDecodedNode,
    type FormattedNode,
    getDecodedNodeAtPath,
} from '@codama/dynamic-codecs';
import {
    getLastNodeFromPath,
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
 * Paths crossing account links read the data of the linked accounts.
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

    const options = {
        ...context.formatOptions,
        linkables: context.linkables,
        resolveInjectedValue: getInjectedValueResolver(context),
    };
    const formatted = formatDecodedNode(context.parsed, options);
    const formattedAccounts = new Map<DecodedAccountNode, FormattedAccountNode>();
    const formatAccount = (account: DecodedAccountNode | undefined): FormattedAccountNode | undefined => {
        if (!account) return undefined;
        if (!formattedAccounts.has(account)) formattedAccounts.set(account, formatDecodedNode(account, options));
        return formattedAccounts.get(account);
    };
    const resolveAccountLink = (publicKey: Parameters<typeof getLinkedAccountData>[1]) =>
        formatAccount(getLinkedAccountData(context, publicKey));

    const getPartText = (part: InterpolatedIntentPart): string | null => {
        if (typeof part === 'string') return part;
        if (isNode(part, 'accountValueNode')) {
            const address = getAccountAddress(context.parsed, part.identifier);
            if (address === undefined) return null;
            return context.formatOptions.formatAddress ? context.formatOptions.formatAddress(address) : address;
        }
        let node: FormattedNode | undefined;
        if (isNode(part, 'dataValueNode')) {
            node = getDecodedNodeAtPath(formatted, part.path, { resolveAccountLink });
        } else {
            const account = formatAccount(getInstructionAccountData(context, part.account));
            node = account && part.path ? getDecodedNodeAtPath(account, part.path, { resolveAccountLink }) : account;
        }
        // A blank in a sentence is easily misread, as is a degraded value.
        return !node || node.degraded || node.text === '' ? null : node.text;
    };

    const texts = parseInterpolatedIntent(getTextNodeContent(template)).map(getPartText);
    return texts.every(text => text !== null) ? texts.join('') : null;
}
