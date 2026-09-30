import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { ProgramLinkNode } from './ProgramLinkNode';

/** A reference to a defined type — possibly in a different program. */
export interface DefinedTypeLinkNode<
    TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'definedTypeLinkNode';

    // Data.
    /** The identifier of the referenced defined type. */
    readonly identifier: IdentifierString;

    // Children.
    /** The program the referenced type is defined in. When omitted, the surrounding program is assumed. */
    readonly program?: TProgram;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
