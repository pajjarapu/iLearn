import { useEffect, useMemo, useState } from "react";
import {
  createPhone,
  getGuidance,
  hasSentFlowers,
  listUserSends,
  matchesTarget,
  nextSnapshots,
  observationFor,
  reducePhone,
  rewindSnapshot,
  sendSummary,
} from "../logic.js";
import { canSpeak, silence, speak } from "../speech.js";
import Phone from "./Phone.jsx";
import { StepTrail } from "./LearningUI.jsx";

const MODE_LABELS = {
  tutorial: "Tutorial",
  practice: "Guided practice",
};

export default function PlaySession({
  mode,
  speechOn,
  onToggleSpeech,
  onBack,
  onTutorialDone,
  onPracticeDone,
  onPractice,
  onTown,
}) {
  const [phone, setPhone] = useState(() => createPhone());
  const [snaps, setSnaps] = useState(() => [createPhone()]);
  const [note, setNote] = useState(null);
  const [helpOn, setHelpOn] = useState(false);
  const [controlNote, setControlNote] = useState(null);
  const [celebrated, setCelebrated] = useState(false);
  const [phoneAlert, setPhoneAlert] = useState(null);

  const guidance = useMemo(() => getGuidance(phone), [phone]);
  const sends = useMemo(() => listUserSends(phone), [phone]);
  const highlight =
    guidance.complete
      ? null
      : mode === "tutorial"
        ? guidance.target
        : mode === "practice" && helpOn
          ? guidance.target
          : null;

  const spoken = useMemo(
    () => spokenText({ mode, guidance, note, helpOn, sends }),
    [mode, guidance, note, helpOn, sends],
  );

  useEffect(() => {
    if (!speechOn) {
      silence();
      return;
    }
    speak(spoken);
  }, [speechOn, spoken]);

  useEffect(() => () => silence(), []);

  useEffect(() => {
    if (!guidance.complete || celebrated) return;
    setCelebrated(true);
    if (mode === "tutorial") onTutorialDone();
    if (mode === "practice") onPracticeDone();
  }, [guidance.complete, celebrated, mode, onTutorialDone, onPracticeDone]);

  function dispatch(action) {
    const next = reducePhone(phone, action);
    const observation = observationFor(mode, phone, action, next);
    const expected = getGuidance(phone);
    const quietAction = action.type === "set-text" || action.type === "toggle-scale";
    const unsupportedAttachment = action.type === "unsupported-attachment";
    const isWrongTap =
      unsupportedAttachment ||
      (!quietAction && !matchesTarget(expected.target, action));

    setPhoneAlert(
      isWrongTap
        ? {
            title: unsupportedAttachment ? `${action.label} is not available` : "Try a different button",
            message: unsupportedAttachment
              ? "For this lesson, tap Photos to choose the saved picture of the garden flowers."
              : observation ?? `That was not the next step. ${expected.body}`,
          }
        : null,
    );
    setPhone(next);
    setSnaps((current) => nextSnapshots(current, next));
    if (action.type !== "set-text" && action.type !== "toggle-scale") {
      setNote(observation);
    }
    setControlNote(null);
    if (matchesTarget(getGuidance(phone).target, action)) {
      setHelpOn(false);
    }
    const before = canonicalProgress(phone);
    const after = canonicalProgress(next);
    if (after !== null && after !== before) {
      setHelpOn(false);
    }
  }

  function restore(nextPhone, nextSnaps, message) {
    setPhone(nextPhone);
    setSnaps(nextSnaps);
    setNote(null);
    setHelpOn(false);
    setControlNote(message);
  }

  function replayStep() {
    if (hasSentFlowers(phone)) {
      setControlNote("This activity is already complete. Start over begins it again. Your unlock stays.");
      return;
    }
    const current = snaps[snaps.length - 1];
    if (JSON.stringify(current) === JSON.stringify(phone)) {
      setControlNote("This step is already at the start. Take the next tap when you are ready.");
      return;
    }
    restore(structuredClone(current), snaps, "This step is back to the start.");
  }

  function previousStep() {
    if (hasSentFlowers(phone)) {
      setControlNote("This activity is already complete. Start over begins it again. Your unlock stays.");
      return;
    }
    const rewound = rewindSnapshot(snaps);
    if (!rewound) {
      setControlNote("This is the first step. Back returns to the lesson menu.");
      return;
    }
    restore(rewound.phone, rewound.snaps, null);
  }

  function startOver() {
    const fresh = createPhone();
    restore(fresh, [fresh], "Starting this activity again. Your neighborhood progress stays.");
    setCelebrated(false);
  }

  function askHelp() {
    setHelpOn(true);
    setControlNote(null);
  }

  return (
    <section className="play">
      <div className="coach">
        <div className="control-row">
          <button type="button" className="secondary-btn" onClick={onBack}>
            Back
          </button>
          {mode === "tutorial" ? (
            <button type="button" className="secondary-btn" onClick={previousStep}>
              Previous step
            </button>
          ) : null}
          {mode === "tutorial" ? (
            <button type="button" className="secondary-btn" onClick={replayStep}>
              Replay step
            </button>
          ) : null}
          <button type="button" className="secondary-btn" onClick={startOver}>
            {mode === "tutorial" ? "Start over" : "Replay"}
          </button>
          {mode !== "tutorial" ? (
            <button type="button" className="secondary-btn" onClick={askHelp}>
              Help me
            </button>
          ) : null}
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              if (!canSpeak()) {
                setControlNote("This browser cannot read instructions aloud. The words stay on the screen.");
                return;
              }
              speak(spoken);
            }}
          >
            Hear this
          </button>
        </div>

        {mode === "tutorial" && <StepTrail step={guidance.step} total={guidance.stepCount || 6} complete={guidance.complete} />}
        <p className="mode-kicker">Send a photo · {MODE_LABELS[mode]}</p>
        {guidance.complete ? (
          <Success
            mode={mode}
            sends={sends}
            onPractice={onPractice}
            onTown={onTown}
            onReplay={startOver}
          />
        ) : (
          <Instruction
            mode={mode}
            guidance={guidance}
            note={note}
            helpOn={helpOn}
          />
        )}
        {controlNote ? (
          <p className="note-card" role="status">
            <strong>Note.</strong> {controlNote}
          </p>
        ) : null}
      </div>
      <Phone
        phone={phone}
        highlight={highlight}
        alert={phoneAlert}
        speechOn={speechOn}
        onToggleSpeech={onToggleSpeech}
        onDismissAlert={() => setPhoneAlert(null)}
        onAction={dispatch}
      />
    </section>
  );
}

function canonicalProgress(phone) {
  if (hasSentFlowers(phone)) return 6;
  return getGuidance(phone).step;
}

function Instruction({ mode, guidance, note, helpOn }) {
  return (
    <div className="instruction" aria-live="polite">
      {mode === "practice" ? (
        <>
          <h2>Send the garden photo</h2>
          <p>Send Maya the photo labeled Garden flowers. The buttons stay quiet unless you tap Help me.</p>
        </>
      ) : null}
      {mode === "tutorial" ? (
        <>
          <p className="step-count">
            {guidance.step ? `Step ${guidance.step} of ${guidance.stepCount}` : "When you are ready"}
          </p>
          <h2>{guidance.title}</h2>
          <p>{guidance.body}</p>
        </>
      ) : null}
      {note ? (
        <p className="note-card">
          <strong>Note.</strong> {note}
        </p>
      ) : null}
      {mode === "practice" && helpOn ? (
        <div className="hint-card">
          <p className="step-count">Hint</p>
          <h3>{guidance.title}</h3>
          <p>{guidance.body}</p>
        </div>
      ) : null}
      {mode === "tutorial" && guidance.term ? (
        <div className="term-card">
          <p className="step-count">{guidance.term.name}</p>
          <p>{guidance.term.text}</p>
        </div>
      ) : null}
      {mode === "practice" && helpOn && guidance.term ? (
        <div className="term-card">
          <p className="step-count">{guidance.term.name}</p>
          <p>{guidance.term.text}</p>
        </div>
      ) : null}
    </div>
  );
}

function Success({ mode, sends, onPractice, onTown, onReplay }) {
  return (
    <div className="instruction" aria-live="polite">
      <p className="step-count">
        <span className="done-mark" aria-hidden="true">
          ✓
        </span>{" "}
        Done
      </p>
      {mode === "tutorial" ? (
        <>
          <h2>You finished the tour</h2>
          <p>You opened Messages, chose Maya, and sent the garden photo. You can try the same task without the highlights.</p>
        </>
      ) : null}
      {mode === "practice" ? (
        <>
          <h2>You sent it yourself</h2>
          <p>The garden photo reached Maya without the buttons lighting up for you.</p>
        </>
      ) : null}
      <h3>What you sent</h3>
      <ul className="recap">
        {sends.map((row) => (
          <li key={row.id}>{sendSummary(row)}</li>
        ))}
      </ul>
      <div className="success-actions">
        {mode === "tutorial" ? (
          <button type="button" className="primary-btn" onClick={onPractice}>
            Try guided practice
          </button>
        ) : null}
        <button type="button" className={mode === "practice" ? "primary-btn" : "secondary-btn"} onClick={onTown}>Back to lessons</button>
        <button type="button" className="secondary-btn" onClick={onReplay}>
          Start over
        </button>
      </div>
    </div>
  );
}

function spokenText({ mode, guidance, note, helpOn, sends }) {
  if (guidance.complete) {
    const recap = sends.map((row) => sendSummary(row)).join(" ");
    if (mode === "practice") {
      return `You sent the garden photo to Maya. ${recap}`;
    }
    return `You finished the tour. Maya has the garden photo. ${recap}`;
  }

  const parts = [];
  if (mode === "practice") {
    parts.push("Send Maya the photo labeled Garden flowers.");
    if (helpOn) parts.push(guidance.title, guidance.body);
  } else {
    if (guidance.step) parts.push(`Step ${guidance.step} of ${guidance.stepCount}.`);
    parts.push(guidance.title, guidance.body);
    if (guidance.term) parts.push(`${guidance.term.name}. ${guidance.term.text}`);
  }
  if (note) parts.push(note);
  return parts.filter(Boolean).join(" ");
}
