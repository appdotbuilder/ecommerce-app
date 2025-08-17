import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';

// Test input for creating a task to delete
const testCreateInput: CreateTaskInput = {
  title: 'Test Task to Delete',
  description: 'A task for deletion testing'
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // First, create a task to delete
    const createResult = await db.insert(tasksTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        completed: false
      })
      .returning()
      .execute();

    const createdTask = createResult[0];
    expect(createdTask).toBeDefined();
    expect(createdTask.id).toBeDefined();

    // Now delete the task
    const deleteInput: DeleteTaskInput = { id: createdTask.id };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify the task was actually deleted from the database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return success false for non-existent task', async () => {
    const deleteInput: DeleteTaskInput = { id: 9999 }; // ID that doesn't exist
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        completed: false
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        completed: true
      })
      .returning()
      .execute();

    const task1 = task1Result[0];
    const task2 = task2Result[0];

    // Delete only the first task
    const deleteInput: DeleteTaskInput = { id: task1.id };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify first task is deleted
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1.id))
      .execute();
    expect(deletedTasks).toHaveLength(0);

    // Verify second task still exists
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2.id))
      .execute();
    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].title).toEqual('Task 2');
    expect(remainingTasks[0].completed).toBe(true);
  });

  it('should handle deletion of completed task', async () => {
    // Create a completed task
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'A task that is already done',
        completed: true
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    // Delete the completed task
    const deleteInput: DeleteTaskInput = { id: createdTask.id };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify the task was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should handle deletion of task with null description', async () => {
    // Create a task with null description
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: createdTask.id };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify the task was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });
});