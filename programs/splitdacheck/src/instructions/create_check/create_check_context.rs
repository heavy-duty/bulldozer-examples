use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount, Token};
use crate::collections::Check;

#[derive(Accounts)]
#[instruction(
  check_id: u64, 
  check_bump: u8, 
  vault_bump: u8, 
  total: u64
)]
pub struct CreateCheck<'info> {
  #[account(
    init,
    payer = authority,
    seeds = [b"check", check_id.to_le_bytes().as_ref()],
    bump = check_bump,
    space = 130
  )]
  pub check: Box<Account<'info, Check>>,
  #[account(
    init,
    payer = authority,
    seeds=[b"vault", check.key().as_ref()],
    bump = vault_bump,
    token::mint=token_mint,
    token::authority=check,
  )]
  pub vault: Box<Account<'info, TokenAccount>>,
  pub token_mint: Box<Account<'info, Mint>>,
  #[account(
    mut,
    constraint=receiver.owner == authority.key(),
    constraint=receiver.mint == token_mint.key()
  )]
  pub receiver: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
  pub rent: Sysvar<'info, Rent>,
  pub system_program: Program<'info, System>,
  #[account(mut)]
  pub authority: Signer<'info>,
}
