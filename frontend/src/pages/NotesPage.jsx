import { useState, useEffect } from 'react';
import { notesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', content: '', category: 'general', tags: '', isPinned: false });
  const toast = useToast();

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async (searchTerm) => {
    try {
      const params = {};
      if (searchTerm || search) params.search = searchTerm || search;
      const res = await notesAPI.getAll(params);
      setNotes(res.data.notes || []);
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditNote(null);
    setForm({ title: '', content: '', category: 'general', tags: '', isPinned: false });
    setShowModal(true);
  };

  const openEditModal = (note) => {
    setEditNote(note);
    setForm({
      title: note.title, content: note.content || '',
      category: note.category || 'general',
      tags: (note.tags || []).join(', '),
      isPinned: note.isPinned || false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    };
    try {
      if (editNote) {
        await notesAPI.update(editNote._id, data);
        toast.success('Note updated');
      } else {
        await notesAPI.create(data);
        toast.success('Note created');
      }
      setShowModal(false);
      loadNotes();
    } catch (err) {
      toast.error('Failed to save note');
    }
  };

  const togglePin = async (note) => {
    try {
      await notesAPI.togglePin(note._id);
      loadNotes();
    } catch (err) {
      toast.error('Failed to toggle pin');
    }
  };

  const deleteNote = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await notesAPI.delete(id);
      toast.success('Note deleted');
      loadNotes();
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadNotes(search);
  };

  const noteColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#14b8a6'];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Notes</h1>
          <p className="page-subtitle">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ New Note</button>
      </div>

      <div className="page-body">
        <div className="toolbar">
          <form onSubmit={handleSearch} className="search-bar flex-1">
            <span className="search-icon">🔍</span>
            <input className="form-input" placeholder="Search notes..." value={search}
              onChange={(e) => setSearch(e.target.value)} id="note-search" />
          </form>
        </div>

        {loading ? (
          <div className="grid-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '180px' }} />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No notes found</h3>
            <p>Create your first note</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openCreateModal}>+ Create Note</button>
          </div>
        ) : (
          <div className="grid-3">
            {notes.map((note, i) => (
              <div key={note._id} className="note-card animate-fadeIn"
                style={{ borderTopColor: noteColors[i % noteColors.length], animationDelay: `${i * 0.05}s` }}
                onClick={() => openEditModal(note)}>
                {note.isPinned && <div className="note-pin">📌</div>}
                <div className="note-title">{note.title}</div>
                <div className="note-content">{note.content || 'No content'}</div>
                <div className="note-footer">
                  <div className="note-tags">
                    {(note.tags || []).slice(0, 3).map((tag, ti) => (
                      <span key={ti} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>#{tag}</span>
                    ))}
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{note.category}</span>
                  </div>
                  <div className="note-date">{new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '10px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); togglePin(note); }}>
                    {note.isPinned ? '📌 Unpin' : '📍 Pin'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); deleteNote(note._id); }}>
                    🗑️
                  </button>
                  {note.createdBy === 'agent' && <span className="badge badge-purple">🤖 agent</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editNote ? 'Edit Note' : 'Create Note'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="note-title">Title</label>
            <input id="note-title" className="form-input" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Note title" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="note-content">Content</label>
            <textarea id="note-content" className="form-textarea" value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your note..." style={{ minHeight: '150px' }} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="note-category">Category</label>
              <input id="note-category" className="form-input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="general" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="note-tags">Tags (comma separated)</label>
              <input id="note-tags" className="form-input" value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2" />
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
              <span className="form-label" style={{ margin: 0 }}>📌 Pin this note</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editNote ? 'Update' : 'Create'} Note</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
