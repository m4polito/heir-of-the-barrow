import { Screen } from './engine/screen';
import { Input } from './engine/input';
import { Font, buildFontSheet } from './engine/font';
import { StateStack } from './engine/state';
import { startLoop } from './engine/loop';
import { PALETTE } from './data/palette';
import { BootState } from './game/boot';
import { TitleState } from './game/title';
import { createGame } from './game/game';
import { createPlayer } from './game/player';
import { createRng } from './engine/rng';
import { SpriteCache } from './engine/spriteCache';
import { MAPS } from './data/maps';
import { DIALOGS } from './data/dialog/hollowmere';
import { SONGS } from './data/songs';
import { ITEMS } from './data/items';
import { MONSTERS } from './data/monsters';
import { SPELLS } from './data/spells';
import { STORY } from './data/story';
import { AudioManager } from './engine/audio/audio';

function safeLocalStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

const screen = new Screen(document.getElementById('game')!);
const input = new Input();
input.attach(window);
const font = new Font(buildFontSheet(PALETTE));
const audio = new AudioManager(safeLocalStorage(), { muteKey: STORY.storagePrefix + '.mute' });
audio.installUnlockListener(window);
const stack = new StateStack();
const game = createGame({
  stack,
  input,
  font,
  audio,
  sprites: new SpriteCache(PALETTE),
  rng: createRng(Date.now()),
  maps: MAPS,
  dialogs: DIALOGS,
  songs: SONGS,
  items: ITEMS,
  monsters: MONSTERS,
  spells: SPELLS,
  story: STORY,
  player: createPlayer(STORY.defaultHeroName, STORY.startingItems),
});
if (import.meta.env.DEV) {
  void import('./game/debug').then((m) => m.installDebug(game));
}
stack.push(
  new BootState({
    font,
    onStart: () => stack.reset(new TitleState(game)),
  }),
);

window.addEventListener('resize', () => screen.resize());

let frame = 0;

startLoop(
  () => {
    input.update();
    frame++;
    if (input.pressed('mute')) audio.toggleMute();
    stack.update(input);
  },
  () => {
    stack.render(screen.ctx, frame);
    screen.present();
  },
);
