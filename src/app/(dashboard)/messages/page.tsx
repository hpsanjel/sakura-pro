'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Mail, 
  Send, 
  Inbox, 
  Star, 
  Trash2, 
  Search,
  Filter,
  ChevronDown,
  User,
  Clock,
  Check,
  CheckCheck,
  Reply,
  Forward,
  Archive,
  MoreVertical,
  Paperclip,
  X,
  File,
  Image,
  FileText
} from 'lucide-react';
import { useUnreadCount } from '@/hooks/useUnreadCount';

// Define types for the message data
interface Message {
  id: string;
  senderId: string;
  recipientIds: string[];
  subject: string;
  content: string;
  attachments: string[];
  isRead: boolean;
  isDeleted: boolean;
  sentAt: string;
  consultancyId: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  recipients: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  }[];
  messageStatus: string;
  isFromMe: boolean;
  isToMe: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const { refreshUnreadCount } = useUnreadCount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'archived'>('received');
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [replyMode, setReplyMode] = useState<'new' | 'reply' | 'forward'>('new');
  const [preselectedData, setPreselectedData] = useState<{
    recipients?: string[];
    subject?: string;
    content?: string;
  }>({});
  const [starredMessages, setStarredMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, [activeTab, searchQuery]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      let apiUrl;
      
      if (activeTab === 'archived') {
        apiUrl = `/api/messages/archived?search=${searchQuery}`;
      } else {
        apiUrl = `/api/messages?status=${activeTab}&search=${searchQuery}`;
      }
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/messages/users');
      const data = await response.json();
      setAvailableUsers(data.allUsers || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    
    // Mark as read if it's a received message and not already read
    if (!message.isRead && message.isToMe) {
      try {
        const response = await fetch(`/api/messages/${message.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true })
        });
        
        if (response.ok) {
          // Update local state to mark as read
          setMessages(prev => 
            prev.map(m => m.id === message.id ? { ...m, isRead: true } : m)
          );
          // Refresh the unread count in the sidebar
          refreshUnreadCount();
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleSendMessage = async (recipientIds: string[], subject: string, content: string, attachments: string[] = []) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientIds, subject, content, attachments })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShowComposeModal(false);
        fetchMessages();
        setSelectedUsers([]);
        setReplyMode('new');
        setPreselectedData({});
        // Show success message
        alert('Message sent successfully!');
      } else {
        // Show error message from API
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    
    setReplyMode('reply');
    setPreselectedData({
      recipients: [selectedMessage.senderId],
      subject: selectedMessage.subject.startsWith('Re: ') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
      content: `\n\n---\nOn ${new Date(selectedMessage.sentAt).toLocaleString()}, ${selectedMessage.sender.name || selectedMessage.sender.email} wrote:\n${selectedMessage.content}`
    });
    setSelectedUsers([selectedMessage.senderId]);
    setShowComposeModal(true);
  };

  const handleForward = () => {
    if (!selectedMessage) return;
    
    setReplyMode('forward');
    setPreselectedData({
      subject: selectedMessage.subject.startsWith('Fwd: ') ? selectedMessage.subject : `Fwd: ${selectedMessage.subject}`,
      content: `\n\n--- Forwarded message ---\nFrom: ${selectedMessage.sender.name || selectedMessage.sender.email}\nDate: ${new Date(selectedMessage.sentAt).toLocaleString()}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.content}`
    });
    setSelectedUsers([]);
    setShowComposeModal(true);
  };

  const handleArchive = async () => {
    if (!selectedMessage) return;
    
    if (confirm('Are you sure you want to archive this message?')) {
      try {
        await fetch(`/api/messages/${selectedMessage.id}`, { method: 'DELETE' });
        setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
        setSelectedMessage(null);
        alert('Message archived successfully!');
      } catch (error) {
        console.error('Error archiving message:', error);
        alert('Failed to archive message. Please try again.');
      }
    }
  };

  const handleUnarchive = async () => {
    if (!selectedMessage) return;
    
    try {
      await fetch(`/api/messages/${selectedMessage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: false })
      });
      
      setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
      setSelectedMessage(null);
      alert('Message restored successfully!');
    } catch (error) {
      console.error('Error restoring message:', error);
      alert('Failed to restore message. Please try again.');
    }
  };

  const openNewMessage = () => {
    setReplyMode('new');
    setPreselectedData({});
    setSelectedUsers([]);
    setShowComposeModal(true);
  };

  const handleStarMessage = (messageId: string) => {
    setStarredMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleMarkAsUnread = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: false })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to mark message as unread');
      }
      
      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, isRead: false } : m)
      );
      // Refresh the unread count in the sidebar
      refreshUnreadCount();
      alert('Message marked as unread');
    } catch (error) {
      console.error('Error marking message as unread:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to mark message as unread: ${errorMessage}`);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800',
      COUNSELOR: 'bg-blue-100 text-blue-800',
      STUDENT: 'bg-green-100 text-green-800',
      TEACHER: 'bg-orange-100 text-orange-800',
      EMPLOYEE: 'bg-gray-100 text-gray-800',
      SUPERADMIN: 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const unreadCount = messages.filter(m => !m.isRead && m.isToMe).length;

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-gray-50">
        <div className="p-4">
          <button
            onClick={openNewMessage}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Mail className="w-5 h-5" />
            <span className="font-medium">Compose</span>
          </button>
        </div>

        <nav className="px-2">
          <button
            onClick={() => setActiveTab('received')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'received' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5" />
              <span>Inbox</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'sent' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Send className="w-5 h-5" />
              <span>Sent</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'archived' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Archive className="w-5 h-5" />
              <span>Archived</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Message List */}
      <div className="w-96 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No messages found</div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                onClick={() => handleMessageClick(message)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                } ${
                  !message.isRead && message.isToMe 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarMessage(message.id);
                    }}
                    className="flex-shrink-0"
                  >
                    <Star 
                      className={`w-4 h-4 ${
                        starredMessages.has(message.id) 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-gray-400 hover:text-yellow-500'
                      }`} 
                    />
                  </button>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {message.sender.name?.charAt(0) || message.sender.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${
                        !message.isRead && message.isToMe ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {message.isFromMe ? 'Me' : message.sender.name || message.sender.email}
                      </p>
                      {!message.isRead && message.isToMe && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                      {message.attachments && message.attachments.length > 0 && (
                        <Paperclip className="w-3 h-3 text-gray-500" />
                      )}
                    </div>
                    <p className={`text-sm truncate ${
                      !message.isRead && message.isToMe ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {message.subject}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatTime(message.sentAt)}</span>
              </div>
                <p className={`text-sm line-clamp-2 ${
                  !message.isRead && message.isToMe ? 'text-gray-800' : 'text-gray-600'
                }`}>{message.content}</p>
                {message.recipients.length > 1 && (
                  <div className="flex items-center gap-1 mt-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {message.recipients.length} recipients
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{selectedMessage.subject}</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleReply}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Reply"
                  >
                    <Reply className="w-5 h-5 text-gray-600" />
                  </button>
                  <button 
                    onClick={handleForward}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Forward"
                  >
                    <Forward className="w-5 h-5 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => handleStarMessage(selectedMessage.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Star"
                  >
                    <Star 
                      className={`w-5 h-5 ${
                        starredMessages.has(selectedMessage.id) 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-gray-600'
                      }`} 
                    />
                  </button>
                  <button 
                    onClick={() => handleMarkAsUnread(selectedMessage.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Mark as unread"
                  >
                    <Mail className="w-5 h-5 text-gray-600" />
                  </button>
                  {activeTab === 'archived' ? (
                    <button 
                      onClick={handleUnarchive}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                      title="Restore from archive"
                    >
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                  ) : (
                    <button 
                      onClick={handleArchive}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedMessage.sender.name?.charAt(0) || selectedMessage.sender.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedMessage.isFromMe ? 'Me' : selectedMessage.sender.name || selectedMessage.sender.email}
                    </p>
                    <p className="text-sm text-gray-500">{selectedMessage.sender.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(selectedMessage.sender.role)}`}>
                    {selectedMessage.sender.role}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedMessage.sentAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-500">To:</span>
                {selectedMessage.recipients.map((recipient, index) => (
                  <span key={recipient.id} className="text-sm">
                    {index > 0 && ', '}
                    {recipient.name || recipient.email}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-800">{selectedMessage.content}</p>
              </div>
              
              {/* Display Attachments */}
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                  {selectedMessage.attachments.map((attachmentUrl, index) => {
                    const fileName = attachmentUrl.split('/').pop()?.split('_').slice(2).join('_') || 'Attachment';
                    const isImage = attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-gray-600">
                            {isImage ? (
                              <Image className="w-5 h-5" />
                            ) : attachmentUrl.includes('pdf') ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <File className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {fileName}
                            </a>
                          </div>
                        </div>
                        <a
                          href={attachmentUrl}
                          download
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Download attachment"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a message to read</p>
              <p className="text-sm">Choose a message from the list to view its content</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <ComposeMessageModal
          onClose={() => {
            setShowComposeModal(false);
            setReplyMode('new');
            setPreselectedData({});
            setSelectedUsers([]);
          }}
          onSend={handleSendMessage}
          availableUsers={availableUsers}
          selectedUsers={selectedUsers}
          setSelectedUsers={setSelectedUsers}
          replyMode={replyMode}
          preselectedData={preselectedData}
        />
      )}
    </div>
  );
}

// Compose Message Modal Component
function ComposeMessageModal({ 
  onClose, 
  onSend, 
  availableUsers, 
  selectedUsers, 
  setSelectedUsers,
  replyMode,
  preselectedData
}: {
  onClose: () => void;
  onSend: (recipientIds: string[], subject: string, content: string, attachments?: string[]) => void;
  availableUsers: User[];
  selectedUsers: string[];
  setSelectedUsers: (users: string[]) => void;
  replyMode: 'new' | 'reply' | 'forward';
  preselectedData: {
    recipients?: string[];
    subject?: string;
    content?: string;
  };
}) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>>([]);
  const [uploading, setUploading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with preselected data when replyMode changes
  useEffect(() => {
    setSubject(preselectedData.subject || '');
    setContent(preselectedData.content || '');
    if (preselectedData.recipients) {
      setSelectedUsers(preselectedData.recipients);
    }
  }, [replyMode, preselectedData, setSelectedUsers]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/messages/upload-attachment', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to upload ${file.name}`);
        }

        const result = await response.json();
        return {
          url: result.url,
          name: file.name,
          size: file.size,
          type: file.type,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to upload files: ${errorMessage}`);
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredUsers = availableUsers.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one recipient');
      return;
    }
    if (!subject.trim() || !content.trim()) {
      alert('Please fill in subject and message');
      return;
    }
    
    setIsSending(true);
    try {
      const attachmentUrls = attachments.map(att => att.url);
      await onSend(selectedUsers, subject, content, attachmentUrls);
    } finally {
      setIsSending(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800',
      COUNSELOR: 'bg-blue-100 text-blue-800',
      STUDENT: 'bg-green-100 text-green-800',
      TEACHER: 'bg-orange-100 text-orange-800',
      EMPLOYEE: 'bg-gray-100 text-gray-800',
      SUPERADMIN: 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const selectedUsersData = availableUsers.filter(user => selectedUsers.includes(user.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {replyMode === 'reply' ? 'Reply to Message' : replyMode === 'forward' ? 'Forward Message' : 'New Message'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="min-h-[42px] p-2 border border-gray-300 rounded-lg cursor-text focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedUsersData.length === 0 ? (
                  <span className="text-gray-500">Select recipients...</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsersData.map(user => (
                      <span
                        key={user.id}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                      >
                        {user.name || user.email}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }}
                          className="hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {showUserDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    className="w-full p-2 border-b border-gray-200 focus:outline-none"
                    autoFocus
                  />
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedUsers.includes(user.id)) {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        } else {
                          setSelectedUsers([...selectedUsers, user.id]);
                        }
                      }}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => {}}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name || user.email}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onFocus={() => setShowUserDropdown(false)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter subject..."
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            
            {/* Attachment Button */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Paperclip className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Attach Files'}
              </button>
              <span className="text-xs text-gray-500">
                Images, PDF, Word, Excel, text files (Max 10MB each)
              </span>
            </div>

            {/* Attached Files */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-gray-600">
                        {getFileIcon(attachment.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setShowUserDropdown(false)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Type your message..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
