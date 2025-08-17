import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const getTask = async (input: GetTaskInput): Promise<Task | null> => {
  try {
    // Query for a single task by ID
    const results = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Return null if no task found, otherwise return the first (and only) result
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Get task failed:', error);
    throw error;
  }
};