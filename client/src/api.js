import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Updated base URL to backend server
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const uploadProfilePictureAuth = (formData) =>
  api.post('/auth/upload-profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// User API
export const updateUserProfile = (id, data) => api.put(`/users/${id}`, data);
export const uploadProfilePictureUser = (id, formData) =>
  api.post(`/users/${id}/profile-picture`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Courses API
export const getCourses = (params) => api.get('/courses', { params });
export const getCategories = () => api.get('/courses/categories');
export const getCourseById = (id) => api.get(`/courses/${id}`);
export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.put(`/courses/${id}/deactivate`);
export const getEnrollmentStatus = (id) => api.get(`/courses/${id}/enrollment-status`);
export const enrollCourse = (id) => api.post(`/courses/${id}/enroll`);
export const saveLessonProgress = (courseId, lessonId, data) =>
  api.post(`/courses/${courseId}/lessons/${lessonId}/progress`, data);
export const uploadCourseImage = (formData) =>
  api.post('/courses/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const uploadCourseVideo = (formData) =>
  api.post('/courses/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Forum API
export const getDiscussions = (params) => api.get('/forum/discussions', { params });
export const getDiscussionById = (id) => api.get(`/forum/discussions/${id}`);
export const getCommentsByCourseId = (courseId) => api.get(`/forum/comments?courseId=${courseId}`);
// Note: Backend does not support get comments by discussionId endpoint as /forum/comments?discussionId=...
// The correct endpoint to get comments by discussionId is not implemented in backend routes.
// So, for now, comments should be fetched by courseId or discussionId via discussions API.
export const getLessonsByCourseId = (courseId) => api.get(`/forum/lessons/${courseId}`);
export const createDiscussion = (data) => api.post('/forum/discussions', data);
export const addComment = (discussionId, data) =>
  api.post(`/forum/comments/${discussionId}`, data);

// Removed addCommentToCourse as it is not supported by backend
// export const addCommentToCourse = (courseId, data) =>
//   api.post(`/forum/courses/${courseId}/comments`, data);
export const deleteComment = (id) => api.delete(`/forum/comments/${id}`);

// Update comment
export const updateComment = (id, data) => api.put(`/forum/comments/${id}`, data);

// Block/unblock comment
export const blockComment = (id) => api.post(`/forum/comments/${id}/block`);
export const unblockComment = (id) => api.post(`/forum/comments/${id}/unblock`);

// Lesson requests
export const submitLessonRequest = (data) => api.post('/lessons/requests', data);

// User-specific forum discussions
export const getUserDiscussions = (userId) => api.get(`/forum/discussions?user=${userId}`);

// User enrolled courses
export const getUserEnrolledCourses = () => api.get('/courses/enrolled');

// Admin API
export const getUsers = () => api.get('/users');
export const blockUser = (id) => api.put(`/admin/users/${id}/block`);
export const blockDiscussion = (id) => api.put(`/admin/discussions/${id}/block`);

export default api;
