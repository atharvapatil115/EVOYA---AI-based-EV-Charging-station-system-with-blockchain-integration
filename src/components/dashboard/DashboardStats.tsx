import React from 'react';
import { Task } from '../../types/task';
import { CheckCircle, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import { getTodayString } from '../../utils/taskUtils';

interface DashboardStatsProps {
  tasks: Task[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ tasks }) => {
  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const todayString = getTodayString();
  const dueTodayTasks = tasks.filter(task => task.dueDate === todayString);
  const overdueTasks = tasks.filter(
    task => !task.completed && new Date(task.dueDate) < new Date(todayString)
  );
  
  // Count subjects
  const subjects = new Set(tasks.map(task => task.subject));
  
  const stats = [
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      color: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-300',
    },
    {
      title: 'Due Today',
      value: dueTodayTasks.length,
      icon: <Calendar className="w-6 h-6 text-blue-500" />,
      color: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-300',
    },
    {
      title: 'Subjects',
      value: subjects.size,
      icon: <BookOpen className="w-6 h-6 text-purple-500" />,
      color: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-800 dark:text-purple-300',
    },
    {
      title: 'Overdue',
      value: overdueTasks.length,
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      color: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow duration-300" hoverable>
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>{stat.icon}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;