import React, { useState } from 'react';
import { Container, Typography, TextField, Button, MenuItem, Box, Link as MuiLink } from '@mui/material';
import Joi from 'joi';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const schema = Joi.object({
  name: Joi.string().min(3).max(30).required().label('שם מלא'),
  email: Joi.string().email({ tlds: { allow: false } }).required().label('אימייל'),
  password: Joi.string().min(6).required().label('סיסמה'),
  role: Joi.string().valid('user', 'admin').required().label('תפקיד'),
  adminCode: Joi.string().allow('').label('קוד מנהל'),
  profilePicture: Joi.any().optional(),
});

const Register = ({ setUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    adminCode: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  const validate = () => {
    const { error } = schema.validate({ ...formData, profilePicture }, { abortEarly: false });
    if (!error) {
      setErrors({});
      return null;
    }
    const errs = {};
    error.details.forEach(detail => {
      errs[detail.path[0]] = detail.message;
    });
    setErrors(errs);
    return errs;
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs) return;

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      alert(res.data.message);

      if (profilePicture) {
        const formDataPic = new FormData();
        formDataPic.append('profilePicture', profilePicture);
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/auth/upload-profile-picture', formDataPic, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (formData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'שגיאה בשרת');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>הרשמה</Typography>
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          label="שם מלא"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
          margin="normal"
        />
        <TextField
          fullWidth
          label="אימייל"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          margin="normal"
        />
        <TextField
          fullWidth
          label="סיסמה"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          margin="normal"
        />
        <TextField
          select
          fullWidth
          label="תפקיד"
          name="role"
          value={formData.role}
          onChange={handleChange}
          margin="normal"
        >
          <MenuItem value="user">משתמש רגיל</MenuItem>
          <MenuItem value="admin">מנהל מערכת</MenuItem>
        </TextField>
        {formData.role === 'admin' && (
          <TextField
            fullWidth
            label="קוד מנהל סודי"
            name="adminCode"
            value={formData.adminCode}
            onChange={handleChange}
            error={!!errors.adminCode}
            helperText={errors.adminCode}
            margin="normal"
          />
        )}
        <Button
          variant="contained"
          component="label"
          sx={{ mt: 2 }}
        >
          העלאת תמונת פרופיל
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>
        {serverError && <Typography color="error" sx={{ mt: 1 }}>{serverError}</Typography>}
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" color="primary" type="submit">הרשמה</Button>
        </Box>
      </form>
      <Box sx={{ mt: 2 }}>
        <MuiLink component={Link} to="/" underline="hover">
          חזרה לדף הבית
        </MuiLink>
      </Box>
    </Container>
  );
};

export default Register;
