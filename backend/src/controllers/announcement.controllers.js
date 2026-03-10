import Announcement from '../models/announcement.model.js';
import { io } from '../lib/socket.js';

export const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(50);
        const isAdmin = req.user && req.user.email === process.env.ADMIN_EMAIL;
        res.status(200).json({ announcements, isAdmin });
    } catch (error) {
        console.log('Error in getAnnouncements', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createAnnouncement = async (req, res) => {
    try {
        // only admin can create announcements
        if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { text, pinned } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ message: 'Text is required' });

        const announcement = await Announcement.create({
            senderId: req.user._id,
            text: text.trim(),
            pinned: !!pinned,
            isAdmin: true,
        });

        // broadcast to all connected clients
        io.emit('announcement', announcement);

        res.status(201).json({ announcement });
    } catch (error) {
        console.log('Error in createAnnouncement', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
