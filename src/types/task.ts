export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: Priority;
}