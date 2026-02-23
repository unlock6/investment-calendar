import express from 'express';
import {
  getAllEvents,
  getUserEvents,
  addUserEvent,
  deleteUserEvent,
  getEventsByDateRange,
  getUpcomingEvents,
  toggleComplete,  // 🆕
  updateNote       // 🆕
} from '../controllers/eventController.js';

const router = express.Router();

// 기존 라우트
router.get('/events', getAllEvents);
router.get('/user-events', getUserEvents);
router.post('/user-events', addUserEvent);
router.delete('/user-events/:id', deleteUserEvent);

// 🆕 새 라우트
router.get('/events/range', getEventsByDateRange);
router.get('/events/upcoming', getUpcomingEvents);
router.patch('/user-events/:id/complete', toggleComplete);
router.patch('/user-events/:id/note', updateNote);

// 프론트엔드 통합 PATCH 엔드포인트 (완료 토글 + 메모 저장)
router.patch('/user-events/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { completed, note } = req.body;

  try {
    const data = {};
    if (completed !== undefined) {
      data.completed = completed;
      data.completed_at = completed ? new Date() : null;
    }
    if (note !== undefined) {
      data.note = note;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const userEvent = await prisma.userEvent.update({
      where: { id },
      data,
      include: { event: true }
    });

    res.json(userEvent);
  } catch (error) {
    console.error('사용자 이벤트 업데이트 에러:', error);
    res.status(500).json({ error: 'Failed to update user event' });
  }
});

export default router;