import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import ForumIcon from '@mui/icons-material/Forum';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Logo from './Logo';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    handleMenuClose();
    setDrawerOpen(false);
    navigate('/');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const menuItems = [
    { text: 'דף הבית', icon: <HomeIcon />, link: '/' },
    { text: 'קורסים', icon: <SchoolIcon />, link: '/courses' },
    { text: 'פורום', icon: <ForumIcon />, link: '/discussions' },
  ];

  if (user && user.role === 'admin') {
    menuItems.push({ text: 'לוח בקרת מנהל', icon: <AdminPanelSettingsIcon />, link: '/admin' });
  }

  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between' }}>
        <Logo />
        <IconButton onClick={toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {menuItems.map(({ text, icon, link }) => (
          <ListItem button component={Link} to={link} key={text}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      {user ? (
        <>
          <ListItem button component={Link} to="/profile">
            <ListItemIcon>
              <Avatar alt={user.name} src={user.profilePicture || ''}>
                {user.name ? user.name.charAt(0) : 'מ'}
              </Avatar>
            </ListItemIcon>
            <ListItemText primary="פרופיל" />
          </ListItem>
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LoginIcon />
            </ListItemIcon>
            <ListItemText primary="התנתקות" />
          </ListItem>
        </>
      ) : (
        <>
          <ListItem button component={Link} to="/login">
            <ListItemIcon>
              <LoginIcon />
            </ListItemIcon>
            <ListItemText primary="התחברות" />
          </ListItem>
          <ListItem button component={Link} to="/register">
            <ListItemIcon>
              <PersonAddIcon />
            </ListItemIcon>
            <ListItemText primary="הרשמה" />
          </ListItem>
        </>
      )}
    </Box>
  );

  return (
    <AppBar position="static" sx={{ bgcolor: '#1565c0', animation: 'fadeIn 1s ease-in-out', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1 }}>
          <Logo />
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold', userSelect: 'none', letterSpacing: '0.05em' }}
          >
            פלטפורמת למידה
          </Typography>
        </Box>
        {isMobile ? (
          <>
            <IconButton color="inherit" edge="end" onClick={toggleDrawer(true)} aria-label="open menu">
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={toggleDrawer(false)}
              ModalProps={{ keepMounted: true }}
              PaperProps={{ sx: { width: 280, borderRadius: '0 0 0 12px' } }}
            >
              {drawerContent}
            </Drawer>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {menuItems.map(({ text, icon, link }) => (
              <Button
                key={text}
                color="inherit"
                component={Link}
                to={link}
                startIcon={icon}
                sx={{ textTransform: 'none', fontWeight: '600', fontSize: '1rem' }}
              >
                {text}
              </Button>
            ))}
            {user ? (
              <>
                <IconButton onClick={handleMenuOpen} sx={{ p: 0 }} aria-label="user menu">
                  <Avatar alt={user.name} src={user.profilePicture || ''} sx={{ width: 36, height: 36, fontSize: '1rem' }}>
                    {user.name ? user.name.charAt(0) : 'מ'}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 140,
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
                    פרופיל
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>התנתקות</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                  startIcon={<LoginIcon />}
                  sx={{ textTransform: 'none', fontWeight: '600', fontSize: '1rem' }}
                >
                  התחברות
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/register"
                  startIcon={<PersonAddIcon />}
                  sx={{ textTransform: 'none', fontWeight: '600', fontSize: '1rem' }}
                >
                  הרשמה
                </Button>
              </>
            )}
          </Box>
        )}
      </Toolbar>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </AppBar>
  );
};

export default Navbar;
