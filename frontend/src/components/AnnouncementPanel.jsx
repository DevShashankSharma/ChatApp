import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const AnnouncementPanel = () => {
    const { announcements, fetchAnnouncements, postAnnouncement, isAdmin, socket, typingAllUser } = useAuthStore();
    const [text, setText] = useState("");
    const typingTimeout = useRef(null);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const emitStartTyping = () => {
        try {
            if (socket && socket.connected) socket.emit('typingAll');
        } catch (_)
        {
            // ignore
        }
    }

    const emitStopTyping = () => {
        try {
            if (socket && socket.connected) socket.emit('stopTypingAll');
        } catch (_)
        {
            // ignore
        }
    }

    const handleChange = (e) => {
        setText(e.target.value);
        // only admin emits typing events
        if (!isAdmin) return;
        emitStartTyping();
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            emitStopTyping();
        }, 1200);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        try {
            await postAnnouncement({ text });
            setText("");
            toast.success('Announcement posted');
            emitStopTyping();
        } catch (_) {
            toast.error('Failed to post announcement');
        }
    }

    return (
        <div className="p-3 border-b border-base-300">
            <div className="font-semibold mb-2">Announcements</div>

            {isAdmin && (
                <form onSubmit={handleSubmit} className="mb-3">
                    <input
                        value={text}
                        onChange={handleChange}
                        placeholder="Share an update..."
                        className="input input-sm w-full mb-2"
                    />
                    <div className="flex justify-end">
                        <button className="btn btn-sm btn-primary" type="submit">Post</button>
                    </div>
                </form>
            )}

            {typingAllUser && (
                <div className="text-xs text-zinc-500 mb-2">Someone is typing...</div>
            )}

            <div className="space-y-2 max-h-40 overflow-y-auto">
                {announcements.length === 0 && (
                    <div className="text-xs text-zinc-500">No announcements</div>
                )}
                {announcements.map(a => (
                    <div key={a._id} className="bg-base-200 rounded p-2 text-sm">
                        <div className="font-medium text-xs opacity-80">{a.isAdmin ? 'Admin' : 'User'}</div>
                        <div className="truncate">{a.text}</div>
                        <div className="text-xs opacity-60 mt-1">{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AnnouncementPanel;
