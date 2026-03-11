import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { Link, Navigate } from 'react-router-dom';

const AdminAnnouncements = () => {
  const { authUser, isAdmin, fetchAllAnnouncements, deleteAnnouncement: storeDelete } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (!isAdmin) return setLoading(false);
    (async () => {
      try {
        const all = await fetchAllAnnouncements();
        setItems(all);
      } catch (e) {
        console.log(e);
        toast.error('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, fetchAllAnnouncements]);

  if (!authUser) return <Navigate to="/login" />;
  if (!isAdmin) return <div className="p-6">Unauthorized</div>;

  const filtered = items.filter(a => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (a.text || '').toLowerCase().includes(q) || (a._id || '').includes(q);
  });

  const toggle = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} announcements?`)) return;
    try {
      // delete sequentially to keep things simple
      for (const id of Array.from(selected)) {
        await axiosInstance.delete(`/announcements/${id}`);
      }
      setItems(items.filter(i => !selected.has(i._id)));
      setSelected(new Set());
      toast.success('Deleted');
    } catch (e) {
      console.log(e);
      toast.error('Bulk delete failed');
    }
  }

  const removeOne = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await storeDelete(id);
      setItems(items.filter(i => i._id !== id));
      toast.success('Deleted');
    } catch (e) {
      console.log(e);
      toast.error('Delete failed');
    }
  }

  return (
    <div className="container mx-auto p-6 pt-28">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Announcements Management</h2>
        <Link to="/" className="btn btn-sm">Back</Link>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search text or id" className="input input-sm flex-1" />
        <div className="flex items-center gap-2">
          <button className="btn btn-sm btn-error" onClick={bulkDelete}>Delete Selected</button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a._id} className="p-3 border rounded bg-base-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(a._id)} onChange={() => toggle(a._id)} />
                <div>
                  <div className="text-sm font-medium">{a.text}</div>
                  <div className="text-xs opacity-60">{new Date(a.startAt || a.createdAt).toLocaleString()} — {new Date(a.endAt || a.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/profile/${a.senderId}`} className="btn btn-xs">Sender</Link>
                <button className="btn btn-xs" onClick={() => alert('Use edit from main UI')}>Edit</button>
                <button className="btn btn-xs btn-outline btn-error" onClick={() => removeOne(a._id)}>Delete</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (<div className="text-sm opacity-60">No announcements</div>)}
        </div>
      )}
    </div>
  )
}

export default AdminAnnouncements;
