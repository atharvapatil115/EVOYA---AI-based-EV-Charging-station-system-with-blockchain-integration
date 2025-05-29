import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import TaskItem from './TaskItem';
import { Task, Priority } from '../../types/task';
import { filterTasks, sortTasksByDueDate, getUniqueSubjects } from '../../utils/taskUtils';
import { Filter, SortAsc, SortDesc, Search } from 'lucide-react';
import Button from '../ui/Button';
import TaskModal from './TaskModal';

interface TaskListProps {
  title?: string;
  showFilters?: boolean;
  initialFilters?: {
    subject?: string;
    priority?: string;
    completed?: boolean | null;
  };
}

const TaskList: React.FC<TaskListProps> = ({ 
  title = 'Tasks', 
  showFilters = true, 
  initialFilters = {} 
}) => {
  const { tasks } = useTasks();
  const [filters, setFilters] = useState({
    subject: initialFilters.subject || 'all',
    priority: initialFilters.priority || 'all',
    completed: initialFilters.completed === undefined ? null : initialFilters.completed,
    searchTerm: '',
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get unique subjects for filter dropdown
  const subjects = getUniqueSubjects(tasks);

  // Filter and sort tasks
  const filteredTasks = filterTasks(tasks, filters);
  const sortedTasks = sortTasksByDueDate(filteredTasks);
  const displayedTasks = sortDirection === 'asc' ? sortedTasks : [...sortedTasks].reverse();

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Handle filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'completed') {
      // Handle the tri-state: null (all), true (completed), false (incomplete)
      const currentValue = filters.completed;
      let newValue: boolean | null;
      
      if (currentValue === null) newValue = true;
      else if (currentValue === true) newValue = false;
      else newValue = null;
      
      setFilters({ ...filters, completed: newValue });
    } else {
      setFilters({ ...filters, [name]: value });
    }
  };

  // Open edit modal
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
        <Button 
          variant="primary" 
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
        >
          Add Task
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                placeholder="Search tasks..."
                className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex flex-col">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </span>
            <div className="flex items-center space-x-2 h-full">
              <button
                type="button"
                name="completed"
                onClick={() => handleFilterChange({ target: { name: 'completed', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filters.completed === null
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                type="button"
                name="completed"
                onClick={() => setFilters({ ...filters, completed: false })}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filters.completed === false
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                name="completed"
                onClick={() => setFilters({ ...filters, completed: true })}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filters.completed === true
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={toggleSortDirection}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              aria-label={`Sort by due date ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortDirection === 'asc' ? (
                <SortAsc className="h-5 w-5" />
              ) : (
                <SortDesc className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {displayedTasks.length > 0 ? (
          displayedTasks.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={handleEditTask} />
          ))
        ) : (
          <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              {filters.searchTerm || filters.subject !== 'all' || filters.priority !== 'all' || filters.completed !== null
                ? 'No tasks match your filters.'
                : 'No tasks yet. Create your first task!'}
            </p>
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
      />
    </div>
  );
};

export default TaskList;