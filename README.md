# Fidel Mastery Pro

An offline-capable iPhone web app for learning the Amharic Fidel (Ge'ez script) —
all 231 forms (33 consonants × 7 vowel orders), with flashcards, a quiz, search,
favorites, and progress tracking.

## Files

```
index.html            the app shell (HTML + CSS)
data.js                the 231-form dataset (letters, romanizations, example words)
app.js                 all app logic (storage, audio, screens)
sw.js                  service worker for offline caching (only active once hosted)
manifest.webmanifest    Add to Home Screen metadata
audio/letters/          drop real letter recordings here (see naming below)
audio/words/            drop real example-word recordings here
```

## Running it right now

Just open `index.html` — everything works: study mode, flashcards, quiz, search,
favorites, and progress tracking (saved via localStorage on your device). No
build step, no server needed for this.

## Getting *true* offline / Add to Home Screen behavior

Opening a local file can't register a service worker (a browser security rule,
not a bug here) — so to get real airplane-mode offline caching and a proper
"Add to Home Screen" icon, host these files somewhere real. Any static host
works and all are free for a small project like this:

- **GitHub Pages** — push this folder to a repo, enable Pages in Settings.
- **Netlify / Vercel** — drag-and-drop the folder in their dashboard.
- **Cloudflare Pages** — same idea.

Once hosted on `https://...`, open it in Safari on iPhone, tap Share → Add to
Home Screen. The service worker will cache the app shell and any audio files
you've added, so it keeps working with no signal.

## Adding real native Amharic audio

Right now, sound playback tries three things in order, per letter and per
example word:

1. **A real recording**, if present: `audio/letters/{id}.mp3` for the letter,
   `audio/words/{id}.mp3` for its example word.
2. **Google Translate's TTS endpoint** — an unofficial trick that gives
   reasonable Amharic pronunciation most of the time, but it's not a
   documented API and can go quiet or get rate-limited without notice.
3. **Your device's own speech synthesis**, reading an approximate English
   phonetic spelling — always available, but not real Amharic pronunciation.

To upgrade any letter or word to real native audio, just record it and save
it with the matching `id`. The `id` is `{rowIdx}_{orderIdx}` — row = which of
the 33 consonants (0-indexed, in the order listed in `data.js`), order = which
of the 7 vowel forms (0 = 1st order/"ä", …, 6 = 7th order/"o"). For example:

- `ሀ` (row 0, order 0) → `audio/letters/0_0.mp3`
- its example word ሀገር → `audio/words/0_0.mp3`
- `ሁ` (row 0, order 1) → `audio/letters/0_1.mp3`

No code changes needed — the app checks for these files automatically and
prefers them the moment they exist. You don't have to record all 231 at once;
partial coverage works fine, since anything missing just falls through to the
next option in the chain.

## Known limitations (worth knowing)

- **The Google TTS trick is fragile.** It's not an official API, so it can
  change or stop working without warning. This is exactly why the audio
  architecture is built the way it is — real recordings are the permanent fix.
- **~40 of the 231 forms** don't have a confidently-known common example word
  (mostly rare/historic letters where Amharic has multiple letters for the
  same sound). The app shows this honestly rather than inventing one.
- **iOS audio quirks**: the app "unlocks" audio/speech on the very first tap
  (Begin button) so that later, timer-driven sounds aren't silently blocked —
  a real WebKit restriction, not a bug in the data.

## Evolving this project

This is meant to keep growing as one project rather than being rebuilt from
scratch each time — new features, more example words, real audio, etc. can
all be layered on top of this same structure.
