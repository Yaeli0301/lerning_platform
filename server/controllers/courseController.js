const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');

// Get distinct categories from courses
exports.getCategories = async (req, res) => {
  try {
    const categories = await Course.distinct('category', { isActive: { $ne: false } });
    return res.json(categories);
  } catch (err) {
    console.error('Error fetching categories', err);
    return res.status(500).json({ message: 'Error fetching categories' });
  }
};

// Helper function for error response
const handleError = (res, err, message = 'שגיאה בשרת', code = 500) => {
  console.error(message, err);
  return res.status(code).json({ message, error: err.message });
};

const mongoose = require('mongoose');

// Get all active courses, optionally filtered by instructor, category, difficultyLevel, search, with pagination
exports.getCourses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.instructor) {
      filter.instructor = req.query.instructor;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.difficultyLevel) {
      filter.difficultyLevel = req.query.difficultyLevel;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const courses = await Course.find(filter)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'lessons',
        select: 'title content videoUrl imageUrl quiz',
      });

    return res.json(courses);
  } catch (err) {
    return handleError(res, err, 'Error fetching courses');
  }
};

// Get course by ID with lessons populated
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: 'lessons',
      select: 'title content videoUrl imageUrl quiz',
    });
    if (!course) return res.status(404).json({ message: 'קורס לא נמצא' });
    return res.json(course);
  } catch (err) {
    return handleError(res, err, 'Error fetching course');
  }
};

// Get enrolled courses for authenticated user
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).populate('enrolledCourses');
    if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

    return res.json(user.enrolledCourses);
  } catch (err) {
    return handleError(res, err, 'Error fetching enrolled courses');
  }
};

// Helper function to validate URLs
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Create a new course with lessons and instructor
exports.createCourse = async (req, res) => {
  try {
    const instructorId = req.user?.id;
    if (!instructorId) return res.status(401).json({ message: 'Unauthorized' });

    const { title, description, category, difficultyLevel, lessons, imageUrl } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Validate imageUrl if provided
    if (imageUrl && imageUrl !== '' && !isValidUrl(imageUrl)) {
      return res.status(400).json({ message: 'Invalid imageUrl format' });
    }

    // Validate lessons array
    if (lessons && Array.isArray(lessons)) {
      for (const lesson of lessons) {
        if (!lesson.title || !lesson.content || !lesson.videoUrl) {
          return res.status(400).json({ message: 'Lesson title, content, and videoUrl are required' });
        }
        if (!isValidUrl(lesson.videoUrl)) {
          return res.status(400).json({ message: `Invalid videoUrl format in lesson: ${lesson.title}` });
        }
        if (lesson.imageUrl && lesson.imageUrl !== '' && !isValidUrl(lesson.imageUrl)) {
          return res.status(400).json({ message: `Invalid imageUrl format in lesson: ${lesson.title}` });
        }
      }
    }

    // Create lessons documents if provided
    let lessonIds = [];
    if (lessons && Array.isArray(lessons)) {
      const createdLessons = await Lesson.insertMany(
        lessons.map(lesson => ({ ...lesson, user: instructorId }))
      );
      lessonIds = createdLessons.map(l => l._id);
    }

    const course = new Course({
      title,
      description,
      category,
      difficultyLevel,
      instructor: instructorId,
      lessons: lessonIds,
      imageUrl: imageUrl || 'https://example.com/default-course-image.jpg',
    });

    await course.save();

    // Emit socket event for new course
    const io = req.app.get('io');
    io.emit('courseCreated', course);

    return res.status(201).json(course);
  } catch (err) {
    return handleError(res, err, 'Error creating course');
  }
};

// Update course details and lessons
exports.updateCourse = async (req, res) => {
  try {
    const instructorId = req.user?.id;
    if (!instructorId) return res.status(401).json({ message: 'Unauthorized' });

    const courseId = req.params.id;
    const { title, description, category, difficultyLevel, lessons, imageUrl } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'קורס לא נמצא' });

    if (course.instructor.toString() !== instructorId) {
      return res.status(403).json({ message: 'גישה נדחתה' });
    }

    // Validate lessons array for required fields
    if (lessons && Array.isArray(lessons)) {
      for (const lesson of lessons) {
        if (!lesson.title || !lesson.content || !lesson.videoUrl) {
          return res.status(400).json({ message: 'Lesson title, content, and videoUrl are required' });
        }
        // Removed quiz validation to allow lessons without quizzes
        // if (!lesson.quiz || !Array.isArray(lesson.quiz) || lesson.quiz.length === 0) {
        //   return res.status(400).json({ message: 'Lesson quiz is required and cannot be empty' });
        // }
      }
    }

    // Update course fields
    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    course.difficultyLevel = difficultyLevel || course.difficultyLevel;
    course.imageUrl = imageUrl || course.imageUrl || 'https://example.com/default-course-image.jpg';

    // Update lessons if provided
    if (lessons && Array.isArray(lessons)) {
      // Delete existing lessons
      if (course.lessons && course.lessons.length > 0) {
        await Lesson.deleteMany({ _id: { $in: course.lessons } });
      }

      // Create new lessons
      const createdLessons = await Lesson.insertMany(
        lessons.map(lesson => ({
          title: lesson.title,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          imageUrl: lesson.imageUrl && lesson.imageUrl !== '' ? lesson.imageUrl : '',
          quiz: lesson.quizzes || lesson.quiz || [],
          course: courseId,
        }))
      );
      course.lessons = createdLessons.map(l => l._id);
    }

    await course.save();

    // Emit socket event for course update
    const io = req.app.get('io');
    io.emit('courseUpdated', course);

    await course.populate({ path: 'lessons', select: 'title content videoUrl imageUrl quiz' });

    return res.json(course);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }
    return handleError(res, err, 'Error updating course');
  }
};

// Soft delete course (deactivate)
exports.deleteCourse = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    console.log('deleteCourse - userId:', userId, 'userRole:', userRole);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    console.log('deleteCourse - course found:', course);
    if (!course) return res.status(404).json({ message: 'קורס לא נמצא' });

    // Allow deletion if user is instructor or admin
    if (course.instructor.toString() !== userId && userRole !== 'admin') {
      console.log('deleteCourse - access denied');
      return res.status(403).json({ message: 'גישה נדחתה' });
    }

    course.isActive = false;
    await course.save();

    // Remove course from enrolledCourses array of all users
    await User.updateMany(
      { enrolledCourses: courseId },
      { $pull: { enrolledCourses: courseId } }
    );

    const io = req.app.get('io');
    io.emit('courseDeleted', { courseId });

    console.log('deleteCourse - course deactivated successfully');
    return res.json({ message: 'הקורס סומן כלא פעיל בהצלחה' });
  } catch (err) {
    console.error('deleteCourse - error:', err);
    return handleError(res, err, 'Error deleting course');
  }
};

// Enroll user in course
exports.enrollCourse = async (req, res) => {
  try {
    const userId = req.user?.id;
    const courseId = req.params.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

    if (!user.enrolledCourses) {
      user.enrolledCourses = [];
    }

    if (user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: 'כבר רשום לקורס' });
    }

    user.enrolledCourses.push(courseId);
    await user.save();

    return res.json({ message: 'הרשמה לקורס בוצעה בהצלחה' });
  } catch (err) {
    return handleError(res, err, 'Error enrolling in course');
  }
};

// Get enrollment status for authenticated user
exports.getEnrollmentStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const courseId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

    const isEnrolled = user.enrolledCourses && user.enrolledCourses.includes(courseId);

    return res.json({ enrolled: !!isEnrolled });
  } catch (err) {
    return handleError(res, err, 'Error checking enrollment status');
  }
};
