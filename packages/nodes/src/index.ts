export * from '@codama/node-types';

// The bulk of the surface — every `xxxNodeInput` type, every `xxxNode()`
// constructor, every `*_NODE_KINDS` runtime array — is generated from
// `@codama/spec` by `@codama-internal/spec-generators`.
export * from './generated';
export * from './shared';

// Hand-written helpers that layer convenience predicates and factories
// on top of the generated constructors.
export * from './ConstantPdaSeedNode';
export * from './ConstantValueNode';
export * from './EnumTypeNode';
export * from './InstructionArgumentNode';
export * from './InstructionNode';
export * from './NestedTypeNode';
export * from './Node';
export * from './NumberTypeNode';
export * from './ProgramNode';

// Legacy plural-noun aliases preserved for API stability. Each maps to
// the canonical `*_NODE_KINDS` name generated from the matching spec
// union.
export {
    CONTEXTUAL_VALUE_NODE_KINDS as CONTEXTUAL_VALUE_NODES,
    ENUM_VARIANT_TYPE_NODE_KINDS as ENUM_VARIANT_TYPE_NODES,
    INSTRUCTION_INPUT_VALUE_NODE_KINDS as INSTRUCTION_INPUT_VALUE_NODES,
    REGISTERED_COUNT_NODE_KINDS as COUNT_NODES,
    REGISTERED_DISCRIMINATOR_NODE_KINDS as DISCRIMINATOR_NODES,
    REGISTERED_LINK_NODE_KINDS as LINK_NODES,
    REGISTERED_PDA_SEED_NODE_KINDS as PDA_SEED_NODES,
    TYPE_NODE_KINDS as TYPE_NODES,
    VALUE_NODE_KINDS as VALUE_NODES,
} from './generated';
