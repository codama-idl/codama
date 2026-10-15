import {
    type DecodedNode,
    formatDecodedNode,
    type FormatDecodedNodeOptions,
    type FormattedTypeNode,
    getFormattedRows,
    isDecodedNode,
    isFormattedNode,
} from '@codama/dynamic-codecs';
import type { Address } from '@solana/addresses';
import { isSignerRole } from '@solana/instructions';
import {
    type DisplaySkip,
    getLastNodeFromPath,
    getTextNodeContent,
    type InstructionAccountDisplayNode,
    titleCase,
} from 'codama';

import { type DisplayContext, getAccountAddress } from './accounts';
import { getInjectedValueResolver } from './injected-values';
import type { DisplayField } from './types';

/** A row before members skipped `whenInjected` are left out. */
type Row = DisplayField & {
    /** The member the row presents, e.g. `account:mint` or `data:config.fee`, if any. */
    readonly member?: string;
    /** The members whose values the row presents through injections, e.g. the mint of an amount. */
    readonly reads: ReadonlySet<string>;
    readonly skip: DisplaySkip;
};

/**
 * The rows of the fallback list of an instruction: its data fields, then its accounts, then its
 * remaining accounts. Members skipped `always` are left out, and so are members skipped
 * `whenInjected` whose value another row presents through an injection, e.g. a mint whose
 * decimals and address scale and name an amount. Only rows that are always shown count, so
 * members skipped `whenInjected` never hide one another.
 */
export function getDisplayFields(context: DisplayContext): DisplayField[] {
    const formatAddress = (address: Address) =>
        context.formatOptions.formatAddress ? context.formatOptions.formatAddress(address) : address;
    const rows = [
        ...getDataRows(context),
        ...getAccountRows(context, formatAddress),
        ...getRemainingAccountRows(context, formatAddress),
    ];
    const surfaced = new Set(rows.flatMap(row => (row.skip === 'never' ? [...row.reads] : [])));
    return rows
        .filter(row => row.skip !== 'whenInjected' || row.member === undefined || !surfaced.has(row.member))
        .map(({ label, value }) => ({ label, value }));
}

/** The rows of the instruction data: one per field of a struct, or a single row otherwise. */
function getDataRows(context: DisplayContext): Row[] {
    const data = context.parsed.data;
    if (!data) return [];
    const reads: Read[] = [];
    const formatted = formatDecodedNode(data, getRowFormatOptions(context, reads));
    if (!isFormattedNode(formatted, 'structTypeNode')) {
        const members = new Set(reads.map(read => read.member));
        return [{ label: 'Data', reads: members, skip: 'never', value: getRowText(formatted.text) }];
    }
    return getFormattedRows(formatted).flatMap(({ field, identifiers, label, text }) => {
        const row = {
            member: `data:${identifiers.join('.')}`,
            reads: new Set(reads.filter(read => startsWith(read.fields, identifiers)).map(read => read.member)),
            skip: field.skip,
        };
        // Lists of addresses show one row per address, so each one can be verified.
        const addresses = field.valueLabel === undefined ? getAddressItems(field.type) : undefined;
        if (addresses && addresses.length > 0) {
            return addresses.map((address, index) => ({
                ...row,
                label: addresses.length > 1 ? `${label} #${index + 1}` : label,
                value: address.text,
            }));
        }
        return [{ ...row, label, value: getRowText(text) }];
    });
}

/** A member an injected value is read from, with the identifiers of the data fields containing the value. */
type Read = { readonly fields: readonly string[]; readonly member: string };

/**
 * The options to format the instruction data with, recording the members each injected value is
 * read from, with the fields containing the value, so each row knows the members it presents.
 * Values that cannot be formatted show through the `formatDegraded` option, as their raw value
 * followed by `(raw)` by default, so they cannot be mistaken for formatted values.
 */
function getRowFormatOptions(context: DisplayContext, reads: Read[]): FormatDecodedNodeOptions {
    const { formatOptions, linkables } = context;
    return {
        ...formatOptions,
        formatDegraded: formatOptions.formatDegraded ?? (raw => `${raw} (raw)`),
        linkables,
        resolveInjectedValue: getInjectedValueResolver(context, (member, parents) => {
            reads.push({ fields: getFieldIdentifiers(parents), member });
        }),
    };
}

/** The identifiers of the struct fields among decoded nodes, e.g. `['config', 'fee']`. */
function getFieldIdentifiers(parents: readonly DecodedNode[]): string[] {
    return parents.flatMap(parent =>
        isDecodedNode(parent, 'structFieldTypeNode') ? [getLastNodeFromPath(parent.path).identifier] : [],
    );
}

/** Whether a list starts with the items of another one, e.g. the fields containing a value and those of a row. */
function startsWith(list: readonly string[], prefix: readonly string[]): boolean {
    return prefix.length <= list.length && prefix.every((item, index) => list[index] === item);
}

/**
 * The text of a row, where empty values, e.g. an empty list or string, show as `Empty` rather
 * than as a blank that could read as a rendering error.
 */
function getRowText(text: string): string {
    return text === '' ? 'Empty' : text;
}

/** The items of a list of addresses, within an option or not, if the type is one. */
function getAddressItems(type: FormattedTypeNode): readonly FormattedTypeNode[] | undefined {
    if (isFormattedNode(type, ['optionTypeNode', 'remainderOptionTypeNode', 'zeroableOptionTypeNode'])) {
        return type.item ? getAddressItems(type.item) : undefined;
    }
    if (!isFormattedNode(type, ['arrayTypeNode', 'setTypeNode'])) return undefined;
    // Links are transparent in decoded nodes, so items linking to a public key are public keys too.
    return type.items.every(item => isFormattedNode(item, 'publicKeyTypeNode')) ? type.items : undefined;
}

/** The rows of the named accounts of the instruction, leaving out optional accounts that are omitted. */
function getAccountRows(context: DisplayContext, formatAddress: (address: Address) => string): Row[] {
    const instruction = getLastNodeFromPath(context.parsed.path);
    return (instruction.accounts ?? []).flatMap(account => {
        const skip = account.display?.skip ?? 'never';
        if (skip === 'always') return [];
        const address = getAccountAddress(context.parsed, account.identifier);
        if (address === undefined) return [];
        return [
            {
                label: getLabel(account.display, account.identifier),
                member: `account:${account.identifier}`,
                reads: new Set<string>(),
                skip,
                value: formatAddress(address),
            },
        ];
    });
}

/**
 * The rows of the remaining accounts of the instruction. The parsed instruction holds them as a
 * single list, so each group but the last takes the run of accounts whose signer role matches its
 * `isSigner`, and the last group takes the rest. A group with an `isSigner` of `either` therefore
 * takes every account after it when it is not the last. Groups with several accounts number them.
 * When the IDL declares no groups, remaining accounts are still shown, as `Remaining Account`,
 * since the signer passes them. No value refers to remaining accounts, so they are always shown,
 * unless skipped `always`.
 */
function getRemainingAccountRows(context: DisplayContext, formatAddress: (address: Address) => string): Row[] {
    const groups = getLastNodeFromPath(context.parsed.path).remainingAccounts ?? [];
    const metas = context.parsed.remainingAccounts;
    let cursor = 0;
    const groupRows = groups.flatMap((group, groupIndex) => {
        const isLastGroup = groupIndex === groups.length - 1;
        const taken: Address[] = [];
        while (
            cursor < metas.length &&
            (isLastGroup || signerMatches(group.isSigner, isSignerRole(metas[cursor].role)))
        ) {
            taken.push(metas[cursor].address);
            cursor += 1;
        }
        if (group.display?.skip === 'always') return [];
        return getNumberedRows(getLabel(group.display, group.identifier), taken, formatAddress);
    });
    const leftovers = metas.slice(cursor).map(meta => meta.address);
    return [...groupRows, ...getNumberedRows('Remaining Account', leftovers, formatAddress)];
}

/** One row per address, numbered when there are several. */
function getNumberedRows(
    label: string,
    addresses: readonly Address[],
    formatAddress: (address: Address) => string,
): Row[] {
    return addresses.map((address, index) => ({
        label: addresses.length > 1 ? `${label} #${index + 1}` : label,
        reads: new Set<string>(),
        skip: 'never',
        value: formatAddress(address),
    }));
}

function signerMatches(isSigner: boolean | 'either' | undefined, signs: boolean): boolean {
    return isSigner === 'either' || (isSigner ?? false) === signs;
}

/** The label of an account or a group of remaining accounts, from its display node or its identifier in title case. */
function getLabel(display: InstructionAccountDisplayNode | undefined, identifier: string): string {
    return display?.label === undefined ? titleCase(identifier) : getTextNodeContent(display.label);
}
