import { useEffect, useMemo, useState } from "react";
import { createPhone, reducePhone } from "../logic.js";
import { canSpeak, silence, speak } from "../speech.js";
import Phone from "./Phone.jsx";
import { StepTrail } from "./LearningUI.jsx";

const TARGET_DAY = 13;
const TARGET_REMINDER = "1 day before";

function guidanceFor(phone) {
  if (phone.reminders[TARGET_DAY] === TARGET_REMINDER) {
    return {
      complete: true,
      step: 5,
      target: null,
      title: "Reminder saved",
      body: "Book club will remind you one day before the event.",
    };
  }

  if (phone.screen === "home") {
    return {
      complete: false,
      step: 1,
      target: "app-calendar",
      title: "Open Calendar",
      body: "Tap Calendar. Its icon shows the date and opens your events.",
    };
  }

  if (phone.screen === "calendar") {
    return {
      complete: false,
      step: 2,
      target: "event-13",
      title: "Find Book club",
      body: "In the Events list, tap Book club on October 13.",
    };
  }

  if (phone.screen === "day" && phone.day === TARGET_DAY) {
    return {
      complete: false,
      step: 3,
      target: "add-reminder",
      title: "Add a reminder",
      body: "Tap Add reminder so the phone can alert you before Book club.",
    };
  }

  if (phone.screen === "reminder" && phone.day === TARGET_DAY) {
    if (phone.reminderDraft === TARGET_REMINDER) {
      return {
        complete: false,
        step: 5,
        target: "save-reminder",
        title: "Save the reminder",
        body: "One day before is selected. Tap Done to save it.",
      };
    }
    return {
      complete: false,
      step: 4,
      target: "reminder-day-before",
      title: "Choose one day before",
      body: "Tap 1 day before. This gives you time to prepare for the event.",
    };
  }

  return {
    complete: false,
    step: null,
    target: "back",
    title: "Go back to the Calendar",
    body: "That is not the Book club reminder. Tap Back to return to the previous screen.",
  };
}

function matches(target, action) {
  if (target === "app-calendar") return action.type === "open-app" && action.app === "calendar";
  if (target === "event-13") return action.type === "open-day" && action.day === TARGET_DAY;
  if (target === "add-reminder") return action.type === "open-reminder";
  if (target === "reminder-day-before") {
    return action.type === "select-reminder" && action.value === TARGET_REMINDER;
  }
  if (target === "save-reminder") return action.type === "save-reminder";
  if (target === "back") return action.type === "back";
  return false;
}

export default function CommunitySession({ speechOn, onBack, onDone, onTown }) {
  const [phone, setPhone] = useState(() => createPhone());
  const [alert, setAlert] = useState(null);
  const [celebrated, setCelebrated] = useState(false);
  const guidance = useMemo(() => guidanceFor(phone), [phone]);

  useEffect(() => {
    if (!speechOn) {
      silence();
      return;
    }
    speak(
      guidance.complete
        ? "Tutorial complete. The Book club reminder is saved for one day before."
        : `${guidance.step ? `Step ${guidance.step} of 5. ` : ""}${guidance.title}. ${guidance.body}`,
    );
  }, [speechOn, guidance]);

  useEffect(() => () => silence(), []);

  useEffect(() => {
    if (!guidance.complete || celebrated) return;
    setCelebrated(true);
    onDone();
  }, [guidance.complete, celebrated, onDone]);

  function dispatch(action) {
    const expected = guidanceFor(phone);
    const correct = matches(expected.target, action);
    setAlert(
      correct
        ? null
        : {
            title: "Try a different button",
            message: `That was not the next step. ${expected.body}`,
          },
    );
    setPhone((current) => reducePhone(current, action));
  }

  function startOver() {
    setPhone(createPhone());
    setAlert(null);
    setCelebrated(false);
  }

  const spoken = guidance.complete
    ? "Tutorial complete. The Book club reminder is saved for one day before."
    : `${guidance.title}. ${guidance.body}`;

  return (
    <section className="play">
      <div className="coach">
        <div className="control-row">
          <button type="button" className="secondary-btn" onClick={onBack}>Back</button>
          <button type="button" className="secondary-btn" onClick={startOver}>Start over</button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              if (canSpeak()) speak(spoken);
            }}
          >
            Hear this
          </button>
        </div>

        <StepTrail step={guidance.step} total={5} complete={guidance.complete} />
        <p className="mode-kicker">Add a calendar reminder · Tutorial</p>
        <div className="instruction" aria-live="polite">
          {guidance.complete ? (
            <>
              <p className="step-count"><span className="done-mark" aria-hidden="true">✓</span> Done</p>
              <h2>Reminder saved</h2>
              <p>Book club is on October 13. The phone will remind you one day before.</p>
              <div className="success-actions">
                <button type="button" className="primary-btn" onClick={onTown}>Back to lessons</button>
                <button type="button" className="secondary-btn" onClick={startOver}>Start over</button>
              </div>
            </>
          ) : (
            <>
              <p className="step-count">{guidance.step ? `Step ${guidance.step} of 5` : "When you are ready"}</p>
              <h2>{guidance.title}</h2>
              <p>{guidance.body}</p>
            </>
          )}
        </div>
      </div>
      <Phone
        phone={phone}
        highlight={guidance.complete ? null : guidance.target}
        alert={alert}
        speechOn={speechOn}
        onToggleSpeech={() => {}}
        onDismissAlert={() => setAlert(null)}
        onAction={dispatch}
      />
    </section>
  );
}
