import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
// @ts-ignore
import { Task, getTaskDateString, dateStringToLocalDate } from 'shared';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function TaskCalendar({ tasks, onToggleTask }: { tasks: Task[], onToggleTask: (t: Task) => void }) {
  // Control view + date so the toolbar's Agenda/Month/Today/Back/Next buttons
  // actually take effect (an uncontrolled Calendar ignores them when the parent
  // re-renders on every tasks snapshot).
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());

  const events = tasks.map(task => {
    // Place the event on the day encoded in dueAt's UTC date portion, pinned to
    // local midnight so it isn't shifted by the viewer's timezone.
    const day = dateStringToLocalDate(getTaskDateString(task.dueAt));
    return {
      id: task.id,
      title: (task.done ? '✓ ' : '') + task.title,
      start: day,
      end: day,
      allDay: true,
      resource: task
    };
  });

  const eventStyleGetter = (event: any) => {
    let backgroundColor = event.resource.done ? '#004d40' : '#4caf50';
    let style = {
      backgroundColor,
      borderRadius: '4px',
      opacity: event.resource.done ? 0.6 : 1,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    return { style };
  };

  return (
    <div className="h-[400px] bg-[#1e1e1e] rounded text-white p-2 shadow-inner">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(e) => onToggleTask(e.resource)}
        views={['month', 'agenda']}
        view={view}
        onView={(v) => setView(v)}
        date={date}
        onNavigate={(d) => setDate(d)}
      />
      
      <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-toolbar button { color: #fff; }
        .rbc-toolbar button:hover { background-color: #333; }
        .rbc-toolbar button.rbc-active { background-color: #8ab4f8; color: #1e1e1e; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: #333; }
        .rbc-day-bg, .rbc-header { border-color: #333; }
        .rbc-off-range-bg { background: #282a2d; }
        .rbc-today { background: #3b3d42; }
      `}</style>
    </div>
  );
}
