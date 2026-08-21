import type { ConstantDiscriminatorNode } from './ConstantDiscriminatorNode';
import type { FieldDiscriminatorNode } from './FieldDiscriminatorNode';
import type { SizeDiscriminatorNode } from './SizeDiscriminatorNode';

/** Every node tagged as a discriminator strategy. */
export type RegisteredDiscriminatorNode = ConstantDiscriminatorNode | FieldDiscriminatorNode | SizeDiscriminatorNode;
