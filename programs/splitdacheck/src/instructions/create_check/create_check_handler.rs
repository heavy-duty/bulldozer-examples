use crate::instructions::create_check::CreateCheck;
use anchor_lang::prelude::*;

pub fn handler(
  ctx: Context<CreateCheck>,
  check_id: u64,
  check_bump: u8,
  vault_bump: u8,
  total: u64,
) -> ProgramResult {
  ctx.accounts.check.authority = ctx.accounts.authority.key();
  ctx.accounts.check.id = check_id;
  ctx.accounts.check.vault = ctx.accounts.vault.key();
  ctx.accounts.check.total = total;
  ctx.accounts.check.payed = 0;
  ctx.accounts.check.token_mint = ctx.accounts.token_mint.key();
  ctx.accounts.check.check_bump = check_bump;
  ctx.accounts.check.vault_bump = vault_bump;
  Ok(())
}
