import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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

const DiscussionPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [discussions, setDiscussions] = useState([]);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [lessonLink, setLessonLink] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    setError(null);
    try {
      const res = await axiosInstance.get('/api/forum/discussions');
      setDiscussions(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch discussions.');
    }
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussionTitle) {
      setError('Please enter a discussion title.');
      return;
    }
    try {
      const payload = {
        title: newDiscussionTitle,
        lessonLink,
        creatorId: user._id,
      };
      await axiosInstance.post('/api/forum/discussions', payload);
      setNewDiscussionTitle('');
      setLessonLink('');
      fetchDiscussions();
    } catch (err) {
      console.error(err);
      setError('Failed to create discussion.');
    }
  };

  const handleEnterDiscussion = (discussionId) => {
    navigate(`/chat/${discussionId}`);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>יצירת דיון חדש</Typography>
      <Paper sx={{ p: 2, mb: 4 }}>
        <TextField
          label="כותרת דיון"
          value={newDiscussionTitle}
          onChange={(e) => setNewDiscussionTitle(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="קישור לשיעור (אופציונלי)"
          value={lessonLink}
          onChange={(e) => setLessonLink(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleCreateDiscussion}>צור דיון</Button>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </Paper>

      <Typography variant="h5" gutterBottom>רשימת דיונים</Typography>
      <List>
        {discussions.map((discussion) => (
          <ListItem key={discussion._id} divider>
            <ListItemText
              primary={discussion.title}
              secondary={`יוצר: ${discussion.creatorUsername}`}
            />
            <Button variant="outlined" onClick={() => handleEnterDiscussion(discussion._id)}>
              כניסה לדיון
            </Button>
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default DiscussionPage;
