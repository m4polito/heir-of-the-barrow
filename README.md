# Heir of the Barrow

*Heir of the Barrow: The Dimming* is an original 8-bit-style browser role-playing game, written in TypeScript with HTML5 canvas and Web Audio and no runtime dependencies. All of its story, characters, art and music are original.

## Commands

```
npm run dev      # local play
npm test         # run the tests
npm run build    # typecheck and production build (output in dist/)
```

## Keys

| Action  | Keys                         |
| ------- | ---------------------------- |
| Move    | Arrow keys or W, A, S, D     |
| Confirm | Z, Enter or Space            |
| Cancel  | X or Escape                  |
| Mute    | M                            |

## Online

The game is published at https://m4polito.github.io/heir-of-the-barrow/

The workflow in `.github/workflows/pages.yml` tests, builds and publishes the game on every push to `master` (or by hand from the Actions tab). GitHub Pages' source is set to "GitHub Actions", and the `github-pages` environment allows the `master` branch to deploy (by default it allows only `main`).
