import { ErrorData } from "./ErrorData.type";

export type ClientError = {
  message?: string;
  stack?: string;
  name?: string;
  data?: ErrorData;
};
