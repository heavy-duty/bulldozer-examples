use anchor_lang::prelude::*;

mod collections;
mod instructions;

use instructions::*;

declare_id!("9EFLnZiD7Hrb41KsMNW6JTAGFpyZtHb2zAHFUhPQztPi");

#[program]
pub mod splitdacheck {
  use super::*;

  pub fn create_check(
    ctx: Context<CreateCheck>,
    check_id: u64,
    check_bump: u8,
    vault_bump: u8,
    total: u64,
  ) -> ProgramResult {
    instructions::create_check::handler(ctx, check_id, check_bump, vault_bump, total)
  }

  pub fn submit_partial_payment(ctx: Context<SubmitPartialPayment>, amount: u64) -> ProgramResult {
    instructions::submit_partial_payment::handler(ctx, amount)
  }
}
