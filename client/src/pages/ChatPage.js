import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Drawer,
  Divider,
  Button,
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete config.headers['Authorization'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const emojiList = ['😀','😂','😍','😎','😭','😡','👍','🙏','🎉','💯','🔥','🥳','🤔','😴','😇'];

const ChatPage = () => {
  const { discussionId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [discussion, setDiscussion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [usersInDiscussion, setUsersInDiscussion] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatPageRef = useRef(null);

  useEffect(() => {
    fetchDiscussion();
    fetchMessages();
    fetchUsersInDiscussion();

    const handleClickOutside = (event) => {
      if (chatPageRef.current && !chatPageRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line
  }, [discussionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDiscussion = async () => {
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/forum/discussions/${discussionId}`);
      setDiscussion(res.data);
      setIsBlocked(res.data.isBlocked);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch discussion.');
    }
  };

  const fetchMessages = async () => {
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/forum/discussions/${discussionId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch messages.');
    }
  };

  const fetchUsersInDiscussion = async () => {
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/forum/discussions/${discussionId}/users`);
      setUsersInDiscussion(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users in discussion.');
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    console.log('Send message clicked, messageText:', messageText);
    if (!messageText.trim() && !imageUrl) {
      console.log('Message text and imageUrl are empty, not sending');
      return;
    }
    try {
      const response = await axiosInstance.post(`/api/forum/discussions/${discussionId}/messages`, {
        senderId: user._id,
        text: messageText,
        type: imageUrl ? 'image' : 'text',
        imageUrl: imageUrl,
      });
      console.log('Message sent response:', response);
      setMessageText('');
      setImageUrl('');
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
    }
  };

  const handleEmojiToggle = () => {
    setEmojiPickerOpen(prev => !prev);
  };

  const handleEmojiSelect = (emoji) => {
    console.log('Emoji selected:', emoji);
    setMessageText(prev => prev + emoji);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <Container sx={{ mt: 4, display: 'flex', flexDirection: 'column', height: '80vh' }} ref={chatPageRef}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => setDrawerOpen(true)}>
          {discussion ? discussion.title : 'Loading...'}
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>חזור</Button>
      </Box>

      <Divider />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f0f0f0', borderRadius: 1 }}>
        {messages.map((msg) => (
          <Box
            key={msg._id}
            sx={{
              display: 'flex',
              flexDirection: msg.senderId === user._id ? 'row-reverse' : 'row',
              mb: 1,
              alignItems: 'center',
              justifyContent: msg.senderId === user._id ? 'flex-end' : 'flex-start',
            }}
          >
            <Avatar src={msg.senderProfilePic} alt={msg.senderUsername} sx={{ mr: 1, ml: 1, order: msg.senderId === user._id ? 2 : 0 }} />
            <Paper sx={{ p: 1, maxWidth: '70%', order: 1 }}>
              {msg.type === 'image' ? (
                <img src={msg.imageUrl} alt="sent" style={{ maxWidth: '100%', borderRadius: 8 }} />
              ) : (
                <Typography>{msg.text}</Typography>
              )}
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
        <IconButton onClick={handleEmojiToggle} type="button" disabled={isBlocked}>
          <EmojiEmotionsIcon />
        </IconButton>
        <TextField
          variant="outlined"
          placeholder="הקלד הודעה..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          fullWidth
          multiline
          maxRows={4}
          sx={{ mx: 1 }}
          disabled={isBlocked}
        />
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isBlocked}
        />
        <TextField
          variant="outlined"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          fullWidth
          sx={{ mx: 1 }}
          disabled={isBlocked}
        />
        <IconButton onClick={openFileDialog} type="button" disabled={isBlocked}>
          Upload
        </IconButton>
        <IconButton color="primary" type="submit" disabled={isBlocked}>
          <SendIcon />
        </IconButton>
      </form>

      {emojiPickerOpen && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            left: 20,
            bgcolor: 'white',
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 1,
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: 300,
            zIndex: 1000,
          }}
        >
          {emojiList.map((emoji) => (
            <Button
              key={emoji}
              onClick={() => handleEmojiSelect(emoji)}
              sx={{ minWidth: 30, fontSize: 24, p: 0.5 }}
            >
              {emoji}
            </Button>
          ))}
        </Box>
      )}

      {isBlocked && (
        <Paper sx={{ p: 2, mt: 2, textAlign: 'center', bgcolor: '#fdd' }}>
          <Typography variant="h6" color="error">
            הדיון הזה חסום על ידי מנהל.
          </Typography>
        </Paper>
      )}

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">משתמשים בדיון</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            {usersInDiscussion.map((u) => (
            <ListItem button key={u._id} onClick={() => handleUserClick(u._id)}>
              <ListItemAvatar sx={{cursor: 'pointer'}} onClick={() => handleUserClick(u._id)}>
                <Avatar src={u.profilePicture} alt={u.name} />
              </ListItemAvatar>
              <ListItemText primary={u.name} />
            </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Container>
  );
};

export default ChatPage;
