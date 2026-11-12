import type { DialogScript } from '../../game/dialog/script';

export type DialogId =
  | 'maren_intro'
  | 'maren'
  | 'hesta'
  | 'garrik'
  | 'odo'
  | 'pip'
  | 'bram'
  | 'tobin'
  | 'villager_a'
  | 'villager_b';

export const DIALOGS: Record<DialogId, DialogScript> = {
  maren_intro: [
    'You are awake early, {name}. Today you are grown.',
    'There is one thing I have kept for this morning.',
    'A squire carried it out of the Barrow twenty years ago.',
    'He set it in my hands and never spoke of what he saw.',
    { give: 'aldric_shield' },
    { sfx: 'menuConfirm' },
    { set: 'shield_received' },
    'It is your father\'s shield. {name} received Aldric\'s Shield.',
    'It is dented, and it is yours.',
    'Stay as long as you like. The fire is warm.',
  ],

  maren: [
    {
      if: 'warden_defeated',
      then: [
        'You went down there.',
        'What did you find, {name}?',
        'No. Tell me later. I am not ready.',
      ],
      else: [
        'The Dimming is worse at night.',
        'I do not say its name aloud much. It listens, I think.',
        'Rest here when you need to. I will keep the lamp lit.',
      ],
    },
  ],

  hesta: [
    {
      if: 'warden_defeated',
      then: [
        'You came back. Sit. Eat something.',
        'Your father never did come through that door again.',
        'A bed is 6 gold, but tonight it is free.',
      ],
      else: [
        'You look more like him every day.',
        'Aldric drank his last cup in this room. He laughed the whole time.',
        'A bed is 6 gold, if you need one.',
      ],
    },
  ],

  garrik: [
    'Aldric was a fool. He left a wife and a child for a hole in the ground.',
    'I will not make that mistake. I make blades and sleep sound.',
    'You may need what a fool needs. Look over the racks.',
  ],

  odo: [
    'Herbs and torches. That is all I carry, and all anyone buys.',
    'Prices climb with the Dimming. I did not set them. The cold did.',
  ],

  pip: [
    'My mum says Aldric is a bedtime story.',
    'Like the ones Gran tells before sleep.',
    'Have you ever seen a real sword?',
  ],

  bram: [
    'I walked your father to this gate.',
    'North-east, past the dead willow.',
    'Stay off the marsh after dusk. I will not walk you.',
  ],

  tobin: [
    {
      if: 'warden_defeated',
      then: [
        'You came back from there.',
        'I will say it now, since you did.',
        'The Warden did not wear your father\'s armor.',
        'I have carried that for twenty years. Go and think on it.',
      ],
      else: [
        '...',
        'He keeps his eyes on his cup and mumbles.',
        'Leave it.',
      ],
    },
  ],

  villager_a: [
    'My crops come up thin as thread. Every year, thinner.',
  ],

  villager_b: [
    'The river runs cold now, even in summer. My father said it was warm once.',
  ],
};
