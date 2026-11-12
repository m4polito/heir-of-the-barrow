import type { DialogScript } from '../../game/dialog/script';

export type DialogId =
  | 'maren_intro'
  | 'maren_fallen'
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
    'You are awake early, {name}. Old Maren was up before you, as ever.',
    'Today you are grown.',
    'There is one thing I have kept for this morning.',
    'A squire carried it out of the Barrow twenty years ago.',
    'He set it in my hands and never spoke of what he saw.',
    "It is your father's shield.",
    { give: 'aldric_shield' },
    { sfx: 'menuConfirm' },
    { set: 'shield_received' },
    "{name} received Aldric's Shield.",
    'It is dented, and it is yours.',
    "Take your coin to Garrik's forge before you try the gate.",
    'Stay as long as you like. The fire is warm.',
  ],

  maren_fallen: [
    'You are home, {name}. You are safe now.',
    'Bram found you and carried you here. He said nothing.',
    'Half your gold is gone. You are not.',
  ],

  maren: [
    {
      if: 'warden_defeated',
      then: ["You went down there. And you came back to Maren's door."],
      else: ["Sit by old Maren's fire a moment. The Dimming is worse at night."],
    },
    {
      choice: ['Yes', 'No'],
      ask: 'Shall I remember your journey?',
      yes: [{ save: true, ok: [{ sfx: 'save' }, 'It is written.'], fail: ['The page will not take the ink. Nothing was written.'] }],
      no: [],
    },
    {
      if: 'warden_defeated',
      then: ['What did you find, {name}?', 'No. Tell me later. I am not ready.'],
      else: [
        'We stopped saying the word years ago. The cold stayed anyway.',
        'Come back when you need to. I will keep the lamp lit.',
      ],
    },
  ],

  hesta: [
    {
      if: 'warden_defeated',
      then: [
        'You came back. Sit. I told myself: Hesta, that one will want feeding.',
        'Your father never did come through that door again.',
        {
          choice: ['Yes', 'No'],
          ask: 'A bed is still 6 gold, and I will not hear otherwise. Stay?',
          yes: [{ pay: 6, then: [{ rest: 'inn' }, 'Morning. Eat before you go. I mean it.'], else: ['That is not 6 gold. I said I will not hear otherwise.'] }],
          no: ['Then sit a while anyway.'],
        },
      ],
      else: [
        'As sure as my name is Hesta, you look more like him every day.',
        'Aldric drank his last cup in this room. He laughed the whole time.',
        {
          choice: ['Yes', 'No'],
          ask: 'A bed is 6 gold, if you need one. Stay?',
          yes: [{ pay: 6, then: [{ rest: 'inn' }, 'Morning. You slept like a stone. He never could.'], else: ['That is not 6 gold. Come back when you have it.'] }],
          no: ['Then mind the road. The bed will keep.'],
        },
      ],
    },
  ],

  garrik: [
    'Aldric was a fool. I am Garrik the smith, and I say so to anyone.',
    'You may need what a fool needs. Look over the racks.',
    { shop: 'forge' },
    'He left a wife and a child for a hole in the ground.',
    'I will not make that mistake. I make blades and sleep sound.',
  ],

  odo: [
    "Odo's Goods, and Odo himself. Herbs and torches, that is all I carry.",
    { shop: 'goods' },
    'Prices climb with the Dimming. I did not set them. The cold did.',
  ],

  pip: [
    "I'm Pip! My mum says Aldric is a bedtime story.",
    'Like the ones Gran tells before sleep.',
    'Have you ever seen a real sword?',
  ],

  bram: [
    'Thirty years they have shouted "Bram, open up!" at this gate. I walked your father to it.',
    'North-east, past the dead willow.',
    'Stay off the marsh after dusk. I will not walk you.',
  ],

  tobin: [
    {
      if: 'warden_defeated',
      then: [
        'You came back from there. Only Tobin ever did that before.',
        'I will say it now, since you did.',
        'The Warden did not wear your father\'s armor.',
        'I have carried that for twenty years. Go and think on it.',
      ],
      else: [
        'Let Tobin drink. Tobin has nothing to say to you.',
        'He keeps his eyes on his cup.',
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
