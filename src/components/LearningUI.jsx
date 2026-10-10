import { useState } from "react";
import { LessonThumb } from "./art.jsx";
import { APP_ICONS } from "../sfIcons.js";
export const LESSONS = [
  { id: "family", title: "Send a photo", description: "Share a favorite photo with someone you love.", category: "Calls & messages", image: "s0-lesson-send-photo", icon: "photo", steps: 6, keys: ["tutorial", "practice"], detail: "Open Messages, choose Maya, select your garden photo, and send it. Practice safely, with nothing leaving this app." },
  { id: "community", title: "Add a calendar reminder", description: "Remember an upcoming event with a helpful alert.", category: "Apps", icon: "calendar", steps: 5, keys: ["communityTutorial", "communityPractice"], detail: "Find Book club in the practice Calendar and add a reminder for one day before the event." },
  { id: "cafe", title: "Make a phone call", description: "Find a friend in Contacts, call, and hang up.", category: "iPhone basics", image: "s0-lesson-facetime", icon: "phone", steps: 5, keys: ["callTutorial", "callPractice"], detail: "Open Phone, find Rosa in Contacts, start a simulated call, and end it with the red hang-up button." },
  { id: "safety", title: "Spot suspicious messages", description: "Learn to leave suspicious links alone and report junk.", category: "Calls & messages", icon: "shield", steps: 4, keys: ["safetyTutorial", "safetyPractice"], detail: "Read a fictional delivery message and practice deleting and reporting it. No real links are opened or reports sent." },
];
export function Icon({ name, ...props }) {
  return <svg className="learn-icon" width="24" height="24" viewBox="0 0 56 56" fill="currentColor" aria-hidden="true" {...props}><path d={APP_ICONS[name] ?? APP_ICONS.smartphone} /></svg>;
}
export function Asset({ name, className = "", alt = "" }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className={`asset-fallback ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}><Icon name="smartphone" /></div> : <img className={className} src={`/images/reference/${name}.webp`} alt={alt} onError={() => setFailed(true)} />;
}
export function Brand() { return <div className="learn-brand"><span><Icon name="smartphone" /></span>iLearn</div>; }
export function BottomNav({ active, onNavigate }) {
  return <nav className="learn-bottom-nav" aria-label="Main navigation">{[["lessons", "Lessons"], ["progress", "Progress"], ["support", "Support"]].map(([id, title]) => <button key={id} aria-current={active === id ? "page" : undefined} onClick={() => onNavigate(id)}><span><Icon name={id} /></span>{title}</button>)}</nav>;
}
export function LessonArt({ lesson }) { return <div className={`lesson-art art-${lesson.id}`}>{lesson.image ? <Asset name={lesson.image} /> : <LessonThumb id={lesson.id} />}</div>; }
const formatDay = (date) => date && !Number.isNaN(Date.parse(date)) ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;
export function LessonCard({ lesson, finished, onOpen, compact = false, progress }) {
  const parts = [["Tutorial", lesson.keys[0]], ["Guided practice", lesson.keys[1]]].map(([label, key]) => ({ label, done: Boolean(progress?.[key]), day: formatDay(progress?.completedAt?.[key]) }));
  const doneCount = parts.filter((part) => part.done).length;
  return <article className={`learn-lesson-card ${compact ? "is-completed" : ""}`}><LessonArt lesson={lesson} /><div className="lesson-card-body"><h2>{lesson.title}</h2><p>{compact ? doneCount === parts.length ? "Tutorial and practice finished" : `${doneCount} of ${parts.length} parts finished` : lesson.description}</p>
    {compact ? <ul className="completed-parts">{parts.map((part) => <li key={part.label} className={part.done ? "done" : ""}><span><Icon name={part.done ? "check" : "smartphone"} /></span><strong>{part.label}</strong><small>{part.done ? part.day ? `Finished ${part.day}` : "Finished" : "Not yet"}</small></li>)}</ul> : <span className={`learn-badge ${finished ? "finished" : ""}`}><Icon name={finished ? "check" : "smartphone"} />{finished ? "Finished" : "Beginner"}</span>}
    <button className={compact ? "learn-outline" : "learn-primary"} onClick={onOpen}>{compact ? "Revisit lesson" : finished ? "Practice again" : "Start lesson"}<Icon name="arrow" /></button>
  </div></article>;
}
export function StepTrail({ step, total, complete = false }) {
  return <ol className="learn-step-trail" aria-label="Lesson steps">{Array.from({ length: total }, (_, i) => <li key={i} className={complete || i + 1 < step ? "done" : i + 1 === step ? "current" : "future"} aria-current={!complete && i + 1 === step ? "step" : undefined}><span>{complete || i + 1 < step ? <Icon name="check" /> : i + 1}</span><span className="sr-only">{complete || i + 1 < step ? "completed" : i + 1 === step ? "current step" : "upcoming"}</span></li>)}</ol>;
}
export function LessonMenu({ lesson, progress, headingRef, onBack, onStart }) {
  const modes = [["tutorial", "Tutorial", "Follow the glowing buttons, with a clear explanation at every step.", lesson.keys[0]], ["practice", "Guided practice", "Try it without highlights. Ask for a hint whenever you need one.", lesson.keys[1]]];
  return <article className="learn-lesson-menu"><button className="learn-back" onClick={onBack}><Icon name="back" />Lessons</button><div className="lesson-detail-art"><LessonArt lesson={lesson} /><span><Icon name={lesson.icon} />{lesson.category}</span></div><p className="learn-overline">Learn at your own pace</p><h1 className="learn-heading" ref={headingRef} tabIndex={-1}>{lesson.title}</h1><p className="learn-description">{lesson.detail}</p><div className="learn-modes">{modes.map(([id, title, description, key], i) => <button key={id} className="learn-mode" onClick={() => onStart(id)}><span className="mode-number">{progress[key] ? <Icon name="check" /> : i + 1}</span><span><small>{progress[key] ? "Finished" : `${lesson.steps} simple steps`}</small><strong>{title}</strong><span>{description}</span></span><Icon name="chevron" /></button>)}</div></article>;
}
