import React, { useState } from 'react';
import { Box, Typography, RadioGroup, FormControlLabel, Radio, Button, List, ListItem, ListItemText } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const Quiz = ({ questions, onComplete }) => {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleChange = (questionIndex, answerIndex) => {
    if (showResults) return; // prevent changes after showing results
    setAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        score += 1;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    setShowResults(true);
    const score = calculateScore();
    if (onComplete) {
      onComplete(score);
    }
  };

  return (
    <Box>
      <List>
        {questions.map((q, idx) => (
          <ListItem key={idx} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="h6">{idx + 1}. {q.question}</Typography>
            <RadioGroup
              value={answers[idx] !== undefined ? answers[idx].toString() : ''}
              onChange={(e) => handleChange(idx, parseInt(e.target.value))}
            >
              {q.options.map((option, i) => {
                const isSelected = answers[idx] === i;
                const isCorrect = q.correctAnswer === i;
                let icon = null;
                if (showResults && isSelected) {
                  icon = isCorrect ? <CheckIcon color="success" sx={{ ml: 1 }} /> : <CloseIcon color="error" sx={{ ml: 1 }} />;
                }
                return (
                  <FormControlLabel
                    key={i}
                    value={i.toString()}
                    control={<Radio disabled={showResults} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option}
                        {icon}
                      </Box>
                    }
                  />
                );
              })}
            </RadioGroup>
          </ListItem>
        ))}
      </List>
      {!showResults && (
        <Button variant="contained" onClick={handleSubmit} disabled={Object.keys(answers).length !== questions.length}>
          סיים
        </Button>
      )}
      {showResults && (
        <Typography variant="h6" sx={{ mt: 2 }}>
          הציון שלך: {calculateScore()} מתוך {questions.length}
        </Typography>
      )}
    </Box>
  );
};

export default Quiz;
