use crate::collections::Check;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(
  check_id: u64, 
  check_bump: u8, 
  escrow_bump: u8, 
  total: u64
)]
pub struct CreateCheck<'info> {
  #[account(
    init,
    payer = authority,
    seeds=[b"check", check_id.to_le_bytes().as_ref()],
    bump = check_bump,
    space = 300
  )]
  pub check: Box<Account<'info, Check>>,
  #[account(
    init,
    payer = authority,
    seeds=[b"escrow", check.key().as_ref()],
    bump = escrow_bump,
    token::mint=token_mint,
    token::authority=check,
  )]
  pub escrow: Box<Account<'info, TokenAccount>>,
  pub token_mint: Account<'info, Mint>,
  pub token_program: Program<'info, Token>,
  pub rent: Sysvar<'info, Rent>,
  pub system_program: Program<'info, System>,
  #[account(mut)]
  pub authority: Signer<'info>,
}

pub fn handler(
  ctx: Context<CreateCheck>,
  check_id: u64,
  check_bump: u8,
  escrow_bump: u8,
  total: u64,
) -> ProgramResult {
  ctx.accounts.check.authority = ctx.accounts.authority.key();
  ctx.accounts.check.id = check_id;
  ctx.accounts.check.escrow = ctx.accounts.escrow.key();
  ctx.accounts.check.total = total;
  ctx.accounts.check.payed = 0;
  ctx.accounts.check.token_mint = ctx.accounts.token_mint.key();
  ctx.accounts.check.check_bump = check_bump;
  ctx.accounts.check.escrow_bump = escrow_bump;
  Ok(())
}
