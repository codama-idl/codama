import type { ProgramNode } from './ProgramNode';
import type { CodamaVersion } from './shared/codamaVersion';

/**
 * The root of a Codama IDL.
 * Pairs a primary program with any number of additional programs and tags the IDL with the spec version.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/96c43c75-5925-4b6b-a1e0-8b8c61317cfe)
 */
export interface RootNode<
    TProgram extends ProgramNode = ProgramNode,
    TAdditionalPrograms extends Array<ProgramNode> | undefined = Array<ProgramNode> | undefined,
> {
    readonly kind: 'rootNode';

    // Data.
    /**
     * A literal marker identifying the JSON object as a Codama IDL.
     * This allows other communities to fork the Codama standard under a different marker.
     */
    readonly standard: 'codama';
    /** The Codama spec version this IDL conforms to. */
    readonly version: CodamaVersion;

    // Children.
    /** The primary program described by the IDL. */
    readonly program: TProgram;
    /** Additional programs referenced by the primary program. */
    readonly additionalPrograms?: TAdditionalPrograms;
}
