use anchor_lang::prelude::*;
use crate::collections::TodoList;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateTodoList<'info>{
  #[account(mut)]
  pub authority: Signer<'info>,
    #[account(
    init,
    space = 8 + 112,
    payer = authority,
  )]
  pub todo_list: Box<Account<'info,TodoList>>,

  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateTodoList>, name: String) -> ProgramResult {
  ctx.accounts.todo_list.name = name;
  ctx.accounts.todo_list.authority = ctx.accounts.authority.key();
  Ok(())
}
