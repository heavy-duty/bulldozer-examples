import { LayoutModule } from '@angular/cdk/layout';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { PROGRAM_CONFIGS } from '@heavy-duty/ng-anchor';
import { WALLET_CONFIG } from '@heavy-duty/wallet-adapter';
import { WalletAdapterUiModule } from '@heavy-duty/wallet-adapter-ui';
import { ReactiveComponentModule } from '@ngrx/component';
import {
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletWallet,
} from '@solana/wallet-adapter-wallets';

import * as counterIdl from '../assets/json/counter.json';
import * as trackerIdl from '../assets/json/tracker.json';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { CounterComponent } from './counter.component';
import { NavigationComponent } from './navigation.component';
import { TrackerComponent } from './tracker.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    CounterComponent,
    TrackerComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([
      { path: 'counter', component: CounterComponent },
      { path: 'tracker', component: TrackerComponent },
    ]),
    RouterModule,
    LayoutModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    ReactiveComponentModule,
    WalletAdapterUiModule,
  ],
  providers: [
    {
      provide: WALLET_CONFIG,
      useValue: {
        wallets: [
          getPhantomWallet(),
          getSlopeWallet(),
          getSolletWallet(),
          getSolflareWallet(),
        ],
        autoConnect: true,
      },
    },
    {
      provide: PROGRAM_CONFIGS,
      useValue: {
        counter: {
          id: environment.counterProgramId,
          idl: counterIdl,
        },
        tracker: {
          id: environment.trackerProgramId,
          idl: trackerIdl,
        },
      },
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
