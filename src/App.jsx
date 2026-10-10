import { useEffect, useRef, useState } from "react";
import { canSpeak, silence, speak } from "./speech.js";
import PlaySession from "./components/PlaySession.jsx";
import CommunitySession from "./components/CommunitySession.jsx";
import ExtraLessonSession from "./components/ExtraLessonSession.jsx";
import { EXTRA_LESSONS } from "./extraLessons.js";
import { Asset, Brand, Icon, BottomNav, LessonCard, LessonMenu, LESSONS } from "./components/LearningUI.jsx";

const STORAGE_KEY = "techtown-progress-v1";
const EMPTY_PROGRESS = { speech: false, tutorial: false, practice: false, mission: false, communityTutorial: false, callTutorial: false, safetyTutorial: false };
function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function lessonFinished(lesson, progress) { return lesson.keys.some((key) => progress[key]); }

export default function App() {
  const [progress, setProgress] = useState(() => ({ ...EMPTY_PROGRESS, ...readStored(STORAGE_KEY, {}) }));
  const [view, setView] = useState(() => ({ name: readStored("ilearn-welcome-v1", false) ? "lessons" : "welcome" }));
  const [theme, setTheme] = useState(() => readStored("ilearn-theme-v1", "light") === "dark" ? "dark" : "light");
  const [storageError, setStorageError] = useState(false);
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const headingRef = useRef(null);
  const playing = ["play", "community-play", "extra-play"].includes(view.name);
  const currentLesson = LESSONS.find((lesson) => lesson.id === view.lessonId);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [progress]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => { meta.content = theme === "dark" ? "#18191c" : "#fafaf8"; });
    try { localStorage.setItem("ilearn-theme-v1", JSON.stringify(theme)); } catch { setStorageError(true); }
  }, [theme]);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); }, [view]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); silence(); };
  }, []);
  function navigate(name) { setView({ name }); }
  function mark(key) {
    setProgress((current) => ({ ...current, [key]: true, completedAt: { ...current.completedAt, [key]: current.completedAt?.[key] ?? new Date().toISOString() } }));
  }
  function toggleSpeech() {
    const enabled = !progress.speech;
    setProgress((current) => ({ ...current, speech: enabled }));
    if (enabled && canSpeak()) speak("Spoken instructions are on."); else silence();
  }
  function openLesson(lessonId) { setView({ name: "lesson", lessonId }); }
  function startLesson(lessonId, mode = "tutorial") {
    setView(lessonId === "family" ? { name: "play", mode, lessonId } : lessonId === "community" ? { name: "community-play", lessonId } : { name: "extra-play", lessonId });
  }
  const completed = LESSONS.filter((lesson) => lessonFinished(lesson, progress));
  const filtered = LESSONS.filter((lesson) => (filter === "All" || lesson.category === filter) && `${lesson.title} ${lesson.description}`.toLowerCase().includes(query.toLowerCase().trim()));
  if (view.name === "welcome") return (
    <main className="ilearn-app welcome" id="main">
      <Asset name="s0-cover-a" className="welcome-photo" /><div className="welcome-shade" /><Brand />
      <div className="welcome-copy"><p className="welcome-eyebrow">A little practice. A lot more confidence.</p><h1>Learn your iPhone,<br />one simple step<br />at a time.</h1><p>Friendly lessons. Your own pace.</p>
        <button className="learn-primary" onClick={() => { try { localStorage.setItem("ilearn-welcome-v1", "true"); } catch { setStorageError(true); } navigate("lessons"); }}>Get started <Icon name="arrow" /></button>
      </div>
    </main>
  );
  return (
    <div className={`ilearn-app ${playing ? "is-learning" : ""}`}>
      <a className="skip" href="#main">Skip to content</a>
      <div className="learn-shell">
        <header className="learn-header">{playing ? <><button className="learn-back" onClick={() => openLesson(view.lessonId)}><Icon name="back" />Lessons</button><strong className="walkthrough-title">{currentLesson?.title}</strong></> : <Brand />}<div className="header-actions">
          <button className="learn-icon-button" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} onClick={() => setTheme(theme === "light" ? "dark" : "light")}><Icon name={theme === "light" ? "moon" : "sun"} /></button>
          {view.name === "lessons" && <button className="learn-icon-button" aria-label="Search lessons" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><Icon name="search" /></button>}
          {playing && <button className="learn-icon-button" aria-label={`Spoken instructions ${progress.speech ? "on" : "off"}`} aria-pressed={progress.speech} onClick={toggleSpeech}><Icon name="volume" /></button>}
        </div></header>
        {offline && <p className="learn-notice" role="status">You're offline. All practice lessons still work.</p>}
        {storageError && <p className="learn-notice" role="status">Your browser couldn't save progress. You can keep practicing in this visit.</p>}
        <main id="main" className="learn-main">
          {view.name === "lessons" && <>
            <p className="learn-overline">Ready to learn,</p><h1 className="learn-heading" ref={headingRef} tabIndex={-1}>Your lessons</h1>
            {searchOpen && <label className="learn-search"><Icon name="search" /><span className="sr-only">Search lessons</span><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a lesson…" type="search" /></label>}
            <div className="lesson-banner"><Asset name="s0-lessons-hero" /><div><h2>Take it slow</h2><p>Every lesson breaks a task into small, clear steps.</p></div></div>
            <div className="learn-filters" aria-label="Filter lessons">{["All", "iPhone basics", "Apps", "Calls & messages", "Photos"].map((item) => <button key={item} aria-pressed={filter === item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
            <div className="lesson-feed">{filtered.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} finished={lessonFinished(lesson, progress)} onOpen={() => openLesson(lesson.id)} />)}</div>
            {!filtered.length && <div className="learn-empty"><Icon name="search" /><h2>No lessons found</h2><p>Try a different word or browse all four lessons.</p><button className="learn-primary" onClick={() => { setFilter("All"); setQuery(""); }}>Show all lessons</button></div>}
          </>}
          {view.name === "lesson" && currentLesson && <LessonMenu lesson={currentLesson} progress={progress} headingRef={headingRef} onBack={() => navigate("lessons")} onStart={(mode) => startLesson(currentLesson.id, mode)} />}
          {view.name === "play" && <PlaySession key={view.mode} mode={view.mode} speechOn={progress.speech} onToggleSpeech={toggleSpeech} onBack={() => openLesson("family")} onTutorialDone={() => mark("tutorial")} onPracticeDone={() => mark("practice")} onMissionDone={() => mark("mission")} onPractice={() => startLesson("family", "practice")} onMission={() => startLesson("family", "game")} onTown={() => navigate("lessons")} />}
          {view.name === "community-play" && <CommunitySession speechOn={progress.speech} onBack={() => openLesson("community")} onDone={() => mark("communityTutorial")} onTown={() => navigate("lessons")} />}
          {view.name === "extra-play" && <ExtraLessonSession key={view.lessonId} lessonId={view.lessonId} speechOn={progress.speech} onToggleSpeech={toggleSpeech} onBack={() => openLesson(view.lessonId)} onDone={() => mark(EXTRA_LESSONS[view.lessonId].progressKey)} onTown={() => navigate("lessons")} />}
          {view.name === "progress" && <>
            <p className="learn-overline">Look how far</p><h1 className="learn-heading" ref={headingRef} tabIndex={-1}>You've come</h1>
            <div className="milestone"><Asset name="s0-progress-milestones" /><div><strong>{completed.length}</strong><h2>{completed.length === 1 ? "Lesson learned" : "Lessons learned"}</h2><p>Every small step is a big win.</p></div></div>
            <h2 className="learn-section-title">Your completed lessons</h2>
            {completed.length ? <div className="lesson-feed">{completed.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} finished onOpen={() => openLesson(lesson.id)} compact date={lesson.keys.map((key) => progress.completedAt?.[key]).filter(Boolean).sort().at(-1)} />)}</div> : <div className="learn-empty"><Icon name="progress" /><h2>Your first win is waiting</h2><p>Finish any lesson and you'll see it here. There's no rush.</p><button className="learn-primary" onClick={() => navigate("lessons")}>Explore lessons <Icon name="arrow" /></button></div>}
          </>}
          {view.name === "support" && <Support headingRef={headingRef} onLessons={() => navigate("lessons")} onSpeak={toggleSpeech} speechOn={progress.speech} />}
        </main>
        <footer className="learn-disclaimer">A safe practice space. Fictional people.<br />No real calls or messages are sent.</footer>
      </div>
      {!playing && <BottomNav active={view.name === "lesson" ? "lessons" : view.name} onNavigate={navigate} />}
    </div>
  );
}
function Support({ headingRef, onLessons, onSpeak, speechOn }) {
  const faqs = [
    ["How do these lessons work?", "Choose any lesson, then tap the highlighted buttons on the practice phone. You can replay steps, start over, and practice as often as you like. Nothing is sent to a real person."],
    ["How do I make the text bigger?", "On your own iPhone, open Settings, then Display & Brightness, then Text Size. Move the slider to the right. You can also zoom this learning page using your browser's zoom controls."],
    ["Can I hear the instructions?", "Yes. Turn on spoken instructions below or use Hear this during a lesson. If your browser doesn't support speech, all instructions are also written on screen."],
    ["Do I have to finish lessons in order?", "No. Every lesson is open from the start. Pick the task you'd like to learn and go at your own pace."],
    ["Where is my progress saved?", "Your progress stays in this browser on this device. Clearing browser storage will remove it. There is no account or cloud sync."],
  ];
  return <>
    <div className="support-hero"><Asset name="s0-support-help" /><div><h1 ref={headingRef} tabIndex={-1}>We're here to help</h1><p>A little guidance, whenever you need it.</p></div></div>
    <button className="learn-primary" onClick={onLessons}><Icon name="lessons" /> Find a practice lesson <Icon name="arrow" /></button>
    <p className="support-note">Tutor calls aren't available in this practice app. The guides below can help you get started.</p>
    <h2 className="learn-section-title">Common questions</h2><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<Icon name="chevron" /></summary><p>{answer}</p></details>)}</div>
    <div className="resource-card"><span className="resource-icon"><Icon name="volume" /></span><div><h2>Listen as you learn</h2><p>Instructions read aloud, at your pace.</p><button className="learn-outline" aria-pressed={speechOn} onClick={onSpeak}>Spoken instructions: {speechOn ? "On" : "Off"}</button></div></div>
    <div className="resource-card"><span className="resource-icon"><Icon name="lessons" /></span><div><h2>Useful iPhone guides</h2><p>Keep a simple guide handy for next time.</p><button className="learn-outline" onClick={() => window.print()}>Print these help tips <Icon name="arrow" /></button></div></div>
  </>;
}
