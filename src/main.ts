import { Screen } from './engine/screen';
import { Input } from './engine/input';
import { Font, buildFontSheet } from './engine/font';
import { StateStack } from './engine/state';
import { startLoop } from './engine/loop';
import { PALETTE } from './data/palette';
import { BootState } from './game/boot';

const screen = new Screen(document.getElementById('game')!);
const input = new Input();
input.attach(window);
const font = new Font(buildFontSheet(PALETTE));
const stack = new StateStack();
stack.push(new BootState({ font, onStart: () => {} }));

window.addEventListener('resize', () => screen.resize());

startLoop(
  () => {
    input.update();
    stack.update(input);
  },
  () => {
    stack.render(screen.ctx);
    screen.present();
  },
);
