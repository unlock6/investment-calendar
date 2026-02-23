import express from 'express';
import { chat } from '../controllers/aiController.js';

const router = express.Router();

// AI 챗봇
router.post('/chat', chat);

export default router;