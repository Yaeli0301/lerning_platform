import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Button,
  Paper,
  LinearProgress,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import {
  getCourseById,
  getEnrollmentStatus,
  saveLessonProgress,
  getCommentsByCourseId,
  addComment,
  updateComment,
  deleteComment,
  blockComment,
  unblockComment,
  uploadCourseImage,
  submitLessonRequest,
  enrollCourse,
} from '../api';
import Quiz from '../components/Quiz';

const CourseDetail = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lessonRequest, setLessonRequest] = useState({
    title: '',
    content: '',
    videoUrl: '',
    imageUrl: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [commentRating, setCommentRating] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [editingCommentRating, setEditingCommentRating] = useState(0);
  const [blockedComments, setBlockedComments] = useState(new Set());
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState({});
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    fetchCourse();
    if (user) {
      checkEnrollment();
    }
  }, [id, user]);

  useEffect(() => {
    if (selectedLesson && enrolled) {
      saveProgress(selectedLesson._id);
      fetchComments();
    }
  }, [selectedLesson, enrolled]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const res = await getCourseById(id);
      setCourse(res.data);
      if (res.data.lessons && res.data.lessons.length > 0) {
        setSelectedLesson(res.data.lessons[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const res = await getEnrollmentStatus(id);
      setEnrolled(res.data.enrolled);
      if (res.data.progress) {
        setProgress(res.data.progress);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveProgress = async (lessonId) => {
    setSavingProgress(true);
    try {
      await saveLessonProgress(id, lessonId, {});
      setProgress(prev => ({ ...prev, [lessonId]: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProgress(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await getCommentsByCourseId(id);
      setComments(res.data);
      const blockedSet = new Set(res.data.filter(c => c.blocked).map(c => c._id));
      setBlockedComments(blockedSet);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    try {
      await addComment(null, {
        courseId: id,
        content: comment,
        rating: commentRating,
        userId: user?.id,
      });
      setComment('');
      setCommentRating(0);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentContent(comment.content);
    setEditingCommentRating(comment.rating || 0);
  };

  const handleSaveEditedComment = async (commentId) => {
    try {
      await updateComment(commentId, {
        content: editingCommentContent,
        rating: editingCommentRating,
      });
      setEditingCommentId(null);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockComment = async (commentId) => {
    try {
      await blockComment(commentId);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblockComment = async (commentId) => {
    try {
      await unblockComment(commentId);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLessonRequestChange = (e) => {
    setLessonRequest({ ...lessonRequest, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    try {
      const res = await uploadCourseImage(formData);
      const imageUrl = res.data.imageUrl;
      setSelectedLesson(prev => ({ ...prev, imageUrl }));
      const updatedLessons = course.lessons.map(lesson =>
        lesson._id === selectedLesson._id ? { ...lesson, imageUrl } : lesson
      );
      await updateCourse(id, { ...course, lessons: updatedLessons });
      fetchCourse();
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLessonRequestSubmit = async () => {
    const { title, content, videoUrl } = lessonRequest;
    if (!title || !content || !videoUrl) {
      setRequestError('אנא מלא את כל השדות הנדרשים (כותרת, תוכן, וידאו)');
      return;
    }
    try {
      await submitLessonRequest({
        courseId: id,
        userId: user?.id,
        ...lessonRequest,
      });
      setRequestSuccess('בקשת העלאת השיעור נשלחה בהצלחה, המנהל יאשר אותה בקרוב.');
      setRequestError('');
      setLessonRequest({ title: '', content: '', videoUrl: '', imageUrl: '' });
    } catch (err) {
      setRequestError('שגיאה בשליחת בקשת השיעור');
      setRequestSuccess('');
    }
  };

  const handleEnroll = async () => {
    try {
      await enrollCourse(id);
      setEnrolled(true);
      checkEnrollment();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !course) return <Container>טוען...</Container>;

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>{course.title}</Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ color: '#555' }}>{course.description}</Typography>
      <Typography variant="body2" gutterBottom sx={{ color: '#777' }}>מרצה: {course.instructor?.name || 'לא זמין'}</Typography>
      {!enrolled && user && (
        <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleEnroll}>
          הרשמה לקורס
        </Button>
      )}
      <Box sx={{ display: 'flex', mt: 4, gap: 3 }}>
        <Paper elevation={3} sx={{ width: '25%', p: 2, bgcolor: '#e3f2fd', borderRadius: 2, maxHeight: '70vh', overflowY: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#0d47a1' }}>שיעורים</Typography>
          <List>
            {course.lessons.map(lesson => (
              <ListItem
                button
                key={lesson._id}
                onClick={() => handleLessonSelect(lesson)}
                selected={selectedLesson?._id === lesson._id}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: selectedLesson?._id === lesson._id ? '#1565c0' : 'transparent',
                  color: selectedLesson?._id === lesson._id ? '#fff' : '#0d47a1',
                  '&:hover': {
                    bgcolor: '#1976d2',
                    color: '#fff',
                  },
                }}
              >
                <ListItemText primary={lesson.title} />
                {enrolled && progress[lesson._id] && (
                  <LinearProgress variant="determinate" value={100} sx={{ width: 50, ml: 1, borderRadius: 1 }} />
                )}
              </ListItem>
            ))}
          </List>
          {savingProgress && <Typography variant="caption" color="textSecondary">שומר התקדמות...</Typography>}
        </Paper>
        <Box sx={{ flexGrow: 1 }}>
          {selectedLesson && (
            <>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>{selectedLesson.title}</Typography>
              <Box sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
                <video width="100%" height="360" controls src={selectedLesson.videoUrl} style={{ borderRadius: '8px' }} />
              </Box>
              {selectedLesson.imageUrl && (
                <Box component="img" src={selectedLesson.imageUrl} alt="המחשה לשיעור" sx={{ width: '100%', mt: 2, borderRadius: 2, boxShadow: 2 }} />
              )}
              <Typography variant="body1" sx={{ mt: 2, color: '#333', lineHeight: 1.6 }}>{selectedLesson.content}</Typography>
              <Box sx={{ mt: 3 }}>
                <Quiz quiz={selectedLesson.quiz} />
              </Box>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d47a1', mb: 2 }}>תגובות על הקורס</Typography>
              <Paper elevation={2} sx={{ maxHeight: 200, overflowY: 'auto', p: 2, mb: 2, bgcolor: '#f1f8e9' }}>
                <List>
                  {comments.map(c => {
                    if (blockedComments.has(c._id)) {
                      return (
                        <ListItem key={c._id} sx={{ bgcolor: '#ffcdd2', mb: 1, borderRadius: 1 }}>
                          <ListItemText primary="תגובה חסומה" />
                          {user?.role === 'admin' && (
                            <Button size="small" color="primary" onClick={() => handleUnblockComment(c._id)}>בטל חסימה</Button>
                          )}
                        </ListItem>
                      );
                    }
                    const isEditing = editingCommentId === c._id;
                    return (
                      <ListItem key={c._id} sx={{ bgcolor: '#dcedc8', mb: 1, borderRadius: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          {isEditing ? (
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              value={editingCommentContent}
                              onChange={(e) => setEditingCommentContent(e.target.value)}
                            />
                          ) : (
                            <ListItemText primary={c.content} secondary={c.user?.name || 'משתמש'} />
                          )}
                          <Box>
                            {isEditing ? (
                              <>
                                <Button size="small" color="primary" onClick={() => handleSaveEditedComment(c._id)}>שמור</Button>
                                <Button size="small" color="error" onClick={() => setEditingCommentId(null)}>בטל</Button>
                              </>
                            ) : (
                              <>
                                {user?.id === c.user?._id && (
                                  <>
                                    <Button size="small" color="primary" onClick={() => startEditingComment(c)}>ערוך</Button>
                                    <Button size="small" color="error" onClick={() => handleDeleteComment(c._id)}>מחק</Button>
                                  </>
                                )}
                                {user?.role === 'admin' && (
                                  <Button size="small" color="error" onClick={() => handleBlockComment(c._id)}>חסום</Button>
                                )}
                              </>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          {isEditing ? (
                            <TextField
                              type="number"
                              label="דירוג"
                              value={editingCommentRating}
                              onChange={(e) => setEditingCommentRating(Number(e.target.value))}
                              inputProps={{ min: 0, max: 5 }}
                              size="small"
                            />
                          ) : (
                            <Typography>דירוג: {c.rating || 0}</Typography>
                          )}
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
              <TextField
                label="הוסף תגובה"
                multiline
                rows={3}
                fullWidth
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                sx={{ mb: 1 }}
                disabled={!user}
              />
              <TextField
                type="number"
                label="דירוג"
                value={commentRating}
                onChange={(e) => setCommentRating(Number(e.target.value))}
                inputProps={{ min: 0, max: 5 }}
                size="small"
                sx={{ mb: 1 }}
                disabled={!user}
              />
              <Button variant="contained" sx={{ backgroundColor: '#388e3c', '&:hover': { backgroundColor: '#2e7d32' } }} onClick={handleCommentSubmit} disabled={!user}>שלח תגובה</Button>
            </>
          )}
          {user && user.role !== 'admin' && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d47a1', mb: 2 }}>בקשת העלאת שיעור חדש</Typography>
              <TextField
                label="כותרת השיעור"
                name="title"
                fullWidth
                value={lessonRequest.title}
                onChange={handleLessonRequestChange}
                sx={{ mb: 1 }}
              />
              <TextField
                label="תוכן השיעור"
                name="content"
                fullWidth
                multiline
                rows={4}
                value={lessonRequest.content}
                onChange={handleLessonRequestChange}
                sx={{ mb: 1 }}
              />
              <TextField
                label="קישור לוידאו"
                name="videoUrl"
                fullWidth
                value={lessonRequest.videoUrl}
                onChange={handleLessonRequestChange}
                sx={{ mb: 1 }}
              />
              <TextField
                label="קישור לתמונה (אופציונלי)"
                name="imageUrl"
                fullWidth
                value={lessonRequest.imageUrl}
                onChange={handleLessonRequestChange}
                sx={{ mb: 1 }}
              />
              {requestError && <Typography color="error" sx={{ mb: 1 }}>{requestError}</Typography>}
              {requestSuccess && <Typography color="success.main" sx={{ mb: 1 }}>{requestSuccess}</Typography>}
              <Button variant="contained" onClick={handleLessonRequestSubmit}>שלח בקשה</Button>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default CourseDetail;
