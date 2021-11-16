import { Injectable } from '@angular/core';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { ProgramStore } from '@heavy-duty/ng-anchor';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { Program } from '@project-serum/anchor';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { BehaviorSubject, combineLatest, defer, from, Observable } from 'rxjs';
import { concatMap, filter, switchMap } from 'rxjs/operators';

const isNotNullOrUndefined = <T>(src: Observable<T | null | undefined>) =>
  src.pipe(
    filter((value): value is T => value !== null && value !== undefined)
  );

export interface Counter {
  id: string;
  data: number;
  authority: string;
}

interface ViewModel {
  counters: Counter[];
}

const initialState: ViewModel = {
  counters: [],
};

@Injectable()
export class CounterStore extends ComponentStore<ViewModel> {
  private readonly _reload = new BehaviorSubject(null);
  readonly reload$ = this._reload.asObservable();
  private readonly _reader$ = this._programStore.getReader('counter');
  private readonly _writer$ = this._programStore.getWriter('counter');
  readonly counters$ = this.select(({ counters }) => counters);

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _programStore: ProgramStore
  ) {
    super(initialState);
  }

  readonly loadCounters = this.effect(() =>
    combineLatest([
      this._walletStore.publicKey$.pipe(isNotNullOrUndefined),
      this.reload$,
    ]).pipe(
      switchMap(([walletPublicKey]) =>
        this._reader$.pipe(
          filter((reader): reader is Program => reader !== null),
          concatMap((reader) =>
            defer(() =>
              from(
                reader.account['counter'].all([
                  { memcmp: { offset: 8, bytes: walletPublicKey.toBase58() } },
                ])
              )
            ).pipe(
              tapResponse(
                (counters) =>
                  this.patchState({
                    counters: counters.map((counter) => ({
                      id: counter.publicKey.toBase58(),
                      data: counter.account['data'],
                      authority: counter.account['authority'].toBase58(),
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

  readonly initCounter = this.effect((action$) =>
    combineLatest([
      this._walletStore.publicKey$.pipe(isNotNullOrUndefined),
      this._writer$.pipe(isNotNullOrUndefined),
      action$,
    ]).pipe(
      concatMap(([walletPublicKey, writer]) => {
        const counter = Keypair.generate();

        return defer(() =>
          from(
            writer.rpc['init']({
              accounts: {
                counter: counter.publicKey,
                authority: walletPublicKey,
                systemProgram: SystemProgram.programId,
              },
              signers: [counter],
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

  readonly incrementCounter = this.effect((counterId$: Observable<string>) =>
    combineLatest([
      this._walletStore.publicKey$.pipe(isNotNullOrUndefined),
      this._writer$.pipe(isNotNullOrUndefined),
      counterId$,
    ]).pipe(
      concatMap(([walletPublicKey, writer, counterId]) =>
        defer(() =>
          from(
            writer.rpc['increment']({
              accounts: {
                counter: new PublicKey(counterId),
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
    this.patchState({ counters: [] });
    this._reload.next(null);
  }
}
