use anchor_lang::prelude::*;

mod collections;
mod instructions;

use instructions::*;

declare_id!("ABxpQTckk4jR1oZ3kFzbUNTcvZfE3TP7nBhecFhysjGy");

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