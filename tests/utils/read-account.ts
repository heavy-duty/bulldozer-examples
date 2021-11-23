import { Provider, web3 } from "@project-serum/anchor";
import { AccountInfo, AccountLayout } from "@solana/spl-token";

export const readAccount = async (
  accountPublicKey: web3.PublicKey,
  provider: Provider
): Promise<[AccountInfo, string]> => {
  const tokenInfo = await provider.connection.getAccountInfo(accountPublicKey);
  const data = Buffer.from(tokenInfo.data);
  const accountInfo: AccountInfo = AccountLayout.decode(data);

  const amount = (accountInfo.amount as any as Buffer).readBigUInt64LE();
  return [accountInfo, amount.toString()];
};
