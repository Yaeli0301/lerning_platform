const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/learning_platform'; // Use same as backend

const seedCoursesAndLessons = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Find or create an instructor user to assign to courses and lessons
    let instructor = await User.findOne({ email: 'instructor@example.com' });
    if (!instructor) {
      instructor = new User({
        name: 'Instructor Name',
        email: 'instructor@example.com',
        password: 'password123', // Make sure to hash password in real app
        role: 'admin', // Added required role field
      });
      await instructor.save();
    }

    // Clear existing courses and lessons
    await Lesson.deleteMany({});
    await Course.deleteMany({});

    // Sample courses data
    const coursesData = [
      {
        title: 'React Basics',
        description: 'Learn the fundamentals of React, including components, state, and props.',
        instructor: instructor._id,
        category: 'Web Development',
        difficultyLevel: 'Beginner',
      },
      {
        title: 'Node.js Fundamentals',
        description: 'Understand the basics of Node.js and build backend applications.',
        instructor: instructor._id,
        category: 'Backend Development',
        difficultyLevel: 'Beginner',
      },
      {
        title: 'Advanced JavaScript',
        description: 'Deep dive into advanced JavaScript concepts and patterns.',
        instructor: instructor._id,
        category: 'Programming',
        difficultyLevel: 'Advanced',
      },
    ];

    // Insert courses and their lessons
    for (const courseData of coursesData) {
      const course = new Course(courseData);
      await course.save();

      // Create sample lessons for each course
      const lessonsData = [
        {
          title: `${course.title} - Lesson 1`,
          content: `Content for ${course.title} lesson 1.`,
          videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
          imageUrl: 'https://via.placeholder.com/600x400.png?text=Lesson+Image+1',
          quiz: [
            {
              question: 'Sample question 1?',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 'Option A',
            },
          ],
          course: course._id,
        },
        {
          title: `${course.title} - Lesson 2`,
          content: `Content for ${course.title} lesson 2.`,
          videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
          imageUrl: 'https://via.placeholder.com/600x400.png?text=Lesson+Image+2',
          quiz: [
            {
              question: 'Sample question 2?',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 'Option B',
            },
          ],
          course: course._id,
        },
      ];

      const lessonIds = [];
      for (const lessonData of lessonsData) {
        const lesson = new Lesson(lessonData);
        await lesson.save();
        lessonIds.push(lesson._id);
      }

      // Update course with lessons
      course.lessons = lessonIds;
      await course.save();

      console.log(`Inserted course: ${course.title} with lessons`);
    }

    console.log('Course and lesson seeding completed.');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding courses and lessons:', err);
    mongoose.disconnect();
  }
};

seedCoursesAndLessons();
