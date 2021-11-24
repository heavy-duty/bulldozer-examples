use anchor_lang::prelude::*;

#[account]
pub struct Check {
  pub authority: Pubkey,
  pub id: u64,
  pub vault: Pubkey,
  pub total: u64,
  pub payed: u64,
  pub token_mint: Pubkey,
  pub check_bump: u8,
  pub vault_bump: u8,
}
