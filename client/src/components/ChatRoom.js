import React, { useState, useEffect, useContext, useRef } from 'react';
import { Box, Typography, Avatar, TextField, IconButton, List, ListItem, ListItemText, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import BlockIcon from '@mui/icons-material/Block';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const ChatRoom = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [usersInChat, setUsersInChat] = useState([]);
  const [input, setInput] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [chatBlocked, setChatBlocked] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchChatData();
    // Setup polling or websocket here for real-time updates
    const interval = setInterval(fetchChatData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchChatData = async () => {
    try {
      const token = localStorage.getItem('token');
      const resMessages = await axios.get('http://localhost:5000/api/chat/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(resMessages.data);

      const resUsers = await axios.get('http://localhost:5000/api/chat/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersInChat(resUsers.data);

      const resBlocked = await axios.get('http://localhost:5000/api/chat/blocked', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedUsers(resBlocked.data.blockedUsers);
      setChatBlocked(resBlocked.data.chatBlocked);
    } catch (err) {
      console.error('Failed to fetch chat data:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || chatBlocked) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/chat/messages', { content: input }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInput('');
      fetchChatData();
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/chat/blockUser/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchChatData();
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) {
    return <Typography>אנא התחבר כדי להשתמש בצ'אט</Typography>;
  }

  if (chatBlocked) {
    return <Typography>הצ'אט חסום עבורך. אנא פנה למנהל.</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '80vh', border: '1px solid #ccc', borderRadius: 2, p: 2 }}>
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
        {messages.map(msg => (
          <Box key={msg._id} sx={{ display: 'flex', alignItems: 'center', mb: 1, opacity: blockedUsers.includes(msg.user._id) ? 0.5 : 1 }}>
            <Avatar src={msg.user.profilePicture} alt={msg.user.name} sx={{ mr: 1 }} />
            <Box>
              <Typography variant="subtitle2">{msg.user.name} <Typography component="span" variant="caption" sx={{ ml: 1, color: 'gray' }}>{new Date(msg.createdAt).toLocaleString()}</Typography></Typography>
              <Typography variant="body1">{msg.content}</Typography>
            </Box>
            {user.role === 'admin' && !blockedUsers.includes(msg.user._id) && (
              <IconButton aria-label="block user" onClick={() => handleBlockUser(msg.user._id)} sx={{ ml: 'auto' }}>
                <BlockIcon />
              </IconButton>
            )}
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ display: 'flex' }}>
        <TextField
          fullWidth
          placeholder="הקלד הודעה..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={chatBlocked}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        />
        <Button variant="contained" onClick={handleSend} disabled={chatBlocked || !input.trim()} sx={{ ml: 1 }}>
          <SendIcon />
        </Button>
      </Box>
    </Box>
  );
};

export default ChatRoom;
