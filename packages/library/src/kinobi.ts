import { CODAMA_ERROR__VERSION_MISMATCH } from '@codama/errors';
import { KinobiError } from '@codama/errors';
import { assertIsNode, KinobiVersion, Node, RootNode } from '@codama/nodes';
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
    validateKinobiVersion(currentRoot.version);
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

function validateKinobiVersion(rootVersion: KinobiVersion): void {
    const codamaVersion = __VERSION__;
    if (rootVersion === codamaVersion) return;
    const [rootMajor, rootMinor] = rootVersion.split('.').map(Number);
    const [KinobiMajor, KinobiMinor] = codamaVersion.split('.').map(Number);
    const isZeroMajor = rootMajor === 0 && KinobiMajor === 0;
    if (isZeroMajor && rootMinor === KinobiMinor) return;
    if (rootMajor === KinobiMajor) return;
    throw new KinobiError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion, rootVersion });
}
