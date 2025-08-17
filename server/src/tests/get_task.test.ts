import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when it exists', async () => {
    // Create a test task directly in the database
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        completed: false
      })
      .returning()
      .execute();

    const insertedTask = insertResult[0];
    
    // Test getting the task
    const input: GetTaskInput = { id: insertedTask.id };
    const result = await getTask(input);

    // Verify the task is returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedTask.id);
    expect(result!.title).toEqual('Test Task');
    expect(result!.description).toEqual('A task for testing');
    expect(result!.completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when task does not exist', async () => {
    // Test getting a non-existent task
    const input: GetTaskInput = { id: 999 };
    const result = await getTask(input);

    expect(result).toBeNull();
  });

  it('should handle task with null description', async () => {
    // Create a task with null description
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Task Without Description',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const insertedTask = insertResult[0];
    
    // Test getting the task
    const input: GetTaskInput = { id: insertedTask.id };
    const result = await getTask(input);

    // Verify the task is returned correctly with null description
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedTask.id);
    expect(result!.title).toEqual('Task Without Description');
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return the correct task when multiple tasks exist', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'First Task',
        description: 'First description',
        completed: false
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Second Task',
        description: 'Second description',
        completed: true
      })
      .returning()
      .execute();

    // Test getting the second task specifically
    const input: GetTaskInput = { id: task2[0].id };
    const result = await getTask(input);

    // Verify we get the correct task
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(task2[0].id);
    expect(result!.title).toEqual('Second Task');
    expect(result!.description).toEqual('Second description');
    expect(result!.completed).toEqual(true);
  });
});