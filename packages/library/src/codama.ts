import { CODAMA_ERROR__VERSION_MISMATCH } from '@codama/errors';
import { CodamaError } from '@codama/errors';
import { assertIsNode, CodamaVersion, Node, RootNode } from '@codama/nodes';
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

function validateCodamaVersion(rootVersion: CodamaVersion): void {
    const codamaVersion = __VERSION__;
    if (rootVersion === codamaVersion) return;
    const [rootMajor, rootMinor] = rootVersion.split('.').map(Number);
    const [CodamaMajor, CodamaMinor] = codamaVersion.split('.').map(Number);
    const isZeroMajor = rootMajor === 0 && CodamaMajor === 0;
    if (isZeroMajor && rootMinor === CodamaMinor) return;
    if (rootMajor === CodamaMajor) return;
    throw new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion, rootVersion });
}
