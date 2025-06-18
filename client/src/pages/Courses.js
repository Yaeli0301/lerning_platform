import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  getCourses,
  deleteCourse,
} from '../api';

const Courses = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const limit = 6;

  useEffect(() => {
    setSkip(0); // Reset skip to 0 when search, category, or difficulty changes
    fetchCourses();
  }, [search, category, difficulty]);

  useEffect(() => {
    fetchCourses();
  }, [skip]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = { search, skip, limit, category, difficultyLevel: difficulty };
      // Removed instructor filter for admin users to show all courses
      const res = await getCourses(params);
      console.log('fetchCourses response:', res);
      // Filter out deactivated courses
      const activeCourses = res.data.filter(course => !course.isDeactivated);
      setCourses(activeCourses);
      setError('');
    } catch (err) {
      console.error('fetchCourses error:', err);
      setError('שגיאה בטעינת הקורסים');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setSkip(0);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSkip(0);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setSkip(0);
  };

  const handlePrev = () => {
    setSkip(Math.max(0, skip - limit));
  };

  const handleNext = () => {
    if (courses.length === limit) {
      setSkip(skip + limit);
    }
  };

const handleDeleteCourse = async (courseId) => {
  try {
    await deleteCourse(courseId);
    await fetchCourses(); // Refresh courses after deletion
    // Update the courses state to remove the deleted course
    setCourses(prevCourses => prevCourses.filter(course => course._id !== courseId));
  } catch (err) {
    console.error('Failed to delete course:', err);
    setError('שגיאה במחיקת הקורס');
  }
};

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        קורסים
      </Typography>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="חיפוש קורסים"
          value={search}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, minWidth: 200 }}
          variant="outlined"
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>קטגוריה</InputLabel>
          <Select value={category} label="קטגוריה" onChange={handleCategoryChange}>
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="programming">תכנות</MenuItem>
            <MenuItem value="design">עיצוב</MenuItem>
            <MenuItem value="marketing">שיווק</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>רמת קושי</InputLabel>
          <Select value={difficulty} label="רמת קושי" onChange={handleDifficultyChange}>
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="Beginner">מתחילים</MenuItem>
            <MenuItem value="Intermediate">בינוני</MenuItem>
            <MenuItem value="Advanced">מתקדם</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading ? (
        <Typography>טוען קורסים...</Typography>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid xs={12} sm={6} md={4} key={course._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={course.imageUrl || '/logo192.png'}
                  alt={course.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{course.title}</Typography>
                  <Typography variant="body2">{course.description}</Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to={`/courses/${course._id}`}>
                    למידע נוסף
                  </Button>
                  {user && user.role === 'admin' && (
                    <Box>
                      <Button size="small" color="error" onClick={() => handleDeleteCourse(course._id)}>
                        מחק
                      </Button>
                      <Button size="small" color="primary" component={Link} to={`/admin?editCourseId=${course._id}`}>
                        ערוך
                      </Button>
                    </Box>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={handlePrev} disabled={skip === 0}>
          הקודם
        </Button>
        <Button variant="outlined" onClick={handleNext} disabled={courses.length < limit}>
          הבא
        </Button>
      </Box>
    </Container>
  );
};

export default Courses;
