import React from 'react';
import WeeklySchedule from '../components/schedule/WeeklySchedule';

const Schedule: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Schedule
      </h1>
      
      <WeeklySchedule />
    </div>
  );
};

export default Schedule;