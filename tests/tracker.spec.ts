import { Provider, setProvider, web3, workspace } from "@project-serum/anchor";
import { assert } from "chai";

describe("Tracker", () => {
  setProvider(Provider.env());
  const application = workspace.Tracker;
  const todoList = web3.Keypair.generate();
  const todoListName = "my-todo";
  const todo = web3.Keypair.generate();
  const todoBody = "this is a todo!";

  it("should create todo list", async () => {
    await application.rpc.createTodoList(todoListName, {
      accounts: {
        todoList: todoList.publicKey,
        authority: application.provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      },
      signers: [todoList],
    });
    const account = await application.account.todoList.fetch(
      todoList.publicKey
    );
    assert.equal(account.name, todoListName);
    assert.ok(account.authority.equals(application.provider.wallet.publicKey));
  });

  it("should create todo", async () => {
    await application.rpc.createTodo(todoBody, {
      accounts: {
        todo: todo.publicKey,
        todoList: todoList.publicKey,
        authority: application.provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      },
      signers: [todo],
    });
    const account = await application.account.todo.fetch(todo.publicKey);
    assert.equal(account.body, todoBody);
    assert.equal(account.checked, false);
    assert.ok(account.todoList.equals(todoList.publicKey));
    assert.ok(account.authority.equals(application.provider.wallet.publicKey));
  });

  it("should toggle todo", async () => {
    await application.rpc.toggleTodo({
      accounts: {
        todo: todo.publicKey,
        authority: application.provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      },
    });
    const account = await application.account.todo.fetch(todo.publicKey);
    assert.equal(account.checked, true);
  });
});
