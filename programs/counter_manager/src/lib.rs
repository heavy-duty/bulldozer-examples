use anchor_lang::prelude::*;

mod collections;
mod instructions;

use instructions::*;

declare_id!("F6A5UyESh3TQkKGjc2wx4tCVe1SZZyZnmMBW7iWmKPcw");

#[program]
pub mod counter_manager {
  use super::*;

  pub fn increment(ctx: Context<Increment>) -> ProgramResult {
    instructions::increment::handler(ctx)
  }
  pub fn init(ctx: Context<Init>) -> ProgramResult {
    instructions::init::handler(ctx)
  }
}