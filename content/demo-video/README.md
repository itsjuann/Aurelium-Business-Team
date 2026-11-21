# HVAC demo walkthrough video

`hvac-demo-walkthrough.mp4`: 2 minutes 3 seconds, 1920×1080, captions plus an AI-voice narration (Higgsfield). Recorded 2026-11-19.

**Status: draft for Juan's review. Not published anywhere.** Posting it is a Publishes-class action: Security
Reviewer sign-off, then Juan approves.

## Vertical reel cut

`hvac-demo-reel.mp4`: 23 seconds, 1080×1920, no sound. Recorded 2026-11-20 with `reel.js`.

Made after Juan shared a dashboard Reel he liked as a reference for the format: a camera that zooms into
details of the screen, pans, pulls back to the whole dashboard, a cursor that clicks, and a light-to-dark wipe
at the end. Only the format is borrowed. The screen, data, wording and motion are our own.

- Seven beats, one short caption each: the call, booked, its value, the record, review queued, the estimate
  moving through the pipeline to won, the guarantee, then the sign-off in dark mode.
- The dashboard sits in the top two thirds of the frame; the bottom third is left clear for the Instagram caption
  and buttons.
- No music. Add it inside Instagram or TikTok when posting, where the track is licensed for the platform.
- The recording runs at 25 frames a second, so motion is a little less smooth than a phone screen recording.
- Same rules as the long cut: real demo CRM, fictional shop and callers, "Demo · sample data" on screen, no results
  claimed. Draft only; posting it needs Security Reviewer sign-off and Juan's approval.

```bash
node content/demo-video/reel.js content/demo-video
```

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

- No music. The call itself is still on-screen text, not a recorded call. See "The voice" below.
- No booking link on the end card; there is none yet.
- One wide format only. A vertical cut for Reels and Shorts needs a different layout.

## The voice

- Narration is a Higgsfield preset voice, "Grady" (male), generated with Higgsfield's default speech model
  (`seed_audio`), one clip per line in `narration.json`. It is a synthetic voice, not Juan and not the AI
  receptionist's voice.
- Cost: 12 Higgsfield credits for 16 lines plus three retakes (balance went from 324.8 to 312.8).
- Three lines were retaken because the first take ran long (one had a five-second pause mid-line). The shorter
  take of each was kept. Each clip has its leading and trailing silence trimmed.
- Nobody has listened to this narration yet. Check how it says "Juan", "Aurelium" and "H V A C", and that the
  "nine one one" line (the longest, about 12 seconds) reads cleanly.
- Check Higgsfield's terms for commercial use of generated voice on the Basic plan before the video is published.
- An earlier cut used a free local voice (Piper). `make_voice.py` still builds that version if it is ever needed.
- The spoken lines are separate from the on-screen captions in `record.js`.

## Re-record

```bash
node content/demo-video/record.js content/demo-video <voice folder>
```

The voice folder holds `n1.wav` to `n16.wav` and a `durations.json` with each clip's length in seconds. Leave
it off for a silent, captions-only cut. The Higgsfield clips are not in the repo; regenerate them from
`narration.json` with any Higgsfield voice.

Needs Playwright and ffmpeg. It starts the demo service locally with throwaway secrets and temporary data, so it
never touches the live service. Captions and timings are in `record.js`.
