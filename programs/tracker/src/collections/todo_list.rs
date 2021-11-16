use anchor_lang::prelude::*;

#[account]
pub struct TodoList {
  pub name: String,
  pub authority: Pubkey,
}