use anchor_lang::prelude::*;

mod collections;
mod instructions;

use instructions::*;

declare_id!("4SXjVQ2iU8iticsh7VCmnCCuko9VLbshmXdVDW2nEi5X");

#[program]
pub mod counter_manager {
  use super::*;

  pub fn increment(ctx: Context<Increment>) -> ProgramResult {
    instructions::increment::handler(ctx)
  }
  pub fn init(ctx: Context<Init>, bump: u8) -> ProgramResult {
    instructions::init::handler(ctx, bump)
  }
  pub fn delete(ctx: Context<Delete>) -> ProgramResult {
    instructions::delete::handler(ctx)
  }
}
