import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Button, Box, TextField, Divider, IconButton, Collapse, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import QuizEditor from '../components/QuizEditor';
import { useLocation } from 'react-router-dom';

// Create axios instance
const axiosInstance = axios.create({
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
  const { token } = useContext(AuthContext);
  const location = useLocation();

  // State declarations
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
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
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Set token header dynamically for each request
  useEffect(() => {
    if (axiosInstance && axiosInstance.defaults && axiosInstance.defaults.headers && axiosInstance.defaults.headers.common) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  // Fetch users and courses on mount
  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  // Set selectedCourse if editCourseId query param is present and scroll to edit section
  useEffect(() => {
    if (courses.length > 0) {
      const params = new URLSearchParams(location.search);
      const editCourseId = params.get('editCourseId');
      if (editCourseId) {
        const courseToEdit = courses.find(c => c._id === editCourseId);
        if (courseToEdit) {
          setSelectedCourse(courseToEdit);
          // Scroll to edit course section after a short delay to ensure rendering
          setTimeout(() => {
            const editSection = document.getElementById('edit-course-section');
            if (editSection) {
              editSection.scrollIntoView({ behavior: 'smooth' });
            }
          }, 300);
        }
      }
    }
  }, [courses, location.search]);

  const fetchUsers = async () => {
    setError(null);
    try {
      const res = await axiosInstance.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users.');
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

  const toggleLessonForm = () => {
    setShowLessonForm(prev => !prev);
  };

  const handleNewCourseChange = (field, value) => {
    setNewCourse(prev => ({ ...prev, [field]: value }));
  };

  const handleNewLessonChange = (field, value) => {
    setNewLesson(prev => ({ ...prev, [field]: value }));
  };

  const addLessonToNewCourse = () => {
    if (!newLesson.title) return;
    const lessonWithContent = { ...newLesson, content: newLesson.verbalExplanation || '' };
    setNewCourse(prev => ({ ...prev, lessons: [...(prev.lessons || []), lessonWithContent] }));
    setNewLesson({ title: '', videoUrl: '', verbalExplanation: '', quizzes: [] });
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

  const handleAddCourse = async () => {
    setError(null);
    if (!newCourse.title) {
      setError('Course title is required.');
      return;
    }
    try {
      await axiosInstance.post('/api/courses', newCourse);
      setNewCourse({
        title: '',
        description: '',
        category: '',
        difficultyLevel: 'Beginner',
        lessons: [],
      });
      fetchCourses();
    } catch (err) {
      console.error(err);
      setError('Failed to add course.');
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
  };

  const handleDeleteCourse = async (courseId) => {
    setError(null);
    try {
      await axiosInstance.put(`/api/courses/${courseId}/deactivate`);
      if (selectedCourse && selectedCourse._id === courseId) {
        setSelectedCourse(null);
      }
      // After deactivation, fetch courses and filter out deactivated ones
      const res = await axiosInstance.get('/api/courses');
      const activeCourses = res.data.filter(course => !course.isDeactivated);
      setCourses(activeCourses);
    } catch (err) {
      console.error(err);
      setError('Failed to delete course.');
    }
  };

  const handleUpdateCourse = async () => {
    setError(null);
    if (!selectedCourse) return;
    try {
      const courseData = { ...selectedCourse };
      if (courseData.lessons) {
        courseData.lessons = courseData.lessons.map(lesson => {
          const { _id, ...rest } = lesson;
          if (!rest.content) {
            rest.content = rest.verbalExplanation || '';
          }
          return rest;
        });
      }
      await axiosInstance.put(`/api/courses/${selectedCourse._id}`, courseData);
      setSnackbar({ open: true, message: 'Course updated successfully.', severity: 'success' });
      setSelectedCourse(null);
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
    const lessonWithContent = { ...newLesson, content: newLesson.verbalExplanation || '' };
    setSelectedCourse(prev => ({ ...prev, lessons: [...(prev.lessons || []), lessonWithContent] }));
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
        <Box id="edit-course-section" sx={{ mt: 4, maxWidth: 600 }}>
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
      await axiosInstance.post(`/api/forum/discussions/${discussion._id}/block`, {
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
        <ListItem key={discussion._id} divider sx={{ opacity: discussion.isBlocked ? 0.5 : 1 }}>
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
