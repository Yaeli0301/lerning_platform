import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Paper,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

const QuizEditor = ({ quiz, onChange }) => {
  const [questions, setQuestions] = useState(quiz?.questions || []);

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
    onChange({ questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setQuestions(updatedQuestions);
    onChange({ questions: updatedQuestions });
  };

  const handleAddQuestion = () => {
    const newQuestion = { questionText: '', options: ['', ''], correctAnswerIndex: 0 };
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    onChange({ questions: updatedQuestions });
  };

  const handleRemoveQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
    onChange({ questions: updatedQuestions });
  };

  const handleAddOption = (qIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options.push('');
    setQuestions(updatedQuestions);
    onChange({ questions: updatedQuestions });
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[qIndex].options.length <= 2) return; // Minimum 2 options
    updatedQuestions[qIndex].options.splice(oIndex, 1);
    // Adjust correctAnswerIndex if needed
    if (updatedQuestions[qIndex].correctAnswerIndex >= updatedQuestions[qIndex].options.length) {
      updatedQuestions[qIndex].correctAnswerIndex = 0;
    }
    setQuestions(updatedQuestions);
    onChange({ questions: updatedQuestions });
  };

  const handleCorrectAnswerChange = (qIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].correctAnswerIndex = parseInt(value, 10);
    setQuestions(updatedQuestions);
    onChange({ questions: updatedQuestions });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Quiz Editor</Typography>
      {questions.map((q, qIndex) => (
        <Paper key={qIndex} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">Question {qIndex + 1}</Typography>
            <IconButton color="error" onClick={() => handleRemoveQuestion(qIndex)} aria-label="Remove question">
              <RemoveCircleOutlineIcon />
            </IconButton>
          </Box>
          <TextField
            label="Question Text"
            value={q.questionText}
            onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControl component="fieldset">
            <FormLabel component="legend">Options</FormLabel>
            {q.options.map((option, oIndex) => (
              <Box key={oIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Radio
                  checked={q.correctAnswerIndex === oIndex}
                  onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                  value={oIndex}
                  name={`correct-answer-${qIndex}`}
                  inputProps={{ 'aria-label': `Option ${oIndex + 1}` }}
                />
                <TextField
                  value={option}
                  onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <IconButton
                  color="error"
                  onClick={() => handleRemoveOption(qIndex, oIndex)}
                  disabled={q.options.length <= 2}
                  aria-label="Remove option"
                >
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => handleAddOption(qIndex)}
              sx={{ mt: 1 }}
            >
              Add Option
            </Button>
          </FormControl>
        </Paper>
      ))}
      <Button variant="contained" onClick={handleAddQuestion}>Add Question</Button>
    </Box>
  );
};

export default QuizEditor;
