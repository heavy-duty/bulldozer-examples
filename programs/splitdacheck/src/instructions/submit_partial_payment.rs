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

pub fn handler(ctx: Context<SubmitPartialPayment>, amount: u64) -> ProgramResult {
  ctx.accounts.check.payed += amount;

  // Transfer amount to escrow
  transfer(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      Transfer {
        from: ctx.accounts.payer.to_account_info(),
        to: ctx.accounts.escrow.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
      },
    ),
    amount,
  )?;

  // Transfer to check authority if payment is complete
  if ctx.accounts.check.payed == ctx.accounts.check.total {
    let check_id = ctx.accounts.check.id.to_le_bytes();
    let seeds = &[
      b"check",
      check_id.as_ref(),
      &[ctx.accounts.check.check_bump],
    ];
    let signer = &[&seeds[..]];

    transfer(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
          from: ctx.accounts.escrow.to_account_info(),
          to: ctx.accounts.receiver.to_account_info(),
          authority: ctx.accounts.check.to_account_info(),
        },
        signer,
      ),
      ctx.accounts.check.total,
    )?;
  }

  Ok(())
}
