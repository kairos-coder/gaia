// ══════════════════════════════════════════════
// MAJOR ARCANA DECK — Apollo's Living Tarot
// 22 cards. 22 gods. Every card carries mythic weight.
// ══════════════════════════════════════════════

const MAJOR_ARCANA_DECK = {
  deck_name: "Major Arcana — The Olympians & Primordials",
  card_count: 22,
  draw_interval_ms: 1600,
  max_hand_size: 5,
  max_table_cards: 12,
  
  // 🜏 Elemental suit mappings from the Divination system
  divine_suits: {
    fire: {
      element: "Fire",
      ruling_triad: ["Apollo", "Ares", "Hephaestus"],
      domain: "Light, conquest, the forge — the burning that creates and commands"
    },
    earth: {
      element: "Earth",
      ruling_triad: ["Demeter", "Hera", "Artemis"],
      domain: "Harvest, covenant, the hunt — the ground that sustains and binds"
    },
    water: {
      element: "Water",
      ruling_triad: ["Poseidon", "Dionysus", "Aphrodite"],
      domain: "The sea, ecstasy, desire — the depths that move and drown"
    },
    air: {
      element: "Air",
      ruling_triad: ["Zeus", "Athena", "Hermes"],
      domain: "Authority, wisdom, messages — the mind that commands and connects"
    }
  },

  cards: [
    // ══ 0 · THE FOOL — DIONYSUS ══
    {
      id: "major_00",
      name: "The Fool",
      god: "Dionysus",
      arcana_number: 0,
      element: "water",
      cost: 0,
      value: 0,
      effect: "spawn_card",
      keywords: ["beginnings", "madness", "divine risk", "ecstasy"],
      flavor: "The vine does not ask permission to climb.",
      image: "data/images/dionysus-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // The Fool is free — draw an extra card next turn
          table.mana = Math.min(table.mana + 1, table.maxMana);
        }
      }
    },

    // ══ I · THE MAGICIAN — HERMES ══
    {
      id: "major_01",
      name: "The Magician",
      god: "Hermes",
      arcana_number: 1,
      element: "air",
      cost: 1,
      value: 1,
      effect: "copy_card",
      keywords: ["skill", "messages", "trickery", "conduit"],
      flavor: "Every locked door has a word that opens it.",
      image: "data/images/hermes-card.jpg",
      triggers: {
        onNeighborChanged: function(card, table, context) {
          if (context && context.newNeighbor) {
            card.tokens.air = (card.tokens.air || 0) + 1;
          }
        }
      }
    },

    // ══ II · THE HIGH PRIESTESS — HERA ══
    {
      id: "major_02",
      name: "The High Priestess",
      god: "Hera",
      arcana_number: 2,
      element: "earth",
      cost: 2,
      value: 2,
      effect: "reveal_card",
      keywords: ["covenant", "hidden knowledge", "the veil", "intuition"],
      flavor: "Not all truths are spoken. Some are kept.",
      image: "data/images/hera-card.jpg",
      triggers: {
        onTurnEnd: function(card, table) {
          // The veil deepens — adjacent cards gain mystery
          const neighbors = table.getNeighbors(card.row, card.col);
          Object.values(neighbors).forEach(n => {
            if (n) n.tokens.void = (n.tokens.void || 0) + 1;
          });
        }
      }
    },

    // ══ III · THE EMPRESS — DEMETER ══
    {
      id: "major_03",
      name: "The Empress",
      god: "Demeter",
      arcana_number: 3,
      element: "earth",
      cost: 3,
      value: 3,
      effect: "spread_element",
      keywords: ["harvest", "abundance", "nurturing", "growth"],
      flavor: "What you give to the soil, the soil returns tenfold.",
      image: "data/images/demeter-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // The Empress nourishes all earth cards
          table.getAllCardsOnTable().forEach(c => {
            if (c.element === 'earth') c.value += 1;
          });
        }
      }
    },

    // ══ IV · THE EMPEROR — ZEUS ══
    {
      id: "major_04",
      name: "The Emperor",
      god: "Zeus",
      arcana_number: 4,
      element: "air",
      cost: 4,
      value: 4,
      effect: "buff_neighbors",
      keywords: ["authority", "structure", "rule", "thunder"],
      flavor: "Power is not the thunder — it is the silence before the storm.",
      image: "data/images/zeus-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          const neighbors = table.getNeighbors(card.row, card.col);
          Object.values(neighbors).forEach(n => {
            if (n) {
              n.value += 2;
              n.tokens.air = (n.tokens.air || 0) + 1;
            }
          });
        }
      }
    },

    // ══ V · THE HIEROPHANT — ARES ══
    {
      id: "major_05",
      name: "The Hierophant",
      god: "Ares",
      arcana_number: 5,
      element: "fire",
      cost: 3,
      value: 3,
      effect: "remove_card",
      keywords: ["tradition as weapon", "conquest", "doctrine"],
      flavor: "Every tradition was once a fresh wound.",
      image: "data/images/ares-card.jpg",
      triggers: {
        onDestroy: function(card, table) {
          // When Ares is destroyed, he takes a neighbor with him
          const neighbors = table.getNeighbors(card.row, card.col);
          const victim = Object.values(neighbors).find(n => n);
          if (victim) {
            victim.value = Math.max(0, victim.value - 2);
          }
        }
      }
    },

    // ══ VI · THE LOVERS — APHRODITE ══
    {
      id: "major_06",
      name: "The Lovers",
      god: "Aphrodite",
      arcana_number: 6,
      element: "water",
      cost: 2,
      value: 2,
      effect: "merge_cards",
      keywords: ["love", "choice", "union", "desire"],
      flavor: "The mirror shows what you desire. It also shows what you are.",
      image: "data/images/aphrodite-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // Aphrodite charms adjacent cards
          const neighbors = table.getNeighbors(card.row, card.col);
          Object.values(neighbors).forEach(n => {
            if (n) n.tokens.water = (n.tokens.water || 0) + 2;
          });
        }
      }
    },

    // ══ VII · THE CHARIOT — ARTEMIS ══
    {
      id: "major_07",
      name: "The Chariot",
      god: "Artemis",
      arcana_number: 7,
      element: "earth",
      cost: 2,
      value: 2,
      effect: "split_card",
      child_count: 2,
      keywords: ["sovereignty", "the hunt", "untouchable will"],
      flavor: "The dark is not your enemy. It is where sovereignty is forged.",
      image: "data/images/artemis-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // Artemis hunts — marks the highest-value enemy card
          const cards = table.getAllCardsOnTable();
          const prey = cards.reduce((a, b) => (b.value || 0) > (a.value || 0) ? b : a, cards[0]);
          if (prey && prey !== card) {
            prey.tokens.void = (prey.tokens.void || 0) + 1;
          }
        }
      }
    },

    // ══ VIII · JUSTICE — ATHENA ══
    {
      id: "major_08",
      name: "Justice",
      god: "Athena",
      arcana_number: 8,
      element: "air",
      cost: 3,
      value: 3,
      effect: "multiply_effect",
      multiplier: 2,
      keywords: ["wisdom", "strategy", "truth", "clarity"],
      flavor: "The battle is won before the sword is drawn.",
      image: "data/images/athena-card.jpg",
      triggers: {
        onTurnEnd: function(card, table) {
          // Athena strategizes — buffs the weakest adjacent card
          const neighbors = table.getNeighbors(card.row, card.col);
          const weakest = Object.values(neighbors)
            .filter(n => n)
            .sort((a, b) => (a.value || 0) - (b.value || 0))[0];
          if (weakest) weakest.value += 1;
        }
      }
    },

    // ══ IX · THE HERMIT — MORTAL MAN ══
    {
      id: "major_09",
      name: "The Hermit",
      god: "Mortal Man",
      arcana_number: 9,
      element: "earth",
      cost: 1,
      value: 1,
      effect: "reveal_card",
      keywords: ["the seeker", "solitude", "the lamp", "mortality"],
      flavor: "The lamp is enough. The path reveals itself step by step.",
      image: "data/images/hermit-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // The Hermit stands alone — no neighbors buff him, but he buffs no one
          card.tokens.earth = (card.tokens.earth || 0) + 3;
        }
      }
    },

    // ══ X · WHEEL OF FORTUNE — THE FATES ══
    {
      id: "major_10",
      name: "Wheel of Fortune",
      god: "The Fates",
      arcana_number: 10,
      element: "air",
      cost: 2,
      value: 2,
      effect: "shuffle_table",
      keywords: ["spinning", "measuring", "cutting", "the cycle"],
      flavor: "Clotho spins. Lachesis measures. Atropos cuts.",
      image: "data/images/moirai-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // The Fates reshuffle — randomize all card positions
          const cards = table.getAllCardsOnTable();
          const positions = cards.map(c => ({ row: c.row, col: c.col }));
          // Shuffle positions
          for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
          }
          cards.forEach((c, i) => {
            table.table[c.row][c.col] = null;
            c.row = positions[i].row;
            c.col = positions[i].col;
            table.table[c.row][c.col] = c;
          });
        }
      }
    },

    // ══ XI · STRENGTH — HEPHAESTUS ══
    {
      id: "major_11",
      name: "Strength",
      god: "Hephaestus",
      arcana_number: 11,
      element: "fire",
      cost: 3,
      value: 3,
      effect: "buff_self",
      keywords: ["creation", "labor", "the forge", "endurance"],
      flavor: "The forge does not care that you were cast out.",
      image: "data/images/hephaestus-card.jpg",
      triggers: {
        onTurnEnd: function(card, table) {
          // Hephaestus works through the night — gains +1 value per turn
          card.value += 1;
        }
      }
    },

    // ══ XII · THE HANGED MAN — PROMETHEUS ══
    {
      id: "major_12",
      name: "The Hanged Man",
      god: "Prometheus",
      arcana_number: 12,
      element: "fire",
      cost: 2,
      value: 2,
      effect: "sacrifice_self",
      keywords: ["sacrifice", "stolen fire", "suffering for the gift"],
      flavor: "Some gifts cost everything. That does not mean they were not worth giving.",
      image: "data/images/prometheus-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // Prometheus sacrifices himself — all other cards gain +2 value
          const cards = table.getAllCardsOnTable();
          cards.forEach(c => {
            if (c !== card) {
              c.value += 2;
              c.tokens.fire = (c.tokens.fire || 0) + 1;
            }
          });
          // Then destroy himself
          table._removeFromGrid(card.row, card.col);
        }
      }
    },

    // ══ XIII · DEATH — THANATOS ══
    {
      id: "major_13",
      name: "Death",
      god: "Thanatos",
      arcana_number: 13,
      element: "water",
      cost: 4,
      value: 4,
      effect: "remove_card",
      keywords: ["transition", "release", "the necessary end"],
      flavor: "I do not kill. I receive what is already finished.",
      image: "data/images/thanatos-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // Thanatos reaps — remove the oldest card on the table
          const cards = table.getAllCardsOnTable();
          cards.sort((a, b) => a.turnPlaced - b.turnPlaced);
          if (cards.length > 0 && cards[0] !== card) {
            table._removeFromGrid(cards[0].row, cards[0].col);
          }
        }
      }
    },

    // ══ XIV · TEMPERANCE — HESTIA ══
    {
      id: "major_14",
      name: "Temperance",
      god: "Hestia",
      arcana_number: 14,
      element: "fire",
      cost: 3,
      value: 3,
      effect: "refresh_hand",
      keywords: ["the hearth", "moderation", "sacred center", "eternal flame"],
      flavor: "The flame does not need to roar to be eternal.",
      image: "data/images/temperance.png",
      triggers: {
        onPlay: function(card, table) {
          // Hestia's hearth warms all — every card on table gains +1 value
          table.getAllCardsOnTable().forEach(c => {
            c.value += 1;
            c.tokens.fire = (c.tokens.fire || 0) + 1;
          });
        }
      }
    },

    // ══ XV · THE DEVIL — HADES ══
    {
      id: "major_15",
      name: "The Devil",
      god: "Hades",
      arcana_number: 15,
      element: "earth",
      cost: 4,
      value: 4,
      effect: "bind_card",
      keywords: ["bondage", "shadow", "wealth", "the hidden"],
      flavor: "The door to the underworld is unlocked. It always was.",
      image: "data/images/hades-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // Hades binds — all adjacent cards lose 1 value, graveyard grows
          const neighbors = table.getNeighbors(card.row, card.col);
          Object.values(neighbors).forEach(n => {
            if (n) {
              n.value = Math.max(0, n.value - 1);
              n.tokens.void = (n.tokens.void || 0) + 1;
            }
          });
        }
      }
    },

    // ══ XVI · THE TOWER — POSEIDON ══
    {
      id: "major_16",
      name: "The Tower",
      god: "Poseidon",
      arcana_number: 16,
      element: "water",
      cost: 4,
      value: 4,
      effect: "destroy_row",
      keywords: ["upheaval", "destruction", "earthquake", "the wave"],
      flavor: "The wave does not negotiate. It arrives.",
      image: "data/images/poseidon-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // Poseidon shakes — destroy all cards in his row
          const row = card.row;
          for (let col = 0; col < table.gridCols; col++) {
            const victim = table.table[row][col];
            if (victim && victim !== card) {
              table._removeFromGrid(row, col);
            }
          }
        }
      }
    },

    // ══ XVII · THE STAR — PERSEPHONE ══
    {
      id: "major_17",
      name: "The Star",
      god: "Persephone",
      arcana_number: 17,
      element: "earth",
      cost: 3,
      value: 3,
      effect: "resurrect_card",
      keywords: ["hope", "return", "the seed in darkness", "rebirth"],
      flavor: "She returns from the underworld and the first green shoot breaks the soil.",
      image: "data/images/persephone-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // Persephone returns — bring a card back from the graveyard
          if (table.graveyard.length > 0) {
            const resurrected = table.graveyard.pop();
            resurrected.row = -1;
            resurrected.col = -1;
            resurrected.turnPlaced = table.turn;
            resurrected.name = '🌱 ' + resurrected.name;
            table._placeCardOnGrid(resurrected);
          }
        }
      }
    },

    // ══ XVIII · THE MOON — MELINOE ══
    {
      id: "major_18",
      name: "The Moon",
      god: "Melinoe",
      arcana_number: 18,
      element: "water",
      cost: 2,
      value: 2,
      effect: "haunt_card",
      keywords: ["ghosts", "madness", "the in-between", "hauntings"],
      flavor: "I walk with what the dead need to say.",
      image: "data/images/melinoe-card.jpg",
      triggers: {
        onTurnEnd: function(card, table) {
          // Melinoe haunts — random adjacent card gains void tokens
          const neighbors = table.getNeighbors(card.row, card.col);
          const target = Object.values(neighbors).find(n => n);
          if (target) {
            target.tokens.void = (target.tokens.void || 0) + 2;
          }
        }
      }
    },

    // ══ XIX · THE SUN — APOLLO ══
    {
      id: "major_19",
      name: "The Sun",
      god: "Apollo",
      arcana_number: 19,
      element: "fire",
      cost: 5,
      value: 5,
      effect: "illuminate_all",
      keywords: ["light", "radiance", "art", "clarity"],
      flavor: "The sun does not negotiate with shadows. It simply rises.",
      image: "data/images/apollo-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // Apollo illuminates — all cards gain +1 value and fire tokens
          table.getAllCardsOnTable().forEach(c => {
            c.value += 1;
            c.tokens.fire = (c.tokens.fire || 0) + 1;
          });
        },
        onTurnEnd: function(card, table) {
          // Apollo's radiance persists — adjacent cards gain fire
          const neighbors = table.getNeighbors(card.row, card.col);
          Object.values(neighbors).forEach(n => {
            if (n) n.tokens.fire = (n.tokens.fire || 0) + 1;
          });
        }
      }
    },

    // ══ XX · JUDGEMENT — THE THREE JUDGES ══
    {
      id: "major_20",
      name: "Judgement",
      god: "The Three Judges",
      arcana_number: 20,
      element: "air",
      cost: 4,
      value: 4,
      effect: "judge_table",
      keywords: ["reckoning", "awakening", "final accounting"],
      flavor: "We do not punish. We see. That is enough.",
      image: "data/images/judgment.png",
      triggers: {
        onPlay: function(card, table) {
          // The Judges weigh — remove all cards with value <= 1
          const cards = table.getAllCardsOnTable();
          cards.forEach(c => {
            if (c.value <= 1 && c !== card) {
              table._removeFromGrid(c.row, c.col);
            }
          });
        }
      }
    },

    // ══ XXI · THE WORLD — GAIA ══
    {
      id: "major_21",
      name: "The World",
      god: "Gaia",
      arcana_number: 21,
      element: "earth",
      cost: 5,
      value: 5,
      effect: "complete_cycle",
      keywords: ["completion", "wholeness", "the primordial earth", "integration"],
      flavor: "Everything that was, is, and will be — it is all here.",
      image: "data/images/gaia-card.jpg",
      triggers: {
        onPlay: function(card, table) {
          // Gaia completes — every element gains a token on every card
          table.getAllCardsOnTable().forEach(c => {
            c.tokens.fire = (c.tokens.fire || 0) + 1;
            c.tokens.water = (c.tokens.water || 0) + 1;
            c.tokens.earth = (c.tokens.earth || 0) + 1;
            c.tokens.air = (c.tokens.air || 0) + 1;
            c.value += 1;
          });
        }
      }
    }
  ]
};

// ══════════════════════════════════════════════
// SKY BRIDGE — Real sky modifies the game
// ══════════════════════════════════════════════

const ApolloSkyBridge = {
  /**
   * Apply sky-based modifiers to the game state.
   * Call once when Apollo initializes, or on golden ticks.
   */
  applySkyModifiers: function(apolloPlayer, skyState) {
    if (!skyState || !skyState.planets) return;
    
    const sun = skyState.planets.sun;
    const moon = skyState.planets.moon;
    const moonPhase = skyState.moonPhase;
    
    // 🜏 Sun sign → elemental affinity
    if (sun && sun.sign) {
      const sunElement = {
        'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
        'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
        'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
        'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water'
      }[sun.sign];
      
      if (sunElement) {
        apolloPlayer.tableModifiers.push(`sun_in_${sunElement}`);
        // Cards of the sun's element gain +1 value
        apolloPlayer.getAllCardsOnTable().forEach(c => {
          if (c.element === sunElement) c.value += 1;
        });
      }
    }
    
    // 🜏 Moon phase → void influence
    if (moonPhase && moonPhase.isWaning) {
      apolloPlayer.tableModifiers.push('melinoe_waning');
      // Melinoe walks — void tokens spread
      apolloPlayer.getAllCardsOnTable().forEach(c => {
        c.tokens.void = (c.tokens.void || 0) + 1;
      });
    }
    
    // 🜏 Detect stelliums from sky
    if (skyState.planets) {
      const signCount = {};
      Object.values(skyState.planets).forEach(p => {
        if (p && p.sign) {
          signCount[p.sign] = (signCount[p.sign] || 0) + 1;
        }
      });
      
      Object.entries(signCount).forEach(([sign, count]) => {
        if (count >= 3) {
          const element = {
            'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
            'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
            'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
            'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water'
          }[sign];
          
          if (element) {
            apolloPlayer.tableModifiers.push(`stellium_in_${sign.toLowerCase()}`);
            // Stellium reduces cost of that element's cards
            apolloPlayer.hand.forEach(c => {
              if (c.element === element) c.cost = Math.max(0, (c.cost || 1) - 1);
            });
          }
        }
      });
    }
  },
  
  /**
   * Get the current sky-based whisper for the log.
   */
  getSkyWhisper: function(skyState) {
    if (!skyState) return "The sky is silent.";
    
    const sun = skyState.planets?.sun;
    const moon = skyState.moonPhase;
    
    let whisper = '';
    if (sun) whisper += `Apollo burns in ${sun.sign}. `;
    if (moon) whisper += `The moon is ${moon.name} — ${moon.deity} watches. `;
    if (skyState.location?.located) {
      whisper += `Sky anchored to your location.`;
    } else {
      whisper += `Sky anchored to the Witch's Foot.`;
    }
    
    return whisper;
  }
};

if (typeof module !== 'undefined') {
  module.exports = { MAJOR_ARCANA_DECK, ApolloSkyBridge };
}
