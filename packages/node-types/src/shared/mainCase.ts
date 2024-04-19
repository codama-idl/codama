export type MainCaseString = string & {
    readonly __mainCaseString: unique symbol;
};
