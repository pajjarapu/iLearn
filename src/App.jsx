import { useEffect, useRef, useState } from "react";
import { PLACES } from "./logic.js";
import { canSpeak, silence, speak } from "./speech.js";
import { CheckIcon, PlaceArt } from "./components/art.jsx";
import PlaySession from "./components/PlaySession.jsx";
import CommunitySession from "./components/CommunitySession.jsx";

const STORAGE_KEY = "techtown-progress-v1";

const EMPTY_PROGRESS = {
  speech: false,
  tutorial: false,
  practice: false,
  mission: false,
  communityTutorial: false,
};

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return { ...EMPTY_PROGRESS, ...saved };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [view, setView] = useState({ name: "town" });
  const headingRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [view]);

  function toggleSpeech() {
    setProgress((current) => {
      const speech = !current.speech;
      if (speech) {
        if (canSpeak()) speak("Spoken instructions are on.");
      } else {
        silence();
      }
      return { ...current, speech };
    });
  }

  function mark(key) {
    setProgress((current) => ({ ...current, [key]: true }));
  }

  const place = PLACES.find((item) => item.id === view.placeId);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <div>
            <p className="eyebrow">A practice town</p>
            <p className="brand">TechTown</p>
          </div>
          <button
            type="button"
            className="speech-toggle"
            aria-pressed={progress.speech}
            onClick={toggleSpeech}
          >
            <span>Spoken instructions</span>
            <strong>{progress.speech ? "On" : "Off"}</strong>
          </button>
        </div>
      </header>
      <main id="main" className="site-main">
        {view.name === "town" ? (
          <Town
            headingRef={headingRef}
            mission={progress.mission}
            onOpenLesson={() => setView({ name: "lesson" })}
            onOpenPlace={(placeId) =>
              setView(
                placeId === "community" && progress.mission
                  ? { name: "community" }
                  : { name: "future", placeId },
              )
            }
          />
        ) : null}
        {view.name === "future" && place ? (
          <FuturePlace headingRef={headingRef} place={place} onBack={() => setView({ name: "town" })} />
        ) : null}
        {view.name === "lesson" ? (
          <LessonMenu
            headingRef={headingRef}
            progress={progress}
            onBack={() => setView({ name: "town" })}
            onPlay={(mode) => setView({ name: "play", mode })}
          />
        ) : null}
        {view.name === "community" ? (
          <CommunityLesson
            headingRef={headingRef}
            done={progress.communityTutorial}
            onBack={() => setView({ name: "town" })}
            onPlay={() => setView({ name: "community-play" })}
          />
        ) : null}
        {view.name === "community-play" ? (
          <CommunitySession
            speechOn={progress.speech}
            onBack={() => setView({ name: "community" })}
            onDone={() => mark("communityTutorial")}
            onTown={() => setView({ name: "town" })}
          />
        ) : null}
        {view.name === "play" ? (
          <PlaySession
            key={view.mode}
            mode={view.mode}
            speechOn={progress.speech}
            onToggleSpeech={toggleSpeech}
            onBack={() => setView({ name: "lesson" })}
            onTutorialDone={() => mark("tutorial")}
            onPracticeDone={() => mark("practice")}
            onMissionDone={() => mark("mission")}
            onPractice={() => setView({ name: "play", mode: "practice" })}
            onMission={() => setView({ name: "play", mode: "game" })}
            onTown={() => setView({ name: "town" })}
          />
        ) : null}
      </main>
      <footer className="site-footer">
        <p>Fictional people and photos. No real messages are sent.</p>
      </footer>
    </>
  );
}

function Town({ headingRef, mission, onOpenLesson, onOpenPlace }) {
  const nextPlaceId = mission ? "community" : null;

  return (
    <div className="town">
      <div className="hero">
        <h1 ref={headingRef} tabIndex={-1}>
          Build confidence, one everyday task at a time.
        </h1>
        <p className="pitch">
          TechTown helps people build confidence with everyday technology through guided tutorials and
          interactive game missions.
        </p>
      </div>
      {mission ? (
        <>
          <p className="unlock-banner" role="status">
            <CheckIcon />
            <span>
              <strong>Family house is unlocked.</strong> You sent Maya the garden photo.
            </span>
          </p>
          <p className="note-card" role="status">
            <strong>Next step:</strong> Community center is ready to explore.
          </p>
        </>
      ) : null}
      <ol className="how">
        <li>
          <span>1</span>
          <div>
            <strong>Tutorial.</strong> We point to each button and explain the words.
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Guided practice.</strong> You try the same task. Help me is there if you want it.
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>Game mission.</strong> A short story asks you to use the skill on your own.
          </div>
        </li>
      </ol>
      <h2>Your neighborhood</h2>
      <div className="places">
        {PLACES.map((item) => {
          const unlocked = (item.id === "family" || item.id === "community") && mission;
          const isNextStep = item.id === nextPlaceId;
          return (
            <button
              key={item.id}
              type="button"
              className={`place ${item.id === "family" ? "featured" : ""} ${item.future && !unlocked ? "is-future" : ""} ${isNextStep ? "is-next-step" : ""}`}
              onClick={() => (item.id === "family" ? onOpenLesson() : onOpenPlace(item.id))}
            >
              <PlaceArt id={item.id} unlocked={unlocked} />
              <span className="kicker">
                {unlocked ? (
                  <>
                    <CheckIcon /> Unlocked
                  </>
                ) : isNextStep ? (
                  <>
                    <CheckIcon /> Next step
                  </>
                ) : (
                  item.kicker
                )}
              </span>
              <span className="place-name">{item.name}</span>
              <span className="place-summary">{item.summary}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FuturePlace({ headingRef, place, onBack }) {
  return (
    <article className="sheet">
      <button type="button" className="secondary-btn" onClick={onBack}>
        Back
      </button>
      <p className="kicker plain">Future lesson</p>
      <h1 ref={headingRef} tabIndex={-1}>
        {place.name}
      </h1>
      <PlaceArt id={place.id} unlocked={false} />
      <p>{place.coming}</p>
      <p>Today’s visit is the family house, where you practice sending a photo.</p>
      <button type="button" className="primary-btn" onClick={onBack}>
        Return to the neighborhood
      </button>
    </article>
  );
}

function CommunityLesson({ headingRef, done, onBack, onPlay }) {
  return (
    <article className="sheet">
      <button type="button" className="secondary-btn" onClick={onBack}>
        Back
      </button>
      <p className="kicker plain">Community center</p>
      <h1 ref={headingRef} tabIndex={-1}>
        Add a calendar reminder
      </h1>
      <PlaceArt id="community" unlocked />
      <p>
        Find Book club in the practice Calendar and add a reminder for one day before the event.
      </p>
      <button type="button" className="mode-card" onClick={onPlay}>
        <span className="kicker">
          {done ? <><CheckIcon /> Finished</> : "Part 1"}
        </span>
        <span className="place-name">Tutorial</span>
        <span className="place-summary">
          We highlight Calendar, Book club, and each reminder button in order.
        </span>
      </button>
    </article>
  );
}

function LessonMenu({ headingRef, progress, onBack, onPlay }) {
  const modes = [
    {
      id: "tutorial",
      name: "Tutorial",
      detail: "We show the next button, explain the icons, and let you replay any step.",
      done: progress.tutorial,
    },
    {
      id: "practice",
      name: "Guided practice",
      detail: "You repeat the task without highlights. Tap Help me when you want a hint.",
      done: progress.practice,
    },
    {
      id: "game",
      name: "Game mission",
      detail: "Maya wants to see your garden. Send her the flower photo on your own.",
      done: progress.mission,
    },
  ];

  return (
    <article className="sheet">
      <button type="button" className="secondary-btn" onClick={onBack}>
        Back
      </button>
      <p className="kicker plain">Family house</p>
      <h1 ref={headingRef} tabIndex={-1}>
        Send a photo
      </h1>
      <p>
        You will use a practice phone. Open Messages, choose Maya, choose the garden photo, and send it.
        Nothing leaves TechTown.
      </p>
      <div className="mode-list">
        {modes.map((mode, index) => (
          <button key={mode.id} type="button" className="mode-card" onClick={() => onPlay(mode.id)}>
            <span className="kicker">
              {mode.done ? (
                <>
                  <CheckIcon /> Finished
                </>
              ) : (
                `Part ${index + 1}`
              )}
            </span>
            <span className="place-name">{mode.name}</span>
            <span className="place-summary">{mode.detail}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
