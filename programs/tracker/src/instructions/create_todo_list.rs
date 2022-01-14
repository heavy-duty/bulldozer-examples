use anchor_lang::prelude::*;
use crate::collections::TodoList;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateTodoListArguments {
  name: String,
  bump: u8,
}

#[derive(Accounts)]
#[instruction(arguments: CreateTodoListArguments)]
pub struct CreateTodoList<'info>{
  #[account(mut)]
  pub authority: Signer<'info>,
  #[account(
    init,
    space = 8 + 114,
    payer = authority,
    seeds = [b"todoList", authority.key.as_ref()],
    bump = arguments.bump
  )]
  pub todo_list: Box<Account<'info,TodoList>>,
  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateTodoList>, arguments: CreateTodoListArguments) -> ProgramResult {
  ctx.accounts.todo_list.name = arguments.name;
  ctx.accounts.todo_list.bump = arguments.bump;
  ctx.accounts.todo_list.authority = ctx.accounts.authority.key();
  ctx.accounts.todo_list.quantity_of_todos = 0;
  Ok(())
}
