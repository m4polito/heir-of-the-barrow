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

## Putting it online

Nothing is online yet. When you want to share the game, take these steps:

1. Create an empty GitHub repository (no README, no license, no .gitignore).
2. Add it as the remote: `git remote add origin https://github.com/<your-name>/<repository>.git`
3. Push the default branch: `git push -u origin master`
4. In the repository's Settings, open Pages and set the source to "GitHub Actions".

The workflow in `.github/workflows/pages.yml` then tests, builds and publishes the game on every push to `master` (or by hand from the Actions tab). The game will be at:

```
https://<your-name>.github.io/<repository>/
```

The build uses relative paths (`base: './'`), so it works under that sub-path.
