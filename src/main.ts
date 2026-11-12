import { Screen } from './engine/screen';
import { Input } from './engine/input';
import { Font, buildFontSheet } from './engine/font';
import { StateStack } from './engine/state';
import { startLoop } from './engine/loop';
import { PALETTE } from './data/palette';
import { BootState } from './game/boot';
import { ExploreState } from './game/explore';
import { createHero } from './game/hero';
import { HOLLOWMERE } from './data/maps/hollowmere';
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
const audio = new AudioManager(safeLocalStorage());
audio.installUnlockListener(window);
const stack = new StateStack();
stack.push(new BootState({ font, onStart: () => {
    const s = HOLLOWMERE.entry.start!;
    stack.replace(new ExploreState({ map: HOLLOWMERE, hero: createHero(s.x, s.y, s.facing) }));
  } }));

window.addEventListener('resize', () => screen.resize());

startLoop(
  () => {
    input.update();
    if (input.pressed('mute')) audio.toggleMute();
    stack.update(input);
  },
  () => {
    stack.render(screen.ctx);
    screen.present();
  },
);
