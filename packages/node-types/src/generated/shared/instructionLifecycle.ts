/** The lifecycle stage of an instruction. */
export type InstructionLifecycle =
    /** No longer included in client SDKs. Retained in the IDL for historical reference only. */
    | 'archived'
    /** Still callable but discouraged. Clients should migrate to a replacement instruction. */
    | 'deprecated'
    /** Work-in-progress. The instruction may change before it stabilises. */
    | 'draft'
    /** Stable and supported for production use. */
    | 'live';
