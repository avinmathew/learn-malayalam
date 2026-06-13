import type { CourseLesson } from './courseTypes'

export const phraseCourseLessons: CourseLesson[] = [
  {
    id: 'phrase-conversation-openers',
    deckType: 'phrase',
    moduleLabel: 'Module 1',
    title: 'Start the Conversation',
    startOrder: 1,
    upNextLabel: 'Phrases 1-13',
    summary: 'These first phrase cards are social glue. They help you greet someone politely, introduce yourself, and keep the interaction going when your Malayalam is still limited.',
    sections: [
      {
        heading: 'What this first pack lets you do',
        bullets: [
          'Open a conversation politely with greetings, thanks, and apologies.',
          'Introduce yourself and sound friendly rather than abrupt.',
          'Explain that you do not know or understand Malayalam yet.',
          'Ask the other person to slow down or write something down.',
        ],
      },
      {
        heading: 'Why this comes first',
        paragraphs: [
          'Before travel or shopping language matters, you need phrases that help conversations start without awkwardness. These cards buy time, invite help, and help people understand you even if you make mistakes.',
        ],
        rows: [
          { left: 'Courtesy phrases', right: 'Make requests sound softer and more natural.' },
          { left: 'Repair phrases', right: 'Keep the conversation alive when you miss something.' },
          { left: 'Identity phrases', right: 'Let you explain who you are and why you need help.' },
        ],
      },
    ],
    goal: 'Use these phrases automatically so you can start a conversation without freezing up.',
  },
  {
    id: 'phrase-survival-basics',
    deckType: 'phrase',
    moduleLabel: 'Module 2',
    title: 'Immediate Survival Phrases',
    startOrder: 14,
    upNextLabel: 'Phrases 14-31',
    summary: 'You will learn the first things a traveller or beginner often needs: water, food, toilets, directions, price questions, and short urgent help phrases.',
    sections: [
      {
        heading: 'What you can do after this block',
        bullets: [
          'Ask for water, food, hot water, and a toilet.',
          'Check where a place is and whether you are going the right way.',
          'Handle simple price conversations and decide what to buy.',
          'Say that you are lost or that something is urgent.',
        ],
      },
      {
        heading: 'What to notice',
        rows: [
          { left: 'Need statements', right: 'Useful whenever you need comfort, transport, or help.' },
          { left: 'Location questions', right: 'A small set of place-finding patterns appears again and again.' },
          { left: 'Urgency phrases', right: 'Short direct language is more important than perfect grammar.' },
        ],
      },
    ],
    goal: 'Cover basic comfort, navigation, and help-seeking without needing full conversation skills.',
  },
  {
    id: 'phrase-pronoun-toolkit',
    deckType: 'phrase',
    moduleLabel: 'Module 3',
    title: 'Talking About People and Things',
    startOrder: 33,
    upNextLabel: 'Phrases 33-58',
    summary: 'These cards look simpler than the travel phrases, but they are structural. They teach who is doing something, whose object is being discussed, and what item someone is pointing at.',
    sections: [
      {
        heading: 'Three jobs in one module',
        rows: [
          { left: 'Personal pronouns', right: 'I, you, he, she, we, and they.' },
          { left: 'Possessive pronouns', right: 'My, your, his, our, and their.' },
          { left: 'Demonstratives', right: 'This, that, these, and those.' },
        ],
      },
      {
        paragraphs: [
          'Later sentence cards become much easier when you can spot these anchor words instantly. Instead of memorising whole sentences, you start seeing how they are built.',
        ],
        bullets: [
          'They reduce the amount of whole-sentence memorisation you need.',
          'They help you follow who is speaking, owning, or pointing.',
          'They prepare you for more flexible phrase building later.',
        ],
      },
    ],
    goal: 'Recognize these small grammar words quickly inside longer Malayalam sentences.',
  },
  {
    id: 'phrase-transport-workflow',
    deckType: 'phrase',
    moduleLabel: 'Module 4',
    title: 'Getting Around',
    startOrder: 59,
    upNextLabel: 'Phrases 59-99',
    summary: 'Here you turn direction questions into actual travel. You move from asking how to get somewhere to buying tickets, finding the right stop, and talking to drivers.',
    sections: [
      {
        heading: 'Typical travel workflow',
        bullets: [
          'Ask how to reach a destination and whether public transport works.',
          'Ask about departure time, arrival time, delay, and seat availability.',
          'Buy the right ticket and confirm class, direction, or seat type.',
          'Handle buses, trains, and taxis once you are already on the move.',
        ],
      },
      {
        heading: 'Why these cards belong together',
        paragraphs: [
          'Transport language repeats the same ideas in different forms: destination, time, ticket, stop, platform, fare, and getting off. Once those ideas feel familiar, many new travel phrases become easier to decode.',
        ],
      },
    ],
    goal: 'Handle common local transport situations without inventing sentences from scratch.',
  },
  {
    id: 'phrase-hosting-and-shopping',
    deckType: 'phrase',
    moduleLabel: 'Module 5',
    title: 'Living Locally',
    startOrder: 100,
    upNextLabel: 'Phrases 100-119',
    summary: 'These cards shift from movement to everyday living. They cover staying with locals, sounding considerate as a guest, and handling low-pressure shopping interactions.',
    sections: [
      {
        heading: 'Two related skills',
        rows: [
          { left: 'Being a guest', right: 'Offer help, show gratitude, and ask about meals or staying over.' },
          { left: 'Buying everyday things', right: 'Find shops, ask prices, get receipts, and return items.' },
        ],
      },
      {
        paragraphs: [
          'This is less about emergency efficiency and more about sounding thoughtful. The language here helps you interact like a person sharing space, not just a tourist extracting information.',
        ],
      },
    ],
    goal: 'Manage ordinary day-to-day interactions with more warmth and independence.',
  },
  {
    id: 'phrase-emergency-escalation',
    deckType: 'phrase',
    moduleLabel: 'Module 6',
    title: 'Help, Safety, and Health',
    startOrder: 120,
    upNextLabel: 'Phrases 120-165',
    summary: 'The early survival cards taught you to say help. This block teaches what kind of help you need, who to call, what happened, what hurts, and what access support you require.',
    sections: [
      {
        heading: 'Three escalation zones',
        rows: [
          { left: 'Police language', right: 'Report theft, assault, loss, or the need to contact someone.' },
          { left: 'Medical language', right: 'Ask for a hospital, describe symptoms, and discuss medicine.' },
          { left: 'Accessibility language', right: 'Ask for assistance, wheelchair access, toilets, lifts, or space.' },
        ],
      },
      {
        paragraphs: [
          'In stressful situations, direct clarity matters more than elegant grammar. The goal is fast recognition and retrieval, not perfect sentence building.',
        ],
      },
    ],
    goal: 'Find and use the right help-seeking phrase quickly under pressure.',
  },
  {
    id: 'phrase-time-and-calendar',
    deckType: 'phrase',
    moduleLabel: 'Module 7',
    title: 'Time, Dates, and Scheduling',
    startOrder: 166,
    upNextLabel: 'Phrases 166-229',
    summary: 'Here you give your plans coordinates. It moves from broad labels like today and tomorrow to weekdays, months, clock expressions, and units of duration.',
    sections: [
      {
        heading: 'What this unlocks',
        bullets: [
          'Talk about past, present, and future timing.',
          'Understand weekdays, months, seasons, and dates.',
          'Ask or answer what time something happens.',
          'Interpret duration such as minutes, hours, weeks, and years.',
        ],
      },
      {
        heading: 'Why it appears here',
        paragraphs: [
          'Once you can travel, buy, and ask for help, time language makes those abilities usable in real schedules. You stop saying only what you need and start saying when you need it.',
        ],
      },
    ],
    goal: 'Attach meetings, departures, and daily plans to concrete times and dates.',
  },
  {
    id: 'phrase-numbers-and-amounts',
    deckType: 'phrase',
    moduleLabel: 'Module 8',
    title: 'Numbers and Quantity',
    startOrder: 230,
    upNextLabel: 'Phrases 230-290',
    summary: 'Numbers and amount words support almost every practical task: prices, dates, ticket counts, room bookings, times, bargaining, and measurements.',
    sections: [
      {
        heading: 'Three layers',
        rows: [
          { left: 'Cardinal numbers', right: 'Recognize everyday counts first, then larger values.' },
          { left: 'Ordinal numbers', right: 'Useful for dates, floors, ranks, and sequence.' },
          { left: 'Amount words', right: 'Half, quarter, more, less, how much, and how many.' },
        ],
      },
      {
        paragraphs: [
          'You do not need every large number right away. The practical target is quick recognition of the ranges most often used in shops, hotels, transport, and time expressions.',
        ],
      },
    ],
    goal: 'Read or hear prices, counts, times, and quantities without stopping the interaction.',
  },
  {
    id: 'phrase-accommodation',
    deckType: 'phrase',
    moduleLabel: 'Module 9',
    title: 'Accommodation and Check-In',
    startOrder: 291,
    upNextLabel: 'Phrases 291-309',
    summary: 'Here you bring earlier skills together in a real stay: booking a room, asking about facilities, reporting problems, checking out, and arranging the next step.',
    sections: [
      {
        heading: 'What you can manage here',
        bullets: [
          'Ask about room type, price per night, breakfast, and wifi.',
          'Handle keys, laundry, tours, hot water, and broken equipment.',
          'Ask about checkout time, deposits, and onward taxi transport.',
        ],
      },
      {
        paragraphs: [
          'This module is a good test of how far the course has taken you. It draws on politeness, numbers, time, and problem-reporting in one everyday setting.',
        ],
      },
    ],
    goal: 'Manage a hotel or guesthouse stay with less dependence on English.',
  },
]