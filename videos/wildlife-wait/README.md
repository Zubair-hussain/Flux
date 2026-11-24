Nine original vector wildlife stories for Flux's download waiting panel.
Each delivered file is 10 seconds, 768×432, 24 fps, VP9 WebM, with no audio track.
The React panel loads only its current story and unmounts on completion/failure.

Artwork and motion are editable in `scripts/build-wildlife-scenes.mjs`.
The local GSAP runtime is included in `assets/` for offline rendering.

From the repository root:

```powershell
node scripts/build-wildlife-scenes.mjs
npx hyperframes@0.9.77 check videos/wildlife-wait
npx hyperframes@0.9.77 render videos/wildlife-wait --fps 24 --quality delivery --workers 2 --output reports/wildlife-master.mp4
node scripts/encode-wildlife-stories.mjs
```

Finished clips and SVG posters are served from `public/animations/wildlife/`.
Only these delivered assets ship to visitors; the render project is source.
The render intentionally has no audio. Scene-structure warnings concern the
editable master; all nine timed scenes render separately into website clips.
