import type { PluginNode } from '../PluginNode';
import type { TextNode } from '../TextNode';

/**
 * Display metadata for an instruction: a short intent label and an interpolated sentence template.
 * Either form may be absent; presentation strategy is left to the renderer.
 */
export interface InstructionDisplayNode<
    TIntent extends string | TextNode | undefined = string | TextNode | undefined,
    TInterpolatedIntent extends string | TextNode | undefined = string | TextNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'instructionDisplayNode';

    // Children.
    /** A short imperative label describing what the instruction does (e.g. `"Transfer"`). */
    readonly intent?: TIntent;
    /**
     * A sentence template that composes the instruction into prose with `${root…}` placeholders.
     * Roots are `data` (the instruction data) and `accounts` (the instruction accounts). After the `data` root, placeholders embed the shared path-expression grammar (e.g. `${data.amount}`, `${data.config.fees[0]}`, `${data[0]}`), which may cross a public key's `accountLink` into the linked account's data (e.g. `${data.mint.decimals}`).
     * After the `accounts` root, an account identifier follows and renders as its address (e.g. `${accounts.destination}`), optionally followed by `.data` and a path into the account's decoded data (e.g. `${accounts.mint.data.decimals}`), resolved as `accountDataValueNode` does and requiring the account's `accountLink`. The `.data` segment is explicit because an account has attributes beyond its data: other segments after an account identifier are reserved for them, e.g. its lamports, and are invalid until then.
     * A placeholder renders through its referent's own presentation, including the value labels of a struct field; the `skip` rule governs the fallback list only and never the sentence.
     */
    readonly interpolatedIntent?: TInterpolatedIntent;
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
