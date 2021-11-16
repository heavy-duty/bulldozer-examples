import { Component, OnInit } from '@angular/core';
import { ProgramStore } from '@heavy-duty/ng-anchor';
import { ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';

@Component({
  selector: 'app-root',
  template: `
    <app-navigation>
      <router-outlet></router-outlet>
    </app-navigation>
  `,
  styles: [],
  providers: [WalletStore, ConnectionStore, ProgramStore],
})
export class AppComponent implements OnInit {
  constructor(
    private readonly _programStore: ProgramStore,
    private readonly _connectionStore: ConnectionStore,
    private readonly _walletStore: WalletStore
  ) {}

  ngOnInit() {
    this._connectionStore.setEndpoint('http://localhost:8899');
    this._programStore.loadConnection(this._connectionStore.connection$);
    this._programStore.loadWallet(this._walletStore.anchorWallet$);
  }
}
