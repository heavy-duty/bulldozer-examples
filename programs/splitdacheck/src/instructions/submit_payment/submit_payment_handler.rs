use crate::instructions::submit_payment::SubmitPayment;
use anchor_lang::prelude::*;
use anchor_spl::token::*;

pub fn handler(ctx: Context<SubmitPayment>, amount: u64) -> ProgramResult {
  ctx.accounts.check.payed += amount;

  // Transfer amount to vault
  transfer(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      Transfer {
        from: ctx.accounts.payer.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
      },
    ),
    amount,
  )?;

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
          from: ctx.accounts.vault.to_account_info(),
          to: ctx.accounts.receiver.to_account_info(),
          authority: ctx.accounts.check.to_account_info(),
        },
        signer,
      ),
      ctx.accounts.check.total,
    )?;

    close_account(CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info(),
      CloseAccount {
        account: ctx.accounts.vault.to_account_info(),
        destination: ctx.accounts.check_authority.to_account_info(),
        authority: ctx.accounts.check.to_account_info(),
      },
      signer,
    ))?;
  }

  Ok(())
}
