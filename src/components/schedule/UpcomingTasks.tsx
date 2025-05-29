import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { Task } from '../../types/task';
import { sortTasksByDueDate, isToday, formatDate } from '../../utils/taskUtils';
import Card, { CardHeader, CardBody } from '../ui/Card';
import { Clock } from 'lucide-react';
import TaskModal from '../tasks/TaskModal';

const UpcomingTasks: React.FC = () => {
  const { tasks } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get upcoming incomplete tasks
  const getUpcomingTasks = (): Task[] => {
    return sortTasksByDueDate(tasks.filter(task => !task.completed))
      .slice(0, 5); // Limit to 5 tasks
  };

  const upcomingTasks = getUpcomingTasks();

  // Open task edit modal
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  // Get appropriate badge style based on due date
  const getDueDateStyle = (dueDate: string) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dueDateTime = new Date(dueDate).getTime();
    const todayTime = today.getTime();
    const tomorrowTime = tomorrow.getTime();
    
    // Overdue
    if (dueDateTime < todayTime) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
    
    // Due today
    if (isToday(dueDate)) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
    
    // Due tomorrow
    if (dueDateTime < tomorrowTime) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
    
    // Future
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Upcoming Tasks
            </h2>
          </div>
        </CardHeader>
        
        <CardBody className="p-0">
          {upcomingTasks.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {upcomingTasks.map((task) => (
                <div 
                  key={task.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                  onClick={() => handleEditTask(task)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {task.subject}
                      </p>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs ${getDueDateStyle(task.dueDate)}`}>
                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No upcoming tasks
              </p>
            </div>
          )}
        </CardBody>
      </Card>
      
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
      />
    </div>
  );
};

export default UpcomingTasks;