import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (taskData: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: taskData.title,
      description: taskData.description,
      completed: false // Default value
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title only', async () => {
    // Create a test task
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.completed).toEqual(false); // Should remain unchanged
    expect(result!.created_at).toEqual(testTask.created_at); // Should remain unchanged
    expect(result!.updated_at.getTime()).toBeGreaterThan(testTask.updated_at.getTime()); // Should be updated
  });

  it('should update task description only', async () => {
    const testTask = await createTestTask({
      title: 'Test Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Test Title'); // Should remain unchanged
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(false); // Should remain unchanged
  });

  it('should update completed status only', async () => {
    const testTask = await createTestTask({
      title: 'Test Title',
      description: 'Test description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Test Title'); // Should remain unchanged
    expect(result!.description).toEqual('Test description'); // Should remain unchanged
    expect(result!.completed).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(true);
    expect(result!.created_at).toEqual(testTask.created_at); // Should remain unchanged
    expect(result!.updated_at.getTime()).toBeGreaterThan(testTask.updated_at.getTime());
  });

  it('should handle null description update', async () => {
    const testTask = await createTestTask({
      title: 'Test Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Test Title'); // Should remain unchanged
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(false); // Should remain unchanged
  });

  it('should return null for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result).toBeNull();
  });

  it('should save changes to database', async () => {
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Updated Title',
      completed: true
    };

    await updateTask(updateInput);

    // Verify changes persisted to database
    const savedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTask.id))
      .execute();

    expect(savedTasks).toHaveLength(1);
    expect(savedTasks[0].title).toEqual('Updated Title');
    expect(savedTasks[0].description).toEqual('Original description');
    expect(savedTasks[0].completed).toEqual(true);
    expect(savedTasks[0].created_at).toEqual(testTask.created_at);
    expect(savedTasks[0].updated_at.getTime()).toBeGreaterThan(testTask.updated_at.getTime());
  });

  it('should handle task with null description initially', async () => {
    const testTask = await createTestTask({
      title: 'Test Title',
      description: null
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      description: 'Added description'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Test Title');
    expect(result!.description).toEqual('Added description');
    expect(result!.completed).toEqual(false);
  });

  it('should preserve original created_at timestamp', async () => {
    const testTask = await createTestTask({
      title: 'Test Title',
      description: 'Test description'
    });

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.created_at.getTime()).toEqual(testTask.created_at.getTime());
    expect(result!.updated_at.getTime()).toBeGreaterThan(testTask.updated_at.getTime());
  });
});