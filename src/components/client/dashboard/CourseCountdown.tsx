import React, { useState, useEffect } from 'react';

interface CourseCountdownProps {
  startTime: string;
}

export const CourseCountdown: React.FC<CourseCountdownProps> = ({ startTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const courseTime = new Date();
      const [hours, minutes] = startTime.split(':');
      courseTime.setHours(parseInt(hours), parseInt(minutes), 0);

      const diff = courseTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Course has started!');
        return false;
      } else {
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hoursLeft}h ${minutesLeft}m until start`);
        return true;
      }
    };

    // Calculate immediately
    const shouldContinue = calculateTimeLeft();

    // Update every minute if course hasn't started
    let timer: NodeJS.Timeout;
    if (shouldContinue) {
      timer = setInterval(() => {
        const shouldContinue = calculateTimeLeft();
        if (!shouldContinue) {
          clearInterval(timer);
        }
      }, 60000); // Update every minute
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [startTime]);

  return (
    <div className="mt-4 text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
      <p className="text-lg font-semibold text-red-800 dark:text-red-200">{timeLeft}</p>
    </div>
  );
};