// ══════════════════════════════════════════════
// GAIA CELESTIAL REGISTRY
// God → Planet → Arcana → Glyph → Element
// ══════════════════════════════════════════════

const GAIA_CELESTIAL = {
  
  // ── LUMINARIES ──
  sun: {
    god: 'Apollo',
    olympian: true,
    arcana: { number: 19, name: 'The Sun', glyph: '☉' },
    glyph: '☀️',
    element: 'Fire',
    domain: 'Prophecy, Light, Truth',
    chariot: 'The solar chariot crosses the sky each day.',
    whisper: 'I see everything the light touches. I do not judge. I illuminate.'
  },
  
  moon: {
    god: 'Artemis',
    olympian: true,
    arcana: { number: 18, name: 'The Moon', glyph: '☽' },
    glyph: '🌙',
    element: 'Water',
    domain: 'The Hunt, Intuition, The Wild',
    phases: {
      new:     { name: 'New Moon',  deity: 'Artemis the Unseen',   meaning: 'The arrow is not yet loosed. Intentions set here fly truest.' },
      waxing:  { name: 'Waxing',    deity: 'Artemis the Huntress', meaning: 'She tracks. She does not rush. The prey is close.' },
      full:    { name: 'Full Moon', deity: 'Artemis Resplendent',  meaning: 'The quarry is in sight. Release the arrow or lower the bow — but choose.' },
      waning:  { name: 'Waning',    deity: 'Melinoe',              meaning: 'Melinoe walks the waning dark. What must be released?' }
    },
    whisper: 'I hunt by the light you cannot see. The dark is not empty.'
  },
  
  // ── PLANETS ──
  mercury: {
    god: 'Hermes',
    olympian: true,
    arcana: { number: 1, name: 'The Magician', glyph: '☿' },
    glyph: '☿',
    element: 'Air',
    domain: 'Messages, Thresholds, Guidance of Souls',
    role: 'Psychopomp — guide between worlds',
    whisper: 'I carry words between the living and the dead. Neither side thanks me. That is the work.'
  },
  
  venus: {
    god: 'Aphrodite',
    olympian: true,
    arcana: { number: 6, name: 'The Lovers', glyph: '♀' },
    glyph: '♀',
    element: 'Water',
    domain: 'Love, Desire, The Binding Force',
    role: 'Eros made flesh — what you want reveals what you are',
    whisper: 'Desire is not weakness. It is the first movement of the soul toward what it must become.'
  },
  
  mars: {
    god: 'Ares',
    olympian: true,
    arcana: { number: 16, name: 'The Tower', glyph: '♂' },
    glyph: '♂',
    element: 'Fire',
    domain: 'War, Destruction, Breakthrough',
    sons: ['Phobos','Deimos'],
    whisper: 'I do not start wars. I finish them. The spear does not negotiate.'
  },
  
  jupiter: {
    god: 'Zeus',
    olympian: true,
    arcana: { number: 4, name: 'The Emperor', glyph: '♃' },
    glyph: '♃',
    element: 'Air',
    domain: 'Authority, Order, The Sky-Throne',
    moons: {
      io:       { god: 'Hestia',   arcana: { number: 14, name: 'Temperance' },     glyph: '⟡', element: 'Fire' },
      europa:   { god: 'Hera',     arcana: { number: 2,  name: 'The High Priestess' }, glyph: '⟡', element: 'Water' },
      ganymede: { god: 'Athena',   arcana: { number: 11, name: 'Justice' },         glyph: '⟡', element: 'Air' },
      callisto: { god: 'Callisto', arcana: { number: 8,  name: 'Strength' },        glyph: '⟡', element: 'Earth' }
    },
    whisper: 'I rule the sky. But the sky was here before me. I am steward, not owner.'
  },
  
  saturn: {
    god: 'Demeter',
    olympian: true,
    arcana: { number: 3, name: 'The Empress', glyph: '♄' },
    glyph: '♄',
    element: 'Earth',
    domain: 'Harvest, Seasons, The Mother Who Returns',
    role: 'Mother of Persephone — she who withholds and restores',
    whisper: 'The harvest knows when to yield. I know when to wait. The seed in the dark is not dead.'
  },
  
  uranus: {
    god: 'Hephaestus',
    olympian: true,
    arcana: { number: 7, name: 'The Chariot', glyph: '♅' },
    glyph: '♅',
    element: 'Earth',
    domain: 'The Forge, Craft, The Building of Thrones',
    role: 'Smith of the gods — he builds what others rule from',
    whisper: 'They sit on thrones I forged. They forget. I do not need to be remembered to be essential.'
  },
  
  neptune: {
    god: 'Poseidon',
    olympian: true,
    arcana: { number: 12, name: 'The Hanged Man', glyph: '♆' },
    glyph: '♆',
    element: 'Water',
    domain: 'The Deep, Earthquakes, Suspension Between Worlds',
    whisper: 'The sea does not explain itself. It rises. It recedes. It is.'
  },
  
  pluto: {
    god: 'Hades',
    olympian: false, // Chthonic
    arcana: { number: 13, name: 'Death', glyph: '♇' },
    glyph: '♇',
    element: 'Earth',
    domain: 'The Underworld, The Unseen, Transformation',
    role: 'He does not judge. He witnesses. He receives everyone eventually.',
    whisper: 'I have seen every soul that ever lived. You are not special. You are also not forgotten.'
  }
};

// Zodiac signs
const GAIA_SIGNS = [
  { name: 'Aries',       glyph: '♈', element: 'Fire',   modality: 'Cardinal', planet: 'mars',     arcana: { number: 4,  name: 'The Emperor' } },
  { name: 'Taurus',      glyph: '♉', element: 'Earth',  modality: 'Fixed',    planet: 'venus',    arcana: { number: 5,  name: 'The Hierophant' } },
  { name: 'Gemini',      glyph: '♊', element: 'Air',    modality: 'Mutable',  planet: 'mercury',  arcana: { number: 6,  name: 'The Lovers' } },
  { name: 'Cancer',      glyph: '♋', element: 'Water',  modality: 'Cardinal', planet: 'moon',     arcana: { number: 7,  name: 'The Chariot' } },
  { name: 'Leo',         glyph: '♌', element: 'Fire',   modality: 'Fixed',    planet: 'sun',      arcana: { number: 8,  name: 'Strength' } },
  { name: 'Virgo',       glyph: '♍', element: 'Earth',  modality: 'Mutable',  planet: 'mercury',  arcana: { number: 9,  name: 'The Hermit' } },
  { name: 'Libra',       glyph: '♎', element: 'Air',    modality: 'Cardinal', planet: 'venus',    arcana: { number: 11, name: 'Justice' } },
  { name: 'Scorpio',     glyph: '♏', element: 'Water',  modality: 'Fixed',    planet: 'pluto',    arcana: { number: 13, name: 'Death' } },
  { name: 'Sagittarius', glyph: '♐', element: 'Fire',   modality: 'Mutable',  planet: 'jupiter',  arcana: { number: 14, name: 'Temperance' } },
  { name: 'Capricorn',   glyph: '♑', element: 'Earth',  modality: 'Cardinal', planet: 'saturn',   arcana: { number: 15, name: 'The Devil' } },
  { name: 'Aquarius',    glyph: '♒', element: 'Air',    modality: 'Fixed',    planet: 'uranus',   arcana: { number: 17, name: 'The Star' } },
  { name: 'Pisces',      glyph: '♓', element: 'Water',  modality: 'Mutable',  planet: 'neptune',  arcana: { number: 18, name: 'The Moon' } }
];
