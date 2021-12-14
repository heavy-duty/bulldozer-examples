use crate::collections::Check;
use anchor_lang::prelude::*;
use anchor_spl::token::*;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct SubmitPayment<'info> {
  #[account(mut)]
  pub check: Box<Account<'info, Check>>,
  #[account(
    mut,
    constraint=check.authority == check_authority.key()
  )]
  pub check_authority: AccountInfo<'info>,
  #[account(mut)]
  pub vault: Box<Account<'info, TokenAccount>>,
  pub token_mint: Box<Account<'info, Mint>>,
  #[account(
    mut,
    constraint=payer.owner == authority.key(),
    constraint=payer.mint == token_mint.key()
  )]
  pub payer: Box<Account<'info, TokenAccount>>,
  #[account(
    mut,
    constraint=receiver.owner == check.authority,
    constraint=receiver.mint == token_mint.key()
  )]
  pub receiver: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
  pub authority: Signer<'info>,
}
