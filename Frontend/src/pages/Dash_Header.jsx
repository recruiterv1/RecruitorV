import React, { useState, useContext, useEffect, useRef } from 'react';
import AnnouncementBar from '../components/AnnouncementBar';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, X, Check, CheckCheck, HelpCircle, Sun, Moon } from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { useTheme } from '../context/ThemeContext';
import NotificationContext from '../context/NotificationContext';

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown time';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Unknown time';
  }
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'new_candidate_submitted':
      return (
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-lg">👤</span>
        </div>
      );
    case 'access_request_accepted':
      return (
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 text-lg">✅</span>
        </div>
      );
    case 'access_request_rejected':
      return (
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-red-600 text-lg">❌</span>
        </div>
      );
    case 'access_request_received':
      return (
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-purple-600 text-lg">📬</span>
        </div>
      );
    case 'new_position_available':
      return (
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-purple-600 text-lg">💼</span>
        </div>
      );
    case 'no_candidate_alert':
      return (
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <span className="text-orange-600 text-lg">⚠️</span>
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <Bell className="text-gray-600 w-5 h-5" />
        </div>
      );
  }
};

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  return (
    <div 
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        !notification.read ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Notification Icon */}
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatTimeAgo(notification.createdAt)}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>

          {/* Position/Client info if available */}
          {(notification.positionTitle || notification.clientName) && (
            <div className="mt-2 flex items-center gap-2">
              {notification.positionTitle && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {notification.positionTitle}
                </span>
              )}
              {notification.clientName && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {notification.clientName}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                <Check size={12} />
                Mark as read
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
            >
              <X size={12} />
              Dismiss
            </button>
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
        )}
      </div>
    </div>
  );
};

const Dash_Header = ({ onMenuClick }) => {
  const { user } = useContext(UserStateContext);
  const { theme, toggleTheme, canUseDark } = useTheme();
  const [greeting, setGreeting] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications, 
    unreadCount, 
    loading, 
    isDropdownOpen, 
    setIsDropdownOpen,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useContext(NotificationContext);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, setIsDropdownOpen]);

  // Fetch notifications when dropdown opens
  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      fetchNotifications({ limit: 20 });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const toggleUserMenu = () => setIsUserMenuOpen((o) => !o);

  return (
    <div className="w-full bg-white border-b border-gray-200">
      {/* Role-wise announcements, above everything else in the header */}
      <AnnouncementBar />
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          
          {/* ========== LEFT SIDE ========== */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={24} className="text-gray-700" />
            </button>

            {/* Greeting Text */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {greeting},{' '}
                <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                  {user?.name || 'Recruiter'}
                </span>
                !
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-1 truncate">
                Here's what's happening with your recruitment today
              </p>
            </div>
          </div>

          {/* ========== RIGHT SIDE ========== */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            
            {/* Theme toggle — only for roles included in the dark-mode rollout */}
            {canUseDark && (
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark'
                  ? <Sun size={20} className="text-gray-600" />
                  : <Moon size={20} className="text-gray-600" />}
              </button>
            )}

            {/* Help Center */}
            <button
              onClick={() => navigate('/help-center')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Help Center"
              title="Help Center"
            >
              <HelpCircle size={20} className="text-gray-600" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} sm:size={22} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-orange-500">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-white/80 hover:text-white text-xs flex items-center gap-1"
                        >
                          <CheckCheck size={14} />
                          Mark all read
                        </button>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <p className="text-white/80 text-xs mt-1">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-gray-500 text-sm">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell className="text-gray-400 w-6 h-6" />
                        </div>
                        <p className="text-gray-600 font-medium">No notifications</p>
                        <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={() => {
                          // Navigate to full notifications page
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium py-2"
                      >
                        View All Notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Avatar + Dropdown */}
            <div className="relative hidden sm:block">
              <button
                onClick={toggleUserMenu}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform shadow-md"
                title="Account"
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'R'}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // A vendor's recruiter keeps a short profile of their own.
                      navigate(user?.vendorEmail ? '/team-profile' : '/profile');
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { 
                      setIsUserMenuOpen(false); 
                      const rolePath = user?.roleCategory?.toLowerCase() === 'coach' ? '/coach-agreement' :
                                     user?.roleCategory?.toLowerCase() === 'expert' ? '/expert-agreement' :
                                     '/recruiter-agreement';
                      navigate(rolePath);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    Agreement
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dash_Header;
