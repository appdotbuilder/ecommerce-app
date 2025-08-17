import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Form state for creating new tasks
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null
  });

  // Form state for editing tasks
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string | null;
    completed: boolean;
  }>({
    title: '',
    description: null,
    completed: false
  });

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(formData);
      setTasks((prev: Task[]) => [newTask, ...prev]);
      setFormData({ title: '', description: null });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setIsLoading(true);
    try {
      const updateData: UpdateTaskInput = {
        id: editingTask.id,
        title: editFormData.title,
        description: editFormData.description,
        completed: editFormData.completed
      };
      
      const updatedTask = await trpc.updateTask.mutate(updateData);
      if (updatedTask) {
        setTasks((prev: Task[]) => 
          prev.map((task: Task) => task.id === editingTask.id ? updatedTask : task)
        );
      }
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: task.id,
        completed: !task.completed
      });
      if (updatedTask) {
        setTasks((prev: Task[]) => 
          prev.map((t: Task) => t.id === task.id ? updatedTask : t)
        );
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const result = await trpc.deleteTask.mutate({ id: taskToDelete.id });
      if (result.success) {
        setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskToDelete.id));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      completed: task.completed
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditFormData({ title: '', description: null, completed: false });
  };

  const openDeleteDialog = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const completedTasks = tasks.filter((task: Task) => task.completed);
  const pendingTasks = tasks.filter((task: Task) => !task.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ Task Manager</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Task Creation Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">➕</span>
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <Input
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                }
                required
                className="text-lg"
              />
              <Textarea
                placeholder="Add a description (optional)"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTaskInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? '⏳ Creating...' : '🚀 Create Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tasks Summary */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                <div className="text-blue-600">Total Tasks</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{pendingTasks.length}</div>
                <div className="text-amber-600">Pending</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                <div className="text-green-600">Completed</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Task Editing Form */}
        {editingTask && (
          <Card className="mb-8 border-amber-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <span className="text-2xl">✏️</span>
                Edit Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <Input
                  placeholder="Task title"
                  value={editFormData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
                <Textarea
                  placeholder="Task description (optional)"
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={editFormData.completed}
                    onCheckedChange={(checked: boolean) =>
                      setEditFormData((prev) => ({ ...prev, completed: checked }))
                    }
                  />
                  <label htmlFor="completed" className="text-sm font-medium">
                    Mark as completed
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? '⏳ Saving...' : '💾 Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1">
                    ❌ Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No tasks yet!</h3>
              <p className="text-gray-500">Create your first task above to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="text-3xl">⏳</span>
                  Pending Tasks ({pendingTasks.length})
                </h2>
                <div className="grid gap-4">
                  {pendingTasks.map((task: Task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => handleToggleComplete(task)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800">
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-gray-600 mt-1">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                <span>📅 Created: {task.created_at.toLocaleDateString()}</span>
                                {task.updated_at.getTime() !== task.created_at.getTime() && (
                                  <span>✏️ Updated: {task.updated_at.toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                              Pending
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(task)}
                              disabled={editingTask?.id === task.id}
                            >
                              ✏️ Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(task)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑️ Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pendingTasks.length > 0 && completedTasks.length > 0 && (
              <Separator className="my-8" />
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="text-3xl">✅</span>
                  Completed Tasks ({completedTasks.length})
                </h2>
                <div className="grid gap-4">
                  {completedTasks.map((task: Task) => (
                    <Card key={task.id} className="opacity-75 hover:opacity-100 transition-opacity">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => handleToggleComplete(task)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-600 line-through">
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-gray-500 mt-1 line-through">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                <span>📅 Created: {task.created_at.toLocaleDateString()}</span>
                                <span>✅ Completed: {task.updated_at.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(task)}
                              disabled={editingTask?.id === task.id}
                            >
                              ✏️ Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(task)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑️ Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>🗑️ Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTask}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Task
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default App;