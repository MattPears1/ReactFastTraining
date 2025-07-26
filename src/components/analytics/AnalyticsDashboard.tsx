import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  ShoppingCart, 
  DollarSign,
  Clock,
  MousePointer,
  Target,
  Activity
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

interface AnalyticsMetric {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  color?: string
}

interface AnalyticsData {
  metrics: AnalyticsMetric[]
  topPages: { url: string; views: number; avgTime: string }[]
  topEvents: { name: string; count: number; category: string }[]
  conversions: { goal: string; completions: number; value: number }[]
  realtimeUsers: number
  loading: boolean
  error?: string
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    metrics: [],
    topPages: [],
    topEvents: [],
    conversions: [],
    realtimeUsers: 0,
    loading: true
  })

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    fetchAnalyticsData()
    const interval = setInterval(fetchRealtimeData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/analytics/dashboard?range=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      
      const result = await response.json()
      setData({
        ...result,
        loading: false
      })
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load analytics data'
      }))
    }
  }

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/analytics/realtime')
      if (response.ok) {
        const { users } = await response.json()
        setData(prev => ({ ...prev, realtimeUsers: users }))
      }
    } catch (error) {
      console.error('Failed to fetch realtime data:', error)
    }
  }

  // Mock data for demonstration
  const mockMetrics: AnalyticsMetric[] = [
    {
      label: 'Total Users',
      value: '12,345',
      change: 15.3,
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Page Views',
      value: '45,678',
      change: 8.2,
      trend: 'up',
      icon: Eye,
      color: 'text-green-600'
    },
    {
      label: 'Avg. Session Duration',
      value: '3m 45s',
      change: -5.1,
      trend: 'down',
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      label: 'Bounce Rate',
      value: '42.3%',
      change: -2.4,
      trend: 'up',
      icon: MousePointer,
      color: 'text-orange-600'
    },
    {
      label: 'Conversions',
      value: '234',
      change: 22.5,
      trend: 'up',
      icon: Target,
      color: 'text-red-600'
    },
    {
      label: 'Revenue',
      value: '$15,234',
      change: 18.7,
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    }
  ]

  const mockTopPages = [
    { url: '/products', views: 8234, avgTime: '2m 15s' },
    { url: '/about', views: 5123, avgTime: '1m 45s' },
    { url: '/contact', views: 3456, avgTime: '3m 20s' },
    { url: '/faq', views: 2345, avgTime: '2m 50s' },
    { url: '/products/item-1', views: 1234, avgTime: '4m 10s' }
  ]

  const mockTopEvents = [
    { name: 'Add to Cart', count: 523, category: 'ecommerce' },
    { name: 'Newsletter Signup', count: 234, category: 'conversion' },
    { name: 'Product View', count: 1523, category: 'ecommerce' },
    { name: 'Contact Form Submit', count: 89, category: 'conversion' },
    { name: 'Video Play', count: 456, category: 'engagement' }
  ]

  const mockConversions = [
    { goal: 'Purchase Complete', completions: 45, value: 8234 },
    { goal: 'Newsletter Signup', completions: 234, value: 2340 },
    { goal: 'Contact Form', completions: 89, value: 2225 },
    { goal: 'Account Created', completions: 123, value: 6150 }
  ]

  const displayData = data.loading ? {
    metrics: mockMetrics,
    topPages: mockTopPages,
    topEvents: mockTopEvents,
    conversions: mockConversions,
    realtimeUsers: 123
  } : data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your website performance and user behavior
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                timeRange === range
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Realtime Users */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users Right Now</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayData.realtimeUsers}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayData.metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              {data.loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
                    <metric.icon className={cn('w-5 h-5', metric.color)} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {metric.value}
                  </p>
                  {metric.change !== undefined && (
                    <div className="flex items-center gap-1">
                      <TrendingUp 
                        className={cn(
                          'w-4 h-4',
                          metric.trend === 'up' ? 'text-green-600' : 'text-red-600',
                          metric.trend === 'down' && 'rotate-180'
                        )} 
                      />
                      <span className={cn(
                        'text-sm font-medium',
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {Math.abs(metric.change)}%
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        vs last {timeRange}
                      </span>
                    </div>
                  )}
                </>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Pages
          </h3>
          <div className="space-y-3">
            {displayData.topPages.map((page, index) => (
              <div key={page.url} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                    {index + 1}.
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {page.url}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Avg. time: {page.avgTime}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {page.views.toLocaleString()} views
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Events */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Events
          </h3>
          <div className="space-y-3">
            {displayData.topEvents.map((event, index) => (
              <div key={event.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                    {index + 1}.
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {event.category}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {event.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Conversions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Goal Conversions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Goal
                </th>
                <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completions
                </th>
                <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Value
                </th>
                <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg. Value
                </th>
              </tr>
            </thead>
            <tbody>
              {displayData.conversions.map((conversion) => (
                <tr key={conversion.goal} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 text-sm text-gray-900 dark:text-white">
                    {conversion.goal}
                  </td>
                  <td className="py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                    {conversion.completions}
                  </td>
                  <td className="py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                    ${conversion.value.toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                    ${(conversion.value / conversion.completions).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Error State */}
      {data.error && (
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{data.error}</p>
        </Card>
      )}
    </div>
  )
}

export default AnalyticsDashboard