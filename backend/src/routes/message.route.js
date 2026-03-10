import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getUsersForSidebar, getMessages, sendMessage, editMessage, deleteMessage, markAsRead, addReaction, searchMessages } from '../controllers/message.controllers.js';

const router = express.Router();

router.get('/users', protectRoute, getUsersForSidebar);
router.get('/:id', protectRoute, getMessages);
router.get('/search', protectRoute, searchMessages);

router.post('/send/:id', protectRoute, sendMessage);
router.put('/edit/:messageId', protectRoute, editMessage);
router.delete('/:messageId', protectRoute, deleteMessage);
router.post('/:id/read', protectRoute, markAsRead);
router.post('/:id/reaction', protectRoute, addReaction);

export default router;