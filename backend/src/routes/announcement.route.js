import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, getAllAnnouncements } from '../controllers/announcement.controllers.js';

const router = express.Router();

router.get('/', protectRoute, getAnnouncements);
router.post('/', protectRoute, createAnnouncement);
router.get('/all', protectRoute, getAllAnnouncements);
router.put('/:id', protectRoute, updateAnnouncement);
router.delete('/:id', protectRoute, deleteAnnouncement);

export default router;
