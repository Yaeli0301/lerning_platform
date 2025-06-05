const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson'); // Added import for Lesson model
require('dotenv').config();

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

async function cleanupInvalidMediaUrls() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/learning_platform', {
      // Removed deprecated options
    });
    console.log('Connected to MongoDB');

    const courses = await Course.find().populate('lessons');
    let updatedCount = 0;

    for (const course of courses) {
      let courseUpdated = false;

      // Validate course imageUrl
      if (course.imageUrl && !isValidUrl(course.imageUrl)) {
        console.log(`Invalid course imageUrl for course ${course._id}: ${course.imageUrl}`);
        course.imageUrl = 'https://example.com/default-course-image.jpg';
        courseUpdated = true;
      }

      // Validate lessons media URLs
      for (const lesson of course.lessons) {
        let lessonUpdated = false;

        if (lesson.videoUrl && !isValidUrl(lesson.videoUrl)) {
          console.log(`Invalid videoUrl for lesson ${lesson._id} in course ${course._id}: ${lesson.videoUrl}`);
          lesson.videoUrl = '';
          lessonUpdated = true;
        }
        if (lesson.imageUrl && lesson.imageUrl !== '' && !isValidUrl(lesson.imageUrl)) {
          console.log(`Invalid imageUrl for lesson ${lesson._id} in course ${course._id}: ${lesson.imageUrl}`);
          lesson.imageUrl = '';
          lessonUpdated = true;
        }
        if (lessonUpdated) {
          await lesson.save();
        }
      }

      if (courseUpdated) {
        await course.save();
        updatedCount++;
      }
    }

    console.log(`Cleanup complete. Updated ${updatedCount} courses.`);
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
}

cleanupInvalidMediaUrls();
