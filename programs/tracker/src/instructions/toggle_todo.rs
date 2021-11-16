use anchor_lang::prelude::*;
use crate::collections::Todo;

#[derive(Accounts)]
pub struct ToggleTodo<'info>{
  pub authority: Signer<'info>,
    #[account(
    mut,
  )]
  pub todo: Box<Account<'info,Todo>>,

}

pub fn handler(ctx: Context<ToggleTodo>) -> ProgramResult {
  ctx.accounts.todo.checked = !ctx.accounts.todo.checked;
  Ok(())
}
