import React from 'react';
import MessageItem from './MessageItem';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>No messages yet</p>
          <p className="text-sm mt-1">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; dateLabel: string; messages: Message[] }[] = [];
  let currentDate = '';

  messages.forEach((message) => {
    const messageDate = new Date(message.created_at).toDateString();
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      let dateLabel = new Date(message.created_at).toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      
      if (messageDate === today) {
        dateLabel = 'Today';
      } else if (messageDate === yesterday) {
        dateLabel = 'Yesterday';
      }

      groupedMessages.push({ date: messageDate, dateLabel, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  return (
    <div className="space-y-4">
      {groupedMessages.map((group) => (
        <div key={group.date}>
          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
              {group.dateLabel}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-1">
            {group.messages.map((message, index) => {
              const prevMessage = index > 0 ? group.messages[index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
              
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === currentUserId}
                  showAvatar={showAvatar}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;