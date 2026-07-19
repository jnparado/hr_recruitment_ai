"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { InterviewCalendarEvent } from "@/lib/calendar-events";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Filter = "all" | "ai" | "human";
type ViewMode = "month" | "week" | "agenda";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function monthLabel(y: number, m: number) {
  return new Date(y, m, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function eventTone(kind: "ai" | "human") {
  return kind === "ai"
    ? {
        chip: "bg-sky-600 text-white",
        soft: "bg-sky-50 border-sky-200 text-sky-900",
        dot: "bg-sky-500",
        bar: "border-l-sky-500 bg-sky-50",
      }
    : {
        chip: "bg-emerald-700 text-white",
        soft: "bg-emerald-50 border-emerald-200 text-emerald-900",
        dot: "bg-emerald-600",
        bar: "border-l-emerald-600 bg-emerald-50",
      };
}

export function InterviewCalendar({
  events,
  compact = false,
}: {
  events: InterviewCalendarEvent[];
  compact?: boolean;
}) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(() =>
    dateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<ViewMode>("month");

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.kind === filter);
  }, [events, filter]);

  const byDate = useMemo(() => {
    const map = new Map<string, InterviewCalendarEvent[]>();
    for (const e of filtered) {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [filtered]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthCells = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = startOfWeek(first);
    const cells: { date: Date; key: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push({
        date: d,
        key: dateKey(d.getFullYear(), d.getMonth(), d.getDate()),
        inMonth: d.getMonth() === month,
      });
    }
    return cells;
  }, [year, month]);

  const weekDays = useMemo(() => {
    const base =
      view === "week"
        ? startOfWeek(new Date(selectedKey + "T12:00:00"))
        : startOfWeek(today);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        date: d,
        key: dateKey(d.getFullYear(), d.getMonth(), d.getDate()),
      };
    });
  }, [view, selectedKey, today]);

  const selectedEvents = byDate.get(selectedKey) || [];

  const agenda = useMemo(() => {
    const from = toDateKey(today);
    return filtered
      .filter((e) => e.date >= from)
      .slice(0, compact ? 6 : 40);
  }, [filtered, today, compact]);

  function shiftMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1));
  }

  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedKey(dateKey(today.getFullYear(), today.getMonth(), today.getDate()));
  }

  function toDateKey(d: Date) {
    return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
  }

  const stats = {
    ai: events.filter((e) => e.kind === "ai").length,
    human: events.filter((e) => e.kind === "human").length,
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        compact ? "" : ""
      }`}
    >
      {/* Outlook-like ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#f3f2f1] px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Today
          </button>
          <div className="flex items-center rounded-md border border-slate-300 bg-white">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => {
                if (view === "week") {
                  const d = new Date(selectedKey + "T12:00:00");
                  d.setDate(d.getDate() - 7);
                  setSelectedKey(toDateKey(d));
                  setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                } else {
                  shiftMonth(-1);
                }
              }}
              className="px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => {
                if (view === "week") {
                  const d = new Date(selectedKey + "T12:00:00");
                  d.setDate(d.getDate() + 7);
                  setSelectedKey(toDateKey(d));
                  setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                } else {
                  shiftMonth(1);
                }
              }}
              className="px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
            >
              ›
            </button>
          </div>
          <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
            {view === "week"
              ? `Week of ${weekDays[0]?.date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}`
              : monthLabel(year, month)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!compact && (
            <div className="flex rounded-md border border-slate-300 bg-white p-0.5 text-xs font-semibold">
              {(["month", "week", "agenda"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded px-2.5 py-1 capitalize ${
                    view === v ? "bg-[#0078d4] text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          <div className="flex rounded-md border border-slate-300 bg-white p-0.5 text-xs font-semibold">
            {(
              [
                ["all", "All"],
                ["ai", "AI"],
                ["human", "Human"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded px-2.5 py-1 ${
                  filter === key ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-slate-100 px-4 py-2 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" />
          AI interview ({stats.ai})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
          Human / final ({stats.human})
        </span>
      </div>

      <div className={`grid ${compact ? "" : "lg:grid-cols-[1fr_280px]"}`}>
        <div className="min-w-0">
          {(view === "month" || compact) && view !== "week" && view !== "agenda" && (
            <MonthGrid
              cells={monthCells}
              byDate={byDate}
              selectedKey={selectedKey}
              today={today}
              onSelect={setSelectedKey}
              maxPills={compact ? 2 : 3}
            />
          )}

          {view === "week" && (
            <WeekGrid
              days={weekDays}
              byDate={byDate}
              selectedKey={selectedKey}
              today={today}
              onSelect={setSelectedKey}
            />
          )}

          {view === "agenda" && (
            <AgendaList events={agenda} empty="No upcoming interviews in the pipeline." />
          )}
        </div>

        {!compact && view !== "agenda" && (
          <aside className="border-t border-slate-200 bg-[#faf9f8] lg:border-l lg:border-t-0">
            <div className="border-b border-slate-200 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {new Date(selectedKey + "T12:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                {selectedEvents.length} event{selectedEvents.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-3">
              {selectedEvents.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-slate-500">
                  Nothing scheduled this day.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedEvents.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}
      </div>

      {compact && (
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Upcoming
            </p>
            <Link
              href="/dashboard/schedule"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Open calendar
            </Link>
          </div>
          <AgendaList events={agenda} empty="No interviews scheduled yet." dense />
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  cells,
  byDate,
  selectedKey,
  today,
  onSelect,
  maxPills,
}: {
  cells: { date: Date; key: string; inMonth: boolean }[];
  byDate: Map<string, InterviewCalendarEvent[]>;
  selectedKey: string;
  today: Date;
  onSelect: (key: string) => void;
  maxPills: number;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-slate-200 bg-[#f3f2f1]">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayEvents = byDate.get(cell.key) || [];
          const isSelected = cell.key === selectedKey;
          const isToday = sameDay(cell.date, today);
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelect(cell.key)}
              className={`min-h-[88px] border-b border-r border-slate-100 p-1 text-left transition hover:bg-sky-50/40 sm:min-h-[110px] ${
                !cell.inMonth ? "bg-slate-50/80" : "bg-white"
              } ${isSelected ? "ring-2 ring-inset ring-[#0078d4]" : ""}`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isToday
                    ? "bg-[#0078d4] text-white"
                    : cell.inMonth
                      ? "text-slate-800"
                      : "text-slate-400"
                }`}
              >
                {cell.date.getDate()}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, maxPills).map((e) => {
                  const tone = eventTone(e.kind);
                  return (
                    <div
                      key={e.id}
                      className={`truncate rounded px-1 py-0.5 text-[9px] font-semibold leading-tight sm:text-[10px] ${tone.chip}`}
                      title={`${e.timeLabel} · ${e.candidateName}`}
                    >
                      {e.kind === "ai" ? "AI" : "Final"} · {e.candidateName.split(" ")[0]}
                    </div>
                  );
                })}
                {dayEvents.length > maxPills && (
                  <p className="px-0.5 text-[9px] font-medium text-slate-500">
                    +{dayEvents.length - maxPills} more
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  days,
  byDate,
  selectedKey,
  today,
  onSelect,
}: {
  days: { date: Date; key: string }[];
  byDate: Map<string, InterviewCalendarEvent[]>;
  selectedKey: string;
  today: Date;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-7 sm:divide-x sm:divide-y-0">
      {days.map((day) => {
        const dayEvents = byDate.get(day.key) || [];
        const isSelected = day.key === selectedKey;
        const isToday = sameDay(day.date, today);
        return (
          <button
            key={day.key}
            type="button"
            onClick={() => onSelect(day.key)}
            className={`min-h-[160px] p-2 text-left hover:bg-sky-50/50 ${
              isSelected ? "bg-sky-50/80 ring-2 ring-inset ring-[#0078d4]" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-slate-500">
                {WEEKDAYS[day.date.getDay()]}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  isToday ? "bg-[#0078d4] text-white" : "text-slate-800"
                }`}
              >
                {day.date.getDate()}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {dayEvents.length === 0 && (
                <li className="text-[10px] text-slate-400">—</li>
              )}
              {dayEvents.map((e) => {
                const tone = eventTone(e.kind);
                return (
                  <li
                    key={e.id}
                    className={`rounded border-l-4 px-1.5 py-1 text-[10px] ${tone.bar}`}
                  >
                    <p className="font-semibold">{e.timeLabel}</p>
                    <p className="truncate">{e.candidateName}</p>
                    <p className="truncate text-slate-500">
                      {e.kind === "ai" ? "AI" : "Human"} · {e.jobTitle}
                    </p>
                  </li>
                );
              })}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

function AgendaList({
  events,
  empty,
  dense,
}: {
  events: InterviewCalendarEvent[];
  empty: string;
  dense?: boolean;
}) {
  if (events.length === 0) {
    return <p className={`text-sm text-slate-500 ${dense ? "py-2" : "p-6 text-center"}`}>{empty}</p>;
  }

  return (
    <ul className={dense ? "space-y-2" : "divide-y divide-slate-100"}>
      {events.map((e) => (
        <li key={e.id} className={dense ? "" : "px-4 py-3"}>
          <EventCard event={e} dense={dense} />
        </li>
      ))}
    </ul>
  );
}

function EventCard({
  event,
  dense,
}: {
  event: InterviewCalendarEvent;
  dense?: boolean;
}) {
  const tone = eventTone(event.kind);
  return (
    <Link
      href={event.href}
      className={`block rounded-xl border p-3 transition hover:shadow-sm ${tone.soft} ${
        dense ? "p-2.5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">
            {event.kind === "ai" ? "AI interview" : "Human / final"}
          </p>
          <p className={`truncate font-semibold ${dense ? "text-sm" : "text-sm"}`}>
            {event.candidateName}
          </p>
          <p className="truncate text-xs opacity-80">{event.jobTitle}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.chip}`}>
          {event.kind === "ai" ? "AI" : "Final"}
        </span>
      </div>
      <p className="mt-2 text-xs font-medium">
        {new Date(event.date + "T12:00:00").toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}{" "}
        · {event.timeLabel}
      </p>
      <p className="mt-0.5 text-[11px] opacity-75">{event.subtitle}</p>
    </Link>
  );
}
