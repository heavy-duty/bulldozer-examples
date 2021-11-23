use crate::collections::Check;
use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct SubmitPartialPayment<'info> {
  #[account(mut)]
  pub check: Box<Account<'info, Check>>,
  #[account(mut)]
  pub escrow: Box<Account<'info, TokenAccount>>,
  pub token_mint: Account<'info, Mint>,
  pub token_program: Program<'info, Token>,
  #[account(mut)]
  pub authority: Signer<'info>,
  #[account(
    mut,
    constraint=associated_token.owner == authority.key(),
    constraint=associated_token.mint == token_mint.key()
  )]
  associated_token: Account<'info, TokenAccount>,
}

pub fn handler(ctx: Context<SubmitPartialPayment>, amount: u64) -> ProgramResult {
  ctx.accounts.check.debt -= amount;
  ctx.accounts.check.payed += amount;

  // Transfer amount to escrow
  let check_id_bytes = ctx.accounts.check.id.to_le_bytes();
  let seeds = &[
    b"check",
    check_id_bytes.as_ref(),
    &[ctx.accounts.check.check_bump],
  ];
  let signer = &[&seeds[..]];
  let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    Transfer {
      from: ctx.accounts.associated_token.to_account_info(),
      to: ctx.accounts.escrow.to_account_info(),
      authority: ctx.accounts.authority.to_account_info(),
    },
    signer,
  );
  transfer(cpi_ctx, amount)?;

  // Transfer to check authority if payment is complete
  Ok(())
}
