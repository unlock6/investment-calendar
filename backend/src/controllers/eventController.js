import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/events
 * 모든 이벤트 조회
 */
export const getAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        datetime: 'asc'
      }
    });
    res.json(events);
  } catch (error) {
    console.error('이벤트 조회 에러:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

/**
 * GET /api/user-events
 * 사용자의 이벤트 조회
 */
export const getUserEvents = async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 1;
    
    const userEvents = await prisma.userEvent.findMany({
      where: {
        user_id: userId
      },
      include: {
        event: true
      }
    });
    
    res.json(userEvents);
  } catch (error) {
    console.error('사용자 이벤트 조회 에러:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
};

/**
 * POST /api/user-events
 * 사용자 이벤트 추가
 */
export const addUserEvent = async (req, res) => {
  try {
    const { user_id = 1, event_id, notify_time } = req.body;

    // 입력 검증
    if (!event_id || isNaN(parseInt(event_id))) {
      return res.status(400).json({ error: 'event_id는 필수 숫자 값입니다.' });
    }

    // 중복 체크
    const existing = await prisma.userEvent.findFirst({
      where: { user_id: parseInt(user_id), event_id: parseInt(event_id) }
    });
    if (existing) {
      return res.status(409).json({ error: '이미 추가된 이벤트입니다.' });
    }

    const userEvent = await prisma.userEvent.create({
      data: {
        user_id: parseInt(user_id),
        event_id: parseInt(event_id),
        notify_time: notify_time ? new Date(notify_time) : null
      },
      include: {
        event: true
      }
    });
    
    res.json(userEvent);
  } catch (error) {
    console.error('사용자 이벤트 추가 에러:', error);
    res.status(500).json({ error: 'Failed to add user event' });
  }
};

/**
 * DELETE /api/user-events/:id
 * 사용자 이벤트 삭제
 */
export const deleteUserEvent = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    await prisma.userEvent.delete({
      where: { id }
    });
    
    res.json({ message: 'User event deleted successfully' });
  } catch (error) {
    console.error('사용자 이벤트 삭제 에러:', error);
    res.status(500).json({ error: 'Failed to delete user event' });
  }
};

/**
 * GET /api/events/range
 * 날짜 범위로 이벤트 조회
 */
export const getEventsByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ 
        error: 'start and end dates are required' 
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const events = await prisma.event.findMany({
      where: {
        datetime: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        datetime: 'asc'
      }
    });

    res.json(events);
  } catch (error) {
    console.error('이벤트 조회 에러:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

/**
 * GET /api/events/upcoming
 * 오늘/내일 이벤트 조회
 */
export const getUpcomingEvents = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 1;
    
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endDate = new Date(startOfToday);
    endDate.setDate(endDate.getDate() + days);

    const events = await prisma.event.findMany({
      where: {
        datetime: {
          gte: startOfToday,
          lt: endDate
        }
      },
      orderBy: [
        { impact_level: 'desc' },
        { datetime: 'asc' }
      ]
    });

    res.json(events);
  } catch (error) {
    console.error('다가오는 이벤트 조회 에러:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
  
};
/**
 * PATCH /api/user-events/:id/complete
 */
export const toggleComplete = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { completed } = req.body;

    const userEvent = await prisma.userEvent.update({
      where: { id },
      data: {
        completed: completed,
        completed_at: completed ? new Date() : null
      }
    });

    res.json(userEvent);
  } catch (error) {
    console.error('완료 토글 에러:', error);
    res.status(500).json({ error: 'Failed to toggle complete' });
  }
};

/**
 * PATCH /api/user-events/:id/note
 */
export const updateNote = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { note } = req.body;

    const userEvent = await prisma.userEvent.update({
      where: { id },
      data: { note }
    });

    res.json(userEvent);
  } catch (error) {
    console.error('메모 저장 에러:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
};
