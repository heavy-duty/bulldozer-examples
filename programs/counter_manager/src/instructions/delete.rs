use anchor_lang::prelude::*;
use crate::collections::Counter;

#[derive(Accounts)]
pub struct Delete<'info>{
  pub authority: Signer<'info>,
    #[account(
    mut,
    has_one = authority,
    close = authority,
  )]
  pub counter: Box<Account<'info,Counter>>,

}

pub fn handler(_ctx: Context<Delete>) -> ProgramResult {
  Ok(())
}
