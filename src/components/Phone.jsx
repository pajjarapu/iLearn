import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CALENDAR, CONTACTS, PHOTOS, contactById, photoById } from "../logic.js";
import { Avatar, PhotoArt } from "./art.jsx";
import { PHONE_ICONS } from "../sfIcons.js";

const APPS = [
  { id: "messages", label: "Messages", icon: "bubble", blurb: "Texts" },
  { id: "photos", label: "Photos", icon: "picture", blurb: "Saved pictures" },
  { id: "phone", label: "Phone", icon: "handset", blurb: "Calls" },
  { id: "camera", label: "Camera", icon: "camera", blurb: "New picture" },
  { id: "calendar", label: "Calendar", icon: "grid", blurb: "Dates" },
  { id: "settings", label: "Settings", icon: "sliders", blurb: "Phone choices" },
];

const HOME_APPS = APPS.filter((app) => !["messages", "phone"].includes(app.id));
const DOCK_APPS = APPS.filter((app) => ["messages", "phone"].includes(app.id));

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CONVO_TIMESTAMPS = {
  maya: "9:41 AM",
  luis: "Yesterday",
  sam: "9:15 AM",
  patel: "8:50 AM",
  rosa: "Mon",
};

export default function Phone({ phone, highlight, alert, speechOn, onToggleSpeech, onDismissAlert, onAction }) {
  const shellRef = useRef(null);

  useEffect(() => {
    const root = shellRef.current;
    if (!root || !highlight) return;
    const target = root.querySelector(`[data-target="${CSS.escape(highlight)}"]`);
    if (!target) return;
    const scroller = target.closest(".photo-grid-picker, .bubbles, .phone-body");
    if (!scroller || !root.contains(scroller)) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const isVisible = targetRect.top >= scrollerRect.top && targetRect.bottom <= scrollerRect.bottom;
    if (isVisible) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const centeredTop =
      scroller.scrollTop +
      targetRect.top -
      scrollerRect.top -
      (scrollerRect.height - targetRect.height) / 2;
    scroller.scrollTo({ top: centeredTop, behavior: reduce ? "auto" : "smooth" });
  }, [highlight, phone.screen, phone.contactId, phone.previewPhotoId, phone.day]);

  const titles = {
    home: "Home",
    messages: "Messages",
    thread: contactById(phone.contactId)?.short ?? "Conversation",
    picker: "Choose a photo",
    preview: "Photo",
    photos: "Photos",
    "photo-view": "Saved photo",
    phone: "Phone",
    calling: "Calling",
    camera: "Camera",
    "camera-result": "Snapshot",
    calendar: CALENDAR.month,
    day: "Day",
    reminder: "Reminder",
    settings: "Settings",
    about: "About this phone",
  };

  return (
    <div className="stage">
      <p className="stage-caption">Practice phone. Nothing here is sent to a real person.</p>
      <div
        className="phone-bezel"
        ref={shellRef}
        style={{ fontSize: phone.textScale > 1 ? "19px" : "17px" }}
      >
        <div className={`phone-screen screen-${phone.screen} ${phone.screen === "picker" ? "picker-active" : ""}`.trim()}>
          <div className="status-bar" aria-hidden="true">
            <span className="status-time">
              9:41
              <span className="location-arrow" />
            </span>
            <span className="dynamic-island">
              <span className="island-indicator" />
              <span className="island-camera" />
            </span>
            <span className="status-right">
              <span className="cellular-icon"><i /><i /><i /><i /></span>
              <span className="wifi-icon" />
              <span className="battery"><span className="battery-level" /></span>
            </span>
          </div>
          {!['home', 'messages', 'thread', 'picker', 'calendar', 'day', 'reminder', 'phone', 'phone-contacts', 'call-contact', 'calling', 'qr-camera', 'cafe-menu', 'safety-inbox', 'safety-message', 'safety-report'].includes(phone.screen) ? (
            <div className="phone-toolbar">
              <Tap id="back" highlight={highlight} className="chrome-btn" onClick={() => onAction({ type: "back" })}>
                Back
              </Tap>
              <h2 className="phone-title">{titles[phone.screen] ?? "Phone"}</h2>
              <Tap id="home" highlight={highlight} className="chrome-btn" onClick={() => onAction({ type: "home" })}>
                Home
              </Tap>
            </div>
          ) : null}
          {phone.banner ? (
            <p className="phone-note" role="status">
              <strong>Note.</strong> {phone.banner}
            </p>
          ) : null}
          <div className="phone-body">
            {['qr-camera', 'cafe-menu'].includes(phone.screen) ? <CafeScreens phone={phone} highlight={highlight} onAction={onAction} /> : null}
            {['safety-inbox', 'safety-message', 'safety-report'].includes(phone.screen) ? <SafetyScreens phone={phone} highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "home" ? <HomeScreen highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "messages" ? (
              <MessagesScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "thread" ? (
              <ThreadScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "picker" ? (
              <div className="picker-layout">
                <ThreadScreen phone={phone} highlight={highlight} onAction={onAction} />
                <PickerScreen phone={phone} highlight={highlight} onAction={onAction} />
              </div>
            ) : null}
            {phone.screen === "preview" ? (
              <PreviewScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "photos" ? <PhotosScreen highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "photo-view" ? <PhotoViewScreen phone={phone} /> : null}
            {phone.screen === "phone" ? <RecentCallsScreen highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "phone-contacts" ? <CallsScreen phone={phone} highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "call-contact" ? <CallContactScreen phone={phone} highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "calling" ? (
              <CallingScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "camera" ? <CameraScreen highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "camera-result" ? (
              <CameraResultScreen highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "calendar" ? (
              <CalendarScreen highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "day" ? (
              <DayScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "reminder" ? (
              <ReminderScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "settings" ? (
              <SettingsScreen
                phone={phone}
                speechOn={speechOn}
                onToggleSpeech={onToggleSpeech}
                onAction={onAction}
              />
            ) : null}
            {phone.screen === "about" ? <AboutScreen /> : null}
          </div>
          <div className="home-indicator" aria-hidden="true">
            <span />
          </div>
          {alert ? (
            <div className="phone-alert-backdrop">
              <div className="phone-alert" role="alertdialog" aria-modal="true" aria-labelledby="phone-alert-title">
                <span className="phone-alert-icon" aria-hidden="true">!</span>
                <h3 id="phone-alert-title">{alert.title}</h3>
                <p>{alert.message}</p>
                <button type="button" className="phone-alert-action" onClick={onDismissAlert}>
                  Try again
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Tap({ id, highlight, className = "", children, onClick, ariaLabel, disabled }) {
  const active = highlight === id;
  return (
    <button
      type="button"
      data-target={id}
      className={`${className} ${active ? "is-next" : ""}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {active ? (
        <span className="next-pill" aria-hidden="true">
          Tap here
        </span>
      ) : null}
      {children}
      {active ? <span className="sr-only"> Suggested next tap.</span> : null}
    </button>
  );
}

function HomeScreen({ highlight, onAction }) {
  return (
    <div className="home-screen">
      <p className="sr-only">Choose an app. Each name is written under its picture.</p>
      <div className="app-grid">
        {HOME_APPS.map((app) => (
          <Tap
            key={app.id}
            id={`app-${app.id}`}
            highlight={highlight}
            className={`app-btn app-${app.id}`}
            onClick={() => onAction({ type: "open-app", app: app.id })}
          >
            <AppIcon name={app.icon} />
            <span className="app-label">{app.label}</span>
            <span className="app-blurb">{app.blurb}</span>
          </Tap>
        ))}
      </div>
      <div className="home-search" aria-hidden="true">
        <span>⌕</span> Search
      </div>
      <div className="home-dock" aria-label="Dock">
        {DOCK_APPS.map((app) => (
          <Tap
            key={app.id}
            id={`app-${app.id}`}
            highlight={highlight}
            className={`app-btn app-${app.id}`}
            onClick={() => onAction({ type: "open-app", app: app.id })}
            ariaLabel={app.label}
          >
            <AppIcon name={app.icon} />
            <span className="app-label">{app.label}</span>
          </Tap>
        ))}
      </div>
    </div>
  );
}

function MessagesScreen({ phone, highlight, onAction }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const people = CONTACTS.filter((contact) => {
    if (!needle) return true;
    return (
      contact.name.toLowerCase().includes(needle) ||
      contact.relation.toLowerCase().includes(needle) ||
      contact.who.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="messages-screen">
      <header className="messages-header">
        <h2>Messages</h2>
        <Tap id="compose" highlight={highlight} className="compose-btn" onClick={() => onAction({ type: "messages" })}>
          ✎
        </Tap>
      </header>

      <label className="search-field" aria-label="Search messages">
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
        />
      </label>

      {query ? (
        <button type="button" className="text-btn clear-search" onClick={() => setQuery("")}>
          Clear search
        </button>
      ) : null}

      {people.length === 0 ? (
        <p className="phone-note">
          <strong>Note.</strong> No one on this practice phone matches that search. You can clear it and look for Maya.
        </p>
      ) : (
        <ul className="conversation-list">
          {people.map((contact) => {
            const last = phone.threads[contact.id][phone.threads[contact.id].length - 1];
            const unread = contact.id === "maya" && last?.from === "them";
            return (
              <li key={contact.id}>
                <Tap
                  id={`contact-${contact.id}`}
                  highlight={highlight}
                  className={`conversation-item ${unread ? "unread" : ""}`.trim()}
                  onClick={() => onAction({ type: "open-contact", contactId: contact.id })}
                >
                  <Avatar initials={contact.initials} />
                  <div className="conversation-copy">
                    <div className="conversation-meta">
                      <span className="person-name">{contact.name}</span>
                      <time>{CONVO_TIMESTAMPS[contact.id] ?? "Now"}</time>
                    </div>
                    <div className="conversation-preview-row">
                      <span className="person-preview">{last?.text ?? contact.preview}</span>
                      {unread ? <span className="unread-dot" aria-label="Unread message" /> : null}
                    </div>
                  </div>
                </Tap>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ThreadScreen({ phone, highlight, onAction }) {
  const contact = contactById(phone.contactId);
  const messages = phone.threads[phone.contactId] ?? [];
  const draft = phone.drafts[phone.contactId] ?? { text: "", photoId: null };
  const draftPhoto = photoById(draft.photoId);
  const endRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const lastOutgoing = [...messages].reverse().find((message) => message.from === "me");
  const sendReady = Boolean(draft.text.trim() || draftPhoto);

  useEffect(() => {
    const end = endRef.current;
    if (!end) return;
    const bubbles = end.previousElementSibling;
    const scroller = phone.screen === "picker" && bubbles?.classList.contains("bubbles")
      ? bubbles
      : end.closest(".phone-body");
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [messages.length, phone.screen]);

  // Fit the attachment menu inside the phone screen so every option can be scrolled to, then bring Photos into view.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menuOpen || !menu) return;
    const screen = menu.closest(".phone-screen");
    const header = screen?.querySelector(".conversation-header");
    const topLimit = (header ?? screen)?.getBoundingClientRect()[header ? "bottom" : "top"] ?? 0;
    const menuBottom = menu.getBoundingClientRect().bottom;
    menu.style.maxHeight = `${Math.max(140, menuBottom - topLimit - 8)}px`;
    const photos = menu.querySelector(".attachment-option.photos-option");
    if (photos && photos.offsetTop + photos.offsetHeight > menu.clientHeight) {
      menu.scrollTop = photos.offsetTop - 28;
    }
  }, [menuOpen]);

  if (!contact) return null;

  return (
    <div className="thread">
      <header className="conversation-header">
        <Tap id="back" highlight={highlight} className="back-btn" onClick={() => onAction({ type: "back" })} ariaLabel="Back to Messages">
          <span aria-hidden="true">‹</span>
          <span className="back-count" aria-hidden="true">1</span>
        </Tap>
        <div className="thread-user">
          <Avatar initials={contact.initials} />
          <span className="thread-contact-copy">
            <span className="thread-name">{contact.name}<span className="contact-chevron" aria-hidden="true">›</span></span>
            <span className="thread-relation">{contact.relation}</span>
          </span>
        </div>
        <span className="video-call" role="img" aria-label="Video call unavailable in this practice phone">
          <svg viewBox="0 0 32 24" aria-hidden="true">
            <rect x="2" y="4" width="19" height="16" rx="4" />
            <path d="M21 9l8-4v14l-8-4z" />
          </svg>
        </span>
      </header>

      <ol className="bubbles">
        {messages.map((message, index) => {
          const photo = photoById(message.photoId);
          const isMine = message.from === "me";
          const showStatus = isMine && index === messages.length - 1;
          return (
            <li key={message.id} className={isMine ? "mine" : "theirs"}>
              {photo ? (
                <figure className="bubble-photo">
                  <PhotoArt id={photo.id} />
                  <figcaption>{photo.label}</figcaption>
                </figure>
              ) : null}
              {message.text ? <p>{message.text}</p> : null}
              {showStatus ? <span className="message-status">Delivered</span> : null}
            </li>
          );
        })}
      </ol>
      <div ref={endRef} className="message-end" aria-hidden="true" />

      <div className="composer">
        <div className="attachment-wrap">
          <Tap
            id="attach"
            highlight={highlight}
            className="composer-photo"
            onClick={() => setMenuOpen((open) => !open)}
          >
            +
          </Tap>
          {menuOpen ? (
            <div ref={menuRef} className="attachment-menu" role="menu" aria-label="Attachment options">
              {[
                { label: "Camera", icon: "◉", style: "camera" },
                { label: "Photos", icon: "✿", style: "photos", active: true },
                { label: "Stickers", icon: "◕", style: "stickers" },
                { label: "Apple Cash", icon: "$", style: "cash" },
                { label: "Polls", icon: "☰", style: "polls" },
                { label: "Audio", icon: "Ⅱ", style: "audio" },
                { label: "Store", icon: "A", style: "store" },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className={`attachment-option ${option.active ? "photos-option" : ""} ${option.active && highlight === "attach" ? "is-next attachment-photos-target" : ""}`.trim()}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onAction(
                      option.active
                        ? { type: "open-picker" }
                        : { type: "unsupported-attachment", label: option.label },
                    );
                  }}
                >
                  <span className={`attachment-icon ${option.style}`} aria-hidden="true">{option.icon}</span>
                  <span>{option.label}</span>
                  {option.active && highlight === "attach" ? (
                    <span className="attachment-tap-pill" aria-hidden="true">Tap here</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="composer-input-wrap">
          {draftPhoto ? (
            <div className="draft-photo-inline">
              <div className="draft-photo-wrap">
                <PhotoArt id={draftPhoto.id} />
                <Tap
                  id="remove-draft"
                  highlight={highlight}
                  className="remove-draft"
                  onClick={() => onAction({ type: "remove-draft" })}
                  ariaLabel="Remove photo"
                >
                  ×
                </Tap>
              </div>
            </div>
          ) : null}

          <label className="field grow composer-field">
            <span className="sr-only">Message</span>
            <input
              value={draft.text}
              onChange={(event) => onAction({ type: "set-text", text: event.target.value })}
              placeholder={draftPhoto ? "" : "iMessage"}
            />
          </label>
        </div>

        <Tap
          id="send"
          highlight={highlight}
          className={`send-btn ${sendReady ? "ready" : ""}`.trim()}
          onClick={() => onAction({ type: "send" })}
            ariaLabel={sendReady ? "Send message" : "Send message, unavailable until you add content"}
            disabled={!sendReady}
        >
            <span aria-hidden="true">↑</span>
        </Tap>
      </div>
    </div>
  );
}

function PickerScreen({ highlight, onAction }) {
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);

  return (
    <div className="photo-picker">
      <div className="photo-picker-toolbar">
        <span className="picker-album">Photos</span>
        <span className="picker-count">Select a photo</span>
        <span className="picker-spacer" aria-hidden="true" />
      </div>
      <div className="photo-grid photo-grid-picker">
        {PHOTOS.map((photo) => {
          const isTutorialTarget = highlight === `photo-${photo.id}`;
          const isSelected = selectedPhotoId === photo.id;
          return (
            <button
              key={photo.id}
              type="button"
              className={`photo-tile ${isTutorialTarget ? "tutorial-target" : ""} ${isSelected ? "selected" : ""}`.trim()}
              aria-label={`${photo.label}${isTutorialTarget ? ", suggested next photo" : ""}`}
              aria-pressed={isSelected}
              onClick={() => {
                setSelectedPhotoId(photo.id);
                onAction({ type: "select-photo", photoId: photo.id });
              }}
            >
              <PhotoArt id={photo.id} />
              {isTutorialTarget ? (
                <span className="photo-tutorial-label" aria-hidden="true">Tap Garden flowers</span>
              ) : null}
              <span className="photo-selection" aria-hidden="true">{isSelected ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewScreen({ phone, highlight, onAction }) {
  const photo = photoById(phone.previewPhotoId);
  if (!photo) return null;
  return (
    <div className="preview preview-sheet">
      <div className="preview-header">
        <Tap id="close-preview" highlight={highlight} className="sheet-close light" onClick={() => onAction({ type: "back" })}>
          ×
        </Tap>
        <span className="photo-sheet-title">{photo.label}</span>
        <span className="sheet-spacer" aria-hidden="true" />
      </div>
      <div className="preview-image-wrap">
        <PhotoArt id={photo.id} />
      </div>
      <div className="preview-meta">
        <p>{photo.detail}</p>
      </div>
      <Tap
        id="use-photo"
        highlight={highlight}
        className="primary-phone"
        onClick={() => onAction({ type: "use-photo" })}
      >
        Use this photo
      </Tap>
      <Tap
        id="choose-another"
        highlight={highlight}
        className="secondary-phone"
        onClick={() => onAction({ type: "back" })}
      >
        Choose another
      </Tap>
    </div>
  );
}

function PhotosScreen({ highlight, onAction }) {
  return (
    <div>
      <p className="home-lead">These pictures stay on the phone. Looking at them does not send them.</p>
      <div className="photo-grid">
        {PHOTOS.map((photo) => (
          <Tap
            key={photo.id}
            id={`library-${photo.id}`}
            highlight={highlight}
            className="photo-card"
            onClick={() => onAction({ type: "preview-photo", photoId: photo.id })}
          >
            <PhotoArt id={photo.id} />
            <span className="photo-label">{photo.label}</span>
          </Tap>
        ))}
      </div>
    </div>
  );
}

function PhotoViewScreen({ phone }) {
  const photo = photoById(phone.previewPhotoId);
  if (!photo) return null;
  return (
    <div className="preview">
      <PhotoArt id={photo.id} />
      <h3>{photo.label}</h3>
      <p>{photo.detail}</p>
      <p>This is only for looking. To send a picture, use Messages.</p>
    </div>
  );
}

function RecentCallsScreen({ highlight, onAction }) {
  const calls = [
    { name: "+1 (202) 555-0186", initials: "", detail: "Potential Spam", time: "4:09 PM", missed: true },
    ...["rosa", "maya", "luis", "sam", "patel", "rosa"].map((id, index) => ({ ...contactById(id), detail: index % 2 ? "mobile" : "phone", time: index === 0 ? "3:38 PM" : index === 1 ? "11:08 AM" : "Yesterday", missed: index === 3 })),
  ];
  return (
    <div className="reference-calls">
      <header className="reference-calls-header"><button onClick={() => onAction({ type: "phone-tool", label: "Edit" })}>Edit</button><h2>Calls</h2><button aria-label="Filter calls" onClick={() => onAction({ type: "phone-tool", label: "Filter calls" })}>☰</button></header>
      <ul className="reference-recents">
        {calls.map((call, index) => <li key={index}>
          <span className="reference-avatar" aria-hidden="true">{call.initials || <PhoneControlIcon name="person" />}</span>
          <div className="reference-recent-copy"><strong className={call.missed ? "missed-call" : ""}>{call.name}</strong><span>↙ {call.detail}</span></div>
          <time>{call.time}</time>
          <button className="reference-recent-call" aria-label={`Call ${call.name}`} onClick={() => onAction({ type: call.id ? "call" : "phone-tool", contactId: call.id })}><PhoneControlIcon name="phone" /></button>
        </li>)}
      </ul>
      <nav className="reference-calls-bottom" aria-label="Phone navigation"><div className="reference-calls-tabs">
        <button className="selected" onClick={() => onAction({ type: "phone-tool", label: "Calls" })}><span aria-hidden="true">◷</span>Calls</button>
        <Tap id="phone-contacts" highlight={highlight} onClick={() => onAction({ type: "open-phone-contacts" })}><PhoneControlIcon name="person" />Contacts</Tap>
        <button onClick={() => onAction({ type: "phone-tool", label: "Keypad" })}><PhoneControlIcon name="keypad" />Keypad</button>
      </div><button className="reference-calls-search" aria-label="Search calls" onClick={() => onAction({ type: "phone-tool", label: "Search calls" })}>⌕</button></nav>
    </div>
  );
}

function CallsScreen({ phone, highlight, onAction }) {
  const [query, setQuery] = useState("");
  const contacts = [...CONTACTS].sort((a, b) => a.name.localeCompare(b.name)).filter((contact) => contact.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="ios-phone-contacts reference-contacts">
      <header className="reference-contacts-header"><button aria-label="Back" onClick={() => onAction({ type: "home" })}>‹</button><h2>Contacts</h2></header>
      <button className="reference-my-card" onClick={() => onAction({ type: "phone-tool", label: "My Card" })}><span className="reference-avatar my-card-avatar">TT</span><span><strong>TechTown Learner</strong><small>My Card</small></span></button>
      <ul className="people">
      {contacts.map((contact, index) => (
        <li key={contact.id}>
          {index === 0 || contacts[index - 1].name[0] !== contact.name[0] ? <div className="reference-letter" id={`contact-letter-${contact.name[0]}`}>{contact.name[0]}</div> : null}
          <Tap
            id={`call-${contact.id}`}
            highlight={highlight}
            className="person"
            onClick={() => onAction({ type: phone.lesson === "cafe" ? "open-call-contact" : "call", contactId: contact.id })}
          >
            <span className="reference-avatar" aria-hidden="true">{contact.initials}</span>
            <span className="person-copy">
              <span className="person-name">{phone.lesson === "cafe" ? contact.name : `Call ${contact.short}`}</span>
            </span>
          </Tap>
        </li>
      ))}
    </ul>
      {!contacts.length ? <p>No contacts found.</p> : null}
      <aside className="reference-alphabet" aria-label="Contact index">{"ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map(letter => <button key={letter} onClick={() => { const section = document.getElementById(`contact-letter-${letter}`); const scroller = section?.closest(".phone-body"); if (scroller) scroller.scrollTo({ top: scroller.scrollTop + section.getBoundingClientRect().top - scroller.getBoundingClientRect().top, behavior: "auto" }); }}>{letter}</button>)}</aside>
      <div className="reference-contact-search"><label><span aria-hidden="true">⌕</span><input aria-label="Search contacts" placeholder="Search" value={query} onChange={event => setQuery(event.target.value)} /><PhoneControlIcon name="mic" /></label><button aria-label="Add contact" onClick={() => onAction({ type: "phone-tool", label: "Add contact" })}>＋</button></div>
    </div>
  );
}

function CallingScreen({ phone, highlight, onAction }) {
  const contact = contactById(phone.contactId);
  return (
    <div className="practice-call-screen">
      {contact ? <Avatar initials={contact.initials} /> : null}
      <h3>{contact?.name ?? "Unknown"}</h3>
      <p className="ios-call-status">calling…</p>
      <div className="ios-call-controls">
        {[ ["mute", "mic"], ["keypad", "keypad"], ["speaker", "speaker"], ["add call", "plus"], ["FaceTime", "video"], ["contacts", "person"] ].map(([label, icon]) => <button key={label} onClick={() => onAction({ type: "call-tool", label })}><span><PhoneControlIcon name={icon} /></span>{label}</button>)}
      </div>
      <Tap
        id="end-call"
        highlight={highlight}
        className="practice-hang-up"
        onClick={() => onAction({ type: "end-call" })}
      >
        <PhoneControlIcon name="hangup" /><span className="sr-only">End call</span>
      </Tap>
    </div>
  );
}

function CallContactScreen({ phone, highlight, onAction }) {
  const contact = contactById(phone.contactId);
  if (!contact) {
    return <div className="call-contact-card"><p>This contact is unavailable.</p><button className="text-btn" onClick={() => onAction({ type: "back" })}>Back to Contacts</button></div>;
  }
  return (
    <div className="call-contact-card reference-contact-poster">
      <div className="ios-contact-navigation"><button aria-label="Back to Contacts" onClick={() => onAction({ type: "back" })}>‹</button><button onClick={() => onAction({ type: "phone-tool", label: "Edit" })}>Edit</button></div>
      <div className="reference-poster-avatar" aria-hidden="true">{contact.short[0]}</div>
      <h2>{contact.short}</h2>
      <div className="ios-contact-actions">
        <button onClick={() => onAction({ type: "phone-tool", label: "Message" })}><PhoneControlIcon name="message" />message</button>
        <Tap id="start-call" highlight={highlight} className="practice-start-call" onClick={() => onAction({ type: "call", contactId: contact.id })}><PhoneControlIcon name="phone" />call</Tap>
        <button onClick={() => onAction({ type: "phone-tool", label: "Video" })}><PhoneControlIcon name="video" />video</button>
        <button onClick={() => onAction({ type: "phone-tool", label: "Mail" })}><PhoneControlIcon name="mail" />mail</button>
      </div>
      <button className="reference-poster-row" onClick={() => onAction({ type: "phone-tool", label: "Contact Photo & Poster" })}><span className="reference-avatar">{contact.short[0]}</span><span>Contact Photo &amp; Poster</span><span aria-hidden="true">›</span></button>
      <div className="ios-contact-information"><span>phone</span><strong>+1 (202) 555-0143</strong><hr /><span>Notes</span><p>Friend from book club</p></div>
      <p className="call-disclaimer">Practice contact. No real phone will ring.</p>
    </div>
  );
}

function PhoneControlIcon({ name }) {
  return <svg viewBox="0 0 56 56" aria-hidden="true" fill="currentColor"><path d={PHONE_ICONS[name]} /></svg>;
}

function CameraScreen({ highlight, onAction }) {
  return (
    <div className="center-card">
      <div className="viewfinder">
        <PhotoArt id="snapshot" />
      </div>
      <p>The shutter takes a new picture. It does not open the pictures you already have.</p>
      <Tap id="shutter" highlight={highlight} className="primary-phone" onClick={() => onAction({ type: "shutter" })}>
        Take photo
      </Tap>
    </div>
  );
}

function CafeScreens({ phone, highlight, onAction }) {
  if (phone.screen === "cafe-menu") return (
    <div className="practice-safari">
      <div className="safari-address">▣ techtown-cafe.example/menu</div>
      <article className="cafe-menu-page">
        <p className="cafe-menu-eyebrow">WELCOME TO</p><h2>TechTown Café</h2><p>Something warm. Something delicious.</p>
        <h3>Drinks</h3>
        <dl><div><dt>House coffee</dt><dd>$3.00</dd></div><div><dt>Herbal tea</dt><dd>$2.50</dd></div><div><dt>Latte</dt><dd>$4.00</dd></div></dl>
        <h3>Food</h3>
        <dl><div><dt>Blueberry muffin</dt><dd>$3.50</dd></div><div><dt>Garden sandwich</dt><dd>$7.00</dd></div><div><dt>Soup of the day</dt><dd>$5.00</dd></div></dl>
        <p>Practice menu · No orders or payments</p>
        <Tap id="finish-menu" highlight={highlight} className="primary-phone" onClick={() => onAction({ type: "finish-menu" })}>{phone.menuViewed ? "Menu found ✓" : "I found the menu"}</Tap>
      </article>
    </div>
  );
  return (
    <div className="qr-camera-screen">
      <p className="camera-mode-title">Camera</p>
      <div className="qr-viewfinder">
        <div className="cafe-qr-sign"><strong>TechTown Café</strong><PracticeQR /><span>Scan for our menu</span><small>Simulated QR code</small></div>
        <span className="qr-frame" aria-hidden="true" />
      </div>
      {phone.qrDetected ? (
        <Tap id="open-qr-menu" highlight={highlight} className="qr-link-banner" onClick={() => onAction({ type: "open-qr-menu" })}>▣ techtown-cafe.example/menu <span>↗</span></Tap>
      ) : (
        <Tap id="scan-qr" highlight={highlight} className="qr-scan-button" onClick={() => onAction({ type: "scan-qr" })}>Scan QR code</Tap>
      )}
      <div className="camera-mode-strip" aria-hidden="true">VIDEO <strong>PHOTO</strong> PORTRAIT</div>
      <div className="camera-shutter-decoration" aria-hidden="true" />
    </div>
  );
}

function PracticeQR() {
  return (
    <svg className="practice-qr" viewBox="0 0 29 29" aria-label="Practice QR code illustration" role="img">
      <rect width="29" height="29" fill="white" />
      {[ [2, 2], [20, 2], [2, 20] ].map(([x,y]) => <g key={`${x}-${y}`}><rect x={x} y={y} width="7" height="7" fill="black" /><rect x={x+1} y={y+1} width="5" height="5" fill="white" /><rect x={x+2} y={y+2} width="3" height="3" fill="black" /></g>)}
      {Array.from({ length: 25 * 25 }, (_, i) => {
        const x = i % 25 + 2, y = Math.floor(i / 25) + 2;
        if ((x < 10 && y < 10) || (x > 18 && y < 10) || (x < 10 && y > 18)) return null;
        return (x * y + x * 7 + y * 3) % 5 < 2 ? <rect key={i} x={x} y={y} width="1" height="1" fill="black" /> : null;
      })}
    </svg>
  );
}

function SafetyScreens({ phone, highlight, onAction }) {
  if (phone.screen === "safety-inbox") return (
    <div className="messages-screen safety-inbox">
      <div className="ios-contact-navigation"><button onClick={() => onAction({ type: "home" })}>‹ Filters</button><button aria-label="Compose message" onClick={() => onAction({ type: "message-tool" })}>✎</button></div>
      <header className="messages-header"><h2>Unknown Senders</h2></header>
      <div className="safety-search" aria-hidden="true">⌕ Search</div>
      <p className="safety-filter-label">Unknown Senders</p>
      <Tap id="open-suspicious" highlight={highlight} className="safety-inbox-row" onClick={() => onAction({ type: "open-suspicious" })}>
        <span className="unknown-avatar" aria-hidden="true"><PhoneControlIcon name="person" /></span>
        <span><strong>{phone.senderNumber}</strong><small>Your parcel is on hold. Pay within 30 minutes…</small></span><span className="safety-inbox-time">9:41 AM ›</span>
      </Tap>
    </div>
  );
  if (phone.screen === "safety-report") return (
    <div className="safety-report-screen">
      {phone.suspiciousReported ? <><h2>Junk reported</h2><p>The fictional message has been removed.</p><p className="safety-success">✓ You kept the link unopened.</p></> : <>
        <div className="safety-report-background" inert=""><SafetyScreens phone={{ ...phone, screen: "safety-message" }} highlight={null} onAction={() => {}} /></div>
        <div className="ios-report-scrim" />
        <div className="ios-report-sheet" role="dialog" aria-modal="true" aria-labelledby="junk-title">
          <div className="ios-report-group"><div className="ios-report-description"><h2 id="junk-title">Report Junk</h2><p>This practice message will be deleted and marked as junk.</p></div>
          <Tap id="confirm-report" highlight={highlight} className="safety-report-confirm" onClick={() => onAction({ type: "confirm-report" })}>Delete and Report Junk</Tap></div>
          <button className="ios-report-cancel" onClick={() => onAction({ type: "back" })}>Cancel</button>
        </div>
      </>}
    </div>
  );
  return (
    <div className="safety-message-screen">
      <header className="safety-message-header"><button className="safety-back" aria-label="Back to messages" onClick={() => onAction({ type: "back" })}>‹ <span>1</span></button><span className="unknown-avatar" aria-hidden="true"><PhoneControlIcon name="person" /></span><strong>{phone.senderNumber} ›</strong></header>
      <p className="safety-message-time">Today 9:41 AM</p>
      <div className="safety-message-bubble">Your parcel is on hold. Pay a $1.99 delivery fee within 30 minutes or it will be returned. Enter your card details here:
        <button className="safety-fake-link" onClick={() => onAction({ type: "unsafe-link" })}>parcel-fee.example/claim</button>
      </div>
      <p className="safety-sender-note">If you did not expect this message from an unknown sender, it may be spam.</p>
      <div className="safety-spam-actions">
        <Tap id="report-suspicious" highlight={highlight} className="safety-report-link" onClick={() => onAction({ type: "report-suspicious" })}>Delete</Tap>
        <button onClick={() => onAction({ type: "mark-known" })}>Mark as Known</button>
      </div>
      <div className="safety-composer"><button aria-label="Add attachment" onClick={() => onAction({ type: "message-tool" })}>＋</button><button className="safety-message-input" onClick={() => onAction({ type: "message-tool" })}>Text Message · SMS <PhoneControlIcon name="mic" /></button></div>
    </div>
  );
}

function CameraResultScreen({ highlight, onAction }) {
  return (
    <div className="preview">
      <PhotoArt id="snapshot" />
      <h3>Practice snapshot</h3>
      <p>Saved only inside this camera. It is not added to the lesson photos.</p>
      <Tap
        id="retake"
        highlight={highlight}
        className="secondary-phone"
        onClick={() => onAction({ type: "retake" })}
      >
        Take another
      </Tap>
    </div>
  );
}

function CalendarScreen({ highlight, onAction }) {
  const blanks = Array.from({ length: CALENDAR.startWeekday }, (_, index) => index);
  const days = Array.from({ length: CALENDAR.days }, (_, index) => index + 1);
  return (
    <div className="ios-calendar">
      <header className="ios-calendar-header">
        <Tap id="back" highlight={highlight} className="ios-calendar-year" onClick={() => onAction({ type: "back" })}>
          <span aria-hidden="true">‹</span> 2026
        </Tap>
        <div className="ios-calendar-tools" aria-label="Calendar tools">
          <button type="button" aria-label="Search" onClick={() => onAction({ type: "calendar-tool", label: "Search" })}>⌕</button>
          <button type="button" aria-label="Add event" onClick={() => onAction({ type: "calendar-tool", label: "Add event" })}>＋</button>
        </div>
      </header>
      <h1 className="ios-calendar-month">October</h1>
      <div className="weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {blanks.map((item) => (
          <span key={`blank-${item}`} />
        ))}
        {days.map((day) => {
          const event = CALENDAR.events[day];
          return (
            <Tap
              key={day}
              id={`day-${day}`}
              highlight={highlight}
              className={`day-btn ${day === CALENDAR.today ? "is-today" : ""}`.trim()}
              onClick={() => onAction({ type: "open-day", day })}
            >
              <span className="day-num">{day}</span>
              {event ? <span className="calendar-event-dot" /> : null}
            </Tap>
          );
        })}
      </div>
      <h2 className="ios-events-title">Upcoming</h2>
      <ul className="ios-event-list">
        {Object.entries(CALENDAR.events).map(([day, event]) => (
          <li key={day}>
            <Tap
              id={`event-${day}`}
              highlight={highlight}
              className="ios-event-row"
              onClick={() => onAction({ type: "open-day", day: Number(day) })}
            >
              <span className="ios-event-color" aria-hidden="true" />
              <span className="ios-event-date"><strong>OCT</strong><span>{day}</span></span>
              <span className="person-copy">
                <span className="person-name">{event.title}</span>
                <span className="person-relation">{event.time ?? "All-day"} · {event.location ?? "Calendar"}</span>
              </span>
              <span className="ios-row-chevron" aria-hidden="true">›</span>
            </Tap>
          </li>
        ))}
      </ul>
      <nav className="ios-calendar-tabs" aria-label="Calendar navigation">
        <button type="button" onClick={() => onAction({ type: "calendar-tool", label: "Today" })}>Today</button>
        <button type="button" onClick={() => onAction({ type: "calendar-tool", label: "Calendars" })}>Calendars</button>
        <button type="button" onClick={() => onAction({ type: "calendar-tool", label: "Inbox" })}>Inbox</button>
      </nav>
    </div>
  );
}

function DayScreen({ phone, highlight, onAction }) {
  const event = CALENDAR.events[phone.day];
  const weekday = WEEKDAYS[(CALENDAR.startWeekday + phone.day - 1) % 7];
  const reminder = phone.reminders[phone.day];
  return (
    <div className="ios-calendar ios-day-view">
      <header className="ios-calendar-header ios-day-header">
        <Tap id="back" highlight={highlight} className="ios-calendar-year" onClick={() => onAction({ type: "back" })}>
          <span aria-hidden="true">‹</span> October
        </Tap>
        <strong>{weekday}, Oct {phone.day}</strong>
        <button type="button" className="ios-calendar-add" aria-label="Add event" onClick={() => onAction({ type: "calendar-tool", label: "Add event" })}>＋</button>
      </header>
      <div className="ios-day-number"><span>{weekday}</span><strong>{phone.day}</strong></div>
      {event ? (
        <section className="ios-event-detail">
          <span className="ios-event-color" aria-hidden="true" />
          <div>
            <h2>{event.title}</h2>
            <p>{event.time ?? "All-day"}</p>
            <p>{event.location ?? "Community Center"}</p>
          </div>
          <p className="ios-event-notes">{event.detail}</p>
          {reminder ? (
            <p className="calendar-reminder-saved" role="status">
              <strong>Reminder:</strong> {reminder}
            </p>
          ) : null}
          <Tap
            id="add-reminder"
            highlight={highlight}
            className="calendar-reminder-button"
            onClick={() => onAction({ type: "open-reminder" })}
          >
            {reminder ? "Change reminder" : "Add reminder"}
          </Tap>
        </section>
      ) : (
        <p className="ios-empty-day">No events scheduled.</p>
      )}
    </div>
  );
}

function ReminderScreen({ phone, highlight, onAction }) {
  const choices = ["At time of event", "1 hour before", "1 day before"];
  return (
    <div className="reminder-screen ios-calendar">
      <header className="ios-reminder-nav">
        <Tap id="back" highlight={highlight} className="ios-nav-action" onClick={() => onAction({ type: "back" })}>Cancel</Tap>
        <h1>Alert</h1>
        <Tap
          id="save-reminder"
          highlight={highlight}
          className="ios-nav-action ios-nav-done"
          onClick={() => onAction({ type: "save-reminder" })}
          disabled={!phone.reminderDraft}
        >
          Done
        </Tap>
      </header>
      <p className="ios-reminder-label">ALERT</p>
      <div className="settings-list reminder-options ios-reminder-options">
        {choices.map((choice) => (
          <Tap
            key={choice}
            id={choice === "1 day before" ? "reminder-day-before" : `reminder-${choice}`}
            highlight={highlight}
            className={`settings-row ${phone.reminderDraft === choice ? "selected" : ""}`.trim()}
            onClick={() => onAction({ type: "select-reminder", value: choice })}
          >
            <span>{choice}</span>
            <span aria-hidden="true">{phone.reminderDraft === choice ? "✓" : ""}</span>
          </Tap>
        ))}
      </div>
      <p className="ios-reminder-help">Calendar will notify you before Book club begins.</p>
    </div>
  );
}

function SettingsScreen({ phone, speechOn, onToggleSpeech, onAction }) {
  return (
    <div className="settings-list">
      <button type="button" className="settings-row" onClick={() => onAction({ type: "toggle-scale" })}>
        <span>Larger phone text</span>
        <strong>{phone.textScale > 1 ? "On" : "Off"}</strong>
      </button>
      <button type="button" className="settings-row" onClick={onToggleSpeech}>
        <span>Spoken instructions</span>
        <strong>{speechOn ? "On" : "Off"}</strong>
      </button>
      <button type="button" className="settings-row" onClick={() => onAction({ type: "open-app", app: "about" })}>
        <span>About this phone</span>
        <strong>Open</strong>
      </button>
    </div>
  );
}

function AboutScreen() {
  return (
    <div className="center-card">
      <h3>A practice phone</h3>
      <p>
        This phone lives inside TechTown. Nothing you tap here sends a real message, places a real call, or
        changes the phone you own.
      </p>
    </div>
  );
}

function AppIcon({ name }) {
  return (
    <svg className="app-icon" viewBox="0 0 48 48" aria-hidden="true">
      {name === "bubble" ? (
        <>
          <rect x="6" y="8" width="36" height="26" rx="8" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M16 34 l-2 8 10-8" fill="none" stroke="currentColor" strokeWidth="3" />
        </>
      ) : null}
      {name === "picture" ? (
        <>
          <rect x="7" y="10" width="34" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="18" cy="20" r="3" fill="currentColor" />
          <path d="M10 32 l10-8 6 5 5-4 7 7" fill="none" stroke="currentColor" strokeWidth="3" />
        </>
      ) : null}
      {name === "handset" ? (
        <path
          d="M16 10 h6 l3 8-4 3 a12 12 0 0 0 6 6 l3-4 8 3 v6 c-12 2-22-8-24-22 z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      ) : null}
      {name === "camera" ? (
        <>
          <rect x="6" y="14" width="36" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="24" cy="26" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M16 14 l3-5 h10 l3 5" fill="none" stroke="currentColor" strokeWidth="3" />
        </>
      ) : null}
      {name === "grid" ? (
        <>
          <text x="24" y="14" textAnchor="middle" fill="#ff3b30" fontSize="9" fontWeight="700">OCT</text>
          <text x="24" y="39" textAnchor="middle" fill="#1c1c1e" fontSize="27" fontWeight="400">10</text>
        </>
      ) : null}
      {name === "sliders" ? (
        <>
          <path d="M10 16 h28 M10 24 h28 M10 32 h28" stroke="currentColor" strokeWidth="3" />
          <circle cx="18" cy="16" r="3" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="30" cy="24" r="3" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="20" cy="32" r="3" fill="none" stroke="currentColor" strokeWidth="3" />
        </>
      ) : null}
    </svg>
  );
}
