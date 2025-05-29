import React from 'react';
import { useTasks } from '../../context/TaskContext';
import Card, { CardBody, CardHeader } from '../ui/Card';
import { Star, Calendar, BookOpen, ArrowUpCircle } from 'lucide-react';
import { formatDate } from '../../utils/taskUtils';
import Button from '../ui/Button';

const DailyFocusTask: React.FC = () => {
  const { getDailyFocusTask, setDailyFocusTaskId, tasks, toggleTaskCompletion } = useTasks();
  const focusTask = getDailyFocusTask();

  // Get a high priority task if no focus task is set
  const getSuggestedTask = () => {
    if (tasks.length === 0) return null;
    
    // First, try to find an incomplete high priority task
    const highPriorityTask = tasks.find(
      task => !task.completed && task.priority === 'high'
    );
    if (highPriorityTask) return highPriorityTask;
    
    // If none found, find any incomplete task
    return tasks.find(task => !task.completed) || tasks[0];
  };

  const suggestedTask = !focusTask ? getSuggestedTask() : null;

  const handleSetFocus = (taskId: string) => {
    setDailyFocusTaskId(taskId);
  };

  const renderEmptyState = () => (
    <div className="text-center py-6">
      <Star className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
        No focus task set
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Set a daily focus task to highlight your most important work
      </p>
      {suggestedTask && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Suggested task:
          </p>
          <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg mb-3 text-left">
            <p className="font-medium text-gray-800 dark:text-gray-200">{suggestedTask.title}</p>
            <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-3 w-3 mr-1" />
              <span className="mr-3">{formatDate(suggestedTask.dueDate)}</span>
              <BookOpen className="h-3 w-3 mr-1" />
              <span>{suggestedTask.subject}</span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="primary" 
            onClick={() => handleSetFocus(suggestedTask.id)}
          >
            Set as Focus
          </Button>
        </div>
      )}
    </div>
  );

  const renderFocusTask = () => (
    <div>
      <div className="flex items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">{focusTask.title}</h3>
          <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-3 w-3 mr-1" />
            <span className="mr-3">{formatDate(focusTask.dueDate)}</span>
            <BookOpen className="h-3 w-3 mr-1" />
            <span>{focusTask.subject}</span>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs ${
          focusTask.priority === 'high' 
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
            : focusTask.priority === 'medium'
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        }`}>
          {focusTask.priority} priority
        </div>
      </div>
      
      {focusTask.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {focusTask.description}
        </p>
      )}
      
      <div className="flex justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setDailyFocusTaskId(null)}
        >
          Clear Focus
        </Button>
        
        <Button 
          size="sm" 
          variant={focusTask.completed ? 'outline' : 'success'} 
          onClick={() => toggleTaskCompletion(focusTask.id)}
        >
          {focusTask.completed ? 'Mark Incomplete' : 'Mark Complete'}
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Star className="h-5 w-5 text-purple-500 mr-2 fill-purple-500" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Daily Focus</h2>
        </div>
      </CardHeader>
      <CardBody>
        {focusTask ? renderFocusTask() : renderEmptyState()}
      </CardBody>
    </Card>
  );
};

export default DailyFocusTask;