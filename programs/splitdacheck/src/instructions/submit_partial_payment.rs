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
  pub authority: Signer<'info>,
  #[account(
    mut,
    constraint=payer.owner == authority.key(),
    constraint=payer.mint == token_mint.key()
  )]
  payer: Account<'info, TokenAccount>,
}

pub fn handler(ctx: Context<SubmitPartialPayment>, amount: u64) -> ProgramResult {
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
      from: ctx.accounts.payer.to_account_info(),
      to: ctx.accounts.escrow.to_account_info(),
      authority: ctx.accounts.authority.to_account_info(),
    },
    signer,
  );
  transfer(cpi_ctx, amount)?;

  // Transfer to check authority if payment is complete
  Ok(())
}
