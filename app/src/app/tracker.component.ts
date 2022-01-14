import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { PublicKey } from '@solana/web3.js';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../environments/environment';
import { ConnectionStore } from './connection-store';
import { Todo, TodoList, TrackerStore } from './tracker.store';

@Component({
  selector: 'app-create-todo-list',
  template: `
    <h1 mat-dialog-title>Create ToDo List</h1>
    <div mat-dialog-content style="height: 120px">
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
    <div mat-dialog-content style="height: 120px">
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
  selector: 'app-todo-list',
  template: `
    <section style="margin: 0.5rem 1rem" *ngIf="todoList">
      <mat-card>
        <header>
          <h3>{{ todoList.name }}</h3>
          <button
            mat-raised-button
            color="primary"
            (click)="onCreateTodo(todoList.id)"
            [disabled]="!canEdit"
          >
            New
          </button>
          <button
            mat-raised-button
            color="primary"
            (click)="onDeleteTodoList()"
            [disabled]="!canEdit"
          >
            Delete
          </button>
        </header>

        <mat-list role="list">
          <mat-list-item
            *ngFor="let todo of todos; trackBy: identify"
            style="height: auto; width: 500px; margin-bottom: 1rem; padding: 0.5rem 1rem; background-color: rgba(0, 0, 0, 0.05)"
          >
            <mat-checkbox
              [ngModel]="todo.checked"
              (change)="onToggleTodo(todo.id)"
            >
            </mat-checkbox>
            <p>{{ todo.body }}</p>
            <button
              mat-raised-button
              color="primary"
              (click)="onDeleteTodo(todo)"
              [disabled]="!canEdit"
            >
              Delete
            </button>
          </mat-list-item>
        </mat-list>
      </mat-card>
    </section>
  `,
})
export class TodoListComponent {
  @Input() canEdit = false;
  @Input() todoList: TodoList | null = null;
  @Input() todos: Todo[] | null = null;
  @Output() createTodo = new EventEmitter<string>();
  @Output() toggleTodo = new EventEmitter<string>();
  @Output() deleteTodo = new EventEmitter<Todo>();
  @Output() deleteTodoList = new EventEmitter();

  onCreateTodo(todoListId: string) {
    this.createTodo.emit(todoListId);
  }

  onToggleTodo(todoId: string) {
    this.toggleTodo.emit(todoId);
  }

  onDeleteTodo(todo: Todo) {
    this.deleteTodo.emit(todo);
  }

  onDeleteTodoList() {
    this.deleteTodoList.emit();
  }

  identify(_: number, item: Todo | TodoList) {
    return item.id;
  }
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
          (click)="onCreateTodoList()"
          [disabled]="(connected$ | ngrxPush) === false"
        >
          New
        </button>
      </header>

      <app-todo-list
        [todoList]="todoList$ | ngrxPush"
        [todos]="todos$ | ngrxPush"
        [canEdit]="connected$ | ngrxPush"
        (createTodo)="onCreateTodo($event)"
        (toggleTodo)="onToggleTodo($event)"
        (deleteTodo)="onDeleteTodo($event)"
        (deleteTodoList)="onDeleteTodoList()"
      >
      </app-todo-list>
    </main>
  `,
  providers: [TrackerStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackerComponent {
  readonly todoList$ = this._trackerStore.todoList$;
  readonly todos$ = this._trackerStore.todos$;
  readonly connected$ = this._walletStore.connected$;

  _destroy = new Subject();

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _trackerStore: TrackerStore,
    private readonly _matDialog: MatDialog,
    private readonly _connectionStore: ConnectionStore
  ) {
    this._connectionStore
      .onProgramAccountChanges(
        new PublicKey(environment.trackerId),
        'confirmed',
        [
          {
            memcmp: {
              offset: 40,
              bytes: '4fP8r6rYiJbAizJ7nEpwAGCKCC1UA2Dw7EYjjftmF1hA',
            },
          },
        ]
      )
      .pipe(takeUntil(this._destroy))
      .subscribe((a) => console.log(`#1 ->`, a));
    this._connectionStore
      .onProgramAccountChanges(
        new PublicKey(environment.trackerId),
        'confirmed',
        [
          {
            memcmp: {
              offset: 8,
              bytes: 'BEXbittaED1WKBiKKLrNr8dWVsT17aUoEfwwUU6vjik4',
            },
          },
        ]
      )
      .pipe(takeUntil(this._destroy))
      .subscribe((a) => console.log(`#2 ->`, a));
  }

  ngOnDestroy() {
    this._destroy.next(null);
  }

  onReload() {
    this._trackerStore.reload();
  }

  onCreateTodoList() {
    this._matDialog
      .open(CreateTodoListComponent)
      .afterClosed()
      .subscribe((name) => {
        if (name) {
          this._trackerStore.createTodoList(name);
        }
      });
  }

  onDeleteTodoList() {
    this._trackerStore.deleteTodoList();
  }

  onCreateTodo(todoList: string) {
    this._matDialog
      .open(CreateTodoComponent)
      .afterClosed()
      .subscribe((body) => {
        if (body) {
          this._trackerStore.createTodo({ todoList, body });
        }
      });
  }

  onDeleteTodo(todo: Todo) {
    this._trackerStore.deleteTodo(todo);
  }

  onToggleTodo(todoId: string) {
    this._trackerStore.toggleTodo(todoId);
  }
}
