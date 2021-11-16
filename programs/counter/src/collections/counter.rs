use anchor_lang::prelude::*;

#[account]
pub struct Counter {
  pub authority: Pubkey,
  pub data: u16,
}