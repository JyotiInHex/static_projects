# Resonance — 3D Audio Visualizer

A browser-based audio visualizer that turns audio into animated 3D visuals.

## Features

- Five visual modes: Wave, Bars, Circle, Particles, and Sphere
- Load local audio files into a playlist
- Live microphone visualization (with browser permission)
- Playback controls, seeking, volume, shuffle, and repeat
- Color and visual sensitivity settings
- Keyboard shortcuts
- Responsive interface
- Saves visual preferences in the browser

## Run locally

1. Open `index.html` in a modern browser, or serve this folder with a local static server.
2. Choose an audio file or drag an audio file onto the page.
3. Select a visual mode from the top navigation.
4. Use Settings to adjust the color and sensitivity.

The page loads Three.js r128 from a CDN, so an internet connection is needed for that dependency unless you replace the CDN script with a local copy.

Audio files are selected locally in the browser; this project does not upload them to a server. Microphone visualization requires permission and may require HTTPS or localhost depending on the browser.

## Technologies

- HTML
- CSS
- JavaScript
- Three.js
- Web Audio API
- Browser File API and localStorage

## Notes

This is a static mini project for experimentation and learning. It has no backend or build step.
