use anchor_lang::prelude::*;

#[account]
pub struct Todo {
  pub authority: Pubkey,
  pub todo_list: Pubkey,
  pub body: String,
  pub checked: bool,
}