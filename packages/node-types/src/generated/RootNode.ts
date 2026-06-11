import type { ProgramNode } from './ProgramNode';
import type { CodamaVersion } from './shared/codamaVersion';

/**
 * The root of a Codama IDL document.
 * Pairs a primary program with any number of additional programs and tags the document with the spec version.
 */
export interface RootNode<
    TProgram extends ProgramNode = ProgramNode,
    TAdditionalPrograms extends Array<ProgramNode> = Array<ProgramNode>,
> {
    readonly kind: 'rootNode';

    // Data.
    /** A literal marker identifying the document as a Codama IDL. */
    readonly standard: 'codama';
    /** The Codama spec version this document conforms to. */
    readonly version: CodamaVersion;

    // Children.
    /** The primary program described by the document. */
    readonly program: TProgram;
    /** Additional programs referenced by the primary program. */
    readonly additionalPrograms: TAdditionalPrograms;
}
