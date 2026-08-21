/** How an attribute that carries a default value is exposed in generated APIs. */
export type DefaultValueStrategy =
    /** The attribute is not exposed as a parameter in the generated API; the default value is always used. */
    | 'omitted'
    /** The attribute is exposed as an optional parameter; callers may override the default value. */
    | 'optional';
