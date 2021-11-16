use anchor_lang::prelude::*;

#[account]
pub struct TodoList {
  pub authority: Pubkey,
  pub name: String,
}