import { Statement } from "../../entities/Statement";

export type ICreateTransferDTO =
Pick<
  Statement,
  'user_id' |
  'receiver_id' |
  'description' |
  'amount'
>
