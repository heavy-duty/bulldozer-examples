import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WalletStore } from '@heavy-duty/wallet-adapter';

import { Todo, TodoList, TrackerStore } from './tracker.store';

@Component({
  selector: 'app-create-todo-list',
  template: `
    <h1 mat-dialog-title>Create ToDo List</h1>
    <div mat-dialog-content>
      <p>What's the name of the ToDo List?</p>
      <mat-form-field appearance="fill">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="name" />
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>No Thanks</button>
      <button mat-button [mat-dialog-close]="name" cdkFocusInitial>Ok</button>
    </div>
  `,
})
export class CreateTodoListComponent {
  name = '';
}

@Component({
  selector: 'app-create-todo',
  template: `
    <h1 mat-dialog-title>Create ToDo</h1>
    <div mat-dialog-content>
      <p>What's the ToDo about?</p>
      <mat-form-field appearance="fill">
        <mat-label>Body</mat-label>
        <textarea matInput [(ngModel)]="body"></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>No Thanks</button>
      <button mat-button [mat-dialog-close]="body" cdkFocusInitial>Ok</button>
    </div>
  `,
})
export class CreateTodoComponent {
  body = '';
}

@Component({
  selector: 'app-tracker',
  template: `
    <header>
      <h1>Tracker</h1>
      <button mat-raised-button color="primary" (click)="onReload()">
        Reload
      </button>
    </header>
    <main>
      <header>
        <h2>ToDo Lists</h2>
        <button
          mat-raised-button
          color="primary"
          (click)="createTodoList()"
          [disabled]="(connected$ | ngrxPush) === false"
        >
          New
        </button>
      </header>

      <section
        *ngFor="let todoList of todoLists$ | ngrxPush; trackBy: identify"
        style="margin: 0.5rem 1rem"
      >
        <mat-card>
          <header>
            <h3>{{ todoList.name }}</h3>
            <button
              mat-raised-button
              color="primary"
              (click)="createTodo(todoList.id)"
              [disabled]="(connected$ | ngrxPush) === false"
            >
              New
            </button>
          </header>

          <mat-list role="list">
            <mat-list-item
              *ngFor="let todo of todoList.todos; trackBy: identify"
              style="height: auto; width: 500px; margin-bottom: 1rem; padding: 0.5rem 1rem; background-color: rgba(0, 0, 0, 0.05)"
            >
              <mat-checkbox
                [ngModel]="todo.checked"
                (change)="onToggleTodo(todo.id)"
              >
                {{ todo.body }}
              </mat-checkbox>
            </mat-list-item>
          </mat-list>
        </mat-card>
      </section>
    </main>
  `,
  providers: [TrackerStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackerComponent {
  readonly todoLists$ = this._trackerStore.todoLists$;
  readonly connected$ = this._walletStore.connected$;

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _trackerStore: TrackerStore,
    private readonly _matDialog: MatDialog
  ) {}

  onReload() {
    this._trackerStore.reload();
  }

  createTodoList() {
    this._matDialog
      .open(CreateTodoListComponent)
      .afterClosed()
      .subscribe((name) => {
        if (name) {
          this._trackerStore.createTodoList(name);
        }
      });
  }

  createTodo(todoList: string) {
    this._matDialog
      .open(CreateTodoComponent)
      .afterClosed()
      .subscribe((body) => {
        if (body) {
          this._trackerStore.createTodo({ todoList, body });
        }
      });
  }

  onToggleTodo(todoId: string) {
    this._trackerStore.toggleTodo(todoId);
  }

  identify(_: number, item: Todo | TodoList) {
    return item.id;
  }
}
