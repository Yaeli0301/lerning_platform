import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Button, Box, TextField, Divider, IconButton, Collapse, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import QuizEditor from '../components/QuizEditor';

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
});

// Add a request interceptor to set Authorization header dynamically
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

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);

  // Debug logs for token and user
  useEffect(() => {
    console.log('Auth token:', token);
    console.log('User info:', user);
  }, [token, user]);

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: '',
    difficultyLevel: 'Beginner',
    lessons: [],
  });
  const [newLesson, setNewLesson] = useState({
    title: '',
    videoUrl: '',
    verbalExplanation: '',
    quizzes: [],
  });

  const [showLessonForm, setShowLessonForm] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users.');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setSnackbar({ open: true, message: 'Unauthorized or forbidden. Please check your login.', severity: 'error' });
        // Logout user on auth error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.reload();
        }
      }
    } finally {
      setLoading(false);
    }
  };

const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) return;
      const res = await axiosInstance.get('/api/courses');
      // Filter courses by instructor (logged-in admin)
      const filteredCourses = res.data.filter(course => {
        const instructorId = course.instructor?._id || course.instructor;
        const userId = user._id || user.id;
        return instructorId === userId;
      });
      setCourses(filteredCourses);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch courses.');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setSnackbar({ open: true, message: 'Unauthorized or forbidden. Please check your login.', severity: 'error' });
        // Logout user on auth error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.reload();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (user) => {
    setError(null);
    try {
      await axiosInstance.put(`/api/admin/users/${user._id}/block`, {
        blocked: !user.isBlocked,
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('Failed to update user block status.');
    }
  };

  const handleNewCourseChange = (field, value) => {
    setNewCourse(prev => ({ ...prev, [field]: value }));
  };

  const handleNewLessonChange = (field, value) => {
    setNewLesson(prev => ({ ...prev, [field]: value }));
  };

  const toggleLessonForm = () => {
    setShowLessonForm(prev => !prev);
  };

  const addLessonToNewCourse = () => {
    if (!newLesson.title) {
      setSnackbar({ open: true, message: 'Please enter a lesson title.', severity: 'warning' });
      return;
    }
    // Ensure quizzes array is properly set
    const lessonToAdd = {
      ...newLesson,
      quizzes: newLesson.quizzes && newLesson.quizzes.length > 0 ? newLesson.quizzes : [],
    };
    setNewCourse(prev => ({ ...prev, lessons: [...prev.lessons, lessonToAdd] }));
    setNewLesson({ title: '', videoUrl: '', verbalExplanation: '', quizzes: [] });
    setShowLessonForm(false);
    setSnackbar({ open: true, message: 'Lesson added to course.', severity: 'success' });
  };

  const handleAddCourse = async () => {
    setError(null);
    const { title, description, category } = newCourse;
    if (!title || !description || !category) {
      setSnackbar({ open: true, message: 'Please fill all required course fields.', severity: 'warning' });
      return;
    }
    try {
      console.log('Sending POST /api/courses with token:', localStorage.getItem('token'));
      const response = await axiosInstance.post('/api/courses', newCourse);
      console.log('POST /api/courses response:', response);
      setNewCourse({
        title: '',
        description: '',
        category: '',
        difficultyLevel: 'Beginner',
        lessons: [],
      });
      setSnackbar({ open: true, message: 'Course created successfully.', severity: 'success' });
      fetchCourses();
    } catch (err) {
      console.error('Error in POST /api/courses:', err);
      setError('Failed to add course.');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setSnackbar({ open: true, message: 'Unauthorized or forbidden. Please check your login.', severity: 'error' });
        // Logout user on auth error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.reload();
        }
      } else {
        setSnackbar({ open: true, message: 'Failed to add course.', severity: 'error' });
      }
    }
  };

  const handleUpdateCourse = async () => {
    setError(null);
    if (!selectedCourse) return;
    try {
      // Prepare course data to avoid sending unwanted fields
      const courseData = { ...selectedCourse };
      // Remove any fields that should not be sent to backend if needed
      // For example, remove _id from lessons if present
      if (courseData.lessons) {
        courseData.lessons = courseData.lessons.map(lesson => {
          const { _id, ...rest } = lesson;
          return rest;
        });
      }
      await axiosInstance.put(`/api/courses/${selectedCourse._id}`, courseData);
      setSnackbar({ open: true, message: 'Course updated successfully.', severity: 'success' });
      setSelectedCourse(null); // Close editing form on success
      fetchCourses();
    } catch (err) {
      console.error(err);
      setError('Failed to update course.');
      setSnackbar({ open: true, message: 'Failed to update course.', severity: 'error' });
    }
  };
=======
  const handleAddCourse = async () => {
    setError(null);
    const { title, description, category } = newCourse;
    if (!title || !description || !category) {
      setSnackbar({ open: true, message: 'Please fill all required course fields.', severity: 'warning' });
      return;
    }
    try {
      console.log('Sending POST /api/courses with token:', localStorage.getItem('token'));
      const response = await axiosInstance.post('/api/courses', newCourse);
      console.log('POST /api/courses response:', response);
      setNewCourse({
        title: '',
        description: '',
        category: '',
        difficultyLevel: 'Beginner',
        lessons: [],
      });
      setSnackbar({ open: true, message: 'Course created successfully.', severity: 'success' });
      fetchCourses();
    } catch (err) {
      console.error('Error in POST /api/courses:', err);
      setError('Failed to add course.');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setSnackbar({ open: true, message: 'Unauthorized or forbidden. Please check your login.', severity: 'error' });
        // Logout user on auth error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.reload();
        }
      } else {
        setSnackbar({ open: true, message: 'Failed to add course.', severity: 'error' });
      }
    }
  };

  const handleUpdateCourse = async () => {
    setError(null);
    if (!selectedCourse) return;
    try {
      // Prepare course data to avoid sending unwanted fields
      const courseData = { ...selectedCourse };
      // Remove any fields that should not be sent to backend if needed
      // For example, remove _id from lessons if present
      if (courseData.lessons) {
        courseData.lessons = courseData.lessons.map(lesson => {
          const { _id, ...rest } = lesson;
          return rest;
        });
      }
      await axiosInstance.put(`/api/courses/${selectedCourse._id}`, courseData);
      setSnackbar({ open: true, message: 'Course updated successfully.', severity: 'success' });
      setSelectedCourse(null); // Close editing form on success
      fetchCourses();
    } catch (err) {
      console.error(err);
      setError('Failed to update course.');
      setSnackbar({ open: true, message: 'Failed to update course.', severity: 'error' });
    }
  };

  const handleAddCourse = async () => {
    setError(null);
    const { title, description, category } = newCourse;
    if (!title || !description || !category) {
      setSnackbar({ open: true, message: 'Please fill all required course fields.', severity: 'warning' });
      return;
    }
    try {
      console.log('Sending POST /api/courses with token:', localStorage.getItem('token'));
      const response = await axiosInstance.post('/api/courses', newCourse);
      console.log('POST /api/courses response:', response);
      setNewCourse({
        title: '',
        description: '',
        category: '',
        difficultyLevel: 'Beginner',
        lessons: [],
      });
      setSnackbar({ open: true, message: 'Course created successfully.', severity: 'success' });
      fetchCourses();
    } catch (err) {
      console.error('Error in POST /api/courses:', err);
      setError('Failed to add course.');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setSnackbar({ open: true, message: 'Unauthorized or forbidden. Please check your login.', severity: 'error' });
        // Logout user on auth error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.reload();
        }
      } else {
        setSnackbar({ open: true, message: 'Failed to add course.', severity: 'error' });
      }
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
  };

  const handleDeleteCourse = async (courseId) => {
    setError(null);
    try {
      await axiosInstance.delete(`/api/courses/${courseId}`);
      if (selectedCourse && selectedCourse._id === courseId) {
        setSelectedCourse(null);
      }
      fetchCourses();
    } catch (err) {
      console.error(err);
      setError('Failed to delete course.');
    }
  };

  const handleUpdateCourse = async () => {
    setError(null);
    if (!selectedCourse) return;
    try {
      // Prepare course data to avoid sending unwanted fields
      const courseData = { ...selectedCourse };
      // Remove any fields that should not be sent to backend if needed
      // For example, remove _id from lessons if present
      if (courseData.lessons) {
        courseData.lessons = courseData.lessons.map(lesson => {
          const { _id, ...rest } = lesson;
          return rest;
        });
      }
      await axiosInstance.put(`/api/courses/${selectedCourse._id}`, courseData);
      setSnackbar({ open: true, message: 'Course updated successfully.', severity: 'success' });
      setSelectedCourse(null); // Close editing form on success
      fetchCourses();
    } catch (err) {
      console.error(err);
      setError('Failed to update course.');
      setSnackbar({ open: true, message: 'Failed to update course.', severity: 'error' });
    }
  };

  const handleSelectedCourseChange = (field, value) => {
    setSelectedCourse(prev => ({ ...prev, [field]: value }));
  };

  const addLessonToSelectedCourse = () => {
    if (!newLesson.title) return;
    setSelectedCourse(prev => ({ ...prev, lessons: [...(prev.lessons || []), newLesson] }));
    setNewLesson({ title: '', videoUrl: '', verbalExplanation: '', quizzes: [] });
  };

  const handleDeleteLesson = (lessonId) => {
    if (!selectedCourse) return;
    const updatedLessons = selectedCourse.lessons.filter(lesson => lesson._id !== lessonId);
    setSelectedCourse(prev => ({ ...prev, lessons: updatedLessons }));
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>מערכת ניהול</Typography>

      <Typography variant="h6" gutterBottom>ניהול משתמשים</Typography>
      <List>
        {users.map(user => (
          <ListItem key={user._id} divider>
            <ListItemText
              primary={`${user.name} (${user.email})`}
            secondary={`תפקיד: ${user.role} | חסום: ${user.isBlocked ? 'כן' : 'לא'}`}
          />
          <Button variant="outlined" onClick={() => handleBlockToggle(user)}>
            {user.isBlocked ? 'שחרר חסימה' : 'חסום משתמש'}
          </Button>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>ניהול קורסים</Typography>
      <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', maxWidth: 600 }}>
        <TextField
          label="שם הקורס"
          value={newCourse.title}
          onChange={(e) => handleNewCourseChange('title', e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
        />
        <TextField
          label="תיאור הקורס"
          value={newCourse.description}
          onChange={(e) => handleNewCourseChange('description', e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
          multiline
          rows={3}
        />
        <TextField
          label="קטגוריה"
          value={newCourse.category}
          onChange={(e) => handleNewCourseChange('category', e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
        />
        <TextField
          label="רמת קושי"
          select
          value={newCourse.difficultyLevel}
          onChange={(e) => handleNewCourseChange('difficultyLevel', e.target.value)}
          SelectProps={{ native: true }}
          sx={{ mb: 2 }}
          fullWidth
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </TextField>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>הוסף שיעור חדש</Typography>
          <IconButton color="primary" onClick={toggleLessonForm} aria-label="add lesson">
            {showLessonForm ? <CloseIcon /> : <AddIcon />}
          </IconButton>
        </Box>
        <Collapse in={showLessonForm} timeout="auto" unmountOnExit>
          <Box sx={{ mb: 2 }}>
            <TextField
              label="כותרת שיעור"
              value={newLesson.title}
              onChange={(e) => handleNewLessonChange('title', e.target.value)}
              sx={{ mb: 2 }}
              fullWidth
            />
            <TextField
              label="קישור וידאו"
              value={newLesson.videoUrl}
              onChange={(e) => handleNewLessonChange('videoUrl', e.target.value)}
              sx={{ mb: 2 }}
              fullWidth
            />
            <TextField
              label="הסבר מילולי"
              value={newLesson.verbalExplanation}
              onChange={(e) => handleNewLessonChange('verbalExplanation', e.target.value)}
              sx={{ mb: 2 }}
              fullWidth
              multiline
              rows={3}
            />
            <Box sx={{ mb: 2 }}>
              <QuizEditor
                quiz={newLesson.quizzes && newLesson.quizzes.length > 0 ? newLesson.quizzes[0] : { questions: [] }}
                onChange={(updatedQuiz) => {
                  setNewLesson(prev => ({ ...prev, quizzes: [updatedQuiz] }));
                }}
              />
            </Box>
            <Button variant="outlined" onClick={addLessonToNewCourse} sx={{ mb: 2 }}>
              הוסף שיעור לקורס
            </Button>
          </Box>
        </Collapse>

        <Button variant="contained" onClick={handleAddCourse}>הוסף קורס</Button>
      </Box>

      <List>
        {courses.map(course => (
          <ListItem
            key={course._id}
            divider
            selected={selectedCourse?._id === course._id}
            onClick={() => handleSelectCourse(course)}
          >
            <ListItemText
              primary={course.title}
              secondary={`קטגוריה: ${course.category} | רמת קושי: ${course.difficultyLevel}`}
            />
            <Button variant="outlined" color="error" onClick={() => handleDeleteCourse(course._id)}>
              מחק קורס
            </Button>
          </ListItem>
        ))}
      </List>

      {selectedCourse && (
        <Box sx={{ mt: 4, maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>ערוך קורס</Typography>
          <TextField
            label="שם הקורס"
            value={selectedCourse.title}
            onChange={(e) => handleSelectedCourseChange('title', e.target.value)}
            sx={{ mb: 2 }}
            fullWidth
          />
          <TextField
            label="תיאור הקורס"
            value={selectedCourse.description}
            onChange={(e) => handleSelectedCourseChange('description', e.target.value)}
            sx={{ mb: 2 }}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="קטגוריה"
            value={selectedCourse.category}
            onChange={(e) => handleSelectedCourseChange('category', e.target.value)}
            sx={{ mb: 2 }}
            fullWidth
          />
          <TextField
            label="רמת קושי"
            select
            value={selectedCourse.difficultyLevel}
            onChange={(e) => handleSelectedCourseChange('difficultyLevel', e.target.value)}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
            fullWidth
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </TextField>

          <Typography variant="subtitle1" gutterBottom>שיעורים</Typography>
          {selectedCourse.lessons && selectedCourse.lessons.length > 0 ? (
            selectedCourse.lessons.map((lesson, index) => (
              <Box key={lesson._id || index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                <TextField
                  label="כותרת שיעור"
                  value={lesson.title}
                  onChange={(e) => {
                    const updatedLessons = [...selectedCourse.lessons];
                    updatedLessons[index] = { ...updatedLessons[index], title: e.target.value };
                    handleSelectedCourseChange('lessons', updatedLessons);
                  }}
                  sx={{ mb: 1 }}
                  fullWidth
                />
                <TextField
                  label="קישור וידאו"
                  value={lesson.videoUrl}
                  onChange={(e) => {
                    const updatedLessons = [...selectedCourse.lessons];
                    updatedLessons[index] = { ...updatedLessons[index], videoUrl: e.target.value };
                    handleSelectedCourseChange('lessons', updatedLessons);
                  }}
                  sx={{ mb: 1 }}
                  fullWidth
                />
                <TextField
                  label="הסבר מילולי"
                  value={lesson.verbalExplanation}
                  onChange={(e) => {
                    const updatedLessons = [...selectedCourse.lessons];
                    updatedLessons[index] = { ...updatedLessons[index], verbalExplanation: e.target.value };
                    handleSelectedCourseChange('lessons', updatedLessons);
                  }}
                  sx={{ mb: 1 }}
                  fullWidth
                  multiline
                  rows={3}
                />
                <Box sx={{ mb: 2 }}>
                  <QuizEditor
                    quiz={lesson.quizzes && lesson.quizzes.length > 0 ? lesson.quizzes[0] : { questions: [] }}
                    onChange={(updatedQuiz) => {
                      const updatedLessons = [...selectedCourse.lessons];
                      updatedLessons[index] = { ...updatedLessons[index], quizzes: [updatedQuiz] };
                      handleSelectedCourseChange('lessons', updatedLessons);
                    }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const updatedLessons = selectedCourse.lessons.filter((_, i) => i !== index);
                    handleSelectedCourseChange('lessons', updatedLessons);
                  }}
                >
                  מחק שיעור
                </Button>
              </Box>
            ))
          ) : (
            <Typography>אין שיעורים בקורס זה</Typography>
          )}
          <Typography variant="subtitle1" gutterBottom>הוסף שיעור חדש</Typography>
          <TextField
            label="כותרת שיעור"
            value={newLesson.title}
            onChange={(e) => handleNewLessonChange('title', e.target.value)}
            sx={{ mb: 2 }}
            fullWidth
          />
          <TextField
            label="קישור וידאו"
            value={newLesson.videoUrl}
            onChange={(e) => handleNewLessonChange('videoUrl', e.target.value)}
            sx={{ mb: 2 }}
            fullWidth
          />
          <TextField
            label="הסבר מילולי"
            value={newLesson.verbalExplanation}
            onChange={(e) => handleNewLessonChange('verbalExplanation', e.target.value)}
            sx={{ mb: 2 }}
            fullWidth
            multiline
            rows={3}
          />
          <Box sx={{ mb: 2 }}>
            <QuizEditor
              quiz={newLesson.quizzes && newLesson.quizzes.length > 0 ? newLesson.quizzes[0] : { questions: [] }}
              onChange={(updatedQuiz) => {
                setNewLesson(prev => ({ ...prev, quizzes: [updatedQuiz] }));
              }}
            />
          </Box>
          <Button variant="outlined" onClick={addLessonToSelectedCourse} sx={{ mb: 2 }}>
            הוסף שיעור לקורס
          </Button>
          <Button variant="contained" onClick={handleUpdateCourse}>
            שמור שינויים
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>ניהול פורום</Typography>
      <ForumManagement />

    </Container>
  );
};

const ForumManagement = () => {
  const { token } = useContext(AuthContext);

  // Set token header dynamically for each request
  useEffect(() => {
    if (axiosInstance && axiosInstance.defaults && axiosInstance.defaults.headers && axiosInstance.defaults.headers.common) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const [discussions, setDiscussions] = React.useState([]);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
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

  const handleBlockToggle = async (discussion) => {
    setError(null);
    try {
      await axiosInstance.put(`/api/admin/discussions/${discussion._id}/block`, {
        blocked: !discussion.isBlocked,
      });
      fetchDiscussions();
    } catch (err) {
      console.error(err);
      setError('Failed to update discussion block status.');
    }
  };

  return (
    <List>
      {discussions.map(discussion => (
        <ListItem key={discussion._id} divider sx={{ opacity: discussion.isBlocked ? 0.5 : 1 }} button={false}>
          <ListItemText
            primary={discussion.title}
            secondary={`יוצר: ${discussion.creatorUsername} | חסום: ${discussion.isBlocked ? 'כן' : 'לא'}`}
          />
          <Button variant="outlined" onClick={() => handleBlockToggle(discussion)}>
            {discussion.isBlocked ? 'שחרר חסימה' : 'חסום דיון'}
          </Button>
        </ListItem>
      ))}
    </List>
  );
};

export default AdminDashboard;
