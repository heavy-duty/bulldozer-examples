use anchor_lang::prelude::*;

mod collections;
mod instructions;

use instructions::*;

declare_id!("BbZeA3aEiEx1ky6BamZha8FX5tDGmBagk5YYmbYQD1Lg");

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

  pub fn submit_payment(ctx: Context<SubmitPayment>, amount: u64) -> ProgramResult {
    instructions::submit_payment::handler(ctx, amount)
  }
}
