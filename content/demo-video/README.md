# HVAC demo walkthrough video

`hvac-demo-walkthrough.mp4`: 2 minutes 23 seconds, 1920×1080. The call is spoken out loud, the rest is narrated, and captions sit in their own strip under the dashboard. Recorded 2026-11-20.

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
2. A no-heat call, spoken out loud and shown as a transcript on the left, while the demo CRM (`apps/hvac-demo`) runs on the right.
   The receptionist's lines follow the script in `clients/_demo-hvac/receptionist/script.md`.
3. The job landing on the calendar, with its source tag, badges and value.
4. The confirmation text, then "Mark job complete" and the review request.
5. A second call for a replacement estimate: the visit is booked, the install sits in the pipeline, the day 2, 7
   and 14 follow-ups are staged, and the estimate is marked won.
6. The guarantee bar, then the end card.

## What is real and what is not

- The CRM on screen is the real demo service, driven through its real booking endpoints. Nothing is drawn by hand.
- The call is a **scripted example**, labelled on screen: the receptionist's real voice, a voice actor as the
  caller. It is not a recording of a live call or of a customer.
- The shop, callers, addresses and phone numbers are fictional. The dollar figures use made-up averages for the
  fictional shop ($420 a service call, $11,500 an install). A "Demo · sample data" mark stays on screen.
- No results are claimed. The only promise shown is the 90-day guarantee, worded as in the offer.

## Not in this cut

- No music.
- No booking link on the end card; there is none yet.
- One wide format only. A vertical cut for Reels and Shorts needs a different layout.

## The voices

- **The call is audible.** It opens with a ring tone, then 15 spoken lines play in order while each one
  appears in the transcript. The lines are in `call-lines.json`.
- **The receptionist** speaks in the voice the HVAC demo line really answers with: ElevenLabs "Cassidy - Crisp,
  Direct and Clear" (voice `56AoDkrOh6qfVPDXZ7Pt`, read from the agent's settings), model `eleven_v4`.
- **The caller** is a second ElevenLabs voice, "Chris - Charming, Down-to-Earth", filtered to sound like a
  phone line. He is a voice actor, and the video says so on screen.
- **It is a scripted example, not a recording of a live call.** The receptionist's words follow the script in
  `clients/_demo-hvac/receptionist/script.md`. A live call would have real pauses and could word things
  differently. A real recorded call can replace this once the 12 test calls pass.
- **The narrator** outside the call is the same Cassidy voice. Lines are in `narration.json`; n2 to n5 are no
  longer used because the call itself now plays where they were.
- Cost so far on ElevenLabs: about 2,700 credits of the 40,000 monthly allowance.
- Nobody has listened to the audio yet. Check how it says "Juan", "Aurelium" and "H V A C", and how the
  phone number read-back sounds (line c9, about 8 seconds).
- Captions sit in a strip under the dashboard and never cover it.

## Re-record

```bash
node content/demo-video/record.js content/demo-video <voice folder>
```

The voice folder holds `n1.wav` to `n16.wav` and a `durations.json` with each clip's length in seconds. Leave
it off for a silent, captions-only cut. The Higgsfield clips are not in the repo; regenerate them from
`narration.json` with any Higgsfield voice.

Needs Playwright and ffmpeg. It starts the demo service locally with throwaway secrets and temporary data, so it
never touches the live service. Captions and timings are in `record.js`.
