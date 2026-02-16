import { useState } from "react";
import { today } from "./utils/dateUtils";
import { useEvents } from "./hooks/useEvents";
import { useNotifications } from "./hooks/useNotifications";

import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import CalendarGrid from "./components/Calendar/CalendarGrid";
import EventModal from "./components/EventModal/EventModal";
import Toast from "./components/Notifications/Toast";

const DEFAULT_CALENDARS = {
    "My Events": { checked: true, color: "blue" },
    "Work": { checked: true, color: "red" },
    "Personal": { checked: true, color: "green" },
};

export default function App() {
    const td = today();

    // ── View state ─────────────────────────────────────────────────────────────
    const [view, setView] = useState({ year: td.year, month: td.month });
    const [selectedDate, setSelectedDate] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [calendars, setCalendars] = useState(DEFAULT_CALENDARS);

    // ── Event CRUD ─────────────────────────────────────────────────────────────
    const { events, saveEvent, deleteEvent } = useEvents();

    // ── Modal state ────────────────────────────────────────────────────────────
    const [modal, setModal] = useState(null);
    // modal shape: { type: 'create' | 'edit', date?: DateObj, event?: Event }

    // ── Notifications ──────────────────────────────────────────────────────────
    const { toasts, dismissToast, notifications, unreadCount } =
        useNotifications(events);

    // ── Navigation helpers ─────────────────────────────────────────────────────
    const prevMonth = () =>
        setView((v) =>
            v.month === 0
                ? { year: v.year - 1, month: 11 }
                : { year: v.year, month: v.month - 1 }
        );

    const nextMonth = () =>
        setView((v) =>
            v.month === 11
                ? { year: v.year + 1, month: 0 }
                : { year: v.year, month: v.month + 1 }
        );

    const goToday = () => {
        const t = today();
        setView({ year: t.year, month: t.month });
        setSelectedDate(t);
    };

    // ── Sidebar calendar toggles ───────────────────────────────────────────────
    const toggleCalendar = (name) =>
        setCalendars((prev) => ({
            ...prev,
            [name]: { ...prev[name], checked: !prev[name].checked },
        }));

    // ── Day / event click handlers ─────────────────────────────────────────────
    const handleDayClick = (cell) => {
        // If clicking an overflow cell, jump the view to that month first
        if (cell.overflow) {
            setView({ year: cell.year, month: cell.month });
        }
        const date = { year: cell.year, month: cell.month, day: cell.day };
        setSelectedDate(date);
        setModal({ type: "create", date });
    };

    const handleEventClick = (e, evt, date) => {
        e.stopPropagation();
        setModal({ type: "edit", event: evt, date });
    };

    // ── CRUD callbacks ─────────────────────────────────────────────────────────
    const handleSave = (evt) => {
        saveEvent(evt);
        setModal(null);
    };

    const handleDelete = (id, date) => {
        deleteEvent(id, date);
        setModal(null);
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div
            className="h-screen flex flex-col bg-white overflow-hidden"
            style={{ fontFamily: "'Google Sans', 'Segoe UI', sans-serif" }}
        >
            {/* Global keyframes (Tailwind doesn't ship arbitrary @keyframe classes by default) */}
            <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

            {/* Header */}
            <Header
                view={view}
                onPrev={prevMonth}
                onNext={nextMonth}
                onToday={goToday}
                onToggleSidebar={() => setSidebarOpen((s) => !s)}
                unreadCount={unreadCount}
                notifications={notifications}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    open={sidebarOpen}
                    view={view}
                    selectedDate={selectedDate}
                    calendars={calendars}
                    onSelectDate={(d) => {
                        setSelectedDate(d);
                        setView({ year: d.year, month: d.month });
                    }}
                    onToggleCalendar={toggleCalendar}
                    onCreateEvent={(date) => setModal({ type: "create", date })}
                />

                {/* Main calendar */}
                <CalendarGrid
                    view={view}
                    events={events}
                    selectedDate={selectedDate}
                    onDayClick={handleDayClick}
                    onEventClick={handleEventClick}
                />
            </div>

            {/* Event modal */}
            {modal && (
                <EventModal
                    event={modal.type === "edit" ? modal.event : null}
                    date={modal.date}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onClose={() => setModal(null)}
                />
            )}

            {/* Toast notifications */}
            <Toast toasts={toasts} onDismiss={dismissToast} />
        </div>
    );
}
