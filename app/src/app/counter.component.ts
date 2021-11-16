import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WalletStore } from '@heavy-duty/wallet-adapter';

import { CounterStore } from './counter.store';

@Component({
  selector: 'app-counter',
  template: `
    <header>
      <h1>Counter</h1>
    </header>
    <main>
      <section>
        <header>
          <button mat-raised-button color="primary" (click)="onReload()">
            Reload
          </button>
          <button
            mat-raised-button
            color="primary"
            (click)="onInitCounter()"
            [disabled]="(connected$ | ngrxPush) === false"
          >
            New
          </button>
        </header>

        <mat-list role="list">
          <mat-list-item
            *ngFor="let counter of counters$ | async"
            role="listitem"
            class="mat-elevation-z4"
            style="height: auto; width: 500px; margin-bottom: 1rem; padding: 0.5rem 1rem; background-color: rgba(255, 255, 255, 0.05)"
          >
            <div style="width: 100%;">
              <p style="text-align: center">{{ counter.id }}</p>
              <div
                style="display: flex; justify-content: center; align-items: center"
              >
                <p
                  style="font-size: 2rem; font-weight: 800; margin-right: 0.5rem; margin-bottom: 0"
                >
                  {{ counter.data }}
                </p>
                <button
                  mat-mini-fab
                  color="accent"
                  (click)="onIncrementCounter(counter.id)"
                >
                  <mat-icon>add</mat-icon>
                </button>
              </div>
            </div>
          </mat-list-item>
        </mat-list>
      </section>
    </main>
  `,
  providers: [CounterStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  readonly counters$ = this._counterStore.counters$;
  readonly connected$ = this._walletStore.connected$;

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _counterStore: CounterStore
  ) {
    this.counters$.subscribe((a) => console.log(a));
    this._counterStore.state$.subscribe((a) => console.log(a));
  }

  onReload() {
    this._counterStore.reload();
  }

  onInitCounter() {
    this._counterStore.initCounter();
  }

  onIncrementCounter(counterId: string) {
    this._counterStore.incrementCounter(counterId);
  }
}
