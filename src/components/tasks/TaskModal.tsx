import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Task, TaskFormData, Priority } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import Button from '../ui/Button';
import { getTodayString } from '../../utils/taskUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task }) => {
  const { addTask, updateTask } = useTasks();
  const isEditing = !!task;

  const initialFormState: TaskFormData = {
    title: '',
    description: '',
    subject: '',
    dueDate: getTodayString(),
    priority: 'medium' as Priority,
  };

  const [formData, setFormData] = useState<TaskFormData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});

  // Reset form when modal opens/closes or when the task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Edit mode - populate form with task data
        setFormData({
          title: task.title,
          description: task.description,
          subject: task.subject,
          dueDate: task.dueDate,
          priority: task.priority,
        });
      } else {
        // Add mode - reset to initial state
        setFormData(initialFormState);
      }
      setErrors({});
    }
  }, [isOpen, task]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is changed
    if (errors[name as keyof TaskFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (isEditing && task) {
      updateTask(task.id, formData);
    } else {
      addTask(formData);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>
        
        {/* Modal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative z-10 transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {isEditing ? 'Edit Task' : 'Add New Task'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label 
                  htmlFor="title" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${
                    errors.title 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="Enter task title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>
              
              {/* Description */}
              <div>
                <label 
                  htmlFor="description" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500"
                  placeholder="Enter task description"
                ></textarea>
              </div>
              
              {/* Subject */}
              <div>
                <label 
                  htmlFor="subject" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${
                    errors.subject 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="Enter subject (e.g., Math, Science)"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>
              
              {/* Due Date */}
              <div>
                <label 
                  htmlFor="dueDate" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${
                    errors.dueDate 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                )}
              </div>
              
              {/* Priority */}
              <div>
                <label 
                  htmlFor="priority" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 flex justify-end space-x-3 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
              >
                {isEditing ? 'Save Changes' : 'Add Task'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;