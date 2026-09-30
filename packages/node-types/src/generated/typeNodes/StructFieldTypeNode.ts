import type { IdentifierString } from '../../brands';
import type { StructFieldDisplayNode } from '../displayNodes/StructFieldDisplayNode';
import type { PluginNode } from '../PluginNode';
import type { DefaultValueStrategy } from '../shared/defaultValueStrategy';
import type { TextNode } from '../TextNode';
import type { ValueNode } from '../valueNodes/ValueNode';
import type { TypeNode } from './TypeNode';

/** A named field within a struct type. */
export interface StructFieldTypeNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TType extends TypeNode = TypeNode,
    TDefaultValue extends ValueNode | undefined = ValueNode | undefined,
    TDisplay extends StructFieldDisplayNode | undefined = StructFieldDisplayNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'structFieldTypeNode';

    // Data.
    /** The identifier of the field. */
    readonly identifier: IdentifierString;
    /**
     * How a configured default value is exposed in generated APIs.
     * Only relevant when `defaultValue` is set — a strategy without a default value is meaningless. When absent, `optional` is assumed.
     */
    readonly defaultValueStrategy?: DefaultValueStrategy;

    // Children.
    /** Markdown documentation for the field. */
    readonly docs?: TDocs;
    /** The type of the field. */
    readonly type: TType;
    /** A default value used when the field is omitted by callers. */
    readonly defaultValue?: TDefaultValue;
    /** Display metadata describing how the field is presented. */
    readonly display?: TDisplay;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
