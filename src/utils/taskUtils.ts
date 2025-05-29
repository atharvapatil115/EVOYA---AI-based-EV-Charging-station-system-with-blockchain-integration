import { Task, TaskFormData } from '../types/task';

// Generate a unique ID for tasks
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Create a new task from form data
export const createTask = (formData: TaskFormData): Task => {
  return {
    id: generateId(),
    ...formData,
    completed: false,
    createdAt: new Date().toISOString(),
  };
};

// Group tasks by date
export const groupTasksByDate = (tasks: Task[]): Record<string, Task[]> => {
  return tasks.reduce((acc: Record<string, Task[]>, task) => {
    const date = task.dueDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {});
};

// Sort tasks by due date
export const sortTasksByDueDate = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};

// Filter tasks by various criteria
export const filterTasks = (
  tasks: Task[],
  filters: {
    subject?: string;
    priority?: string;
    completed?: boolean | null;
    searchTerm?: string;
  }
): Task[] => {
  return tasks.filter((task) => {
    // Subject filter
    if (filters.subject && filters.subject !== 'all' && task.subject !== filters.subject) {
      return false;
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    // Completion status filter
    if (filters.completed !== null && filters.completed !== undefined && task.completed !== filters.completed) {
      return false;
    }

    // Search term filter
    if (
      filters.searchTerm &&
      !task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
      !task.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
};

// Get unique subjects from tasks
export const getUniqueSubjects = (tasks: Task[]): string[] => {
  const subjects = tasks.map((task) => task.subject);
  return [...new Set(subjects)];
};

// Check if a date is today
export const isToday = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);
  
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Format date to display in UI
export const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Get today's date in YYYY-MM-DD format
export const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Get the date range for the current week
export const getCurrentWeekDates = (): string[] => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the start of the week (Sunday)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek);
  
  // Generate dates for the whole week
  const weekDates: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    weekDates.push(date.toISOString().split('T')[0]);
  }
  
  return weekDates;
};