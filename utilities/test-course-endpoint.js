// Test script to verify course sessions endpoint
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001; // Use different port to avoid conflicts

app.use(cors());
app.use(express.json());

const mockCourseSessions = [
  {
    id: '1',
    courseId: 'course-1',
    course: { name: 'Emergency First Aid at Work', type: 'EFAW' },
    startDate: '2025-02-15T00:00:00.000Z',
    startTime: '09:00',
    endTime: '17:00',
    maxParticipants: 12,
    currentParticipants: 8,
    pricePerPerson: 75,
    status: 'SCHEDULED'
  }
];

app.get('/course-sessions/available', (req, res) => {
  console.log('✅ Course sessions endpoint hit');
  res.json(mockCourseSessions);
});

app.get('/test', (req, res) => {
  console.log('✅ Test endpoint hit');
  res.json({ message: 'Server is working' });
});

app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
});