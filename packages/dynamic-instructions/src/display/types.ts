import type { FormatDecodedNodeOptions } from '@codama/dynamic-codecs';
import type { LinkableDictionary } from 'codama';

/** A labelled row of the fallback list of an instruction, e.g. `{ label: 'Amount', value: '1.5 USDC' }`. */
export type DisplayField = {
    /** The label of the row, e.g. `"Amount"`. */
    readonly label: string;
    /** The formatted value of the row, e.g. `"1.5 USDC"`. */
    readonly value: string;
};

/**
 * The human-readable presentation of an instruction. It carries both presentation modes and
 * lets the renderer choose between the sentence and the fallback list.
 */
export type InstructionDisplay = {
    /** The rows of the fallback list: the instruction data, then its accounts and remaining accounts. */
    readonly fields: readonly DisplayField[];
    /** A short imperative label, e.g. `"Transfer"`, derived from the instruction identifier when absent. */
    readonly intent: string;
    /**
     * The interpolated sentence, e.g. `"Transfer 1.5 USDC to Alice"`, or `null` when the
     * instruction has none or when one of its placeholders cannot be presented with confidence,
     * e.g. an amount whose decimals cannot be resolved. Renderers then fall back to `fields`.
     */
    readonly interpolatedIntent: string | null;
};

/**
 * Options of the instruction display: the options of `formatDecodedNode` from
 * `@codama/dynamic-codecs`, e.g. `formatAddress` to name addresses or `numberFormat` for a locale,
 * except `resolveInjectedValue`, which the display handles itself.
 */
export type GetInstructionDisplayOptions = Omit<FormatDecodedNodeOptions, 'resolveInjectedValue'> & {
    /**
     * The linkable nodes of the tree, e.g. from `getLinkablesFromNode(root)`, to avoid recording
     * them again when displaying many instructions. Defaults to recording them from the root.
     */
    readonly linkables?: LinkableDictionary;
};
