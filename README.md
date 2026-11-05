# Static Projects

A curated collection of frontend experiments, interactive interfaces and creative web projects by **Parag Jyoti Das**.

This repository keeps each project independent and easy to explore. The root homepage is a lightweight project index; individual projects live in their own folders.

## Explore

- **Project gallery:** [Open the GitHub Pages site](https://JyotiInHex.github.io/static_projects/) (available once Pages deployment is configured and successful)
- **Source code:** [Browse this repository](https://github.com/JyotiInHex/static_projects)

## Current projects

| Project | Description | Technologies |
| --- | --- | --- |
| [Resonance — 3D Audio Visualizer](./resonance-3d-audio-visualizer/) | Browser-based audio visualizer with six 3D modes, local audio playback and microphone input. | HTML, CSS, JavaScript, Three.js, Web Audio API |

## Repository structure

```text
static_projects/
├── index.html             # Project gallery homepage
├── projects.json          # Project metadata used by the gallery
├── favicon.svg
├── assets/                # Shared static assets
└── project-folder/        # One independent folder per project
```

## Add a project

1. Create a descriptive, lowercase folder at the repository root.
2. Put the project's entry page at `<folder>/index.html`.
3. Add a project-specific `README.md` with features, technologies and run instructions.
4. Add an entry to `projects.json` using the existing schema.
5. Keep project-specific CSS, JavaScript and media inside that folder.

The gallery reads `projects.json` at runtime. Use relative paths (for example, `./my-project/`) so it works under the GitHub Pages repository subpath.

## Local preview

Because the homepage loads `projects.json` using `fetch()`, serve the repository root with a local HTTP server rather than opening `index.html` directly.

For example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Styling

The gallery currently uses Tailwind CSS utilities through the Tailwind CDN for a no-build static setup. For a production deployment with a compiled, purged stylesheet, a build pipeline can be introduced as a separate improvement.

## Scope

This repository is for static sites, mini-apps, prototypes, UI experiments and learning projects. It is not intended to be a monolithic application.
