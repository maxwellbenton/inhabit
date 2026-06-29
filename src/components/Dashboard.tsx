'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useSession } from 'next-auth/react';
import {
  REMINDERS_QUERY,
  SETTINGS_QUERY,
  SKIP_REMINDER_TODAY,
  WORKBLOCKS_QUERY,
  type Reminder,
  type Settings,
  type WorkBlock,
} from '@/graphql/queries';
import { DAY_NAMES, fmt12, minutesOfDay, nowHM, pad, todayStr } from '@/lib/time';
import MediaEmbed from './MediaEmbed';
import ReminderModal, { type ReminderDraft } from './ReminderModal';
import WorkBlockModal, { type WorkBlockDraft } from './WorkBlockModal';
import SettingsModal from './SettingsModal';

const THEMES = ['midnight', 'forest', 'sunset', 'slate', 'ocean'];
const LAYOUTS = ['a', 'b', 'c', 'd'];

type OverlayPayload =
  | { type: 'reminder'; data: Reminder | ReminderDraft; isPreview?: boolean }
  | { type: 'break'; data: WorkBlock };

export default function Dashboard() {
  const { data: session } = useSession();

  const { data: remindersData } = useQuery<{ reminders: Reminder[] }>(REMINDERS_QUERY, { pollInterval: 60000 });
  const { data: workBlocksData } = useQuery<{ workBlocks: WorkBlock[] }>(WORKBLOCKS_QUERY, { pollInterval: 60000 });
  const { data: settingsData } = useQuery<{ settings: Settings }>(SETTINGS_QUERY, { pollInterval: 60000 });
  const [skipReminderToday] = useMutation(SKIP_REMINDER_TODAY, { refetchQueries: [{ query: REMINDERS_QUERY }] });

  const reminders = remindersData?.reminders ?? [];
  const workBlocks = workBlocksData?.workBlocks ?? [];
  const settings = settingsData?.settings ?? { takeoverSeconds: 90 };

  const remindersRef = useRef<Reminder[]>([]);
  const workBlocksRef = useRef<WorkBlock[]>([]);
  useEffect(() => { remindersRef.current = reminders; }, [reminders]);
  useEffect(() => { workBlocksRef.current = workBlocks; }, [workBlocks]);

  // ---------------- clock ----------------
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ---------------- style rotation ----------------
  const currentThemeRef = useRef(THEMES[0]);
  const currentLayoutRef = useRef(LAYOUTS[0]);

  function rotateStyle() {
    let theme = currentThemeRef.current;
    let layout = currentLayoutRef.current;
    while (theme === currentThemeRef.current) theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    while (layout === currentLayoutRef.current) layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    currentThemeRef.current = theme;
    currentLayoutRef.current = layout;
    document.body.dataset.theme = theme;
    document.body.dataset.layout = layout;
    const app = document.getElementById('app');
    app?.style.setProperty('--grad-x', `${10 + Math.random() * 80}%`);
    app?.style.setProperty('--grad-y', `${10 + Math.random() * 80}%`);
    document.documentElement.style.setProperty('--badge-bottom', `${1 + Math.random() * 3}rem`);
    document.documentElement.style.setProperty('--badge-right', `${1 + Math.random() * 3}rem`);
  }

  useEffect(() => { rotateStyle(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------- overlay queue ----------------
  const [overlayQueue, setOverlayQueue] = useState<OverlayPayload[]>([]);
  const [currentOverlay, setCurrentOverlay] = useState<OverlayPayload | null>(null);
  const [fading, setFading] = useState(false);
  const [badge, setBadge] = useState<{ title: string; sub: string } | null>(null);
  const advancingRef = useRef(false);

  function queueOverlay(payload: OverlayPayload) {
    setOverlayQueue((q) => [...q, payload]);
  }

  useEffect(() => {
    if (!currentOverlay && overlayQueue.length > 0 && !advancingRef.current) {
      advancingRef.current = true;
      const [next, ...rest] = overlayQueue;
      setOverlayQueue(rest);
      setCurrentOverlay(next);
      setFading(false);
      rotateStyle();
      advancingRef.current = false;
    }
  }, [currentOverlay, overlayQueue]);

  function endOverlay() {
    setFading(true);
    setTimeout(() => {
      setCurrentOverlay((cur) => {
        // Skip the "it happened" badge for a Preview click from the editing
        // modal — nothing actually fired, it was just a look at the draft.
        if (cur?.type === 'reminder' && !cur.isPreview) {
          const title = (cur.data as Reminder).title;
          setBadge({ title, sub: 'It happened — carry on' });
          setTimeout(() => setBadge(null), 5 * 60 * 1000);
        }
        return null;
      });
    }, 600);
  }

  // reminder auto-dismiss timer
  useEffect(() => {
    if (currentOverlay?.type === 'reminder' && !fading) {
      const ms = (settings.takeoverSeconds || 90) * 1000;
      const id = setTimeout(() => endOverlay(), ms);
      return () => clearTimeout(id);
    }
  }, [currentOverlay, fading, settings.takeoverSeconds]);

  // break countdown timer
  const [breakRemaining, setBreakRemaining] = useState(0);
  useEffect(() => {
    if (currentOverlay?.type === 'break' && !fading) {
      setBreakRemaining(currentOverlay.data.breakMin * 60);
      const id = setInterval(() => {
        setBreakRemaining((r) => {
          if (r <= 1) {
            clearInterval(id);
            endOverlay();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }
  }, [currentOverlay, fading]);

  // ---------------- scheduler ----------------
  const firedRef = useRef<Record<string, string>>({});
  const breakFiredRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const dow = n.getDay();
      const hm = nowHM(n);
      const today = todayStr(n);

      remindersRef.current.forEach((r) => {
        if (!r.enabled || !r.days.includes(dow) || r.skipDates.includes(today) || r.time !== hm) return;
        const fireKey = `${today}_${hm}`;
        if (firedRef.current[r.id] === fireKey) return;
        firedRef.current[r.id] = fireKey;
        queueOverlay({ type: 'reminder', data: r });
      });

      workBlocksRef.current.forEach((w) => {
        if (!w.enabled || !w.days.includes(dow)) return;
        const nowMin = minutesOfDay(hm);
        const startMin = minutesOfDay(w.start);
        const endMin = minutesOfDay(w.end);
        if (nowMin < startMin || nowMin >= endMin) return;
        const sinceStart = nowMin - startMin;
        const cycleLen = w.workMin + w.breakMin;
        const cyclePos = sinceStart % cycleLen;
        const cycleIndex = Math.floor(sinceStart / cycleLen);
        if (cyclePos >= w.workMin) {
          const fireKey = `${today}_${w.id}_${cycleIndex}`;
          if (breakFiredRef.current[w.id] !== fireKey) {
            breakFiredRef.current[w.id] = fireKey;
            queueOverlay({ type: 'break', data: w });
          }
        }
      });
    };
    const id = setInterval(tick, 5000);
    tick();
    return () => clearInterval(id);
  }, []);

  // ---------------- modals ----------------
  const [editingReminder, setEditingReminder] = useState<ReminderDraft | null>(null);
  const [editingWorkBlock, setEditingWorkBlock] = useState<WorkBlockDraft | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  function duplicateReminder(r: Reminder) {
    setEditingReminder({ ...r, id: undefined, title: `${r.title} (copy)`, skipDates: [] });
  }
  function skipToday(r: Reminder) {
    skipReminderToday({ variables: { id: r.id, date: todayStr() } });
  }

  // ---------------- derived data for render ----------------
  const dow = now.getDay();
  const today = todayStr(now);
  const nowMin = minutesOfDay(nowHM(now));

  const todaysReminders = reminders
    .filter((r) => r.enabled && r.days.includes(dow) && !r.skipDates.includes(today))
    .sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time));

  const agendaItems = [
    ...todaysReminders.map((r) => ({ time: r.time, label: r.title, color: r.color })),
    ...workBlocks
      .filter((w) => w.enabled && w.days.includes(dow))
      .flatMap((w) => [
        { time: w.start, label: `${w.label} starts`, color: 'cyan' },
        { time: w.end, label: `${w.label} ends`, color: 'cyan' },
      ]),
  ].sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time));

  let nextUp: { label: string; sub: string } | null = null;
  const upcomingToday = reminders
    .filter((r) => r.enabled && r.days.includes(dow) && !r.skipDates.includes(today) && minutesOfDay(r.time) >= nowMin)
    .sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time));
  if (upcomingToday.length) {
    nextUp = { label: upcomingToday[0].title, sub: `today at ${fmt12(upcomingToday[0].time)}` };
  } else {
    for (let add = 1; add <= 7 && !nextUp; add++) {
      const d = new Date(now);
      d.setDate(d.getDate() + add);
      const ddow = d.getDay();
      const candidates = reminders.filter((r) => r.enabled && r.days.includes(ddow)).sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time));
      if (candidates.length) {
        const label = add === 1 ? 'tomorrow' : d.toLocaleDateString([], { weekday: 'long' });
        nextUp = { label: candidates[0].title, sub: `${label} at ${fmt12(candidates[0].time)}` };
      }
    }
  }

  const activeBlock = workBlocks.find((w) => w.enabled && w.days.includes(dow) && nowMin >= minutesOfDay(w.start) && nowMin < minutesOfDay(w.end));
  let pomodoroStatus: { label: string; sub: string } | null = null;
  if (activeBlock) {
    const sinceStart = nowMin - minutesOfDay(activeBlock.start);
    const cycleLen = activeBlock.workMin + activeBlock.breakMin;
    const cyclePos = sinceStart % cycleLen;
    if (cyclePos < activeBlock.workMin) {
      pomodoroStatus = { label: `${activeBlock.label} — focus`, sub: `break in ${activeBlock.workMin - cyclePos} min` };
    } else {
      pomodoroStatus = { label: `${activeBlock.label} — break`, sub: `back to work in ${cycleLen - cyclePos} min` };
    }
  }

  return (
    <div id="app">
      <header className="topbar">
        <div className="clock-block">
          <div className="clock">{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
          <div className="date">{now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div className="controls">
          {session?.user?.email && <span className="user-chip">{session.user.email}</span>}
          <button className="btn-icon" onClick={() => setEditingReminder({ days: [0, 1, 2, 3, 4, 5, 6] })}>+ Reminder</button>
          <button className="btn-icon" onClick={() => setEditingWorkBlock({})}>+ Work block</button>
          <button className="btn-icon" onClick={() => setSettingsOpen(true)}>⚙ Settings</button>
        </div>
      </header>

      <main className="dashboard">
        <section className="panel agenda-panel">
          <h2>Today</h2>
          <div className="agenda-list">
            {agendaItems.length === 0 ? (
              <div className="agenda-empty">Nothing scheduled today.</div>
            ) : (
              agendaItems.map((it, idx) => (
                <div key={idx} className={`agenda-item ${minutesOfDay(it.time) < nowMin ? 'is-past' : ''}`}>
                  <span className="time">{fmt12(it.time)}</span>
                  <span className={`tag-dot tag-${it.color}`} />
                  <span>{it.label}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel status-panel">
          <div>
            <h3>Next up</h3>
            <div className="next-up-body">
              {nextUp ? <>{nextUp.label}<span className="small">{nextUp.sub}</span></> : 'Nothing scheduled'}
            </div>
          </div>
          <div>
            <h3>Work block</h3>
            <div className="pomodoro-body">
              {pomodoroStatus ? <>{pomodoroStatus.label}<span className="small">{pomodoroStatus.sub}</span></> : 'No active work block'}
            </div>
          </div>
          <div>
            <h3>All reminders</h3>
            <div className="quicklist-items">
              {reminders.length === 0 && <div className="agenda-empty">No reminders yet.</div>}
              {reminders.map((r) => (
                <div key={r.id} className={`quicklist-row ${r.enabled ? '' : 'disabled'}`}>
                  <span>
                    <span className={`tag-dot tag-${r.color}`} />
                    {r.title}
                    <span className="ql-meta"> {fmt12(r.time)} · {r.days.length === 7 ? 'daily' : r.days.map((d) => DAY_NAMES[d]).join('/')}</span>
                  </span>
                  <span className="quicklist-actions">
                    <button onClick={() => setEditingReminder(r)}>Edit</button>
                    <button onClick={() => duplicateReminder(r)}>Duplicate</button>
                    <button onClick={() => skipToday(r)}>Skip today</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>All work blocks</h3>
            <div className="quicklist-items">
              {workBlocks.length === 0 && <div className="agenda-empty">No work blocks yet.</div>}
              {workBlocks.map((w) => (
                <div key={w.id} className={`quicklist-row ${w.enabled ? '' : 'disabled'}`}>
                  <span>
                    {w.label}
                    <span className="ql-meta"> {fmt12(w.start)}–{fmt12(w.end)} · {w.workMin}/{w.breakMin}m</span>
                  </span>
                  <span className="quicklist-actions">
                    <button onClick={() => setEditingWorkBlock(w)}>Edit</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <div id="badgeRoot">
        {badge && (
          <div className="badge" onClick={() => setBadge(null)}>
            <div className="badge-title">{badge.title}</div>
            <div className="badge-sub">{badge.sub}</div>
          </div>
        )}
      </div>

      <div id="overlayRoot">
        {currentOverlay && (
          <div className={`takeover ${fading ? 'fading' : ''}`} onClick={() => endOverlay()}>
            {currentOverlay.type === 'reminder' ? (
              <>
                <div className="tk-eyebrow">Reminder</div>
                <div className="tk-title">{(currentOverlay.data as Reminder).title}</div>
                {(currentOverlay.data as Reminder).body && <div className="tk-body">{(currentOverlay.data as Reminder).body}</div>}
                <MediaEmbed imageUrl={(currentOverlay.data as Reminder).imageUrl} videoUrl={(currentOverlay.data as Reminder).videoUrl} />
                <div className="tk-dismiss-hint">Click anywhere to dismiss</div>
              </>
            ) : (
              <>
                <div className="tk-eyebrow">Break time</div>
                <div className="tk-title">{currentOverlay.data.label}</div>
                <div className="tk-body">Step away for a moment.</div>
                <div className="tk-countdown">{pad(Math.floor(breakRemaining / 60))}:{pad(breakRemaining % 60)}</div>
                <div className="tk-dismiss-hint">Click anywhere to end early</div>
              </>
            )}
          </div>
        )}
      </div>

      {editingReminder && (
        <ReminderModal
          draft={editingReminder}
          // The modal backdrop renders above the full-screen takeover
          // (#overlayRoot is z-index 100, .modal-backdrop is 200) so a
          // preview would otherwise be stuck behind the modal that's still
          // open. Hide (not unmount) it for the duration of a preview so
          // the takeover is actually visible, and unsaved field edits
          // survive the round trip.
          hidden={currentOverlay?.type === 'reminder' && currentOverlay.isPreview === true}
          onClose={() => setEditingReminder(null)}
          onPreview={(draft) => queueOverlay({ type: 'reminder', data: draft, isPreview: true })}
        />
      )}
      {editingWorkBlock && <WorkBlockModal draft={editingWorkBlock} onClose={() => setEditingWorkBlock(null)} />}
      {settingsOpen && <SettingsModal settings={settings} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
