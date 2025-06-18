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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiscussions();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchDiscussions = async () => {
    setError(null);
    try {
      const res = await axiosInstance.get('/api/forum/discussions');
      const discussionsWithDetails = await Promise.all(
        res.data.map(async (discussion) => {
          try {
            if (!discussion.courseId || !discussion.lessonId) {
              return {
                ...discussion,
                courseName: 'Unknown Course',
                lessonTitle: 'Unknown Lesson',
              };
            }
            const course = await axiosInstance.get(`/api/courses/${discussion.courseId}`);
            const lesson = await axiosInstance.get(`/api/courses/${discussion.courseId}/lessons/${discussion.lessonId}`);
            return {
              ...discussion,
              courseName: course.data.name,
              lessonTitle: lesson.data.title,
            };
          } catch (err) {
            console.error(`Failed to fetch course or lesson details for discussion ${discussion._id}:`, err);
            return {
              ...discussion,
              courseName: 'Unknown Course',
              lessonTitle: 'Unknown Lesson',
            };
          }
        })
      );
      setDiscussions(discussionsWithDetails);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch discussions.');
    }
  };

  const fetchCourses = async () => {
    setError(null);
    try {
      const res = await axiosInstance.get('/api/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch courses.');
    }
  };

  const fetchLessons = async (courseId) => {
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/courses/${courseId}/lessons`);
      setLessons(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch lessons.');
    }
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussionTitle) {
      setError('Please enter a discussion title.');
      return;
    }
    if (!selectedCourse) {
      setError('Please select a course.');
      return;
    }
    if (!selectedLesson) {
      setError('Please select a lesson.');
      return;
    }
    try {
      const payload = {
        title: newDiscussionTitle,
        course: selectedCourse,
        lesson: selectedLesson,
      };
      await axiosInstance.post('/api/forum/discussions', payload);
      setNewDiscussionTitle('');
      setSelectedCourse('');
      setSelectedLesson('');
      fetchDiscussions();
    } catch (err) {
      console.error(err);
      setError('Failed to create discussion.');
    }
  };

  const handleEnterDiscussion = (discussionId) => {
    navigate(`/chat/${discussionId}`);
  };

  const handleToggleBlockDiscussion = async (discussionId, blocked) => {
    try {
      await axiosInstance.post(`/api/forum/discussions/${discussionId}/block`, { blocked });
      fetchDiscussions();
    } catch (err) {
      console.error('Failed to toggle block discussion:', err);
      setError('Failed to update discussion block status.');
    }
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
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="course-select-label">קורס</InputLabel>
          <Select
            labelId="course-select-label"
            id="course-select"
            value={selectedCourse}
            label="קורס"
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            {courses.map((course) => (
              <MenuItem key={course._id} value={course._id}>{course.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="lesson-select-label">שיעור</InputLabel>
          <Select
            labelId="lesson-select-label"
            id="lesson-select"
            value={selectedLesson}
            label="שיעור"
            onChange={(e) => setSelectedLesson(e.target.value)}
            disabled={!selectedCourse}
          >
            {lessons.map((lesson) => (
              <MenuItem key={lesson._id} value={lesson._id}>{lesson.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleCreateDiscussion}>צור דיון</Button>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </Paper>

      <Typography variant="h5" gutterBottom>רשימת דיונים</Typography>
      <List>
        {discussions.map((discussion) => {
          const isBlocked = discussion.isBlocked || false;
          return (
            <ListItem key={discussion._id} divider sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ textDecoration: isBlocked ? 'line-through' : 'none' }}>
                  {discussion.title} {isBlocked && '(חסום)'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {discussion.courseName} - {discussion.lessonTitle}
                </Typography>
                <Typography variant="caption">נוצר על ידי: {discussion.creatorUsername}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={() => handleEnterDiscussion(discussion._id)} disabled={isBlocked}>
                  כניסה לדיון
                </Button>
                {user?.role === 'admin' && (
                  <Button
                    variant="contained"
                    color={isBlocked ? 'success' : 'error'}
                    onClick={() => handleToggleBlockDiscussion(discussion._id, !isBlocked)}
                  >
                    {isBlocked ? 'בטל חסימה' : 'חסום'}
                  </Button>
                )}
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
};

export default DiscussionPage;

