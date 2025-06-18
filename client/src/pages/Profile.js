import React, { useContext, useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Avatar,
  TextField,
  IconButton,
  Divider,
  CircularProgress,
  Fade,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress as MuiCircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import {
  updateUserProfile,
  getUserDiscussions,
  getUserEnrolledCourses,
  getUsers,
  uploadProfilePictureUser,
} from '../api';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { userId } = useParams();

  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    profilePicture: '',
  });
  const [discussions, setDiscussions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (userId && userId !== user.id) {
      fetchOtherUserProfile();
      fetchOtherUserDiscussions();
      setLoading(false);
    } else {
      fetchProfile();
      fetchUserDiscussions();
      fetchUserCourses();
    }
  }, [user, userId]);

  const fetchProfile = () => {
    setProfileData({
      name: user.name || '',
      email: user.email || '',
      profilePicture: user.profilePicture || '',
    });
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await uploadProfilePictureUser(user.id, formData);
      const updatedUser = response.data.user;

      setProfileData((prev) => ({
        ...prev,
        profilePicture: updatedUser.profilePicture,
      }));

      setUser(updatedUser);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setUploadError('שגיאה בהעלאת תמונת הפרופיל');
    } finally {
      setUploading(false);
    }
  };

  const fetchOtherUserProfile = async () => {
    try {
      const res = await getUsers();
      const otherUser = res.data.find(u => u._id === userId);
      if (otherUser) {
        setProfileData({
          name: otherUser.name || '',
          email: otherUser.email || '',
          profilePicture: otherUser.profilePicture || '',
        });
      } else {
        setError('User not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user profile.');
    }
  };

  const fetchUserDiscussions = async () => {
    try {
      const res = await getUserDiscussions(user.id);
      setDiscussions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOtherUserDiscussions = async () => {
    try {
      const res = await getUserDiscussions(userId);
      setDiscussions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserCourses = async () => {
    try {
      const res = await getUserEnrolledCourses();
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setProfileData({ ...profileData, [field]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await updateUserProfile(user.id, profileData);
      setUser(res.data.user);
      setEditMode(false);
    } catch (err) {
      setError('שגיאה בעדכון הפרופיל');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Fade in>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            src={profileData.profilePicture}
            alt={profileData.name}
            sx={{ width: 120, height: 120 }}
          >
            {profileData.name ? profileData.name.charAt(0) : 'מ'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            {editMode ? (
              <>
                <TextField
                  label="שם מלא"
                  value={profileData.name}
                  onChange={handleChange('name')}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="אימייל"
                  value={profileData.email}
                  onChange={handleChange('email')}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </>
            ) : (
              <>
                <Typography variant="h4">{profileData.name}</Typography>
                <Typography variant="body1">{profileData.email}</Typography>
              </>
            )}
          </Box>
          <Box>
            {editMode ? (
              <>
                <IconButton color="primary" onClick={handleSave} disabled={saving} aria-label="save">
                  <SaveIcon />
                </IconButton>
                <IconButton color="error" onClick={() => setEditMode(false)} disabled={saving} aria-label="cancel">
                  <CancelIcon />
                </IconButton>
              </>
            ) : (
              <IconButton onClick={() => setEditMode(true)} aria-label="edit">
                <EditIcon />
              </IconButton>
            )}
          </Box>
          <Box sx={{ ml: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-picture-upload"
              type="file"
              onChange={handleProfilePictureChange}
              disabled={uploading || !editMode}
            />
            <label htmlFor="profile-picture-upload">
              <Button
                variant="outlined"
                component="span"
                disabled={uploading || !editMode}
                aria-label="upload profile picture"
              >
                {uploading ? <MuiCircularProgress size={24} /> : 'העלה תמונת פרופיל'}
              </Button>
            </label>
            {uploadError && (
              <Typography color="error" sx={{ mt: 1 }}>
                {uploadError}
              </Typography>
            )}
          </Box>
        </Box>
      </Fade>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Divider sx={{ mb: 3 }} />
      <Typography variant="h5" gutterBottom>
        דיונים שיצרת
      </Typography>
      {/* Discussions display */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="h5" gutterBottom>
        קורסים שנרשמת אליהם
      </Typography>
            {courses.length === 0 ? (
              <Typography>לא נרשמת לקורסים עדיין</Typography>
            ) : (
              <List>
                {courses.map((course) => (
              <ListItem
                key={course._id}
                component={Link}
                to={`/courses/${course._id}`}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <SchoolIcon color="primary" />
                <ListItemText primary={course.title} />
              </ListItem>
                ))}
              </List>
            )}
    </Container>
  );
};

export default Profile;

