import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
    {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        pinned: { type: Boolean, default: false },
        // mark whether the announcement was created by an admin
        isAdmin: { type: Boolean, default: false },
        // visibility window for announcement
        startAt: { type: Date, required: true },
        endAt: { type: Date, required: true },
    },
    { timestamps: true }
);

// TTL index so documents expire when `endAt` is reached
announcementSchema.index({ endAt: 1 }, { expireAfterSeconds: 0 });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
