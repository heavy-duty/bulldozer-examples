use anchor_lang::prelude::*;

mod collections;
mod instructions;

use instructions::*;

declare_id!("4tWf3qtzRhufNPiQa6VkdQE2Buuan94vVjH6KaUMpaSU");

#[program]
pub mod tracker {
  use super::*;

  pub fn create_todo_list(ctx: Context<CreateTodoList>, name: String) -> ProgramResult {
    instructions::create_todo_list::handler(ctx, name)
  }
  pub fn toggle_todo(ctx: Context<ToggleTodo>) -> ProgramResult {
    instructions::toggle_todo::handler(ctx)
  }
  pub fn create_todo(ctx: Context<CreateTodo>, body: String) -> ProgramResult {
    instructions::create_todo::handler(ctx, body)
  }
}