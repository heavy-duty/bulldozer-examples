import { ChangeDetectionStrategy, Component } from '@angular/core';

import { NavigationStore } from './navigation.store';

@Component({
  selector: 'app-navigation',
  template: `
    <mat-sidenav-container class="h-full" fullscreen>
      <mat-sidenav
        #drawer
        class="sidenav"
        fixedInViewport
        [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
        [mode]="(isHandset$ | async) ? 'over' : 'side'"
        [opened]="(isHandset$ | async) === false"
      >
        <div class="h-full flex flex-col">
          <figure class="pt-4 pb-4 w-full flex justify-center bg-white">
            <img src="assets/images/logo.png" class="w-4/6" />
          </figure>
          <h2 class="mt-4 text-center">BULLDOZER</h2>

          <mat-nav-list>
            <a mat-list-item [routerLink]="['/counter']">
              <div class="px-4">Counter</div>
            </a>
            <a mat-list-item [routerLink]="['/tracker']">
              <div class="px-4">Tracker</div>
            </a>
          </mat-nav-list>
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary" class="shadow-xl sticky top-0 z-10">
          <button
            type="button"
            aria-label="Toggle sidenav"
            mat-icon-button
            (click)="drawer.toggle()"
            *ngIf="isHandset$ | async"
          >
            <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
          </button>
          <hd-wallet-multi-button
            class="ml-auto bd-custom-color"
            color="accent"
          ></hd-wallet-multi-button>
        </mat-toolbar>
        <ng-content></ng-content>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .sidenav {
        width: 200px;
      }

      .mat-toolbar.mat-primary {
        position: sticky;
        top: 0;
        z-index: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NavigationStore],
})
export class NavigationComponent {
  readonly isHandset$ = this._navigationStore.isHandset$;
  readonly connected$ = this._navigationStore.connected$;
  readonly address$ = this._navigationStore.address$;

  constructor(private readonly _navigationStore: NavigationStore) {}
}
