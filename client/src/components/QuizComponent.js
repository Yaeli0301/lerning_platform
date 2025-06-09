import React, { useState } from 'react';
import { Box, Typography, RadioGroup, FormControlLabel, Radio, Paper } from '@mui/material';

const QuizComponent = ({ quiz }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const handleChange = (questionIndex, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>שאלות תרגול</Typography>
      {quiz.map((q, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">{index + 1}. {q.question}</Typography>
          <RadioGroup
            value={selectedAnswers[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
          >
            {q.options.map((option, i) => (
              <FormControlLabel
                key={i}
                value={option}
                control={<Radio />}
                label={option}
              />
            ))}
          </RadioGroup>
          {selectedAnswers[index] && selectedAnswers[index] === q.correctAnswer && (
            <Typography color="success.main">תשובה נכונה!</Typography>
          )}
          {selectedAnswers[index] && selectedAnswers[index] !== q.correctAnswer && (
            <Typography color="error.main">תשובה שגויה. התשובה הנכונה היא: {q.correctAnswer}</Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default QuizComponent;
