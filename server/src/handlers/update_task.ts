import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task | null> => {
  try {
    // Extract the id and build update data object
    const { id, ...updateData } = input;
    
    // Only include fields that are actually provided
    const fieldsToUpdate: Partial<typeof tasksTable.$inferInsert> = {};
    
    if (updateData.title !== undefined) {
      fieldsToUpdate.title = updateData.title;
    }
    
    if (updateData.description !== undefined) {
      fieldsToUpdate.description = updateData.description;
    }
    
    if (updateData.completed !== undefined) {
      fieldsToUpdate.completed = updateData.completed;
    }
    
    // Always update the updated_at timestamp
    fieldsToUpdate.updated_at = new Date();
    
    // Perform the update
    const result = await db.update(tasksTable)
      .set(fieldsToUpdate)
      .where(eq(tasksTable.id, id))
      .returning()
      .execute();

    // Return the updated task or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};