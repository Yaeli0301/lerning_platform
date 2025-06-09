import React, { useState, useContext } from 'react';
import { Container, Typography, TextField, Button, Box, Link as MuiLink } from '@mui/material';
import Joi from 'joi';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const schema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().label('אימייל'),
  password: Joi.string().required().label('סיסמה'),
  adminCode: Joi.string().allow('').label('קוד מנהל'),
});

const Login = () => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminCode: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  const validate = () => {
    const { error } = schema.validate(formData, { abortEarly: false });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs) return;

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      alert(res.data.message);
      login(res.data.user, res.data.token); // Pass both user and token to login
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/courses');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'שגיאה בשרת');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>התחברות</Typography>
      <form onSubmit={handleSubmit} noValidate>
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
          fullWidth
          label="קוד מנהל סודי (אם מנהל)"
          name="adminCode"
          value={formData.adminCode}
          onChange={handleChange}
          error={!!errors.adminCode}
          helperText={errors.adminCode}
          margin="normal"
        />
        {serverError && <Typography color="error" sx={{ mt: 1 }}>{serverError}</Typography>}
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" color="primary" type="submit">התחבר</Button>
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

export default Login;
