use anchor_lang::prelude::*;
use crate::collections::Counter;

#[derive(Accounts)]
pub struct Increment<'info>{
  pub authority: Signer<'info>,
    #[account(
    mut,
    has_one = authority,
  )]
  pub counter: Box<Account<'info,Counter>>,

}

pub fn handler(ctx: Context<Increment>) -> ProgramResult {
  ctx.accounts.counter.data += 1;
  Ok(())
}
