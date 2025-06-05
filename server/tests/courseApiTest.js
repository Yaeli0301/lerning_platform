const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const baseURL = 'http://localhost:5000/api';
let token = null;
let createdCourseId = null;
let createdLessonId = null;

async function login() {
  try {
    const res = await axios.post(baseURL + '/auth/login', {
      email: 'sorskyt5@gmail.com',
      password: '123456',
      adminCode: 'admin123'
    });
    token = res.data.token;
    console.log('Login successful, token acquired');
  } catch (err) {
    console.error('Login failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

async function uploadImage() {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(path.join(__dirname, 'test-image.jpg')));
    const res = await axios.post(baseURL + '/courses/upload-image', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: 'Bearer ' + token
      }
    });
    console.log('Image upload response:', res.data);
    return res.data.imageUrl;
  } catch (err) {
    console.error('Image upload failed:', err.response ? err.response.data : err.message);
    throw err;
  }
}

async function uploadVideo() {
  try {
    const form = new FormData();
    form.append('video', fs.createReadStream(path.join(__dirname, 'test-video.mp4')));
    const res = await axios.post(baseURL + '/courses/upload-video', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: 'Bearer ' + token
      }
    });
    console.log('Video upload response:', res.data);
    return res.data.videoUrl;
  } catch (err) {
    console.error('Video upload failed:', err.response ? err.response.data : err.message);
    throw err;
  }
}

async function createCourse(imageUrl) {
  try {
    const res = await axios.post(baseURL + '/courses', {
      title: 'Test Course',
      description: 'Test course description',
      category: 'Test Category',
      difficultyLevel: 'Beginner',
      imageUrl,
      lessons: []
    }, {
      headers: { Authorization: 'Bearer ' + token }
    });
    createdCourseId = res.data._id;
    console.log('Course created:', res.data);
  } catch (err) {
    console.error('Create course failed:', err.response ? err.response.data : err.message);
    throw err;
  }
}

async function addLesson(videoUrl) {
  try {
    const lesson = {
      title: 'Test Lesson',
      videoUrl: videoUrl || 'http://localhost:5000/uploads/sample-video.mp4',
      content: 'Test lesson content',
      quizzes: []
    };
    const res = await axios.put(baseURL + '/courses/' + createdCourseId, {
      lessons: [lesson]
    }, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const lessons = res.data.lessons;
    if (lessons && lessons.length > 0) {
      createdLessonId = lessons[0]._id;
    }
    console.log('Lesson added:', res.data);
  } catch (err) {
    console.error('Add lesson failed:', err.response ? err.response.data : err.message);
    throw err;
  }
}

async function getCourse() {
  try {
    const res = await axios.get(baseURL + '/courses/' + createdCourseId);
    console.log('Get course response:', res.data);
  } catch (err) {
    console.error('Get course failed:', err.response ? err.response.data : err.message);
    throw err;
  }
}

async function runTests() {
  try {
    await login();
    const imageUrl = await uploadImage();
    const videoUrl = await uploadVideo();
    await createCourse(imageUrl);
    await addLesson(videoUrl);
    await getCourse();
    console.log('All tests passed successfully');
  } catch (err) {
    console.error('Test suite failed');
  }
}

runTests();
