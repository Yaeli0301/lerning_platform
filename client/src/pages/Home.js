import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Slide,
  Grow,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import ComputerIcon from '@mui/icons-material/Computer';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import SearchResults from '../components/SearchResults';

const features = [
  {
    icon: <SchoolIcon sx={{ fontSize: 50, color: '#1565c0' }} />,
    title: 'לימוד איכותי',
    description: 'קורסים מקצועיים עם מרצים מובילים בתחום.',
  },
  {
    icon: <ComputerIcon sx={{ fontSize: 50, color: '#2e7d32' }} />,
    title: 'פלטפורמה מתקדמת',
    description: 'כלים טכנולוגיים מתקדמים ללמידה אינטראקטיבית.',
  },
  {
    icon: <VerifiedUserIcon sx={{ fontSize: 50, color: '#ef6c00' }} />,
    title: 'תעודות מקצועיות',
    description: 'השג תעודה מוכרת בסיום כל קורס.',
  },
];

const getTodayKey = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [topRatedCourses, setTopRatedCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [slideIn, setSlideIn] = useState(false);
  const [growIn, setGrowIn] = useState(false);

  useEffect(() => {
    fetchRecommendedCourses();
    setSlideIn(true);
    setTimeout(() => setGrowIn(true), 500);
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCourses(recommendedCourses);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCourses(
        recommendedCourses.filter(course =>
          course.title.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, recommendedCourses]);

  const handleSearchClick = () => {
    const term = searchInput.trim().toLowerCase();
    if (term === '') {
      setFilteredCourses(recommendedCourses);
    } else {
      setFilteredCourses(
        recommendedCourses.filter(course =>
          course.title.toLowerCase().includes(term)
        )
      );
    }
    setSearchTerm(searchInput);
  };

  const fetchRecommendedCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/courses?limit=20');
      setRecommendedCourses(res.data);
      setFilteredCourses(res.data);
      selectTopRatedCourses(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch recommended courses:', err);
      setError('שגיאה בטעינת הקורסים המומלצים');
    } finally {
      setLoading(false);
    }
  };

  const selectTopRatedCourses = (courses) => {
    if (!courses || courses.length === 0) {
      setTopRatedCourses([]);
      return;
    }
    // Sort courses by rating descending
    const sorted = [...courses].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const highestRating = sorted[0].rating || 0;
    // Filter courses with highest rating
    const highestRatedCourses = sorted.filter(c => (c.rating || 0) === highestRating);
    let selected = [];
    const todayKey = getTodayKey();
    const storageKey = 'topRatedCoursesSelectionDate';
    const storedDate = localStorage.getItem(storageKey);
    const storedSelection = localStorage.getItem('topRatedCoursesSelection');

    if (highestRatedCourses.length <= 3) {
      selected = highestRatedCourses.slice(0, 3);
    } else {
      // More than 3 courses with same highest rating
      // Check if stored selection is for today
      if (storedDate === todayKey && storedSelection) {
        try {
          const parsed = JSON.parse(storedSelection);
          // Validate parsed is array of course ids present in highestRatedCourses
          const validSelection = parsed.filter(id =>
            highestRatedCourses.some(c => c._id === id)
          );
          if (validSelection.length === 3) {
            selected = highestRatedCourses.filter(c => validSelection.includes(c._id));
          } else {
            selected = randomSelectThree(highestRatedCourses);
            localStorage.setItem(storageKey, todayKey);
            localStorage.setItem('topRatedCoursesSelection', JSON.stringify(selected.map(c => c._id)));
          }
        } catch {
          selected = randomSelectThree(highestRatedCourses);
          localStorage.setItem(storageKey, todayKey);
          localStorage.setItem('topRatedCoursesSelection', JSON.stringify(selected.map(c => c._id)));
        }
      } else {
        selected = randomSelectThree(highestRatedCourses);
        localStorage.setItem(storageKey, todayKey);
        localStorage.setItem('topRatedCoursesSelection', JSON.stringify(selected.map(c => c._id)));
      }
    }
    setTopRatedCourses(selected);
  };

  const randomSelectThree = (courses) => {
    const shuffled = [...courses].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  return (
    <>
      <Box
        sx={{
          height: 320,
          backgroundImage: 'url(https://source.unsplash.com/featured/?education,technology)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          px: 2,
          mb: 6,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 0 2000px rgba(0,0,0,0.4)',
          borderRadius: 4,
        }}
      >
        <Slide direction="down" in={slideIn} timeout={1000}>
          <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold', textShadow: '3px 3px 6px rgba(0,0,0,0.8)' }}>
            ברוכים הבאים לפלטפורמת הלמידה שלנו!
          </Typography>
        </Slide>
        <Slide direction="up" in={slideIn} timeout={1500}>
          <Typography variant="h5" sx={{ mt: 3, textShadow: '2px 2px 5px rgba(0,0,0,0.7)' }}>
            למדו מהטובים ביותר, בצעו תרגולים, והשיגו תעודות מקצועיות.
          </Typography>
        </Slide>
      </Box>

      <Container sx={{ mb: 6 }}>
        <Grow in={growIn} timeout={1000}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center" sx={{ mb: 6 }}>
            {features.map((feature, index) => (
              <Paper
                key={index}
                elevation={6}
                sx={{
                  p: 4,
                  maxWidth: 280,
                  textAlign: 'center',
                  borderRadius: 3,
                  bgcolor: '#ffffff',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    transform: 'scale(1.07)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  },
                }}
              >
                {feature.icon}
                <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: '#222' }}>
                  {feature.title}
                </Typography>
                <Typography variant="body1" sx={{ color: '#444' }}>
                  {feature.description}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Grow>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {!user && (
              <>
                <Button variant="contained" color="primary" component={Link} sx={{ mr: 2, mb: 4 }} to="/register" disableElevation>
                  התחל ללמוד עכשיו
                </Button>
                <Button variant="outlined" color="primary" component={Link} sx={{ mb: 4 }} to="/login" disableElevation>
                  כניסה לחשבון
                </Button>
              </>
            )}

            {user && user.role === 'admin' && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  to="/admin"
                  sx={{ fontWeight: 'bold', fontSize: '1.2rem', px: 4, py: 2, boxShadow: 6 }}
                  disableElevation
                >
                  לוח בקרה למנהל
                </Button>
              </Box>
            )}

            <TextField
              label="חפש קורסים"
              variant="outlined"
              fullWidth
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="search courses"
                      onClick={handleSearchClick}
                      edge="end"
                    >
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              inputProps={{ 'aria-label': 'חפש קורסים' }}
            />

            <SearchResults results={filteredCourses} />

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button component={Link} to="/courses" variant="text" size="small">
                לחיפוש מתקדם יותר לחצו כאן
              </Button>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                קורסים מומלצים
              </Typography>
              <Grid container spacing={3}>
                {topRatedCourses.map(course => (
                  <Grid item xs={12} sm={6} md={4} key={course._id}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6">{course.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        דירוג: {course.rating}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default Home;
