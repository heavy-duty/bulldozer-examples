use anchor_lang::prelude::*;

mod collections;
mod instructions;

use instructions::*;

declare_id!("J15Nxu5dcMEyeQFymh1qvk3XzSLZcLyr9mCmCc8PSEhJ");

#[program]
pub mod counter_manager {
  use super::*;

  pub fn increment(ctx: Context<Increment>) -> ProgramResult {
    instructions::increment::handler(ctx)
  }
  pub fn init(ctx: Context<Init>, bump: u8) -> ProgramResult {
    instructions::init::handler(ctx, bump)
  }
}
