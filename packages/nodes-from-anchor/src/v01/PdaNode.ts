import { KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, KinobiError } from '@kinobi-so/errors';
import {
    bytesTypeNode,
    camelCase,
    constantPdaSeedNode,
    fixedSizeTypeNode,
    PdaNode,
    pdaNode,
    PdaSeedNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@kinobi-so/nodes';

import { getAnchorDiscriminatorV01 } from './../discriminators';
import { IdlV01InstructionAccount } from './idl';

export function pdaNodeFromAnchorV01(idl: IdlV01InstructionAccount): PdaNode {
    const seeds = idl.pda?.seeds.map((seed): PdaSeedNode => {
        switch (seed.kind) {
            case 'const':
                return constantPdaSeedNode(
                    fixedSizeTypeNode(bytesTypeNode(), seed.value.length),
                    getAnchorDiscriminatorV01(seed.value),
                );
            case 'account':
                return variablePdaSeedNode(seed.path, publicKeyTypeNode());
            case 'arg':
                throw new KinobiError(KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, { idlType: seed });
        }
    });

    if (!seeds) {
        throw new KinobiError(KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, { idlType: idl });
    }

    const name = camelCase(idl.name);

    return pdaNode({ name, seeds });
}
