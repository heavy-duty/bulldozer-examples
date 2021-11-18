import {
  Provider,
  setProvider,
  web3,
  workspace,
  utils,
} from "@project-serum/anchor";
import { assert } from "chai";

describe("Counter Manager", () => {
  setProvider(Provider.env());
  const counterManager = workspace.CounterManager;
  let counterPublicKey: web3.PublicKey, counterBump: number;

  before(async () => {
    [counterPublicKey, counterBump] = await web3.PublicKey.findProgramAddress(
      [
        utils.bytes.utf8.encode("counter"),
        counterManager.provider.wallet.publicKey.toBuffer(),
      ],
      counterManager.programId
    );
  });

  it("should init", async () => {
    await counterManager.rpc.init(counterBump, {
      accounts: {
        counter: counterPublicKey,
        authority: counterManager.provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      },
    });
    const account = await counterManager.account.counter.fetch(
      counterPublicKey
    );
    assert.equal(account.data, 0);
  });

  it("should increment", async () => {
    await counterManager.rpc.increment({
      accounts: {
        authority: counterManager.provider.wallet.publicKey,
        counter: counterPublicKey,
      },
    });
    const account = await counterManager.account.counter.fetch(
      counterPublicKey
    );
    assert.equal(account.data, 1);
  });
});
