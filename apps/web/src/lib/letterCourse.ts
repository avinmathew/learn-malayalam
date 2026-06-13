import type { CourseLesson } from './courseTypes'

export const letterCourseLessons: CourseLesson[] = [
  {
    id: 'letter-introduction',
    deckType: 'letter',
    moduleLabel: 'Introduction',
    title: 'How Malayalam Writing Works',
    startOrder: 1,
    upNextLabel: 'Before Letters 1-14',
    summary: 'Malayalam writing works differently from English. Most consonants come with a default vowel sound, and vowel signs can change that sound. Once you see this pattern, the rest gets much easier.',
    sections: [
      {
        heading: 'The basic idea',
        bullets: [
          'ക is read as "ka", not just "k".',
          'Most consonants come with a default vowel sound.',
          'Vowel signs change the vowel sound.',
          'Sometimes Malayalam has special letters that remove the vowel sound completely. You will learn these later.',
        ],
      },
      {
        heading: 'Example',
        columns: ['Form', 'Reading'],
        rows: [
          { left: 'ക', right: 'ka' },
          { left: 'കാ', right: 'kaa' },
          { left: 'കി', right: 'ki' },
          { left: 'ക്', right: 'k' },
          { left: 'ൿ', right: 'special letter for a final k sound' },
        ],
        paragraphs: [
          'ക് uses a small mark called a virama (്) to remove the default vowel sound. Later you will learn special letters that can also show a consonant without a vowel.',
        ],
      },
    ],
    goal: 'Understand how vowels, consonants, vowel signs, and chillu letters work together in Malayalam script.',
  },
  {
    id: 'letter-vowels',
    deckType: 'letter',
    moduleLabel: 'Module 1',
    title: 'Meet the Malayalam Vowels',
    startOrder: 1,
    upNextLabel: 'Letters 1-14',
    summary: 'Malayalam vowels are called സ്വരാക്ഷരങ്ങൾ (svaraksharangngal). Malayalam vowels have short and long versions. The length of the vowel can change the meaning of a word.',
    sections: [
      {
        heading: 'Short and long vowels',
        columns: ['Short', 'Long'],
        rows: [
          { left: 'അ (a)', right: 'ആ (aa)' },
          { left: 'ഇ (i)', right: 'ഈ (ii)' },
          { left: 'ഉ (u)', right: 'ഊ (uu)' },
          { left: 'എ (e)', right: 'ഏ (ee)' },
          { left: 'ഒ (o)', right: 'ഓ (oo)' },
        ],
        paragraphs: ['Long vowels are held slightly longer when spoken.'],
      },
      {
        heading: 'Special vowels',
        bullets: [
          'ഐ (ai) sounds like the vowel in "kite".',
          'ഔ (au) sounds similar to the "ow" in "cow".',
        ],
        paragraphs: ['These spellings are only close English-style guides. They are not exact matches.'],
      },
      {
        heading: 'Anusvaram and visargam',
        paragraphs: [
          'The symbol ം (anusvaram) represents a nasal sound. It is not a separate consonant and usually appears at the end of a syllable. You will see it in words such as സംസാരം, സംശയം, and സംരംഭം.',
          'അഃ adds a soft breathy release after a vowel. It appears mostly in Sanskrit-derived words such as ദുഃഖം and പ്രാതഃകാലം.',
        ],
      },
    ],
    goal: 'Recognise every independent Malayalam vowel before moving on to consonants.',
  },
  {
    id: 'letter-core-consonants',
    deckType: 'letter',
    moduleLabel: 'Module 2',
    title: 'Your First Consonants',
    startOrder: 15,
    upNextLabel: 'Letters 15-26',
    summary: 'Malayalam consonants are called വ്യഞ്ജനങ്ങൾ (vyanjanangal). Most consonants are read with an "a" sound unless a vowel sign changes it.',
    sections: [
      {
        heading: 'Read them as syllables',
        bullets: [
          'ക = ka, not just k',
          'മ = ma, not just m',
          'ന = na, not just n',
        ],
      },
      {
        heading: 'Common letters',
        columns: ['Letter', 'Sound'],
        rows: [
          { left: 'ക', right: 'ka' },
          { left: 'ച', right: 'cha' },
          { left: 'ട', right: 'tta' },
          { left: 'ത', right: 'ta' },
          { left: 'പ', right: 'pa' },
          { left: 'മ', right: 'ma' },
          { left: 'ന', right: 'na' },
        ],
        paragraphs: ['These letters appear in thousands of common words and are enough to start sounding out very simple syllables.'],
      },
    ],
    goal: 'Read standalone syllables such as ക, മ, ന, and പ without stripping away the inherent vowel.',
  },
  {
    id: 'letter-vowel-signs',
    deckType: 'letter',
    moduleLabel: 'Module 3',
    title: 'Vowel Signs (Matras)',
    startOrder: 27,
    upNextLabel: 'Letters 27-37',
    summary: 'This is the point where single letters start turning into readable Malayalam patterns. A consonant already includes an "a" sound, and vowel signs change that sound without adding a new consonant.',
    sections: [
      {
        heading: 'How matras work',
        paragraphs: [
          'ക on its own is ka. When a vowel sign is attached, the sound changes: kaa, ki, kii, ku, and so on.',
          'This matters more for reading than memorising every rare letter early on, because many Malayalam words are built from consonants plus vowel signs.',
        ],
      },
      {
        heading: 'First pattern to master',
        columns: ['Form', 'Sound'],
        rows: [
          { left: 'ക', right: 'ka' },
          { left: 'കാ', right: 'kaa' },
          { left: 'കി', right: 'ki' },
          { left: 'കീ', right: 'kii' },
          { left: 'കു', right: 'ku' },
          { left: 'കൂ', right: 'kuu' },
          { left: 'കെ', right: 'ke' },
          { left: 'കേ', right: 'kee' },
          { left: 'കൈ', right: 'kai' },
          { left: 'കൊ', right: 'ko' },
          { left: 'കോ', right: 'koo' },
          { left: 'കൗ', right: 'kau' },
        ],
      },
    ],
    goal: 'Notice vowel sign patterns quickly so that Malayalam syllables become easy to recognise at a glance.',
  },
  {
    id: 'letter-more-common-consonants',
    deckType: 'letter',
    moduleLabel: 'Module 4',
    title: 'More Everyday Consonants',
    startOrder: 38,
    upNextLabel: 'Letters 38-43',
    summary: 'After the vowel-sign pattern, the next six consonants complete a large share of the everyday symbols you will see in basic Malayalam text.',
    sections: [
      {
        columns: ['Letter', 'Sound'],
        rows: [
          { left: 'യ', right: 'ya' },
          { left: 'ര', right: 'ra' },
          { left: 'ല', right: 'la' },
          { left: 'വ', right: 'va' },
          { left: 'സ', right: 'sa' },
          { left: 'ഹ', right: 'ha' },
        ],
        paragraphs: ['These are everyday workhorse letters. You will keep seeing them when words become longer and more varied.'],
      },
    ],
    goal: 'Fold these six letters into the same fast visual recognition you already have for ക, മ, ന, and the other early consonants.',
  },
  {
    id: 'letter-aspirated-consonants',
    deckType: 'letter',
    moduleLabel: 'Module 5',
    title: 'Consonant Families and Aspirated Consonants',
    startOrder: 44,
    upNextLabel: 'Letters 44-58',
    summary: 'Some Malayalam consonants come in pairs where the second version releases an extra puff of air. Many learners first need to notice the visual pairing before worrying about perfect pronunciation.',
    sections: [
      {
        heading: 'Common pairs',
        columns: ['Unaspirated', 'Aspirated'],
        rows: [
          { left: 'ക', right: 'ഖ' },
          { left: 'ഗ', right: 'ഘ' },
          { left: 'ച', right: 'ഛ' },
          { left: 'ജ', right: 'ഝ' },
          { left: 'ട', right: 'ഠ' },
          { left: 'ഡ', right: 'ഢ' },
          { left: 'ത', right: 'ഥ' },
          { left: 'ദ', right: 'ധ' },
          { left: 'പ', right: 'ഫ' },
          { left: 'ബ', right: 'ഭ' },
        ],
      },
      {
        heading: 'Why these groups help',
        paragraphs: [
          'Some letters come in groups that are related in shape and sound. Spotting these groups can make the script feel much easier to learn.',
        ],
      },
      {
        heading: 'A concrete example',
        columns: ['Family', 'Letters'],
        rows: [
          { left: 'Velar family', right: 'ക ഖ ഗ ഘ ങ' },
          { left: 'Palatal family', right: 'ച ഛ ജ ഝ ഞ' },
        ],
      },
      {
        paragraphs: [
          'For English speakers, ക is close to "k" while ഖ is closer to "kh" with extra breath.',
          'In modern spoken Malayalam, many aspirated sounds are most common in Sanskrit-derived words.',
        ],
      },
    ],
    goal: 'Recognise aspirated letters while reading, even if exact pronunciation takes time.',
  },
  {
    id: 'letter-special-letters',
    deckType: 'letter',
    moduleLabel: 'Module 6',
    title: 'Important Malayalam Letter Distinctions',
    startOrder: 59,
    upNextLabel: 'Letters 59-61',
    summary: 'Some Malayalam letters represent sounds that do not exist in English and are important for accurate reading. These letters deserve special attention because learners often confuse them.',
    sections: [
      {
        columns: ['Letter', 'Description'],
        rows: [
          { left: 'ല', right: 'Ordinary l sound' },
          { left: 'ള', right: 'Retroflex l sound' },
          { left: 'ര', right: 'Softer r sound' },
          { left: 'റ', right: 'Harder flapped or rolled r sound' },
          { left: 'ഴ', right: 'Unique Malayalam sound' },
        ],
      },
      {
        paragraphs: [
          'Many learners confuse these letters at first. Focus on visual recognition before worrying about perfect pronunciation.',
          'ഴ does not exist in English, and many learners need months before it feels natural.',
          'That is normal. Visual recognition matters more than perfect pronunciation at this stage.',
        ],
      },
    ],
    goal: 'Spot these letters immediately in text, even if you still simplify them when speaking.',
  },
  {
    id: 'letter-chillu',
    deckType: 'letter',
    moduleLabel: 'Module 7',
    title: 'Chillu Letters',
    startOrder: 62,
    upNextLabel: 'Letters 62-67',
    summary: 'Chillu letters are one of the most distinctive parts of Malayalam script. They let you write a pure consonant sound without the built-in vowel.',
    sections: [
      {
        heading: 'Why they exist',
        bullets: [
          'ന = na, but ൻ = n',
          'ല = la, but ൽ = l',
          'ര = ra, but ർ = r',
        ],
        paragraphs: [
          'In everyday Malayalam writing, these are special letters used to show a consonant sound without adding a vowel.',
        ],
      },
      {
        heading: 'Core forms',
        columns: ['Chillu', 'Sound'],
        rows: [
          { left: 'ൻ', right: 'n' },
          { left: 'ൺ', right: 'nn' },
          { left: 'ർ', right: 'r' },
          { left: 'ൽ', right: 'l' },
          { left: 'ൾ', right: 'll' },
          { left: 'ൿ', right: 'k' },
        ],
      },
      {
        heading: 'Why they matter',
        paragraphs: ['You will see them often in real Malayalam words such as ഞാൻ, അവർ, കേരളം, and നാൾ. Without the chillu form, the word would sound wrong.'],
      },
    ],
    goal: 'Recognise chillu letters instantly while reading connected Malayalam text.',
  },
  {
    id: 'letter-rare-vowels',
    deckType: 'letter',
    moduleLabel: 'Module 8',
    title: 'Rare Sanskrit Vowels',
    startOrder: 68,
    upNextLabel: 'Letters 68-71',
    summary: 'These vowel letters exist mainly for Sanskrit-derived words and are much rarer in everyday Malayalam than the main vowel set.',
    sections: [
      {
        bullets: [
          'Recognise ഋ, ൠ, ഌ, and ൡ when you see them.',
          'Most modern Malayalam speakers rarely encounter ൠ, ഌ, or ൡ in ordinary text.',
          'You only need to recognise them, not memorise or use them often.',
        ],
      },
      {
        paragraphs: ['You may rarely encounter these letters in everyday Malayalam. They are included because they are part of the complete script and may appear in dictionaries, religious texts, formal writing, and Sanskrit-derived words.'],
      },
    ],
    goal: 'Know that these letters exist and identify them without spending disproportionate study time on them.',
  },
]