import React from 'react';
import { List, ListItem, ListItemText, Typography, Paper } from '@mui/material';

const SearchResults = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <Typography variant="body1" sx={{ mt: 2 }}>
        לא נמצאו תוצאות חיפוש.
      </Typography>
    );
  }

  return (
    <Paper sx={{ maxHeight: 300, overflowY: 'auto', mt: 2 }}>
      <List>
        {results.map(course => (
          <ListItem key={course._id} divider>
            <ListItemText
              primary={course.title}
              secondary={course.description || ''}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default SearchResults;
