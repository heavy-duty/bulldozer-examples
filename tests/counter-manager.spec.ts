import { Provider, setProvider, web3, workspace } from "@project-serum/anchor";
import { assert } from "chai";

describe("Counter Manager", () => {
  setProvider(Provider.env());
  const counterManager = workspace.CounterManager;
  const counter = web3.Keypair.generate();

  it("should init", async () => {
    await counterManager.rpc.init({
      accounts: {
        counter: counter.publicKey,
        authority: counterManager.provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      },
      signers: [counter],
    });
    const account = await counterManager.account.counter.fetch(
      counter.publicKey
    );
    assert.equal(account.data, 0);
  });

  it("should increment", async () => {
    await counterManager.rpc.increment({
      accounts: {
        authority: counterManager.provider.wallet.publicKey,
        counter: counter.publicKey,
      },
    });
    const account = await counterManager.account.counter.fetch(
      counter.publicKey
    );
    assert.equal(account.data, 1);
  });
});
