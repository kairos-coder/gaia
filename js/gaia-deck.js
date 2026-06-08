// ══════════════════════════════════════════════
// GAIA DECK REGISTRY
// Maps gods to card images, arcana, and whispers
// Single-card encounters — not spreads
// ══════════════════════════════════════════════

const GaiaDeck = (() => {
  
  // ── IMAGE BASE PATH ──
  const IMG_PATH = 'data/images/';
  
  // ── DIVINE CARDS ──
  // Every god who may appear in the descent
  const CARDS = {
    
    // ══ OLYMPIANS ══
    zeus: {
      name: 'Zeus',
      arcana: { number: 4, name: 'The Emperor' },
      image: 'zeus-card.jpg',
      glyph: '⚡',
      domain: 'Oaths, Authority, The Sky-Throne',
      element: 'Air',
      thesis: true,
      whisper: 'I bound the Titans. I bound the gods. What have YOU bound yourself to?',
      intervention: {
        river: 'Styx',
        message: 'The Styx binds even me. But you are not a god — you are not yet bound. The sky above still holds your name. The oath you leave here will be remembered. Are you certain you want to continue?',
        returnMessage: 'The King of Olympus nods. You turn back — but the Styx remembers your name.'
      }
    },
    
    apollo: {
      name: 'Apollo',
      arcana: { number: 19, name: 'The Sun' },
      image: 'apollo-card.jpg',
      glyph: '☀️',
      domain: 'Truth, Memory, Prophecy, Light',
      element: 'Fire',
      thesis: true,
      whisper: 'I illuminate everything. Even the things you wish I would not.',
      intervention: {
        river: 'Lethe',
        message: 'Forgetting is a theft from yourself. I illuminate — I do not erase. The memory you surrender to Lethe will be lost to even my light. Are you certain?',
        returnMessage: 'Apollo draws his chariot back. The memory you almost lost remains. The sun still rises.'
      }
    },
    
    artemis: {
      name: 'Artemis',
      arcana: { number: 7, name: 'The Chariot' },
      image: 'artemis-card.jpg',
      glyph: '🌙',
      domain: 'The Hunt, Sovereignty, The Wild, Endurance',
      element: 'Earth',
      thesis: true,
      whisper: 'I hunt by the light you cannot see. The dark is not empty — it is full of what you refuse to name.',
      intervention: {
        river: 'Acheron',
        message: 'Pain is the quarry you have been tracking. You have caught it. Now — do you release it into the river, or let it consume you? The hunt does not end here unless you choose to stop.',
        returnMessage: 'Artemis lowers her bow. The pain you carry remains — but so does the hunt. The surface still has trails to follow.'
      }
    },
    
    athena: {
      name: 'Athena',
      arcana: { number: 8, name: 'Justice' },
      image: 'athena-card.jpg',
      glyph: '🦉',
      domain: 'Wisdom, Strategy, Justice, Clarity',
      element: 'Air',
      thesis: true,
      whisper: 'The battle is won before the sword is drawn — in the quiet, in the mind, where strategy outlives strength.',
      intervention: {
        river: 'Phlegethon',
        message: 'Anger is a weapon. Weapons require discipline. The fire river burns — but it also illuminates. Do not burn what you came here to save. Will you let wisdom hold the reins, or will the fire drive?',
        returnMessage: 'Athena sheathes her sword. The anger remains — but so does the strategist. You chose wisdom over burning.'
      }
    },
    
    demeter: {
      name: 'Demeter',
      arcana: { number: 3, name: 'The Empress' },
      image: 'demeter-card.jpg',
      glyph: '🌾',
      domain: 'Harvest, Nurturing, Grief, The Return of Spring',
      element: 'Earth',
      thesis: true,
      whisper: 'I lost my daughter to this place. I know what grief does to the soil. Nothing grows in unwatered ground.',
      intervention: {
        river: 'Cocytus',
        message: 'I know grief. I made the world starve when Persephone was taken. The river of lamentation feeds on tears — but the surface still has fields that need tending. Come home. The harvest is not yet done.',
        returnMessage: 'Demeter opens her arms. The grief remains — but it is not the only thing growing. The fields still need you.'
      }
    },
    
    hermes: {
      name: 'Hermes',
      arcana: { number: 1, name: 'The Magician' },
      image: 'hermes-card.jpg',
      glyph: '☿',
      domain: 'Messages, Thresholds, Guidance, The Conduit',
      element: 'Air',
      thesis: false,
      role: 'guide',
      whisper: 'I carry words between the living and the dead. Neither side thanks me. That is the work.',
      guideMessage: 'You spoke truth to the twins. I am Hermes — guide of souls, living and dead. The path ahead has five rivers. Each takes something. You do not get to keep everything. Ready? No one ever is. Walk anyway.'
    },
    
    // ══ CHTHONIC ══
    hades: {
      name: 'Hades',
      arcana: { number: 15, name: 'The Devil' },
      image: 'hades-card.jpg',
      glyph: '🌑',
      domain: 'The Underworld, Hidden Wealth, The Unseen',
      element: 'Earth',
      antithesis: true,
      whisper: 'I have seen every soul that ever lived. You are not special. You are also not forgotten.',
      gateMessage: 'The Unseen regards you. He does not speak. He has witnessed every soul that ever crossed this threshold. Now he has witnessed you. Enter — if you still choose to.'
    },
    
    persephone: {
      name: 'Persephone',
      arcana: { number: 17, name: 'The Star' },
      image: 'persephone-card.jpg',
      glyph: '🌱',
      domain: 'Spring, The Underworld, Return, The Seed in Darkness',
      element: 'Earth',
      antithesis: true,
      whisper: 'I chose to stay. Half the year in the dark, half in the light. The seed knows both worlds. So do I.',
      courtMessage: 'The Queen of the Dead and the Goddess of Spring sits beside her husband. She chose the underworld — not as a prisoner, but as a queen. She sees in you something familiar.'
    },
    
    thanatos: {
      name: 'Thanatos',
      arcana: { number: 13, name: 'Death' },
      image: 'thanatos-card.jpg',
      glyph: '💀',
      domain: 'Gentle Death, The Receiver, The Necessary End',
      element: 'Water',
      antithesis: true,
      whisper: 'I do not kill. I receive what is already finished. Every ending is a door I hold open.'
    },
    
    melinoe: {
      name: 'Melinoe',
      arcana: { number: 18, name: 'The Moon' },
      image: 'melinoe-card.jpg',
      glyph: '👻',
      domain: 'Ghosts, Madness, The Veil, The In-Between',
      element: 'Water',
      antithesis: true,
      whisper: 'I walk with what the dead need to say. Not all visions are false — but not all are true.'
    },
    
    // ══ THRESHOLD GUARDIANS ══
    phobos: {
      name: 'Phobos',
      arcana: null,
      image: null,
      glyph: '🔥',
      domain: 'Fear, The First Question, Threshold Guardian',
      element: 'Fire',
      role: 'twin',
      whisper: 'I am the trembling before the blow. The thing you feel at 3am. I am not your enemy. I am the question you keep avoiding.'
    },
    
    deimos: {
      name: 'Deimos',
      arcana: null,
      image: null,
      glyph: '💀',
      domain: 'Dread, The Second Question, Threshold Guardian',
      element: 'Fire',
      role: 'twin',
      whisper: 'I am the panic when the line breaks. The dread of losing what matters most. I am not here to hurt you. I am here to name what would.'
    },
    
    charon: {
      name: 'Charon',
      arcana: null,
      image: null,
      glyph: '🛶',
      domain: 'The Ferryman, The Crossing, The True Name',
      element: 'Water',
      role: 'ferryman',
      whisper: 'I do not ask for coin. I ask for your name — the one you ARE, not the one you were given.'
    }
  };
  
  // ── RIVER → OLYMPIAN MAPPING ──
  const RIVER_GODS = {
    styx: 'zeus',
    lethe: 'apollo',
    acheron: 'artemis',
    phlegethon: 'athena',
    cocytus: 'demeter'
  };
  
  // ── PUBLIC API ──
  
  function getCard(godName) {
    const card = CARDS[godName.toLowerCase()];
    if (!card) return null;
    return {
      ...card,
      imagePath: card.image ? IMG_PATH + card.image : null
    };
  }
  
  function getGodForRiver(riverName) {
    const godName = RIVER_GODS[riverName.toLowerCase()];
    return godName ? getCard(godName) : null;
  }
  
  function getImagePath(godName) {
    const card = CARDS[godName.toLowerCase()];
    if (!card || !card.image) return null;
    return IMG_PATH + card.image;
  }
  
  function getAllOlympians() {
    return Object.values(CARDS).filter(c => c.thesis === true);
  }
  
  function getAllChthonic() {
    return Object.values(CARDS).filter(c => c.antithesis === true);
  }
  
  // ── CREATE DIVINE PAIR ──
  function createDivinePair(riverName, pilgrimChoice) {
    const olympian = getGodForRiver(riverName);
    if (!olympian) return null;
    
    // Determine the chthonic counterpart based on the river
    const chthonicMap = {
      styx: 'phobos',
      lethe: 'melinoe',
      acheron: 'thanatos',
      phlegethon: 'phobos',
      cocytus: 'persephone'
    };
    
    const chthonicName = chthonicMap[riverName] || 'hades';
    const chthonic = getCard(chthonicName);
    
    const syntheses = {
      styx: `Zeus guards oaths. Phobos asks what you fear. The Styx receives both — the promise and the terror of breaking it. You offered: "${pilgrimChoice}". The river remembers.`,
      lethe: `Apollo illuminates truth. Melinoe walks with ghosts. Lethe erases — but what is forgotten is not gone. It waits in the mist. You released: "${pilgrimChoice}". The river received it.`,
      acheron: `Artemis hunts with sovereignty. Thanatos receives what is finished. Acheron carries pain — but pain, once named, begins to heal. You surrendered: "${pilgrimChoice}". The current carries it away.`,
      phlegethon: `Athena wields strategy. Phobos trembles before the fire. Phlegethon burns — but fire also illuminates. You named: "${pilgrimChoice}". The flames saw it.`,
      cocytus: `Demeter nurtures the harvest. Persephone chose the dark. Cocytus weeps — but grief shared is grief halved. You mourned: "${pilgrimChoice}". The river weeps with you.`
    };
    
    return {
      river: riverName,
      thesis: olympian,
      antithesis: chthonic,
      synthesis: syntheses[riverName] || `The ${riverName} received your offering. The gods witnessed it.`,
      pilgrimChoice: pilgrimChoice
    };
  }
  
  return {
    CARDS,
    RIVER_GODS,
    getCard,
    getGodForRiver,
    getImagePath,
    getAllOlympians,
    getAllChthonic,
    createDivinePair
  };
  
})();

// ══════════════════════════════════════════════
// AUTO-LOAD: If gaia-deck element exists, render
// ══════════════════════════════════════════════
if (typeof window !== 'undefined') {
  console.log('🜏 Gaia Deck Registry loaded. ' + 
    Object.keys(GaiaDeck.CARDS).length + ' divine cards registered. ' +
    GaiaDeck.getAllOlympians().length + ' Olympians. ' +
    GaiaDeck.getAllChthonic().length + ' Chthonic.');
}
