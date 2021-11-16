use anchor_lang::prelude::*;

#[account]
pub struct Todo {
  pub body: String,
  pub checked: bool,
  pub authority: Pubkey,
  pub todo_list: Pubkey,
}