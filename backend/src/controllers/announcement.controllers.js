import Announcement from '../models/announcement.model.js';
import { io } from '../lib/socket.js';

export const getAnnouncements = async (req, res) => {
    try {
        const now = new Date();
        // return only announcements active right now
        const announcements = await Announcement.find({ startAt: { $lte: now }, endAt: { $gte: now } }).sort({ createdAt: -1 }).limit(50);
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

        const { text, pinned, startAt, endAt } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ message: 'Text is required' });
        if (!startAt || !endAt) return res.status(400).json({ message: 'startAt and endAt are required' });

        const s = new Date(startAt);
        const e = new Date(endAt);
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return res.status(400).json({ message: 'Invalid dates' });
        if (s >= e) return res.status(400).json({ message: 'endAt must be after startAt' });

        const announcement = await Announcement.create({
            senderId: req.user._id,
            text: text.trim(),
            pinned: !!pinned,
            isAdmin: true,
            startAt: s,
            endAt: e,
        });

        // broadcast to all connected clients
        io.emit('announcement', announcement);

        res.status(201).json({ announcement });
    } catch (error) {
        console.log('Error in createAnnouncement', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateAnnouncement = async (req, res) => {
    try {
        if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { text, pinned, startAt, endAt } = req.body;

        const update = {};
        if (text && text.trim()) update.text = text.trim();
        if (typeof pinned !== 'undefined') update.pinned = !!pinned;
        if (startAt) update.startAt = new Date(startAt);
        if (endAt) update.endAt = new Date(endAt);

        if (update.startAt && update.endAt && update.startAt >= update.endAt) return res.status(400).json({ message: 'endAt must be after startAt' });

        const announcement = await Announcement.findByIdAndUpdate(id, update, { new: true });
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

        io.emit('announcement:update', announcement);
        res.status(200).json({ announcement });
    } catch (error) {
        console.log('Error in updateAnnouncement', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;
        const announcement = await Announcement.findByIdAndDelete(id);
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

        io.emit('announcement:delete', { id });
        res.status(200).json({ message: 'Deleted' });
    } catch (error) {
        console.log('Error in deleteAnnouncement', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllAnnouncements = async (req, res) => {
    try {
        if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).json({ announcements });
    } catch (error) {
        console.log('Error in getAllAnnouncements', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
