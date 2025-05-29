import React, { createContext, useContext, useEffect, useState } from 'react';
import { Task, TaskFormData } from '../types/task';
import { createTask } from '../utils/taskUtils';

interface TaskContextType {
  tasks: Task[];
  addTask: (taskData: TaskFormData) => void;
  updateTask: (id: string, updatedTask: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  getDailyFocusTask: () => Task | undefined;
  setDailyFocusTaskId: (id: string | null) => void;
  dailyFocusTaskId: string | null;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load tasks from localStorage on initial render
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  // Daily focus task
  const [dailyFocusTaskId, setDailyFocusTaskId] = useState<string | null>(() => {
    return localStorage.getItem('dailyFocusTaskId');
  });

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save daily focus task ID to localStorage
  useEffect(() => {
    if (dailyFocusTaskId) {
      localStorage.setItem('dailyFocusTaskId', dailyFocusTaskId);
    } else {
      localStorage.removeItem('dailyFocusTaskId');
    }
  }, [dailyFocusTaskId]);

  // Add a new task
  const addTask = (taskData: TaskFormData) => {
    const newTask = createTask(taskData);
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  // Update an existing task
  const updateTask = (id: string, updatedTask: Partial<Task>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, ...updatedTask } : task
      )
    );
  };

  // Delete a task
  const deleteTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    // If the deleted task was the daily focus, clear it
    if (dailyFocusTaskId === id) {
      setDailyFocusTaskId(null);
    }
  };

  // Toggle task completion status
  const toggleTaskCompletion = (id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Get the daily focus task
  const getDailyFocusTask = () => {
    if (!dailyFocusTaskId) return undefined;
    return tasks.find((task) => task.id === dailyFocusTaskId);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        getDailyFocusTask,
        setDailyFocusTaskId,
        dailyFocusTaskId,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};