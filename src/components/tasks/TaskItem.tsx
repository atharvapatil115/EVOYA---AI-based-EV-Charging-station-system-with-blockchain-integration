import React, { useState } from 'react';
import { CheckCircle, Circle, Edit, Trash2, Star } from 'lucide-react';
import { Task } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import { formatDate } from '../../utils/taskUtils';
import Button from '../ui/Button';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit }) => {
  const { toggleTaskCompletion, deleteTask, dailyFocusTaskId, setDailyFocusTaskId } = useTasks();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const priorityColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const isFocusTask = dailyFocusTaskId === task.id;
  
  const toggleFocus = () => {
    setDailyFocusTaskId(isFocusTask ? null : task.id);
  };

  return (
    <div 
      className={`mb-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
        task.completed ? 'opacity-70' : ''
      } ${
        isFocusTask ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-grow">
          <button
            onClick={() => toggleTaskCompletion(task.id)}
            className="mt-0.5 mr-3 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
          >
            {task.completed ? (
              <CheckCircle className="h-5 w-5 text-blue-500" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          <div className="flex-grow">
            <div 
              className="cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center">
                <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                  {task.title}
                </h3>
                {isFocusTask && (
                  <Star className="ml-2 h-4 w-4 text-purple-500 fill-purple-500" />
                )}
              </div>
              
              <div className="flex items-center flex-wrap mt-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="mr-2">{formatDate(task.dueDate)}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
                  {task.subject}
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                <p>{task.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center ml-2">
          <button 
            className="p-1 text-gray-500 hover:text-purple-500 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
            onClick={toggleFocus}
            aria-label={isFocusTask ? "Remove from focus" : "Set as focus task"}
          >
            <Star className={`h-5 w-5 ${isFocusTask ? 'fill-purple-500 text-purple-500' : ''}`} />
          </button>
          <button 
            className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button 
            className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            onClick={() => deleteTask(task.id)}
            aria-label="Delete task"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(task)}
          >
            Edit
          </Button>
        </div>
      )}
    </div>
  );
};

export default TaskItem;