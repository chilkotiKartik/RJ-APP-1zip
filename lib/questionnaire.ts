export type QuestionType = 'choice' | 'text';

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  sub?: string;
  choices?: string[];
  placeholder?: string;
};

export const QUESTIONS: Question[] = [
  {
    id: 'sunday',
    type: 'choice',
    prompt: 'How do you spend an unhurried morning?',
    sub: 'The kind where no one is waiting for you.',
    choices: [
      'Alone — reading, making something, thinking',
      'With someone close, no agenda',
      'Moving — markets, walks, outdoors',
      'It varies entirely by week',
    ],
  },
  {
    id: 'draws',
    type: 'choice',
    prompt: 'What draws you to someone first?',
    choices: [
      'The way they listen',
      'Their particular sense of humour',
      'How they treat strangers',
      'Something I notice later — never at first',
    ],
  },
  {
    id: 'misunderstood',
    type: 'text',
    prompt: 'What do you want someone to understand about you that most people miss?',
    placeholder: 'Take your time with this one.',
  },
  {
    id: 'honesty',
    type: 'choice',
    prompt: 'How honest are you about what you want?',
    choices: [
      'I say it plainly',
      'I suggest it and hope they notice',
      'I\'m still learning to',
      'Honest in writing — less so in person',
    ],
  },
  {
    id: 'moved',
    type: 'text',
    prompt: 'The last thing that genuinely moved you was —',
    placeholder: 'A book, a place, a conversation, anything.',
  },
  {
    id: 'relationship',
    type: 'choice',
    prompt: 'What does a good relationship look like to you?',
    choices: [
      'Two people who keep choosing each other',
      'Two lives running in parallel, touching often',
      'A long conversation that never quite ends',
      'I\'m open — I haven\'t fixed this yet',
    ],
  },
  {
    id: 'romeo_note',
    type: 'text',
    prompt: 'Is there anything you\'d like Romeo to know before he decides?',
    sub: 'One sentence is enough. So is nothing.',
    placeholder: 'Optional.',
  },
  {
    id: 'hope',
    type: 'choice',
    prompt: 'What are you hoping for here, honestly?',
    choices: [
      'One person, properly',
      'To meet someone interesting',
      'Something I can\'t quite name yet',
      'All of the above',
    ],
  },
];
