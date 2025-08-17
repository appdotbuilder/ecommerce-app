import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test inputs with all required fields
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing'
};

const testInputWithNullDescription: CreateTaskInput = {
  title: 'Task with null description',
  description: null
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with description', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with null description', async () => {
    const result = await createTask(testInputWithNullDescription);

    // Basic field validation
    expect(result.title).toEqual('Task with null description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set completed to false by default', async () => {
    const result = await createTask(testInput);

    expect(result.completed).toEqual(false);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].completed).toEqual(false);
  });

  it('should set timestamps automatically', async () => {
    const beforeCreation = new Date();
    
    const result = await createTask(testInput);
    
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should create multiple tasks with unique IDs', async () => {
    const firstTask = await createTask({
      title: 'First Task',
      description: 'First description'
    });

    const secondTask = await createTask({
      title: 'Second Task',
      description: 'Second description'
    });

    expect(firstTask.id).not.toEqual(secondTask.id);
    expect(firstTask.title).toEqual('First Task');
    expect(secondTask.title).toEqual('Second Task');

    // Verify both tasks exist in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(2);
    
    const taskTitles = allTasks.map(task => task.title).sort();
    expect(taskTitles).toEqual(['First Task', 'Second Task']);
  });
});