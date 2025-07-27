# Upcoming Courses Dashboard

**Status: COMPLETED** ✅

## Overview
Client portal dashboard showing upcoming booked courses with quick access to course details, materials, and management options.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Features

### 1. Dashboard Overview
- Next upcoming course prominent display
- List of all future bookings
- Quick stats (total courses, certificates earned)
- Recent activity timeline

### 2. Course Cards
- Course name and date
- Time until course
- Attendee count
- Location details
- Quick actions (view details, cancel, reschedule)

### 3. Pre-Course Preparation
- Download pre-course materials
- View course requirements
- Special requirements reminder
- Location/parking information

## Database Queries

### Get User's Upcoming Bookings
```typescript
// backend-loopback4/src/services/client-portal.service.ts
export class ClientPortalService {
  static async getUpcomingCourses(userId: string) {
    const bookings = await db
      .select({
        booking: bookings,
        session: courseSessions,
        attendees: sql<number>`COUNT(DISTINCT ${bookingAttendees.id})`,
        specialRequirements: specialRequirements,
      })
      .from(bookings)
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .leftJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .leftJoin(specialRequirements, eq(bookings.id, specialRequirements.bookingId))
      .where(
        and(
          eq(bookings.userId, userId),
          eq(bookings.status, 'confirmed'),
          gte(courseSessions.sessionDate, new Date()),
          eq(courseSessions.status, 'scheduled')
        )
      )
      .groupBy(bookings.id, courseSessions.id, specialRequirements.id)
      .orderBy(courseSessions.sessionDate, courseSessions.startTime);

    return this.formatUpcomingCourses(bookings);
  }

  static async getNextCourse(userId: string) {
    const [nextCourse] = await this.getUpcomingCourses(userId);
    
    if (nextCourse) {
      // Calculate time until course
      const now = new Date();
      const courseDate = new Date(`${nextCourse.session.sessionDate}T${nextCourse.session.startTime}`);
      const daysUntil = Math.ceil((courseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...nextCourse,
        daysUntil,
        isToday: daysUntil === 0,
        isTomorrow: daysUntil === 1,
        isThisWeek: daysUntil <= 7,
      };
    }
    
    return null;
  }

  static async getUserStats(userId: string) {
    // Total bookings
    const [totalBookings] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(bookings)
      .where(eq(bookings.userId, userId));

    // Completed courses
    const [completedCourses] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${bookings.id})` })
      .from(bookings)
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .where(
        and(
          eq(bookings.userId, userId),
          eq(courseSessions.status, 'completed')
        )
      );

    // Total attendees trained
    const [totalAttendees] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(bookingAttendees)
      .innerJoin(bookings, eq(bookingAttendees.bookingId, bookings.id))
      .where(eq(bookings.userId, userId));

    return {
      totalBookings: totalBookings.count,
      completedCourses: completedCourses.count,
      totalAttendees: totalAttendees.count,
      certificatesEarned: completedCourses.count, // Simplified - one per completed course
    };
  }
}
```

## Frontend Implementation

### Upcoming Courses Dashboard
```typescript
// src/pages/client/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, FileText, AlertCircle } from 'lucide-react';
import { NextCourseCard } from '@/components/client/NextCourseCard';
import { CourseList } from '@/components/client/CourseList';
import { DashboardStats } from '@/components/client/DashboardStats';
import { EmptyState } from '@/components/common/EmptyState';

export const DashboardPage: React.FC = () => {
  const [nextCourse, setNextCourse] = useState<NextCourse | null>(null);
  const [upcomingCourses, setUpcomingCourses] = useState<UpcomingCourse[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [next, upcoming, userStats] = await Promise.all([
        clientApi.getNextCourse(),
        clientApi.getUpcomingCourses(),
        clientApi.getUserStats(),
      ]);
      
      setNextCourse(next);
      setUpcomingCourses(upcoming);
      setStats(userStats);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Training Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your upcoming first aid training courses
        </p>
      </div>

      {/* Stats Overview */}
      {stats && <DashboardStats stats={stats} />}

      {/* Next Course Highlight */}
      {nextCourse ? (
        <NextCourseCard course={nextCourse} onUpdate={loadDashboardData} />
      ) : (
        <EmptyState
          icon={Calendar}
          title="No Upcoming Courses"
          description="You don't have any courses booked yet."
          action={{
            label: "Browse Available Courses",
            href: "/courses",
          }}
        />
      )}

      {/* Other Upcoming Courses */}
      {upcomingCourses.length > 1 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            All Upcoming Courses
          </h2>
          <CourseList 
            courses={upcomingCourses}
            onUpdate={loadDashboardData}
          />
        </div>
      )}
    </div>
  );
};
```

### Next Course Card Component
```typescript
// src/components/client/NextCourseCard.tsx
import React from 'react';
import { Calendar, Clock, MapPin, Users, Download, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface NextCourseCardProps {
  course: NextCourse;
  onUpdate: () => void;
}

export const NextCourseCard: React.FC<NextCourseCardProps> = ({ course, onUpdate }) => {
  const getTimeUntilMessage = () => {
    if (course.isToday) return "Today!";
    if (course.isTomorrow) return "Tomorrow";
    if (course.daysUntil <= 7) return `In ${course.daysUntil} days`;
    return format(new Date(course.session.sessionDate), 'EEEE, MMMM d');
  };

  const getUrgencyColor = () => {
    if (course.isToday) return 'bg-red-50 border-red-300';
    if (course.isTomorrow) return 'bg-orange-50 border-orange-300';
    if (course.isThisWeek) return 'bg-yellow-50 border-yellow-300';
    return 'bg-blue-50 border-blue-300';
  };

  return (
    <div className={`rounded-lg border-2 p-6 mb-6 ${getUrgencyColor()}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-2xl font-bold text-gray-900">Your Next Course</h3>
            {course.isToday && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium animate-pulse">
                TODAY
              </span>
            )}
          </div>
          
          <h4 className="text-xl font-semibold text-gray-800 mb-4">
            {course.session.courseType}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="font-medium">{getTimeUntilMessage()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span>{course.session.startTime} - {course.session.endTime}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              <span>{course.session.location}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span>{course.attendeeCount} attendee{course.attendeeCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {course.specialRequirements && course.specialRequirements.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Special Requirements Noted
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    We have your requirements on file and will ensure accommodations are ready.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 lg:mt-0 lg:ml-8 space-y-3">
          <Link
            to={`/my-bookings/${course.booking.id}`}
            className="block w-full lg:w-auto px-6 py-3 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors"
          >
            View Details
          </Link>
          
          {course.preMaterials && (
            <button
              onClick={() => downloadPreMaterials(course.booking.id)}
              className="flex items-center justify-center gap-2 w-full lg:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Pre-Course Materials
            </button>
          )}
        </div>
      </div>

      {/* Countdown for today's course */}
      {course.isToday && <CourseCountdown startTime={course.session.startTime} />}
    </div>
  );
};
```

### Dashboard Stats Component
```typescript
// src/components/client/DashboardStats.tsx
import React from 'react';
import { BookOpen, Award, Users, Calendar } from 'lucide-react';

interface DashboardStatsProps {
  stats: UserStats;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      icon: BookOpen,
      label: 'Total Bookings',
      value: stats.totalBookings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Award,
      label: 'Certificates Earned',
      value: stats.certificatesEarned,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Users,
      label: 'People Trained',
      value: stats.totalAttendees,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Calendar,
      label: 'Courses Completed',
      value: stats.completedCourses,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
};
```

### Course List Component
```typescript
// src/components/client/CourseList.tsx
import React from 'react';
import { Calendar, Clock, MapPin, Users, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Menu } from '@headlessui/react';

interface CourseListProps {
  courses: UpcomingCourse[];
  onUpdate: () => void;
}

export const CourseList: React.FC<CourseListProps> = ({ courses, onUpdate }) => {
  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div
          key={course.booking.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {course.session.courseType}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(course.session.sessionDate), 'EEE, MMM d')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{course.session.startTime} - {course.session.endTime}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{course.session.location}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.attendeeCount} attendee{course.attendeeCount !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="mt-3 text-sm">
                <span className="text-gray-500">Booking Reference:</span>
                <span className="ml-2 font-mono text-gray-700 dark:text-gray-300">
                  {course.booking.bookingReference}
                </span>
              </div>
            </div>

            <Menu as="div" className="relative">
              <Menu.Button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </Menu.Button>
              
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to={`/my-bookings/${course.booking.id}`}
                      className={`block px-4 py-2 text-sm ${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      View Details
                    </Link>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleReschedule(course.booking.id)}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      Reschedule
                    </button>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleCancel(course.booking.id)}
                      className={`block w-full text-left px-4 py-2 text-sm text-red-600 ${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      Cancel Booking
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### Pre-Course Materials Component
```typescript
// src/components/client/PreCourseMaterials.tsx
import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, Info } from 'lucide-react';

interface PreCourseMaterial {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  isRequired: boolean;
  viewed: boolean;
}

export const PreCourseMaterials: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [materials, setMaterials] = useState<PreCourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, [bookingId]);

  const loadMaterials = async () => {
    try {
      const data = await clientApi.getPreCourseMaterials(bookingId);
      setMaterials(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (material: PreCourseMaterial) => {
    await clientApi.downloadMaterial(material.id);
    // Mark as viewed
    setMaterials(prev => prev.map(m => 
      m.id === material.id ? { ...m, viewed: true } : m
    ));
  };

  const requiredCount = materials.filter(m => m.isRequired).length;
  const viewedRequiredCount = materials.filter(m => m.isRequired && m.viewed).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Pre-Course Materials
      </h3>

      {requiredCount > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Required Materials: {viewedRequiredCount} of {requiredCount} viewed
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Please review all required materials before attending the course.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div className="flex items-start gap-3 flex-1">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {material.title}
                  </h4>
                  {material.isRequired && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                      Required
                    </span>
                  )}
                  {material.viewed && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {material.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload(material)}
              className="ml-4 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Countdown Timer Component
```typescript
// src/components/client/CourseCountdown.tsx
import React, { useState, useEffect } from 'react';

interface CourseCountdownProps {
  startTime: string;
}

export const CourseCountdown: React.FC<CourseCountdownProps> = ({ startTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const courseTime = new Date();
      const [hours, minutes] = startTime.split(':');
      courseTime.setHours(parseInt(hours), parseInt(minutes), 0);

      const diff = courseTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Course has started!');
        clearInterval(timer);
      } else {
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hoursLeft}h ${minutesLeft}m until start`);
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className="mt-4 text-center p-3 bg-red-100 rounded-lg">
      <p className="text-lg font-semibold text-red-800">{timeLeft}</p>
    </div>
  );
};
```

## Mobile Optimization

### Mobile Dashboard View
```typescript
// src/components/client/MobileDashboard.tsx
import React from 'react';
import { SwipeableViews } from 'react-swipeable-views';

export const MobileDashboard: React.FC = () => {
  const [index, setIndex] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Tab Navigation */}
      <div className="flex border-b bg-white dark:bg-gray-800">
        <button
          onClick={() => setIndex(0)}
          className={`flex-1 py-3 text-sm font-medium ${
            index === 0 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500'
          }`}
        >
          Next Course
        </button>
        <button
          onClick={() => setIndex(1)}
          className={`flex-1 py-3 text-sm font-medium ${
            index === 1 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500'
          }`}
        >
          All Courses
        </button>
        <button
          onClick={() => setIndex(2)}
          className={`flex-1 py-3 text-sm font-medium ${
            index === 2 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500'
          }`}
        >
          Stats
        </button>
      </div>

      {/* Swipeable Content */}
      <SwipeableViews index={index} onChangeIndex={setIndex}>
        <div className="p-4">
          <NextCourseCard course={nextCourse} onUpdate={loadData} />
        </div>
        <div className="p-4">
          <CourseList courses={upcomingCourses} onUpdate={loadData} />
        </div>
        <div className="p-4">
          <DashboardStats stats={stats} />
        </div>
      </SwipeableViews>
    </div>
  );
};
```

## Testing

1. Test loading upcoming courses
2. Test next course countdown
3. Test pre-course material downloads
4. Test empty state display
5. Test mobile swipeable views
6. Test real-time updates
7. Test special requirements display
8. Test stats calculation accuracy