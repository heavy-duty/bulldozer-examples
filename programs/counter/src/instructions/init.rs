use anchor_lang::prelude::*;
use crate::collections::Counter;

#[derive(Accounts)]
pub struct Init<'info>{
  #[account(
    init,
    space = 8 + 2,
    payer = authority,
  )]
  pub counter: Box<Account<'info,Counter>>,
  #[account(mut)]
  pub authority: Signer<'info>,
  
  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Init>) -> ProgramResult {
  ctx.accounts.counter.data = 0;
  ctx.accounts.counter.authority = ctx.accounts.authority.key();
  Ok(())
}
