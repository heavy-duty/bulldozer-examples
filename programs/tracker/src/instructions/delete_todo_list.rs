use anchor_lang::prelude::*;
use crate::collections::TodoList;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct DeleteTodoList<'info>{
  pub authority: Signer<'info>,
  #[account(
    mut,
    close = authority,
    has_one = authority @ ErrorCode::UnauthorizedToDeleteTodoList,
    constraint = todo_list.quantity_of_todos == 0 @ ErrorCode::CantDeleteTodoListWithTodos,
  )]
  pub todo_list: Box<Account<'info,TodoList>>,
}

pub fn handler(_ctx: Context<DeleteTodoList>) -> ProgramResult {
  Ok(())
}
