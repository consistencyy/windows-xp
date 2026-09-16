/* ════════════════════════════════════════════════════════════
   MEDIA PLAYER PLAYLIST — the only file to edit when swapping songs.
   Both the desktop and mobile players read from this list.

   Each track:
     title   – shown in the playlist and "Now Playing"
     audio   – path to the .mp3
     art     – cover image (.jpg/.png/.gif) OR a looping video (.webm/.mp4)
               Optional: leave it out and the placeholder art is used.
     viz     – visualizer style: "bars" | "scope" | "ambience"   (default "bars")
     colors  – optional [main, highlight] hex colors for the visualizer.
               Leave it out and colors are pulled from the art automatically.

   Tip: a tidy way to add songs is one folder per track, e.g.
     assets/tracks/her/audio.mp3
     assets/tracks/her/cover.jpg
   then:
     { title: "eery - Her", audio: "assets/tracks/her/audio.mp3",
       art: "assets/tracks/her/cover.jpg", viz: "scope" },
   ════════════════════════════════════════════════════════════ */

window.PLAYLIST = [
  {
    title: "CHRYSTAL - The Days (Notion Remix)",
    audio: "assets/music1.mp3",
    art:   "assets/music1.webm",
    viz:   "bars"
  },
  {
    title: "eery - Her",
    audio: "assets/music2.mp3",
    art:   "assets/music2.webm",
    viz:   "scope"
  },
  {
    title: "The Backseat Lovers - Slowing Down",
    audio: "assets/music3.mp3",
    art:   "assets/music3.webm",
    viz:   "ambience"
  }
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
