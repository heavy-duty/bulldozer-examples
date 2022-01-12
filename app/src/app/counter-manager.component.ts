import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { CounterManagerStore } from './counter-manager.store';

@Component({
  selector: 'app-counter',
  template: `
    <header>
      <h1>Counter Manager</h1>
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
            *ngIf="counter$ | async as counter"
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
                  (click)="onIncrementCounter()"
                >
                  <mat-icon>add</mat-icon>
                </button>
                <button mat-mini-fab color="accent" (click)="onDeleteCounter()">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </mat-list-item>
        </mat-list>
      </section>
    </main>
  `,
  providers: [CounterManagerStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterManagerComponent {
  readonly counter$ = this._counterManagerStore.counter$;
  readonly connected$ = this._walletStore.connected$;

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _counterManagerStore: CounterManagerStore
  ) {}

  onReload() {
    this._counterManagerStore.reload();
  }

  onInitCounter() {
    this._counterManagerStore.initCounter();
  }

  onIncrementCounter() {
    this._counterManagerStore.incrementCounter();
  }

  onDeleteCounter() {
    this._counterManagerStore.deleteCounter();
  }
}
