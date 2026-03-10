import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getAnnouncements, createAnnouncement } from '../controllers/announcement.controllers.js';

const router = express.Router();

router.get('/', protectRoute, getAnnouncements);
router.post('/', protectRoute, createAnnouncement);

export default router;
