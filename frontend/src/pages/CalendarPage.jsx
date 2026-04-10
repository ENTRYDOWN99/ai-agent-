import { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', startTime: '', endTime: '',
    location: '', type: 'meeting', color: '#6366f1'
  });
  const toast = useToast();

  useEffect(() => { loadEvents(); }, [filterType]);

  const loadEvents = async () => {
    try {
      const params = {};
      if (filterType) params.type = filterType;
      const res = await eventsAPI.getAll(params);
      setEvents(res.data.events || []);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditEvent(null);
    const now = new Date();
    const later = new Date(now.getTime() + 3600000);
    setForm({
      title: '', description: '',
      startTime: now.toISOString().slice(0, 16),
      endTime: later.toISOString().slice(0, 16),
      location: '', type: 'meeting', color: '#6366f1'
    });
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditEvent(event);
    setForm({
      title: event.title, description: event.description || '',
      startTime: new Date(event.startTime).toISOString().slice(0, 16),
      endTime: new Date(event.endTime).toISOString().slice(0, 16),
      location: event.location || '', type: event.type || 'meeting',
      color: event.color || '#6366f1'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editEvent) {
        await eventsAPI.update(editEvent._id, form);
        toast.success('Event updated');
      } else {
        await eventsAPI.create(form);
        toast.success('Event created');
      }
      setShowModal(false);
      loadEvents();
    } catch (err) {
      toast.error('Failed to save event');
    }
  };

  const deleteEvent = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await eventsAPI.delete(id);
      toast.success('Event deleted');
      loadEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d) => new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const typeColors = {
    meeting: '#6366f1', reminder: '#f59e0b', deadline: '#ef4444', personal: '#22c55e'
  };

  const typeFilters = ['', 'meeting', 'reminder', 'deadline', 'personal'];

  // Group events by date
  const grouped = events.reduce((acc, event) => {
    const dateKey = new Date(event.startTime).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Calendar</h1>
          <p className="page-subtitle">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ New Event</button>
      </div>

      <div className="page-body">
        <div className="toolbar">
          <div className="filter-chips">
            {typeFilters.map(t => (
              <button key={t || 'all'} className={`filter-chip ${filterType === t ? 'active' : ''}`}
                onClick={() => setFilterType(t)}
                style={t && filterType === t ? { borderColor: typeColors[t], color: typeColors[t] } : {}}>
                {t ? `${t === 'meeting' ? '🤝' : t === 'reminder' ? '🔔' : t === 'deadline' ? '⏰' : '👤'} ${t}` : 'All Types'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px' }} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No events found</h3>
            <p>Schedule your first event</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openCreateModal}>+ Create Event</button>
          </div>
        ) : (
          Object.entries(grouped).map(([dateKey, dayEvents]) => (
            <div key={dateKey} style={{ marginBottom: '24px' }} className="animate-fadeIn">
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-accent)', marginBottom: '10px', fontWeight: 600 }}>
                {formatDate(dayEvents[0].startTime)}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dayEvents.map(event => (
                  <div key={event._id} className="event-item" onClick={() => openEditModal(event)} style={{ cursor: 'pointer' }}>
                    <div className="event-color-bar" style={{ background: typeColors[event.type] || event.color || '#6366f1' }}></div>
                    <div className="event-time-block">
                      <div className="time">{formatTime(event.startTime)}</div>
                      <div className="period">to {formatTime(event.endTime)}</div>
                    </div>
                    <div className="event-details" style={{ flex: 1 }}>
                      <div className="event-title">{event.title}</div>
                      <div className="event-info">
                        {event.location && <span>📍 {event.location}</span>}
                        <span className="badge" style={{ background: `${typeColors[event.type]}20`, color: typeColors[event.type] }}>
                          {event.type}
                        </span>
                        {event.createdBy === 'agent' && <span className="badge badge-purple">🤖 agent</span>}
                      </div>
                    </div>
                    <div className="task-actions">
                      <button className="btn btn-ghost btn-icon btn-sm"
                        onClick={(e) => { e.stopPropagation(); deleteEvent(event._id); }} title="Delete">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editEvent ? 'Edit Event' : 'Create Event'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="event-title">Title</label>
            <input id="event-title" className="form-input" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Event title" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="event-desc">Description</label>
            <textarea id="event-desc" className="form-textarea" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="event-start">Start</label>
              <input id="event-start" className="form-input" type="datetime-local" value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="event-end">End</label>
              <input id="event-end" className="form-input" type="datetime-local" value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="event-location">Location</label>
              <input id="event-location" className="form-input" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="event-type">Type</label>
              <select id="event-type" className="form-select" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="meeting">Meeting</option>
                <option value="reminder">Reminder</option>
                <option value="deadline">Deadline</option>
                <option value="personal">Personal</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editEvent ? 'Update' : 'Create'} Event</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
