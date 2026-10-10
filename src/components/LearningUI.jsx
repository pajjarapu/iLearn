import { useState } from "react";
import { PlaceArt } from "./art.jsx";
export const LESSONS = [
  { id: "family", title: "Send a photo", description: "Share a favorite photo with someone you love.", category: "Photos", image: "s0-lesson-send-photo", icon: "photo", steps: 6, keys: ["tutorial", "practice", "mission"], detail: "Open Messages, choose Maya, select your garden photo, and send it. Practice safely, with nothing leaving this app." },
  { id: "community", title: "Add a calendar reminder", description: "Remember an upcoming event with a helpful alert.", category: "Apps", icon: "calendar", steps: 5, keys: ["communityTutorial"], detail: "Find Book club in the practice Calendar and add a reminder for one day before the event." },
  { id: "cafe", title: "Make a phone call", description: "Find a friend in Contacts, call, and hang up.", category: "iPhone basics", image: "s0-lesson-facetime", icon: "phone", steps: 5, keys: ["callTutorial"], detail: "Open Phone, find Rosa in Contacts, start a simulated call, and end it with the red hang-up button." },
  { id: "safety", title: "Spot suspicious messages", description: "Learn to leave suspicious links alone and report junk.", category: "Calls & messages", icon: "shield", steps: 4, keys: ["safetyTutorial"], detail: "Read a fictional delivery message and practice deleting and reporting it. No real links are opened or reports sent." },
];
export function Icon({ name, ...props }) {
  const paths = {
    phone: <path d="M6 3h4l1 5-3 2a15 15 0 0 0 6 6l2-3 5 1v4a3 3 0 0 1-3 3C9 20 4 15 3 6a3 3 0 0 1 3-3Z" />,
    smartphone: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 5h4m-3 14h2" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />, back: <path d="m15 5-7 7 7 7" />, chevron: <path d="m9 5 7 7-7 7" />,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
    lessons: <path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v15" />,
    progress: <><path d="M4 20V10m8 10V4m8 16v-7" /><path d="m15 5 2 2 4-4" /></>,
    support: <><path d="M3 13v-2a9 9 0 0 1 18 0v2m-2 6c0 2-3 3-7 3" /><rect x="2" y="11" width="4" height="8" rx="2" /><rect x="18" y="11" width="4" height="8" rx="2" /></>,
    check: <path d="m5 12 4 4L19 6" />, moon: <path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" /></>,
    volume: <path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" /></>,
    shield: <><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Z" /><path d="m8 12 3 3 5-6" /></>,
    photo: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1" /><path d="m3 17 6-6 4 4 3-3 5 5" /></>,
  };
  return <svg className="learn-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] ?? paths.smartphone}</svg>;
}
export function Asset({ name, className = "", alt = "" }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className={`asset-fallback ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}><Icon name="smartphone" /></div> : <img className={className} src={`/images/reference/${name}.webp`} alt={alt} onError={() => setFailed(true)} />;
}
export function Brand() { return <div className="learn-brand"><span><Icon name="smartphone" /></span>iLearn</div>; }
export function BottomNav({ active, onNavigate }) {
  return <nav className="learn-bottom-nav" aria-label="Main navigation">{[["lessons", "Lessons"], ["progress", "Progress"], ["support", "Support"]].map(([id, title]) => <button key={id} aria-current={active === id ? "page" : undefined} onClick={() => onNavigate(id)}><span><Icon name={id} /></span>{title}</button>)}</nav>;
}
export function LessonArt({ lesson }) { return <div className={`lesson-art art-${lesson.id}`}>{lesson.image ? <Asset name={lesson.image} /> : <PlaceArt id={lesson.id} unlocked={false} />}</div>; }
export function LessonCard({ lesson, finished, onOpen, compact = false, date }) {
  const validDate = date && !Number.isNaN(Date.parse(date));
  return <article className={`learn-lesson-card ${compact ? "is-completed" : ""}`}><LessonArt lesson={lesson} /><div className="lesson-card-body"><h2>{lesson.title}</h2><p>{compact ? validDate ? `Finished ${new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "Finished — ready to revisit" : lesson.description}</p>
    {compact ? <div className="completed-steps" aria-label={`${lesson.steps} of ${lesson.steps} steps complete`}>{Array.from({ length: lesson.steps }, (_, i) => <span key={i}><Icon name="check" /></span>)}<small>{lesson.steps} of {lesson.steps}</small></div> : <span className={`learn-badge ${finished ? "finished" : ""}`}><Icon name={finished ? "check" : "smartphone"} />{finished ? "Finished" : "Beginner"}</span>}
    <button className={compact ? "learn-outline" : "learn-primary"} onClick={onOpen}>{compact ? "Revisit lesson" : finished ? "Practice again" : "Start lesson"}<Icon name="arrow" /></button>
  </div></article>;
}
export function StepTrail({ step, total, complete = false }) {
  return <ol className="learn-step-trail" aria-label="Lesson steps">{Array.from({ length: total }, (_, i) => <li key={i} className={complete || i + 1 < step ? "done" : i + 1 === step ? "current" : "future"} aria-current={!complete && i + 1 === step ? "step" : undefined}><span>{complete || i + 1 < step ? <Icon name="check" /> : i + 1}</span><span className="sr-only">{complete || i + 1 < step ? "completed" : i + 1 === step ? "current step" : "upcoming"}</span></li>)}</ol>;
}
export function LessonMenu({ lesson, progress, headingRef, onBack, onStart }) {
  const modes = lesson.id === "family" ? [["tutorial", "Tutorial", "Follow the glowing buttons, with a clear explanation at every step.", "tutorial"], ["practice", "Guided practice", "Try it without highlights. Ask for a hint whenever you need one.", "practice"], ["game", "Game mission", "Maya wants to see your garden. Send her the flower photo on your own.", "mission"]] : [["tutorial", "Step-by-step tutorial", "Follow the glowing buttons. Replay and start over any time.", lesson.keys[0]]];
  return <article className="learn-lesson-menu"><button className="learn-back" onClick={onBack}><Icon name="back" />Lessons</button><div className="lesson-detail-art"><LessonArt lesson={lesson} /><span><Icon name={lesson.icon} />{lesson.category}</span></div><p className="learn-overline">Learn at your own pace</p><h1 className="learn-heading" ref={headingRef} tabIndex={-1}>{lesson.title}</h1><p className="learn-description">{lesson.detail}</p><div className="learn-modes">{modes.map(([id, title, description, key], i) => <button key={id} className="learn-mode" onClick={() => onStart(id)}><span className="mode-number">{progress[key] ? <Icon name="check" /> : i + 1}</span><span><small>{progress[key] ? "Finished" : `${lesson.steps} simple steps`}</small><strong>{title}</strong><span>{description}</span></span><Icon name="chevron" /></button>)}</div></article>;
}
