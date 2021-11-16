use anchor_lang::prelude::*;

mod collections;
mod instructions;

use instructions::*;

declare_id!("F3G6Aq7MTF3D5nZHBH7uKqJ8xD7yo1gv4F5eHmBEtt1X");

#[program]
pub mod counter {
  use super::*;

  pub fn increment(ctx: Context<Increment>) -> ProgramResult {
    instructions::increment::handler(ctx)
  }
  pub fn init(ctx: Context<Init>) -> ProgramResult {
    instructions::init::handler(ctx)
  }
}