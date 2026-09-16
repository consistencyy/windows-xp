/* ════════════════════════════════════════════════════════════
   MEDIA PLAYER PLAYLIST — the only file to edit when swapping songs.
   Both the desktop and mobile players read from this file.

   Each track:
     title   – shown in the playlist and "Now Playing"
     audio   – path to the .mp3
     mood    – words describing the song, e.g. ["dreamy", "night"].
               The player picks a matching clip from CLIP_BANK below,
               so each play can look a little different.
     art     – optional. A specific image or webm for this song only.
               If set, it always wins over the mood pick.
     viz     – visualizer style: "bars" | "scope" | "ambience"   (default "bars")
     colors  – optional [main, highlight] hex colors for the visualizer.
               Leave it out and colors are pulled from the art automatically.

   Adding a song is usually just:
     { title: "Artist - Song", audio: "assets/music4.mp3",
       mood: ["warm", "mellow"], viz: "bars" },
   ════════════════════════════════════════════════════════════ */

window.PLAYLIST = [
  {
    title: "CHRYSTAL - The Days (Notion Remix)",
    audio: "assets/music1.mp3",
    mood:  ["upbeat", "night"],
    art:   "assets/music1.webm",   // delete this line to use the clip bank instead
    viz:   "bars"
  },
  {
    title: "eery - Her",
    audio: "assets/music2.mp3",
    mood:  ["dreamy", "night"],
    art:   "assets/music2.webm",   // delete this line to use the clip bank instead
    viz:   "scope"
  },
  {
    title: "The Backseat Lovers - Slowing Down",
    audio: "assets/music3.mp3",
    mood:  ["warm", "mellow"],
    art:   "assets/music3.webm",   // delete this line to use the clip bank instead
    viz:   "ambience"
  },
  {
    title: "Blow Tha Speaker",           // change to "Artist - Song" if you like
    audio: "assets/blowthaspeaker.mp3",
    mood:  ["upbeat", "energetic"],
    art:   "assets/minky.webm",
    viz:   "tunnel"
  }
];


/* ════════════════════════════════════════════════════════════
   CLIP BANK — reusable background loops (webm, mp4, gif, jpg, png).
   Put the files in assets/clips/ and list them here with a few tags.
   A track uses the clip whose tags match the most of its moods;
   ties are picked at random.

   Keep tags to a small shared set so they match reliably. For example:
     dreamy · night · warm · mellow · upbeat · sad · city · nature
     rain · summer · retro · hazy · energetic · lonely

   Clips work best short (5–15s), looping, square-ish, and under ~3 MB.
   The player dims them and adds the CRT effect, so busy footage is fine.
   ════════════════════════════════════════════════════════════ */

window.CLIP_BANK = [
  // Your current song videos, reused as starter clips:
  { src: "assets/music1.webm", tags: ["upbeat", "night", "city"] },
  { src: "assets/music2.webm", tags: ["dreamy", "night", "hazy"] },
  { src: "assets/music3.webm", tags: ["warm", "mellow", "summer"] },
  { src: "assets/minky.webm",  tags: ["upbeat", "energetic"] },

  // Add your own like this:
  // { src: "assets/clips/rainy-window.webm", tags: ["rain", "sad", "night"] },
  // { src: "assets/clips/highway-dusk.webm", tags: ["warm", "retro", "mellow"] },
];


/* ════════════════════════════════════════════════════════════
   LAST.FM "RECENTLY PLAYED"
   Fill these in to show what you've been listening to under the playlist.
   Leave either one blank and the panel stays hidden.
     user    – your Last.fm username
     apiKey  – from https://www.last.fm/api/account/create
     count   – how many recent songs to show (3–5 fits best)
   ════════════════════════════════════════════════════════════ */
window.LASTFM = {
  user:   "DesktopCM-Music",
  apiKey: "6ac97f3f86788358feb7d656b65112a7",
  count:  4
};
