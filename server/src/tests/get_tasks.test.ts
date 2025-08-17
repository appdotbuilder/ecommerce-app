import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

// Test data
const testTask1: CreateTaskInput = {
  title: 'First Task',
  description: 'First task description'
};

const testTask2: CreateTaskInput = {
  title: 'Second Task',
  description: null // Test null description
};

const testTask3: CreateTaskInput = {
  title: 'Third Task',
  description: 'Third task description'
};

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all tasks', async () => {
    // Create test tasks
    await db.insert(tasksTable)
      .values([
        {
          title: testTask1.title,
          description: testTask1.description
        },
        {
          title: testTask2.title,
          description: testTask2.description
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Find tasks by title since order may vary with batch inserts
    const firstTask = result.find(task => task.title === testTask1.title);
    const secondTask = result.find(task => task.title === testTask2.title);
    
    expect(firstTask).toBeDefined();
    expect(firstTask?.description).toEqual(testTask1.description);
    expect(firstTask?.completed).toBe(false); // Default value
    expect(firstTask?.id).toBeDefined();
    expect(firstTask?.created_at).toBeInstanceOf(Date);
    expect(firstTask?.updated_at).toBeInstanceOf(Date);

    expect(secondTask).toBeDefined();
    expect(secondTask?.description).toBeNull();
    expect(secondTask?.completed).toBe(false);
    expect(secondTask?.id).toBeDefined();
    expect(secondTask?.created_at).toBeInstanceOf(Date);
    expect(secondTask?.updated_at).toBeInstanceOf(Date);
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Create first task
    await db.insert(tasksTable)
      .values({
        title: testTask1.title,
        description: testTask1.description
      })
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second task
    await db.insert(tasksTable)
      .values({
        title: testTask2.title,
        description: testTask2.description
      })
      .execute();

    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create third task
    await db.insert(tasksTable)
      .values({
        title: testTask3.title,
        description: testTask3.description
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Verify ordering (newest first)
    expect(result[0].title).toEqual(testTask3.title); // Most recent
    expect(result[1].title).toEqual(testTask2.title); // Middle
    expect(result[2].title).toEqual(testTask1.title); // Oldest
    
    // Verify timestamps are actually in descending order
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeGreaterThan(result[2].created_at.getTime());
  });

  it('should handle tasks with various completion states', async () => {
    // Create tasks with different completion states
    await db.insert(tasksTable)
      .values([
        {
          title: 'Completed Task',
          description: 'A completed task',
          completed: true
        },
        {
          title: 'Incomplete Task',
          description: 'An incomplete task',
          completed: false
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Find each task
    const completedTask = result.find(task => task.title === 'Completed Task');
    const incompleteTask = result.find(task => task.title === 'Incomplete Task');

    expect(completedTask).toBeDefined();
    expect(completedTask?.completed).toBe(true);
    
    expect(incompleteTask).toBeDefined();
    expect(incompleteTask?.completed).toBe(false);
  });

  it('should handle tasks with null descriptions correctly', async () => {
    // Create task with null description
    await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Task with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return all task fields correctly', async () => {
    // Create a task with all fields specified
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Full Task',
        description: 'Complete task with all fields',
        completed: true
      })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];
    
    // Verify all fields are present and correct types
    expect(typeof task.id).toBe('number');
    expect(typeof task.title).toBe('string');
    expect(task.description === null || typeof task.description === 'string').toBe(true);
    expect(typeof task.completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
    
    // Verify values
    expect(task.title).toEqual('Full Task');
    expect(task.description).toEqual('Complete task with all fields');
    expect(task.completed).toBe(true);
    expect(task.id).toEqual(insertResult[0].id);
  });
});