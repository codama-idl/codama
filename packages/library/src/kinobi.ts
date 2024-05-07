import { KINOBI_ERROR__VERSION_MISMATCH } from '@kinobi-so/errors';
import { KinobiError } from '@kinobi-so/errors';
import { assertIsNode, KinobiVersion, Node, RootNode } from '@kinobi-so/nodes';
import { visit, Visitor } from '@kinobi-so/visitors';

export interface Kinobi {
    accept<T>(visitor: Visitor<T>): T;
    clone(): Kinobi;
    getJson(): string;
    getRoot(): RootNode;
    update(visitor: Visitor<Node | null>): void;
}

export function createFromRoot(root: RootNode): Kinobi {
    let currentRoot = root;
    validateKinobiVersion(currentRoot.version);
    return {
        accept<T>(visitor: Visitor<T>): T {
            return visit(currentRoot, visitor);
        },
        clone(): Kinobi {
            return createFromRoot({ ...currentRoot });
        },
        getJson(): string {
            return JSON.stringify(currentRoot);
        },
        getRoot(): RootNode {
            return currentRoot;
        },
        update(visitor: Visitor<Node | null>): void {
            const newRoot = visit(currentRoot, visitor);
            assertIsNode(newRoot, 'rootNode');
            currentRoot = newRoot;
        },
    };
}

export function createFromJson(json: string): Kinobi {
    return createFromRoot(JSON.parse(json) as RootNode);
}

function validateKinobiVersion(rootVersion: KinobiVersion): void {
    const kinobiVersion = __VERSION__;
    if (rootVersion === kinobiVersion) return;
    const [rootMajor, rootMinor] = rootVersion.split('.').map(Number);
    const [KinobiMajor, KinobiMinor] = kinobiVersion.split('.').map(Number);
    const isZeroMajor = rootMajor === 0 && KinobiMajor === 0;
    if (isZeroMajor && rootMinor === KinobiMinor) return;
    if (rootMajor === KinobiMajor) return;
    throw new KinobiError(KINOBI_ERROR__VERSION_MISMATCH, { kinobiVersion, rootVersion });
}
