import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { getCurrentWeekDates, groupTasksByDate, formatDate, isToday } from '../../utils/taskUtils';
import Card, { CardHeader, CardBody } from '../ui/Card';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import TaskItem from '../tasks/TaskItem';
import TaskModal from '../tasks/TaskModal';
import { Task } from '../../types/task';

const WeeklySchedule: React.FC = () => {
  const { tasks } = useTasks();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek);
    return startDate;
  });
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate date strings for the current week view
  const getWeekDates = (): string[] => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const tasksByDate = groupTasksByDate(tasks);

  // Format date for display
  const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.toLocaleDateString(undefined, { weekday: 'short' });
    const dayOfMonth = date.getDate();
    return `${day} ${dayOfMonth}`;
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek);
    setCurrentWeekStart(startDate);
  };

  // Format the month range for the header
  const getMonthRange = (): string => {
    const startMonth = currentWeekStart.toLocaleDateString(undefined, { month: 'short' });
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);
    const endMonth = endDate.toLocaleDateString(undefined, { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${currentWeekStart.getFullYear()}`;
    }
    return `${startMonth} - ${endMonth} ${currentWeekStart.getFullYear()}`;
  };

  // Handle task edit
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
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Weekly Schedule
              </h2>
            </div>
            
            <div className="flex items-center">
              <button
                onClick={goToPreviousWeek}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <button
                onClick={goToCurrentWeek}
                className="mx-2 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                Today
              </button>
              
              <span className="mx-2 font-medium">{getMonthRange()}</span>
              
              <button
                onClick={goToNextWeek}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Next week"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </CardHeader>
        
        <CardBody>
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date) => (
              <div key={date} className="min-h-[120px]">
                <div className={`text-center py-2 mb-2 rounded ${
                  isToday(date) 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-semibold' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {formatDateHeader(date)}
                </div>
                
                <div className="space-y-2">
                  {tasksByDate[date]?.map((task) => (
                    <div 
                      key={task.id}
                      className={`p-2 text-xs rounded cursor-pointer ${
                        task.completed 
                          ? 'bg-gray-100 dark:bg-gray-750 text-gray-500 dark:text-gray-400' 
                          : task.priority === 'high'
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50'
                          : task.priority === 'medium'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50'
                          : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50'
                      }`}
                      onClick={() => handleEditTask(task)}
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="mt-1 truncate text-gray-600 dark:text-gray-400">
                        {task.subject}
                      </div>
                    </div>
                  ))}
                  
                  {(!tasksByDate[date] || tasksByDate[date].length === 0) && (
                    <div className="text-xs text-center py-2 text-gray-400 dark:text-gray-500">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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

export default WeeklySchedule;