use anchor_lang::prelude::*;

mod collections;
mod instructions;
mod errors;

use instructions::*;

declare_id!("4FiqmNTgPxvXZLfiuUuJkF28tdupFz66HnMQRTjmUS7r");

#[program]
pub mod tracker {
  use super::*;

  pub fn create_todo_list(ctx: Context<CreateTodoList>, arguments: CreateTodoListArguments) -> ProgramResult {
    instructions::create_todo_list::handler(ctx, arguments)
  }
  pub fn delete_todo_list(ctx: Context<DeleteTodoList>) -> ProgramResult {
    instructions::delete_todo_list::handler(ctx)
  }
  pub fn toggle_todo(ctx: Context<ToggleTodo>) -> ProgramResult {
    instructions::toggle_todo::handler(ctx)
  }
  pub fn create_todo(ctx: Context<CreateTodo>, arguments: CreateTodoArguments) -> ProgramResult {
    instructions::create_todo::handler(ctx, arguments)
  }
  pub fn delete_todo(ctx: Context<DeleteTodo>) -> ProgramResult {
    instructions::delete_todo::handler(ctx)
  }
}
