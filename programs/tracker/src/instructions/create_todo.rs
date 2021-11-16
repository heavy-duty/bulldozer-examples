use anchor_lang::prelude::*;
use crate::collections::{TodoList, Todo};

#[derive(Accounts)]
#[instruction(body: String)]
pub struct CreateTodo<'info>{
  pub todo_list: Box<Account<'info,TodoList>>,
  #[account(mut)]
  pub authority: Signer<'info>,
    #[account(
    init,
    space = 8 + 113,
    payer = authority,
  )]
  pub todo: Box<Account<'info,Todo>>,

  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateTodo>, body: String) -> ProgramResult {
  ctx.accounts.todo.body = body;
  ctx.accounts.todo.checked = false;
  ctx.accounts.todo.todo_list = ctx.accounts.todo_list.key();
  ctx.accounts.todo.authority = ctx.accounts.authority.key();
  Ok(())
}
