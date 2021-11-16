import { Injectable } from '@angular/core';
import { ProgramStore } from '@heavy-duty/ng-anchor';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { Program } from '@project-serum/anchor';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { BehaviorSubject, combineLatest, defer, from, Observable } from 'rxjs';
import { concatMap, filter, switchMap } from 'rxjs/operators';

const isNotNullOrUndefined = <T>(src: Observable<T | null | undefined>) =>
  src.pipe(
    filter((value): value is T => value !== null && value !== undefined)
  );

export interface Todo {
  id: string;
  body: string;
  checked: boolean;
  authority: string;
}

export interface TodoList {
  id: string;
  name: string;
  authority: string;
  todos: Todo[];
}

interface ViewModel {
  todoLists: TodoList[];
}

const initialState: ViewModel = {
  todoLists: [],
};

@Injectable()
export class TrackerStore extends ComponentStore<ViewModel> {
  private readonly _reload = new BehaviorSubject(null);
  readonly reload$ = this._reload.asObservable();
  private readonly _reader$ = this._programStore.getReader('tracker');
  private readonly _writer$ = this._programStore.getWriter('tracker');
  readonly todoLists$ = this.select(({ todoLists }) => todoLists);

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _programStore: ProgramStore
  ) {
    super(initialState);
  }

  readonly loadTodoLists = this.effect(() =>
    combineLatest([
      this._walletStore.publicKey$.pipe(isNotNullOrUndefined),
      this.reload$,
    ]).pipe(
      switchMap(([walletPublicKey]) =>
        this._reader$.pipe(
          filter((reader): reader is Program => reader !== null),
          concatMap((reader) =>
            combineLatest([
              from(
                reader.account['todoList'].all([
                  { memcmp: { offset: 8, bytes: walletPublicKey.toBase58() } },
                ])
              ),
              from(
                reader.account['todo'].all([
                  { memcmp: { offset: 8, bytes: walletPublicKey.toBase58() } },
                ])
              ),
            ]).pipe(
              tapResponse(
                ([todoLists, todos]) =>
                  this.patchState({
                    todoLists: todoLists.map((todoList) => ({
                      id: todoList.publicKey.toBase58(),
                      name: todoList.account['name'],
                      authority: todoList.account['authority'].toBase58(),
                      todos: todos
                        .filter((todo) =>
                          todo.account['todoList'].equals(todoList.publicKey)
                        )
                        .map((todo) => ({
                          id: todo.publicKey.toBase58(),
                          body: todo.account['body'],
                          authority: todo.account['authority'].toBase58(),
                          checked: todo.account['checked'],
                        })),
                    })),
                  }),
                (error) => console.log(error)
              )
            )
          )
        )
      )
    )
  );

  readonly createTodoList = this.effect((action$: Observable<string>) =>
    combineLatest([
      this._walletStore.publicKey$.pipe(isNotNullOrUndefined),
      this._writer$.pipe(isNotNullOrUndefined),
      action$,
    ]).pipe(
      concatMap(([walletPublicKey, writer, name]) => {
        const todoList = Keypair.generate();

        return defer(() =>
          from(
            writer.rpc['createTodoList'](name, {
              accounts: {
                todoList: todoList.publicKey,
                authority: walletPublicKey,
                systemProgram: SystemProgram.programId,
              },
              signers: [todoList],
            })
          )
        ).pipe(
          tapResponse(
            () => this.reload(),
            (error) => console.log(error)
          )
        );
      })
    )
  );

  readonly createTodo = this.effect(
    (action$: Observable<{ todoList: string; body: string }>) =>
      combineLatest([
        this._walletStore.publicKey$.pipe(isNotNullOrUndefined),
        this._writer$.pipe(isNotNullOrUndefined),
        action$,
      ]).pipe(
        concatMap(([walletPublicKey, writer, { todoList, body }]) => {
          const todo = Keypair.generate();

          return defer(() =>
            from(
              writer.rpc['createTodo'](body, {
                accounts: {
                  todo: todo.publicKey,
                  todoList: new PublicKey(todoList),
                  authority: walletPublicKey,
                  systemProgram: SystemProgram.programId,
                },
                signers: [todo],
              })
            )
          ).pipe(
            tapResponse(
              () => this.reload(),
              (error) => console.log(error)
            )
          );
        })
      )
  );

  readonly toggleTodo = this.effect((todoId$: Observable<string>) =>
    combineLatest([
      this._walletStore.publicKey$.pipe(isNotNullOrUndefined),
      this._writer$.pipe(isNotNullOrUndefined),
      todoId$,
    ]).pipe(
      concatMap(([walletPublicKey, writer, todoId]) =>
        defer(() =>
          from(
            writer.rpc['toggleTodo']({
              accounts: {
                todo: new PublicKey(todoId),
                authority: walletPublicKey,
              },
            })
          )
        ).pipe(
          tapResponse(
            () => this.reload(),
            (error) => console.log(error)
          )
        )
      )
    )
  );

  reload() {
    this._reload.next(null);
  }
}
