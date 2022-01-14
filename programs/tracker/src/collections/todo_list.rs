use anchor_lang::prelude::*;

#[account]
pub struct TodoList {
  pub authority: Pubkey,
  pub name: String,
  pub bump: u8,
  pub created_at: i64,
  pub updated_at: i64,
  pub quantity_of_todos: u16,
}