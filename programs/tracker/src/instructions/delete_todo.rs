use anchor_lang::prelude::*;
use crate::collections::{Todo, TodoList};
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct DeleteTodo<'info>{
  #[account(
    mut,
    constraint = todo_list.key() == todo.todo_list @ ErrorCode::TodoListDoesntMatchTodo,
  )]
  pub todo_list: Box<Account<'info, TodoList>>,
  pub authority: Signer<'info>,
  #[account(
    mut,
    has_one = authority @ ErrorCode::UnauthorizedToDeleteTodo,
    close = authority,
  )]
  pub todo: Box<Account<'info,Todo>>,
}

pub fn handler(ctx: Context<DeleteTodo>) -> ProgramResult {
  ctx.accounts.todo_list.quantity_of_todos -= 1;
  Ok(())
}
