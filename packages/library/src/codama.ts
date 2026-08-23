import { CODAMA_ERROR__VERSION_MISMATCH } from '@codama/errors';
import { CodamaError } from '@codama/errors';
import { assertIsNode, CODAMA_VERSION, CodamaVersion, getCodamaVersionMajor, Node, RootNode } from '@codama/nodes';
import { visit, Visitor } from '@codama/visitors';

export interface Codama {
    accept<T>(visitor: Visitor<T, 'rootNode'>): T;
    clone(): Codama;
    getJson(): string;
    getRoot(): RootNode;
    update(visitor: Visitor<Node | null, 'rootNode'>): void;
}

export function createFromRoot(root: RootNode): Codama {
    let currentRoot = root;
    validateCodamaVersion(currentRoot.version);
    return {
        accept<T>(visitor: Visitor<T, 'rootNode'>): T {
            return visit(currentRoot, visitor);
        },
        clone(): Codama {
            return createFromRoot({ ...currentRoot });
        },
        getJson(): string {
            return JSON.stringify(currentRoot);
        },
        getRoot(): RootNode {
            return currentRoot;
        },
        update(visitor: Visitor<Node | null, 'rootNode'>): void {
            const newRoot = visit(currentRoot, visitor);
            assertIsNode(newRoot, 'rootNode');
            currentRoot = newRoot;
        },
    };
}

export function createFromJson(json: string): Codama {
    return createFromRoot(JSON.parse(json) as RootNode);
}

/**
 * Asserts that an IDL version is compatible with the Codama spec version
 * supported by the installed packages — i.e. that both share the same major —
 * and narrows it to `CodamaVersion` accordingly.
 *
 * The IDL version is compared against the generated `CODAMA_VERSION`
 * spec constant, not the npm package version: the two are unrelated
 * namespaces. Accepts any string since IDLs usually arrive as
 * untrusted JSON; unparsable versions are rejected.
 */
export function validateCodamaVersion(rootVersion: string): asserts rootVersion is CodamaVersion {
    const codamaVersion = CODAMA_VERSION;
    const rootMajor = getCodamaVersionMajor(rootVersion);
    if (rootMajor !== null && rootMajor === getCodamaVersionMajor(codamaVersion)) return;
    throw new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion, rootVersion });
}
