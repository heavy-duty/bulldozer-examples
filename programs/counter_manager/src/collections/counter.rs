use anchor_lang::prelude::*;

#[account]
pub struct Counter {
  pub authority: Pubkey,
  pub data: u16,
  pub bump: u8
}