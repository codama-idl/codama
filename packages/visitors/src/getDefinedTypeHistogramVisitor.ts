import { CamelCaseString } from '@kinobi-so/nodes';
import { extendVisitor, interceptVisitor, mergeVisitor, pipe, visit, Visitor } from '@kinobi-so/visitors-core';

export type DefinedTypeHistogram = {
    [key: CamelCaseString]: {
        directlyAsInstructionArgs: number;
        inAccounts: number;
        inDefinedTypes: number;
        inInstructionArgs: number;
        total: number;
    };
};

function mergeHistograms(histograms: DefinedTypeHistogram[]): DefinedTypeHistogram {
    const result: DefinedTypeHistogram = {};

    histograms.forEach(histogram => {
        Object.keys(histogram).forEach(key => {
            const mainCaseKey = key as CamelCaseString;
            if (result[mainCaseKey] === undefined) {
                result[mainCaseKey] = histogram[mainCaseKey];
            } else {
                result[mainCaseKey].total += histogram[mainCaseKey].total;
                result[mainCaseKey].inAccounts += histogram[mainCaseKey].inAccounts;
                result[mainCaseKey].inDefinedTypes += histogram[mainCaseKey].inDefinedTypes;
                result[mainCaseKey].inInstructionArgs += histogram[mainCaseKey].inInstructionArgs;
                result[mainCaseKey].directlyAsInstructionArgs += histogram[mainCaseKey].directlyAsInstructionArgs;
            }
        });
    });

    return result;
}

export function getDefinedTypeHistogramVisitor(): Visitor<DefinedTypeHistogram> {
    let mode: 'account' | 'definedType' | 'instruction' | null = null;
    let stackLevel = 0;

    return pipe(
        mergeVisitor(
            () => ({}) as DefinedTypeHistogram,
            (_, histograms) => mergeHistograms(histograms),
        ),
        v =>
            interceptVisitor(v, (node, next) => {
                stackLevel += 1;
                const newNode = next(node);
                stackLevel -= 1;
                return newNode;
            }),
        v =>
            extendVisitor(v, {
                visitAccount(node, { self }) {
                    mode = 'account';
                    stackLevel = 0;
                    const histogram = visit(node.data, self);
                    mode = null;
                    return histogram;
                },

                visitDefinedType(node, { self }) {
                    mode = 'definedType';
                    stackLevel = 0;
                    const histogram = visit(node.type, self);
                    mode = null;
                    return histogram;
                },

                visitDefinedTypeLink(node) {
                    return {
                        [node.name]: {
                            directlyAsInstructionArgs: Number(mode === 'instruction' && stackLevel <= 1),
                            inAccounts: Number(mode === 'account'),
                            inDefinedTypes: Number(mode === 'definedType'),
                            inInstructionArgs: Number(mode === 'instruction'),
                            total: 1,
                        },
                    };
                },

                visitInstruction(node, { self }) {
                    mode = 'instruction';
                    stackLevel = 0;
                    const dataHistograms = node.arguments.map(arg => visit(arg, self));
                    const extraHistograms = (node.extraArguments ?? []).map(arg => visit(arg, self));
                    mode = null;
                    const subHistograms = (node.subInstructions ?? []).map(ix => visit(ix, self));
                    return mergeHistograms([...dataHistograms, ...extraHistograms, ...subHistograms]);
                },
            }),
    );
}
