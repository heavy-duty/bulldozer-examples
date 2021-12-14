use anchor_lang::prelude::*;

mod collections;
mod instructions;

use instructions::*;

declare_id!("4FiqmNTgPxvXZLfiuUuJkF28tdupFz66HnMQRTjmUS7r");

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
