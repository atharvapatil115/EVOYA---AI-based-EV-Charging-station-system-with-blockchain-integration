import React from 'react';
import TaskList from '../components/tasks/TaskList';

const Tasks: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Task Management
      </h1>
      
      <TaskList title="All Tasks" showFilters={true} />
    </div>
  );
};

export default Tasks;