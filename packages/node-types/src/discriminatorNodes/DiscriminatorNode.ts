import type { ConstantDiscriminatorNode } from './ConstantDiscriminatorNode';
import type { FieldDiscriminatorNode } from './FieldDiscriminatorNode';
import type { SizeDiscriminatorNode } from './SizeDiscriminatorNode';

// Discriminator Node Registration.
export type RegisteredDiscriminatorNode = ConstantDiscriminatorNode | FieldDiscriminatorNode | SizeDiscriminatorNode;

// Discriminator Node Helpers.
export type DiscriminatorNode = RegisteredDiscriminatorNode;
