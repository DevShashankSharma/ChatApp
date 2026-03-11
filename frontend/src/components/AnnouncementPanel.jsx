import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const isoLocal = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
}

const AnnouncementPanel = () => {
    const { announcements, fetchAnnouncements, postAnnouncement, isAdmin, socket, typingAllUser, editAnnouncement, deleteAnnouncement } = useAuthStore();
    const [text, setText] = useState("");
    const [startAt, setStartAt] = useState(isoLocal(new Date()));
    const [endAt, setEndAt] = useState(isoLocal(new Date(Date.now() + 60*60*1000)));
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [editStartAt, setEditStartAt] = useState("");
    const [editEndAt, setEditEndAt] = useState("");
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
            await postAnnouncement({ text, startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString() });
            setText("");
            setStartAt(isoLocal(new Date()));
            setEndAt(isoLocal(new Date(Date.now() + 60*60*1000)));
            toast.success('Announcement posted');
            emitStopTyping();
        } catch (_) {
            toast.error('Failed to post announcement');
        }
    }

    const handleEdit = (a) => {
        setEditingId(a._id);
        setEditText(a.text);
        setEditStartAt(isoLocal(a.startAt || a.createdAt));
        setEditEndAt(isoLocal(a.endAt || a.createdAt));
    }

    const handleSaveEdit = async (id) => {
        try {
            await editAnnouncement(id, { text: editText, startAt: new Date(editStartAt).toISOString(), endAt: new Date(editEndAt).toISOString() });
            toast.success('Announcement updated');
            setEditingId(null);
        } catch (e) {
            toast.error('Failed to update');
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            await deleteAnnouncement(id);
            toast.success('Deleted');
        } catch (e) {
            toast.error('Failed to delete');
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
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="input input-sm" />
                        <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="input input-sm" />
                    </div>
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
                        <div className="flex items-center justify-between">
                            <div className="font-medium text-xs opacity-80">{a.isAdmin ? 'Admin' : 'User'}</div>
                            {isAdmin && (
                                <div className="space-x-1">
                                    <button className="btn btn-xs btn-ghost" onClick={() => handleEdit(a)}>Edit</button>
                                    <button className="btn btn-xs btn-outline btn-error" onClick={() => handleDelete(a._id)}>Delete</button>
                                </div>
                            )}
                        </div>

                        {editingId === a._id ? (
                            <div className="mt-2">
                                <textarea className="textarea textarea-sm w-full mb-2" value={editText} onChange={(e) => setEditText(e.target.value)} />
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input type="datetime-local" value={editStartAt} onChange={(e) => setEditStartAt(e.target.value)} className="input input-sm" />
                                    <input type="datetime-local" value={editEndAt} onChange={(e) => setEditEndAt(e.target.value)} className="input input-sm" />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button className="btn btn-xs" onClick={() => setEditingId(null)}>Cancel</button>
                                    <button className="btn btn-xs btn-primary" onClick={() => handleSaveEdit(a._id)}>Save</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="truncate">{a.text}</div>
                                <div className="text-xs opacity-60 mt-1">{new Date(a.startAt).toLocaleString()} — {new Date(a.endAt).toLocaleString()}</div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AnnouncementPanel;
