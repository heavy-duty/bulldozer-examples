use anchor_lang::error;
use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
  #[msg("Cant delete todo list with todos")]
  CantDeleteTodoListWithTodos,
  #[msg("Todo list provided doesnt match todo")]
  TodoListDoesntMatchTodo,
  #[msg("Unauthorized to create todo")]
  UnauthorizedToCreateTodo,
  #[msg("Unauthorized to toggle todo")]
  UnauthorizedToToggleTodo,
  #[msg("Unauthorized to delete todo")]
  UnauthorizedToDeleteTodo,
  #[msg("Unauthorized to delete todo list")]
  UnauthorizedToDeleteTodoList,
}
