export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text) {
  if (!canSpeak() || !text) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
  return true;
}

export function silence() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
