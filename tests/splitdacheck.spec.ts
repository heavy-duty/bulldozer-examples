import {
  BN,
  Provider,
  setProvider,
  utils,
  web3,
  workspace,
} from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

import { createMint } from "./utils";

describe("SplitDaCheck", () => {
  setProvider(Provider.env());
  const splitDaCheck = workspace.Splitdacheck;
  const checkId = new BN(5);
  let checkPublicKey: web3.PublicKey, checkBump: number;
  let escrowPublicKey: web3.PublicKey, escrowBump: number;
  let mintAddress: web3.PublicKey;

  before(async () => {
    [checkPublicKey, checkBump] = await web3.PublicKey.findProgramAddress(
      [utils.bytes.utf8.encode("check"), checkId.toBuffer("le", 8)],
      splitDaCheck.programId
    );
    [escrowPublicKey, escrowBump] = await web3.PublicKey.findProgramAddress(
      [utils.bytes.utf8.encode("escrow"), checkPublicKey.toBuffer()],
      splitDaCheck.programId
    );
    mintAddress = await createMint(splitDaCheck.provider);
  });

  it("should create a check", async () => {
    // arrange
    const checkAmount = new BN(5);
    // act
    await splitDaCheck.rpc.createCheck(
      checkId,
      checkBump,
      escrowBump,
      checkAmount,
      {
        accounts: {
          check: checkPublicKey,
          escrow: escrowPublicKey,
          authority: splitDaCheck.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
        },
      }
    );
    // assert
    const account = await splitDaCheck.account.check.fetch(checkPublicKey);
    assert.ok(checkId.eq(account.id));
    assert.ok(checkAmount.eq(account.amount));
  });
});
