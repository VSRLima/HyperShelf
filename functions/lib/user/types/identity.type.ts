import { RequestCtx } from "../../recommendation/types/requestCtx.type";

export type Identity = NonNullable<
  Awaited<ReturnType<RequestCtx["auth"]["getUserIdentity"]>>
>;