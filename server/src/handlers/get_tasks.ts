import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { desc } from 'drizzle-orm';

export const getTasks = async (): Promise<Task[]> => {
  try {
    // Query all tasks ordered by creation date (newest first)
    const results = await db.select()
      .from(tasksTable)
      .orderBy(desc(tasksTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Get tasks failed:', error);
    throw error;
  }
};