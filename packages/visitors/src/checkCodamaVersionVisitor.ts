import { CODAMA_ERROR__VERSION_MISMATCH, CodamaError } from '@codama/errors';
import { CODAMA_VERSION, getCodamaVersionMajor, type RootNode } from '@codama/nodes';
import { rootNodeVisitor, type Visitor } from '@codama/visitors-core';

/**
 * A visitor that checks the visited IDL's `version` against the Codama
 * spec version supported by the installed packages, mirroring the check
 * performed by `createFromRoot`. It throws a
 * {@link CODAMA_ERROR__VERSION_MISMATCH} error when the majors differ or the
 * version cannot be parsed, and returns the IDL unchanged otherwise.
 *
 * Mainly useful at IDL-ingestion boundaries that bypass `createFromRoot` —
 * e.g. as a `before` visitor in a Codama CLI config to fail fast on
 * incompatible IDLs:
 *
 * ```json
 * { "idl": "program/idl.json", "before": ["@codama/visitors#checkCodamaVersionVisitor"] }
 * ```
 */
export function checkCodamaVersionVisitor(): Visitor<RootNode, 'rootNode'> {
    return rootNodeVisitor(root => {
        const rootMajor = getCodamaVersionMajor(root.version);
        if (rootMajor !== null && rootMajor === getCodamaVersionMajor(CODAMA_VERSION)) return root;
        throw new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, {
            codamaVersion: CODAMA_VERSION,
            rootVersion: root.version,
        });
    });
}
