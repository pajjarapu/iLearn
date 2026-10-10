export const CONTACTS = [
  {
    id: "maya",
    name: "Maya Alvarez",
    short: "Maya",
    relation: "Granddaughter",
    initials: "MA",
    pattern: "petals",
    who: "your granddaughter",
    preview: "Could you send a picture of the garden flowers?",
  },
  {
    id: "luis",
    name: "Luis Alvarez",
    short: "Luis",
    relation: "Son",
    initials: "LA",
    pattern: "stripes",
    who: "your son",
    preview: "I can visit on Sunday afternoon.",
  },
  {
    id: "sam",
    name: "Sam Okonkwo",
    short: "Sam",
    relation: "Neighbor",
    initials: "SO",
    pattern: "dots",
    who: "your neighbor",
    preview: "The porch light is on for you.",
  },
  {
    id: "patel",
    name: "Dr. Amina Patel",
    short: "Dr. Patel",
    relation: "Clinic",
    initials: "AP",
    pattern: "rings",
    who: "from the clinic",
    preview: "Your checkup is Thursday at 10.",
  },
  {
    id: "rosa",
    name: "Rosa Nguyen",
    short: "Rosa",
    relation: "Book club",
    initials: "RN",
    pattern: "waves",
    who: "from your book club",
    preview: "Tuesday we talk about chapter two.",
  },
];

export const PHOTOS = [
  {
    id: "flowers",
    label: "Garden flowers",
    detail: "Yellow blooms beside the garden path",
  },
  {
    id: "tomatoes",
    label: "Tomato vines",
    detail: "Round tomatoes still on the vine",
  },
  {
    id: "porch",
    label: "Front porch",
    detail: "The front door and porch steps",
  },
  {
    id: "rain",
    label: "Rainy window",
    detail: "Raindrops on the kitchen window",
  },
  {
    id: "cake",
    label: "Birthday cake",
    detail: "A layered cake with candles",
  },
  {
    id: "drawing",
    label: "Crayon drawing",
    detail: "A child’s drawing of a house",
  },
];

export const PLACES = [
  {
    id: "family",
    name: "Family house",
    kicker: "Open today",
    summary: "Sending a photo in Messages. Video calls will be a later visit.",
    future: false,
  },
  {
    id: "community",
    name: "Community center",
    kicker: "Future lesson",
    summary: "Finding events and adding calendar reminders.",
    future: true,
    coming:
      "At the community center you will practice finding an event and adding a reminder to the calendar. That lesson is not part of today’s visit.",
  },
  {
    id: "cafe",
    name: "Café",
    kicker: "Future lesson",
    summary: "Scanning QR codes and navigating menus.",
    future: true,
    coming:
      "At the café you will practice scanning a QR code and reading a menu on the phone. That lesson is not part of today’s visit.",
  },
  {
    id: "safety",
    name: "Safety station",
    kicker: "Future lesson",
    summary: "Recognizing suspicious messages and choosing safe responses.",
    future: true,
    coming:
      "At the safety station you will practice spotting a suspicious message and choosing a careful response. That lesson is not part of today’s visit.",
  },
];

export const CALENDAR = {
  month: "October 2026",
  year: 2026,
  monthIndex: 9,
  startWeekday: 4,
  days: 31,
  today: 9,
  events: {
    13: {
      title: "Book club",
      detail: "Tuesday with Rosa. You will talk about chapter two. Adding a reminder is a future TechTown lesson.",
    },
    15: {
      title: "Clinic checkup",
      detail: "Thursday at 10 with Dr. Patel. This is only a practice calendar.",
    },
  },
};

const STEP_COUNT = 6;

export function contactById(id) {
  return CONTACTS.find((contact) => contact.id === id) ?? null;
}

export function photoById(id) {
  return PHOTOS.find((photo) => photo.id === id) ?? null;
}

function createThreads() {
  return {
    maya: [
      { id: 1, from: "them", text: "Hi. I miss you." },
      {
        id: 2,
        from: "them",
        text: "Could you send a picture of the garden flowers?",
      },
    ],
    luis: [
      {
        id: 3,
        from: "them",
        text: "I can visit on Sunday afternoon. I would love to see the garden too.",
      },
    ],
    sam: [
      {
        id: 4,
        from: "them",
        text: "The porch light is on for you. Your flowers look bright from the sidewalk.",
      },
    ],
    patel: [
      {
        id: 5,
        from: "them",
        text: "Your checkup is Thursday at 10. The clinic will see you then.",
      },
    ],
    rosa: [
      {
        id: 6,
        from: "them",
        text: "Tuesday we talk about chapter two. Come if you are free.",
      },
    ],
  };
}

export function createPhone() {
  return {
    screen: "home",
    stack: [],
    contactId: null,
    previewPhotoId: null,
    drafts: {},
    threads: createThreads(),
    day: null,
    textScale: 1,
    banner: null,
    seq: 10,
    lastSent: null,
  };
}

function push(state, screen, patch = {}) {
  return {
    ...state,
    ...patch,
    banner: null,
    screen,
    stack: [...state.stack, state.screen],
  };
}

function pop(state) {
  if (state.stack.length === 0) {
    return {
      ...state,
      screen: "home",
      banner: "You are already on the phone’s home screen.",
    };
  }
  const stack = state.stack.slice(0, -1);
  const screen = state.stack[state.stack.length - 1];
  return {
    ...state,
    stack,
    screen,
    banner: null,
    previewPhotoId: screen === "preview" ? state.previewPhotoId : null,
    day: screen === "day" ? state.day : null,
  };
}

function popTo(state, screen) {
  const index = state.stack.lastIndexOf(screen);
  if (index === -1) {
    return { ...state, screen, banner: null };
  }
  return {
    ...state,
    screen,
    stack: state.stack.slice(0, index),
    banner: null,
  };
}

function replyText(contactId, photoId, text) {
  if (contactId === "maya" && photoId === "flowers") {
    return "The flowers are lovely. Thank you for sending them to me.";
  }
  if (contactId === "maya" && photoId) {
    return "Thank you for the picture. I would still love to see the garden flowers when you have a moment.";
  }
  if (contactId === "maya" && text) {
    return "Thank you for writing. A photo of the garden would be wonderful too.";
  }
  if (photoId) return "Received your photo. Thank you.";
  if (text) return "Received your message. Thank you.";
  return null;
}

export function reducePhone(state, action) {
  const base = { ...state, banner: null };

  switch (action.type) {
    case "open-app": {
      const screens = {
        messages: "messages",
        photos: "photos",
        phone: "phone",
        camera: "camera",
        calendar: "calendar",
        settings: "settings",
        about: "about",
      };
      const screen = screens[action.app];
      if (!screen) return state;
      return push(base, screen, { contactId: null, previewPhotoId: null, day: null });
    }
    case "back":
      return pop(base);
    case "home":
      if (state.screen === "home" && state.stack.length === 0) {
        return {
          ...base,
          banner: "You are already on the phone’s home screen.",
        };
      }
      return {
        ...base,
        screen: "home",
        stack: [],
        contactId: null,
        previewPhotoId: null,
        day: null,
      };
    case "open-contact":
      if (!contactById(action.contactId)) return state;
      return push(base, "thread", { contactId: action.contactId });
    case "open-picker":
      if (state.screen !== "thread" || !state.contactId) return state;
      return push(base, "picker");
    case "preview-photo":
      if (!photoById(action.photoId)) return state;
      if (state.screen === "photos") {
        return push(base, "photo-view", { previewPhotoId: action.photoId });
      }
      if (state.screen !== "picker") return state;
      return push(base, "preview", { previewPhotoId: action.photoId });
    case "use-photo": {
      if (state.screen !== "preview" || !state.previewPhotoId || !state.contactId) {
        return state;
      }
      const returned = popTo(base, "thread");
      const previous = state.drafts[state.contactId] ?? { text: "", photoId: null };
      return {
        ...returned,
        contactId: state.contactId,
        previewPhotoId: null,
        drafts: {
          ...state.drafts,
          [state.contactId]: { ...previous, photoId: state.previewPhotoId },
        },
      };
    }
    case "remove-draft": {
      if (!state.contactId) return state;
      const previous = state.drafts[state.contactId] ?? { text: "", photoId: null };
      return {
        ...base,
        drafts: {
          ...state.drafts,
          [state.contactId]: { ...previous, photoId: null },
        },
      };
    }
    case "set-text": {
      if (state.screen !== "thread" || !state.contactId) return state;
      const previous = state.drafts[state.contactId] ?? { text: "", photoId: null };
      return {
        ...base,
        drafts: {
          ...state.drafts,
          [state.contactId]: { ...previous, text: action.text },
        },
      };
    }
    case "send": {
      if (state.screen !== "thread" || !state.contactId) return state;
      const draft = state.drafts[state.contactId] ?? { text: "", photoId: null };
      const text = draft.text.trim();
      const photoId = draft.photoId;
      if (!text && !photoId) {
        return {
          ...base,
          banner: "There is nothing to send yet. Choose a photo or write a message, then tap Send.",
        };
      }
      const sent = {
        id: state.seq,
        from: "me",
        text,
        photoId,
      };
      const reply = replyText(state.contactId, photoId, text);
      const incoming = reply
        ? [{ id: state.seq + 1, from: "them", text: reply }]
        : [];
      return {
        ...base,
        seq: state.seq + 2,
        lastSent: { id: sent.id, contactId: state.contactId, photoId, text },
        drafts: {
          ...state.drafts,
          [state.contactId]: { text: "", photoId: null },
        },
        threads: {
          ...state.threads,
          [state.contactId]: [...state.threads[state.contactId], sent, ...incoming],
        },
      };
    }
    case "call":
      if (!contactById(action.contactId)) return state;
      return push(base, "calling", { contactId: action.contactId });
    case "end-call":
      return pop({ ...base, contactId: null });
    case "shutter":
      return push(base, "camera-result");
    case "retake":
      if (state.stack[state.stack.length - 1] === "camera") return pop(base);
      return { ...base, screen: "camera" };
    case "open-day":
      return push(base, "day", { day: action.day });
    case "toggle-scale":
      return { ...base, textScale: state.textScale > 1 ? 1 : 1.18 };
    default:
      return state;
  }
}

export function hasSentFlowers(phone) {
  return phone.threads.maya.some(
    (message) => message.from === "me" && message.photoId === "flowers",
  );
}

export function canonicalLevel(phone) {
  if (hasSentFlowers(phone)) return 6;
  if (
    phone.screen === "thread" &&
    phone.contactId === "maya" &&
    phone.drafts.maya?.photoId === "flowers"
  ) {
    return 5;
  }
  if (
    phone.screen === "preview" &&
    phone.contactId === "maya" &&
    phone.previewPhotoId === "flowers"
  ) {
    return 4;
  }
  if (phone.screen === "picker" && phone.contactId === "maya") return 3;
  if (phone.screen === "thread" && phone.contactId === "maya") {
    if (phone.drafts.maya?.photoId) return null;
    return 2;
  }
  if (phone.screen === "messages") return 1;
  if (phone.screen === "home") return hasDraftOrSend(phone) ? null : 0;
  return null;
}

function hasDraftOrSend(phone) {
  for (const contact of CONTACTS) {
    if (phone.threads[contact.id].some((message) => message.from === "me")) return true;
  }
  return Object.values(phone.drafts).some((draft) => draft?.photoId || draft?.text?.trim());
}

export function nextSnapshots(snaps, phone) {
  const level = canonicalLevel(phone);
  if (level === null) return snaps;
  if (level >= 6) {
    if (snaps[6]) return snaps;
    const done = snaps.slice();
    done[6] = structuredClone(phone);
    return done;
  }
  const copy = snaps.slice(0, level);
  copy[level] = snaps[level] ?? structuredClone(phone);
  return copy;
}

export function rewindSnapshot(snaps) {
  if (snaps.length <= 1) return null;
  const copy = snaps.slice(0, -1);
  return {
    snaps: copy,
    phone: structuredClone(copy[copy.length - 1]),
  };
}

const APP_NAMES = {
  messages: "Messages",
  photos: "Photos",
  phone: "Phone",
  camera: "Camera",
  calendar: "Calendar",
  settings: "Settings",
  about: "About this phone",
};

function term(name, text) {
  return { name, text };
}

export function getGuidance(phone) {
  if (hasSentFlowers(phone)) {
    return {
      complete: true,
      target: null,
      step: null,
      title: "Maya has the garden photo",
      body: "You sent the photo labeled Garden flowers to Maya. It arrived in her conversation on this practice phone.",
      term: null,
    };
  }

  const contact = contactById(phone.contactId);
  const preview = photoById(phone.previewPhotoId);
  const draftPhoto = photoById(phone.drafts[phone.contactId]?.photoId);

  if (phone.screen === "calling") {
    return recovery(
      "end-call",
      "A practice call is open",
      `You are calling ${contact?.short ?? "someone"}. No real call is being made. Tap End call when you want to leave.`,
      term("Call", "A call is a live voice conversation. A text can be read later, and it can carry a photo."),
    );
  }

  if (phone.screen === "camera" || phone.screen === "camera-result") {
    return recovery(
      "back",
      "This is the camera",
      "The camera takes a new picture. For this lesson, use a photo that is already saved. Tap Back, then open Messages.",
      term("Camera", "The camera app takes a new picture. The Photo button inside Messages chooses one you already have."),
    );
  }

  if (phone.screen === "photos" || phone.screen === "photo-view") {
    return recovery(
      "back",
      "These pictures are only for looking",
      "Photos lets you look at saved pictures. It does not choose who receives one. Tap Back until you reach the phone’s home screen, then open Messages.",
      term("Photos", "Photos is the app that stores pictures. Messages is the app that sends a picture to a person."),
    );
  }

  if (phone.screen === "phone") {
    return recovery(
      "back",
      "This screen places calls",
      "Phone is for calling. To send a photo, tap Back, then open Messages. The Messages icon is a speech bubble.",
      term("App", "An app is one tool on the phone. Phone and Messages are different apps."),
    );
  }

  if (phone.screen === "calendar" || phone.screen === "day") {
    return recovery(
      "back",
      "This is the calendar",
      "The calendar shows days and plans. Sending a photo starts in Messages. Tap Back to leave the calendar.",
      term("Calendar", "A calendar keeps dates. Adding reminders is a future TechTown lesson."),
    );
  }

  if (phone.screen === "settings" || phone.screen === "about") {
    return recovery(
      "back",
      "These are phone settings",
      "Settings changes how this practice phone behaves. Your photo task is in Messages. Tap Back when you are ready.",
      term("Settings", "Settings is where you change choices such as text size. It does not send messages."),
    );
  }

  if (phone.screen === "picker" && phone.contactId && phone.contactId !== "maya") {
    return recovery(
      "back",
      `This photo would go to ${contact.short}`,
      `${contact.short} is not the person who asked for the garden. Tap Back, return to the list, and tap Maya.`,
      term("Contact", "A contact is a person saved on the phone. The name under the picture tells you who it is."),
    );
  }

  if (phone.screen === "preview" && phone.contactId && phone.contactId !== "maya") {
    return recovery(
      "back",
      `This is still ${contact.short}’s conversation`,
      "Tap Back until you see the list of people, then tap Maya.",
      null,
    );
  }

  if (phone.screen === "thread" && phone.contactId && phone.contactId !== "maya") {
    return recovery(
      "back",
      `This conversation is with ${contact.short}`,
      `${contact.name} is ${contact.who}. Maya is the person who asked for the garden. Tap Back, then tap Maya.`,
      term("Conversation", "A conversation is the set of messages with one person. The name at the top tells you who will receive the next message."),
    );
  }

  if (
    phone.screen === "preview" &&
    phone.contactId === "maya" &&
    phone.previewPhotoId &&
    phone.previewPhotoId !== "flowers"
  ) {
    return recovery(
      "choose-another",
      `This photo is ${preview.label}`,
      "Maya asked for the garden. Tap Choose another, then tap the photo whose label says Garden flowers.",
      term("Label", "The words under a picture tell you what it is, so you do not have to guess from the image."),
    );
  }

  if (phone.screen === "thread" && phone.contactId === "maya" && draftPhoto && draftPhoto.id !== "flowers") {
    return recovery(
      "remove-draft",
      `${draftPhoto.label} is attached`,
      "Attached means it is waiting with the message, and it has not been sent. Tap Remove photo, then tap Photo and choose Garden flowers.",
      term("Attached", "An attached photo is ready to travel with the message. Send is the tap that delivers it."),
    );
  }

  if (phone.screen === "home") {
    return step(1, "app-messages", "Open Messages", "Tap the button labeled Messages. Its icon is a speech bubble. That is where texts are kept.", term(
      "Icon",
      "An icon is a small picture that stands for an app. The words next to the picture tell you the app’s name.",
    ));
  }

  if (phone.screen === "messages") {
    return step(2, "contact-maya", "Choose Maya", "Maya Alvarez is your granddaughter. Tap her name in the list. There are other people here on purpose, so the name matters.", term(
      "Contact",
      "A contact is a person saved on the phone. The relationship under the name, such as Granddaughter, helps you choose.",
    ));
  }

  if (phone.screen === "picker" && phone.contactId === "maya") {
    return step(4, "photo-flowers", "Choose the garden", "Tap the picture labeled Garden flowers. Tomato vines and the front porch are different photos.", term(
      "Photo library",
      "A photo library is the group of pictures saved on the phone. Each one here has a written label.",
    ));
  }

  if (phone.screen === "preview" && phone.contactId === "maya" && phone.previewPhotoId === "flowers") {
    return step(5, "use-photo", "Use this photo", "This is Garden flowers. Tap Use this photo. It is attached to the message, and it is not delivered until you tap Send.", term(
      "Attach",
      "Attach means the photo is ready to go with your message. Send is a separate step.",
    ));
  }

  if (
    phone.screen === "thread" &&
    phone.contactId === "maya" &&
    phone.drafts.maya?.photoId === "flowers"
  ) {
    return step(6, "send", "Send it to Maya", "The garden photo is attached. Tap Send. Maya is fictional, and the photo stays inside TechTown.", term(
      "Send",
      "Send delivers the message to the person whose name is at the top of the conversation.",
    ));
  }

  if (phone.screen === "thread" && phone.contactId === "maya") {
    return step(3, "attach", "Add a photo", "Tap the button labeled Photo, beside the message box. It opens pictures that are already saved. It does not take a new one.", term(
      "Photo button",
      "The Photo button looks like a small picture and has the word Photo. Tap it to choose an existing picture.",
    ));
  }

  return recovery(
    "home",
    "Return to the phone’s home screen",
    "Tap Home, then open Messages. You can take your time.",
    null,
  );
}

function step(number, target, title, body, termInfo) {
  return {
    complete: false,
    target,
    step: number,
    stepCount: STEP_COUNT,
    title,
    body,
    term: termInfo,
  };
}

function recovery(target, title, body, termInfo) {
  return {
    complete: false,
    target,
    step: null,
    stepCount: STEP_COUNT,
    title,
    body,
    term: termInfo,
  };
}

export function matchesTarget(target, action) {
  if (!target) return true;
  switch (target) {
    case "app-messages":
      return action.type === "open-app" && action.app === "messages";
    case "contact-maya":
      return action.type === "open-contact" && action.contactId === "maya";
    case "attach":
      return action.type === "open-picker";
    case "photo-flowers":
      return action.type === "preview-photo" && action.photoId === "flowers";
    case "use-photo":
      return action.type === "use-photo";
    case "send":
      return action.type === "send";
    case "back":
    case "home":
      return action.type === target;
    case "choose-another":
      return action.type === "back";
    case "remove-draft":
      return action.type === "remove-draft";
    case "end-call":
      return action.type === "end-call" || action.type === "back";
    default:
      return false;
  }
}

function describeSend(sent) {
  if (!sent) {
    return "There is nothing to send yet. Choose a photo or write a message, then tap Send.";
  }
  const contact = contactById(sent.contactId);
  const photo = photoById(sent.photoId);
  const name = contact?.short ?? "that person";
  if (sent.contactId === "maya" && sent.photoId === "flowers") {
    return "You sent Garden flowers to Maya. That is the photo she asked for.";
  }
  if (photo && sent.contactId !== "maya") {
    return `You sent ${photo.label} to ${name}. ${name} has that picture. Maya has not received the garden photo.`;
  }
  if (photo) {
    return `You sent ${photo.label} to Maya. She can see it. She also asked for the photo labeled Garden flowers, and you can send that one too.`;
  }
  const snippet = sent.text.length > 90 ? `${sent.text.slice(0, 90)}…` : sent.text;
  return `You sent ${name} a written message: “${snippet}”. The garden photo has not been sent.`;
}

function describeUnexpected(prev, action, next) {
  if (action.type === "send") {
    if (!next.lastSent || next.lastSent.id === prev.lastSent?.id) {
      return next.banner;
    }
    return describeSend(next.lastSent);
  }
  if (action.type === "open-app") {
    const name = APP_NAMES[action.app] ?? "that app";
    if (action.app === "messages") return null;
    return `You opened ${name}. You can look around. The photo task continues in Messages.`;
  }
  if (action.type === "open-contact") {
    const contact = contactById(action.contactId);
    if (!contact || contact.id === "maya") return null;
    return `You opened ${contact.name}, ${contact.who}. Maya is a different person in the list.`;
  }
  if (action.type === "preview-photo") {
    const photo = photoById(action.photoId);
    if (!photo || photo.id === "flowers") return null;
    return `You selected ${photo.label}. The label under the picture is there so the choice is clear.`;
  }
  if (action.type === "use-photo") {
    const photo = photoById(prev.previewPhotoId);
    if (photo && photo.id !== "flowers") {
      return `${photo.label} is now attached. It will not be delivered until you tap Send, and you can remove it first.`;
    }
  }
  if (action.type === "back") return "You went back one screen.";
  if (action.type === "home") return "You returned to the phone’s home screen.";
  if (action.type === "call") {
    const contact = contactById(action.contactId);
    return `You started a practice call with ${contact?.short ?? "someone"}. No real phone will ring.`;
  }
  if (action.type === "shutter") {
    return "You took a practice snapshot. It stays inside this camera and is not one of the lesson photos.";
  }
  if (action.type === "open-day") {
    const event = CALENDAR.events[action.day];
    if (event) return `You opened ${event.title}.`;
    return "You opened a day with nothing planned.";
  }
  return null;
}

const QUIET_ACTIONS = new Set(["set-text", "toggle-scale"]);

export function observationFor(mode, prev, action, next) {
  if (QUIET_ACTIONS.has(action.type)) return null;
  if (hasSentFlowers(prev)) return null;

  if (mode === "game") {
    if (action.type !== "send") return null;
    if (!next.lastSent || next.lastSent.id === prev.lastSent?.id) return next.banner;
    return describeSend(next.lastSent);
  }

  const expected = getGuidance(prev);
  if (matchesTarget(expected.target, action)) return null;
  return describeUnexpected(prev, action, next);
}

export function gameHint(phone, level) {
  const guidance = getGuidance(phone);
  if (guidance.complete) return "Maya has the garden photo.";
  if (level <= 1) {
    return "Maya’s message is in the Messages app. She asked for the photo labeled Garden flowers.";
  }
  if (level === 2) {
    return `Next, look for “${guidance.title}.” The button’s name is written on it.`;
  }
  return guidance.body;
}

export function listUserSends(phone) {
  const rows = [];
  for (const contact of CONTACTS) {
    for (const message of phone.threads[contact.id]) {
      if (message.from !== "me") continue;
      const photo = photoById(message.photoId);
      rows.push({
        id: message.id,
        contactId: contact.id,
        name: contact.short,
        photoId: message.photoId,
        photoLabel: photo?.label ?? null,
        text: message.text,
      });
    }
  }
  rows.sort((a, b) => a.id - b.id);
  return rows;
}

export function sendSummary(row) {
  if (row.photoLabel && row.text) {
    return `To ${row.name}: ${row.photoLabel}, with the words “${row.text}”.`;
  }
  if (row.photoLabel) return `To ${row.name}: ${row.photoLabel}.`;
  return `To ${row.name}: a written message, “${row.text}”.`;
}

export const LESSON_STEPS = STEP_COUNT;
