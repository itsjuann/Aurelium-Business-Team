# HVAC demo walkthrough video

`hvac-demo-walkthrough.mp4`: 1 minute 50 seconds, 1920×1080, captions plus a computer-voice narration. Recorded 2026-11-19.

**Status: draft for Juan's review. Not published anywhere.** Posting it is a Publishes-class action: Security
Reviewer sign-off, then Juan approves.

## What it shows

1. Title: "It's 9:14 at night. A furnace just quit."
2. A no-heat call, shown as a text conversation on the left, while the demo CRM (`apps/hvac-demo`) runs on the right.
   The receptionist's lines follow the script in `clients/_demo-hvac/receptionist/script.md`.
3. The job landing on the calendar, with its source tag, badges and value.
4. The confirmation text, then "Mark job complete" and the review request.
5. A second call for a replacement estimate: the visit is booked, the install sits in the pipeline, the day 2, 7
   and 14 follow-ups are staged, and the estimate is marked won.
6. The guarantee bar, then the end card.

## What is real and what is not

- The CRM on screen is the real demo service, driven through its real booking endpoints. Nothing is drawn by hand.
- The call is a **scripted example**, labelled on screen. It is not a recording of the AI receptionist or of a
  customer. A real recorded call can replace it once the ElevenLabs account issue is resolved.
- The shop, callers, addresses and phone numbers are fictional. The dollar figures use made-up averages for the
  fictional shop ($420 a service call, $11,500 an install). A "Demo · sample data" mark stays on screen.
- No results are claimed. The only promise shown is the 90-day guarantee, worded as in the offer.

## Not in this cut

- No music, and the narration is not an ElevenLabs voice: ElevenLabs refused voice generation on 2026-11-19
  (account payment issue). See "The voice" below.
- No booking link on the end card; there is none yet.
- One wide format only. A vertical cut for Reels and Shorts needs a different layout.

## The voice

- Narration is generated on this machine with Piper (`pip install piper-tts`), voice `en-us-libritts-high`,
  speaker 6. It is a synthetic voice, not Juan and not the AI receptionist's voice.
- The voice model's card lists its training data as LibriTTS under **CC BY 4.0**, which allows commercial use
  with attribution. Credit line if the video is published: "Narration voice: Piper, LibriTTS model (CC BY 4.0)."
  Confirm that licence before the video is published; this is from the model card, not a legal review.
- A first candidate voice (`ryan-high`) was dropped: its card says CC BY-NC-SA, non-commercial only.
- The model is about 120 MB and is not in the repo. It comes from the Piper release at
  `github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-libritts-high.tar.gz`.
- The spoken lines are in `narration.json`. They are separate from the on-screen captions in `record.js`.
- Nobody has listened to this narration yet. Check how it says "Juan", "Aurelium" and "H V A C".

## Re-record

```bash
python3 content/demo-video/make_voice.py <path to en-us-libritts-high.onnx> 6 /tmp/voice
node content/demo-video/record.js content/demo-video /tmp/voice
```

Leave the voice folder off the second command for a silent, captions-only cut. Change the speaker number
(0 to 903) for a different voice.

Needs Playwright and ffmpeg. It starts the demo service locally with throwaway secrets and temporary data, so it
never touches the live service. Captions and timings are in `record.js`.
