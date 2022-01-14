use anchor_lang::prelude::*;
use crate::collections::Todo;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct ToggleTodo<'info>{
  pub authority: Signer<'info>,
  #[account(
    mut, 
    has_one = authority @ ErrorCode::UnauthorizedToToggleTodo,
  )]
  pub todo: Box<Account<'info,Todo>>,
  pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<ToggleTodo>) -> ProgramResult {
  ctx.accounts.todo.checked = !ctx.accounts.todo.checked;
  ctx.accounts.todo.updated_at = ctx.accounts.clock.unix_timestamp;
  Ok(())
}
