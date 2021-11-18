use anchor_lang::prelude::*;
use crate::collections::Counter;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Init<'info>{
  #[account(
    init,
    space = 8 + 2 + 32 + 1,
    payer = authority,
    seeds = [b"counter", authority.key().as_ref()],
    bump = bump
  )]
  pub counter: Box<Account<'info,Counter>>,
  #[account(mut)]
  pub authority: Signer<'info>,
  
  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Init>, bump: u8) -> ProgramResult {
  ctx.accounts.counter.data = 0;
  ctx.accounts.counter.authority = ctx.accounts.authority.key();
  ctx.accounts.counter.bump = bump;
  Ok(())
}
