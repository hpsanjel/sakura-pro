'use client';

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, Mail, MessageSquare, Check, X, Clock, Calendar, User, Search, Filter, Archive } from 'lucide-react'
import { NotificationStatus } from '@/generated/prisma'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  status: NotificationStatus
  priority: string
  sentAt?: string
  readAt?: string
  createdAt: string
  recipientId: string
  consultancyId: string
  channels: string[]
  data: any
  execution: {
    student?: {
      name: string
      id: string
    }
  }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      } else {
        console.error('Failed to fetch notifications:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      console.log('Attempting to mark notification as read:', notificationId)
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT'
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)
        
        // Update local state immediately
        setNotifications(prev => {
          console.log('Previous notifications:', prev)
          const updated = prev.map(n => 
            n.id === notificationId 
              ? { ...n, status: NotificationStatus.READ, readAt: new Date().toISOString() }
              : n
          )
          console.log('Updated notifications:', updated)
          return updated
        })
        
        setUnreadCount(prev => {
          const newCount = Math.max(0, prev - 1)
          console.log('Updated unread count from', prev, 'to', newCount)
          return newCount
        })
        
        // Also refresh the data from server to ensure consistency
        setTimeout(() => {
          console.log('Refreshing notifications from server...')
          fetchNotifications()
          fetchUnreadCount()
        }, 500)
        
        console.log('Successfully marked as read and updated state')
      } else {
        const errorText = await response.text()
        console.error('Failed to mark as read. Status:', response.status)
        console.error('Response headers:', Object.fromEntries(response.headers.entries()))
        console.error('Response text (first 500 chars):', errorText.substring(0, 500))
        
        // Check if it's HTML (Next.js error page)
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          console.error('Received HTML error page instead of JSON')
          console.error('This suggests a Next.js routing or server error occurred')
        }
        
        // Try to parse as JSON if possible
        try {
          const errorData = JSON.parse(errorText)
          console.error('Parsed error:', errorData)
        } catch (e) {
          console.error('Could not parse error as JSON - received HTML instead')
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        const notification = notifications.find(n => n.id === notificationId)
        if (notification?.status === NotificationStatus.SENT) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => n.status === NotificationStatus.SENT)
    
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id)
    }
  }

  const getFilteredNotifications = () => {
    let filtered = notifications.filter(n => 
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(n => n.status === NotificationStatus.SENT)
        break
      case 'read':
        filtered = filtered.filter(n => n.status === NotificationStatus.READ)
        break
      default:
        break
    }
    
    return filtered
  }

  const getStatusIcon = (status: NotificationStatus) => {
    switch (status) {
      case NotificationStatus.SENT:
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      case NotificationStatus.READ:
        return <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      case NotificationStatus.PENDING:
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
      default:
        return <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'REMINDER':
        return <Bell className="h-4 w-4 text-blue-500" />
      case 'DOCUMENT':
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'PAYMENT':
        return <Mail className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white animate-pulse">
            <Bell className="w-8 h-8" />
          </div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Notification Center</h1>
              <p className="text-lg text-white/80">
                Manage your notifications and stay updated
                {unreadCount > 0 && (
                  <span className="ml-2 text-yellow-300">({unreadCount} unread)</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark All as Read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3.5 bg-white/90 backdrop-blur-lg border border-white/30 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
              placeholder="Search notifications by title or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white/90 backdrop-blur-lg border border-white/30">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="secondary">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              Unread
              <Badge variant="secondary">{notifications.filter(n => n.status === NotificationStatus.SENT).length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center gap-2">
              Read
              <Badge variant="secondary">{notifications.filter(n => n.status === NotificationStatus.READ).length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* All Notifications Tab */}
          <TabsContent value="all" className="mt-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white/95 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                  <Bell className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No notifications found</h2>
                <p className="text-gray-600">
                  {searchQuery ? 'Try adjusting your search terms' : 'Notifications will appear here when you have updates'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <Card 
                    key={notification.id} 
                    className={`transition-all hover:shadow-lg border-0 bg-white/95 backdrop-blur-lg ${
                      notification.status === NotificationStatus.SENT ? 'ring-2 ring-blue-100' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="mt-1">
                            {getStatusIcon(notification.status)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {getTypeIcon(notification.type)}
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 mb-4 leading-relaxed text-lg">
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {notification.createdAt ? formatDate(notification.createdAt) : 'Unknown date'}
                                </span>
                              </div>
                              
                              {notification.execution?.student && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{notification.execution.student.name}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                  {notification.channels.join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          {notification.status === NotificationStatus.SENT && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Unread Notifications Tab */}
          <TabsContent value="unread" className="mt-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white/95 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white">
                  <Check className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
                <p className="text-gray-600">You have no unread notifications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <Card 
                    key={notification.id} 
                    className="transition-all hover:shadow-lg border-0 bg-white/95 backdrop-blur-lg ring-2 ring-blue-100"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="mt-1">
                            {getStatusIcon(notification.status)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {getTypeIcon(notification.type)}
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 mb-4 leading-relaxed text-lg">
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {notification.createdAt ? formatDate(notification.createdAt) : 'Unknown date'}
                                </span>
                              </div>
                              
                              {notification.execution?.student && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{notification.execution.student.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Read Notifications Tab */}
          <TabsContent value="read" className="mt-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white/95 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white">
                  <Mail className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No read notifications</h2>
                <p className="text-gray-600">Notifications you've read will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <Card 
                    key={notification.id} 
                    className="transition-all hover:shadow-lg border-0 bg-white/95 backdrop-blur-lg opacity-75"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="mt-1">
                            {getStatusIcon(notification.status)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {getTypeIcon(notification.type)}
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 mb-4 leading-relaxed text-lg">
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {notification.createdAt ? formatDate(notification.createdAt) : 'Unknown date'}
                                </span>
                              </div>
                              
                              {notification.execution?.student && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{notification.execution.student.name}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                  Read on {notification.readAt ? formatDate(notification.readAt) : 'Unknown'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
