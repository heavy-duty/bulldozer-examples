use anchor_lang::prelude::*;
use crate::collections::{TodoList, Todo};
use crate::errors::ErrorCode;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateTodoArguments {
  body: String,
}

#[derive(Accounts)]
#[instruction(arguments: CreateTodoArguments)]
pub struct CreateTodo<'info>{
  #[account(
    mut,
    has_one = authority @ ErrorCode::UnauthorizedToCreateTodo,
  )]
  pub todo_list: Box<Account<'info,TodoList>>,
  #[account(mut)]
  pub authority: Signer<'info>,
  #[account(
    init,
    space = 8 + 265,
    payer = authority,
  )]
  pub todo: Box<Account<'info,Todo>>,
  pub system_program: Program<'info, System>,
  pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<CreateTodo>, arguments: CreateTodoArguments) -> ProgramResult {
  ctx.accounts.todo.body = arguments.body;
  ctx.accounts.todo.checked = false;
  ctx.accounts.todo.todo_list = ctx.accounts.todo_list.key();
  ctx.accounts.todo.authority = ctx.accounts.authority.key();
  ctx.accounts.todo.created_at = ctx.accounts.clock.unix_timestamp;
  ctx.accounts.todo.updated_at = ctx.accounts.clock.unix_timestamp;
  ctx.accounts.todo_list.quantity_of_todos += 1;
  Ok(())
}
