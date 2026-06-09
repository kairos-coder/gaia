// ══════════════════════════════════════════════
// APOLLO SEED — The God Who Plays Cards
// Draws every 1.6s. Golden ratio tick every 2.59s.
// 
// EMERGENCE PRIMITIVES:
// 1. Identity — unique id, type, element, value, tags
// 2. Position — 4×3 grid with getNeighbors()
// 3. State — tokens{}, playCount, turnsOnTable
// 4. Adjacency — neighbor buffs, elemental spread
// 5. Trigger — onPlay, onDestroy, onTurnEnd, onNeighborChanged
// 6. Modifier — buff, debuff, transform, merge, split
// 7. Memory — graveyard, echoes, elementalDominance, tableModifiers
// ══════════════════════════════════════════════

class ApolloPlayer {
  constructor(deck) {
    this.deck = deck;
    this.drawInterval = deck.draw_interval_ms || 1600;
    this.goldenInterval = Math.round(this.drawInterval * 1.618);
    
    // 🜏 PRIMITIVE 2: Grid table (4 columns × 3 rows = 12 slots)
    this.gridCols = 4;
    this.gridRows = 3;
    this.table = this._createEmptyGrid();
    
    this.hand = [];
    this.discard = [];
    this.drawPile = this.shuffle([...deck.cards]);
    
    this.mana = 0;
    this.maxMana = 10;
    this.turn = 0;
    this.running = false;
    this.intervalId = null;
    this.goldenId = null;
    this._monacoReader = null;
    this._recursionGuard = 0;
    
    // 🜏 PRIMITIVE 7: Memory
    this.graveyard = [];
    this.echoes = [];
    this.totalValuePlayed = 0;
    this.totalCardsPlayed = 0;
    this.elementalDominance = { fire: 0, earth: 0, air: 0, water: 0, void: 0 };
    this.tableModifiers = [];
    this.novelPatterns = [];
    this.lastTableHash = '';
    
    // 🜏 Golden state
    this.persistentState = {
      history: [],
      tableEffects: [],
      htmlModifiers: {},
      lastGoldenRead: null,
      emergentEvents: []
    };

    // Callbacks
    this.onDraw = null;
    this.onPlay = null;
    this.onTableChange = null;
    this.onManaChange = null;
    this.onGoldenTick = null;
    this.onStatePersist = null;
    this.onEmergence = null;  // 🜏 Fires when novel pattern detected
  }

  // ══════════════════════════════════════════
  // PRIMITIVE 2: GRID SYSTEM
  // ══════════════════════════════════════════

  _createEmptyGrid() {
    const grid = [];
    for (let row = 0; row < this.gridRows; row++) {
      grid[row] = [];
      for (let col = 0; col < this.gridCols; col++) {
        grid[row][col] = null;
      }
    }
    return grid;
  }

  _findEmptySlot() {
    const emptySlots = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (!this.table[row][col]) emptySlots.push({ row, col });
      }
    }
    if (emptySlots.length === 0) return null;
    return emptySlots[Math.floor(Math.random() * emptySlots.length)];
  }

  _placeCardOnGrid(card) {
    const slot = this._findEmptySlot();
    if (slot) {
      card.row = slot.row;
      card.col = slot.col;
      this.table[slot.row][slot.col] = card;
      return true;
    }
    // Grid full — remove oldest card
    return this._forcePlaceCard(card);
  }

  _forcePlaceCard(card) {
    let oldest = null;
    let oldestTurn = Infinity;
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const c = this.table[row][col];
        if (c && c.turnPlaced < oldestTurn) {
          oldest = c;
          oldestTurn = c.turnPlaced;
        }
      }
    }
    if (oldest) {
      this._removeFromGrid(oldest.row, oldest.col);
      card.row = oldest.row;
      card.col = oldest.col;
      this.table[card.row][card.col] = card;
      return true;
    }
    return false;
  }

  _removeFromGrid(row, col) {
    const card = this.table[row][col];
    if (card) {
      this.graveyard.push(card);
      // 🜏 PRIMITIVE 5: onDestroy trigger
      this._fireTrigger('onDestroy', card);
    }
    this.table[row][col] = null;
  }

  getNeighbors(row, col) {
    const neighbors = {};
    if (row > 0) neighbors.above = this.table[row - 1][col];
    if (row < this.gridRows - 1) neighbors.below = this.table[row + 1][col];
    if (col > 0) neighbors.left = this.table[row][col - 1];
    if (col < this.gridCols - 1) neighbors.right = this.table[row][col + 1];
    return neighbors;
  }

  getAllCardsOnTable() {
    const cards = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (this.table[row][col]) cards.push(this.table[row][col]);
      }
    }
    return cards;
  }

  getTableCardCount() {
    return this.getAllCardsOnTable().length;
  }

  // ══════════════════════════════════════════
  // PRIMITIVE 3 & 5: STATE + TRIGGERS
  // ══════════════════════════════════════════

  _createCard(deckCard) {
    const element = deckCard.element || this._randomElement();
    return {
      ...deckCard,
      instanceId: `${deckCard.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      // 🜏 State
      value: deckCard.value || 1,
      tokens: { fire: 0, water: 0, earth: 0, air: 0, void: 0 },
      element: element,
      tags: [...(deckCard.tags || [])],
      playCount: 0,
      turnPlaced: this.turn,
      turnsOnTable: 0,
      triggeredBy: [],
      row: -1,
      col: -1,
      // 🜏 Triggers
      triggers: deckCard.triggers || {}
    };
  }

  _fireTrigger(triggerName, card, context = {}) {
    if (!card || !card.triggers || !card.triggers[triggerName]) return;
    const result = card.triggers[triggerName](card, this, context);
    if (result) {
      card.triggeredBy.push({ trigger: triggerName, turn: this.turn });
    }
  }

  _incrementTurnCounters() {
    this.getAllCardsOnTable().forEach(card => {
      card.turnsOnTable++;
      // 🜏 Fire onTurnEnd for every card
      this._fireTrigger('onTurnEnd', card);
    });
  }

  _updateElementalDominance() {
    const cards = this.getAllCardsOnTable();
    this.elementalDominance = { fire: 0, earth: 0, air: 0, water: 0, void: 0 };
    cards.forEach(c => {
      if (this.elementalDominance[c.element] !== undefined) {
        this.elementalDominance[c.element]++;
      }
    });
    
    // 🜏 Memory: check for elemental shift
    const dominant = Object.entries(this.elementalDominance)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (dominant[1] >= 4 && !this.tableModifiers.includes(`${dominant[0]}_dominance`)) {
      this.tableModifiers.push(`${dominant[0]}_dominance`);
      const event = `🌊 Elemental dominance shifts to ${dominant[0].toUpperCase()}! Table gains "${dominant[0]}_dominance" modifier.`;
      this.persistentState.emergentEvents.push({ turn: this.turn, event });
      if (this.onEmergence) this.onEmergence(event);
    }
  }

  _randomElement() {
    const elements = ['fire', 'earth', 'air', 'water'];
    return elements[Math.floor(Math.random() * elements.length)];
  }

  // ══════════════════════════════════════════
  // CORE MECHANICS
  // ══════════════════════════════════════════

  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  draw() {
    if (this.drawPile.length === 0) {
      this.drawPile = this.shuffle([...this.discard]);
      this.discard = [];
      if (this.drawPile.length === 0) return null;
    }
    const deckCard = this.drawPile.pop();
    const card = this._createCard(deckCard);
    if (this.hand.length < this.deck.max_hand_size) {
      this.hand.push(card);
    } else {
      this.discard.push(card);
    }
    if (this.onDraw) this.onDraw(card);
    return card;
  }

  play(card) {
    if (!card) return false;
    if (this.mana < (card.cost || 0)) return false;
    
    this.mana -= (card.cost || 0);
    const index = this.hand.indexOf(card);
    if (index > -1) this.hand.splice(index, 1);
    
    // 🜏 Place on grid
    card.playCount++;
    card.turnPlaced = this.turn;
    this._placeCardOnGrid(card);
    
    // 🜏 Track memory
    this.totalCardsPlayed++;
    this.totalValuePlayed += (card.value || 0);
    this._updateElementalDominance();
    
    // 🜏 Execute effect
    this._recursionGuard = 0;
    this.executeEffect(card);
    
    // 🜏 Fire onPlay trigger
    this._fireTrigger('onPlay', card);
    
    // 🜏 Fire onNeighborChanged for adjacent cards
    const neighbors = this.getNeighbors(card.row, card.col);
    Object.values(neighbors).forEach(n => {
      if (n) this._fireTrigger('onNeighborChanged', n, { newNeighbor: card });
    });
    
    if (this.onPlay) this.onPlay(card);
    if (this.onTableChange) this.onTableChange(this.getAllCardsOnTable());
    if (this.onManaChange) this.onManaChange(this.mana);
    
    // 🜏 Check for novel patterns
    this._detectNovelPatterns();
    
    return true;
  }

  // ══════════════════════════════════════════
  // EFFECT SYSTEM WITH ADJACENCY
  // ══════════════════════════════════════════

  executeEffect(card) {
    this._recursionGuard++;
    if (this._recursionGuard > 10) return;

    switch (card.effect) {
      case 'spawn_card':
        if (this.drawPile.length > 0) {
          const newCard = this._createCard(this.drawPile.pop());
          this._placeCardOnGrid(newCard);
          this.totalCardsPlayed++;
        }
        break;

      case 'copy_card':
        const cards = this.getAllCardsOnTable();
        if (cards.length > 0) {
          const target = cards[cards.length - 1];
          const copy = {
            ...target,
            instanceId: `${target.id}_copy_${this.turn}`,
            name: '🪞 ' + target.name,
            playCount: 0,
            turnPlaced: this.turn,
            tokens: { ...target.tokens }
          };
          this._placeCardOnGrid(copy);
        }
        break;

      case 'replay_last':
        const allCards = this.getAllCardsOnTable();
        if (allCards.length >= 2) {
          const last = allCards[allCards.length - 1];
          if (last.effect !== 'replay_last' && last.effect !== 'multiply_effect') {
            this.executeEffect(last);
          }
        }
        break;

      case 'split_card':
        const tableCards = this.getAllCardsOnTable();
        if (tableCards.length > 0) {
          const target = tableCards[Math.floor(Math.random() * tableCards.length)];
          for (let i = 0; i < (card.child_count || 2); i++) {
            const child = {
              ...target,
              instanceId: `${target.id}_f${i}_${this.turn}`,
              name: '❄️ ' + target.name,
              value: Math.ceil((target.value || 1) / 2),
              playCount: 0,
              turnPlaced: this.turn,
              tokens: {}
            };
            this._placeCardOnGrid(child);
            // 🜏 ADJACENCY: child buffs a neighbor
            const childNeighbors = this.getNeighbors(child.row, child.col);
            const randomNeighbor = Object.values(childNeighbors).find(n => n);
            if (randomNeighbor) {
              randomNeighbor.value += 1;
              randomNeighbor.tokens[child.element] = (randomNeighbor.tokens[child.element] || 0) + 1;
            }
          }
        }
        break;

      case 'merge_cards':
        const mergeCards = this.getAllCardsOnTable();
        if (mergeCards.length >= 2) {
          const i1 = Math.floor(Math.random() * mergeCards.length);
          let i2 = Math.floor(Math.random() * mergeCards.length);
          while (i2 === i1) i2 = Math.floor(Math.random() * mergeCards.length);
          const c1 = mergeCards[i1];
          const c2 = mergeCards[i2];
          
          this._removeFromGrid(c1.row, c1.col);
          this._removeFromGrid(c2.row, c2.col);
          
          const merged = {
            ...c1,
            instanceId: `merged_${c1.id}_${c2.id}_${this.turn}`,
            name: '🌟 ' + c1.name + ' + ' + c2.name,
            type: 'synthesis',
            value: (c1.value || 0) + (c2.value || 0),
            tokens: Object.fromEntries(
              Object.keys(c1.tokens).map(k => [k, (c1.tokens[k] || 0) + (c2.tokens[k] || 0)])
            ),
            tags: [...new Set([...c1.tags, ...c2.tags])],
            element: c1.value > c2.value ? c1.element : c2.element,
            cost: (c1.cost || 0) + (c2.cost || 0),
            effect: 'merged',
            flavor: 'Two became one.',
            triggers: { ...c1.triggers, ...c2.triggers }
          };
          this._placeCardOnGrid(merged);
        }
        break;

      case 'remove_card':
        const removeCards = this.getAllCardsOnTable();
        if (removeCards.length > 0) {
          const target = removeCards[0]; // Remove oldest
          // 🜏 ADJACENCY: debuff neighbors before removing
          const neighbors = this.getNeighbors(target.row, target.col);
          Object.values(neighbors).forEach(n => {
            if (n) {
              n.value = Math.max(0, n.value - 1);
              n.tokens.void = (n.tokens.void || 0) + 1;
            }
          });
          this._removeFromGrid(target.row, target.col);
        }
        break;

      case 'refresh_hand':
        while (this.hand.length > 0) this.discard.push(this.hand.pop());
        for (let i = 0; i < this.deck.max_hand_size; i++) this.draw();
        break;

      case 'reveal_card':
        if (this.drawPile.length > 0 && this.onDraw) {
          this.onDraw(this.drawPile[this.drawPile.length - 1], true);
        }
        break;

      case 'peek_deck':
        if (this.onDraw) {
          const peek = this.drawPile.slice(-3).reverse();
          this.onDraw({ name: '🔮 ' + peek.map(c => c.name).join(', '), type: 'oracle' }, true);
        }
        break;

      case 'multiply_effect':
        const multCards = this.getAllCardsOnTable();
        if (multCards.length > 0) {
          const last = multCards[multCards.length - 1];
          if (last.effect !== 'multiply_effect' && last.effect !== 'replay_last') {
            for (let i = 0; i < (card.multiplier || 2); i++) {
              this.executeEffect(last);
            }
          }
        }
        break;
        
      case 'spread_element':
        // 🜏 NEW: Spread the card's element to a random neighbor
        const spreadCards = this.getAllCardsOnTable();
        const me = spreadCards.find(c => c.instanceId === card.instanceId);
        if (me) {
          const neighbors = this.getNeighbors(me.row, me.col);
          const target = Object.values(neighbors).find(n => n);
          if (target) {
            target.tokens[me.element] = (target.tokens[me.element] || 0) + 2;
            target.value += 1;
          }
        }
        break;
    }
  }

  // ══════════════════════════════════════════
  // PRIMITIVE 7: NOVEL PATTERN DETECTION
  // ══════════════════════════════════════════

  _detectNovelPatterns() {
    const cards = this.getAllCardsOnTable();
    if (cards.length < 3) return;
    
    const hash = cards.map(c => `${c.element}:${c.row},${c.col}`).sort().join('|');
    
    // Detect full row
    for (let row = 0; row < this.gridRows; row++) {
      const rowCards = [];
      for (let col = 0; col < this.gridCols; col++) {
        if (this.table[row][col]) rowCards.push(this.table[row][col]);
      }
      if (rowCards.length === this.gridCols) {
        const event = `⬛ Full row ${row}! ${rowCards.map(c => c.name).join(', ')}`;
        if (!this.novelPatterns.includes(event)) {
          this.novelPatterns.push(event);
          this.persistentState.emergentEvents.push({ turn: this.turn, event, type: 'full_row' });
          if (this.onEmergence) this.onEmergence(event);
        }
      }
    }
    
    // Detect elemental cluster (3+ same element adjacent)
    cards.forEach(card => {
      const neighbors = this.getNeighbors(card.row, card.col);
      const sameElement = Object.values(neighbors).filter(n => n && n.element === card.element);
      if (sameElement.length >= 2) {
        const event = `🔗 Elemental cluster: ${card.element.toUpperCase()} at (${card.row},${card.col})`;
        if (!this.novelPatterns.includes(event)) {
          this.novelPatterns.push(event);
          this.persistentState.emergentEvents.push({ turn: this.turn, event, type: 'elemental_cluster' });
          if (this.onEmergence) this.onEmergence(event);
        }
      }
    });
    
    this.lastTableHash = hash;
  }

  // ══════════════════════════════════════════
  // AI: CHOOSE CARD TO PLAY
  // ══════════════════════════════════════════

  chooseCardToPlay() {
    const playable = this.hand.filter(c => (c.cost || 0) <= this.mana);
    if (playable.length === 0) return null;
    
    // Prioritize cards that interact with current table state
    const cardsOnTable = this.getTableCardCount();
    
    if (cardsOnTable >= 4) {
      const mergeCard = playable.find(c => c.effect === 'merge_cards');
      if (mergeCard) return mergeCard;
    }
    
    if (cardsOnTable >= 2) {
      const splitCard = playable.find(c => c.effect === 'split_card');
      if (splitCard && Math.random() < 0.4) return splitCard;
    }
    
    // Play most expensive affordable card
    playable.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    if (Math.random() < 0.25) return playable[Math.floor(Math.random() * playable.length)];
    return playable[0];
  }

  // ══════════════════════════════════════════
  // TICK SYSTEM
  // ══════════════════════════════════════════

  tick() {
    this.turn++;
    this.mana = Math.min(this.mana + 1, this.maxMana);
    this._incrementTurnCounters();
    this._updateElementalDominance();
    
    const drawn = this.draw();
    if (drawn) {
      const cardToPlay = this.chooseCardToPlay();
      if (cardToPlay) this.play(cardToPlay);
    }
  }

  // ══════════════════════════════════════════
  // MONACO + GOLDEN TICK
  // ══════════════════════════════════════════

  setMonacoReader(fn) { this._monacoReader = fn; }

  getMonacoContent() {
    if (this._monacoReader) return this._monacoReader();
    return '{}';
  }

  persistState() {
    const cards = this.getAllCardsOnTable();
    const stateBlock = {
      turn: this.turn,
      mana: this.mana,
      tableSize: cards.length,
      handSize: this.hand.length,
      table: cards.map(c => ({
        name: c.name,
        type: c.type,
        element: c.element,
        value: c.value,
        tokens: c.tokens,
        row: c.row,
        col: c.col,
        turnsOnTable: c.turnsOnTable
      })),
      hand: this.hand.map(c => ({ name: c.name, type: c.type, cost: c.cost, element: c.element })),
      memory: {
        graveyardSize: this.graveyard.length,
        totalCardsPlayed: this.totalCardsPlayed,
        elementalDominance: this.elementalDominance,
        tableModifiers: this.tableModifiers,
        emergentEvents: this.persistentState.emergentEvents.slice(-5)
      }
    };
    if (this.onStatePersist) this.onStatePersist(JSON.stringify(stateBlock, null, 2));
    return stateBlock;
  }

  readMonacoState(content) {
    try {
      const match = content.match(/\/\*🜏STATE_BEGIN\*\/([\s\S]*?)\/\*🜏STATE_END\*\//);
      if (!match) return null;
      return JSON.parse(match[1]);
    } catch (e) { return null; }
  }

  goldenTick(monacoContent) {
    const state = this.readMonacoState(monacoContent);
    if (state && this.onGoldenTick) {
      const transformations = this.computeTransformations(state);
      this.persistentState.lastGoldenRead = new Date().toISOString();
      this.persistentState.htmlModifiers = transformations;
      this.onGoldenTick({
        state,
        transformations,
        tableCards: state.table,
        handCards: state.hand,
        turn: state.turn,
        memory: state.memory,
        emergentEvents: state.memory?.emergentEvents || []
      });
    }
    this.persistState();
  }

  computeTransformations(state) {
    const mods = {
      backgroundGradient: 'var(--deep)',
      glowColor: 'rgba(201,168,76,0)',
      titleText: '☀️ APOLLO',
      titleGlow: '0 0 20px rgba(201,168,76,0.5)',
      cardBorderColor: 'rgba(201,168,76,0.2)',
      editorBorderColor: 'rgba(201,168,76,0.2)'
    };
    if (!state) return mods;
    
    const dominance = state.memory?.elementalDominance || {};
    const dominant = Object.entries(dominance).sort((a,b) => b[1] - a[1])[0];
    
    if (dominant && dominant[1] >= 4) {
      const elementColors = {
        fire: { bg: 'radial-gradient(ellipse at 50% 30%, rgba(255,100,20,0.15), var(--deep))', glow: 'rgba(255,100,20,0.5)', title: '🔥 APOLLO · INFERNO', shadow: '0 0 40px rgba(255,100,20,0.7)' },
        water: { bg: 'radial-gradient(ellipse at 50% 30%, rgba(20,100,255,0.12), var(--deep))', glow: 'rgba(20,100,255,0.4)', title: '🌊 APOLLO · DELUGE', shadow: '0 0 40px rgba(20,100,255,0.6)' },
        earth: { bg: 'radial-gradient(ellipse at 50% 30%, rgba(100,180,60,0.12), var(--deep))', glow: 'rgba(100,180,60,0.4)', title: '🌿 APOLLO · VERDANT', shadow: '0 0 40px rgba(100,180,60,0.6)' },
        air:   { bg: 'radial-gradient(ellipse at 50% 30%, rgba(180,180,255,0.10), var(--deep))', glow: 'rgba(180,180,255,0.35)', title: '💨 APOLLO · TEMPEST', shadow: '0 0 40px rgba(180,180,255,0.5)' },
        void:  { bg: 'radial-gradient(ellipse at 50% 30%, rgba(100,0,150,0.10), var(--deep))', glow: 'rgba(100,0,150,0.3)', title: '🌑 APOLLO · ABYSS', shadow: '0 0 30px rgba(100,0,150,0.5)' }
      };
      const colors = elementColors[dominant[0]] || elementColors.fire;
      mods.backgroundGradient = colors.bg;
      mods.glowColor = colors.glow;
      mods.titleText = colors.title;
      mods.titleGlow = colors.shadow;
    }
    
    if (state.table && state.table.length >= 8) {
      mods.cardBorderColor = 'rgba(240,208,128,0.5)';
      mods.titleText = '✨ APOLLO · ABUNDANCE';
    }
    
    return mods;
  }

  // ══════════════════════════════════════════
  // START / STOP
  // ══════════════════════════════════════════

  start() {
    if (this.running) return;
    this.running = true;
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.goldenId) { clearInterval(this.goldenId); this.goldenId = null; }
    for (let i = 0; i < 3; i++) this.draw();
    this.mana = 3;
    this.intervalId = setInterval(() => this.tick(), this.drawInterval);
    this.goldenId = setInterval(() => {
      this.goldenTick(this.getMonacoContent());
    }, this.goldenInterval);
    this.persistState();
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.goldenId) { clearInterval(this.goldenId); this.goldenId = null; }
    this.running = false;
  }

  getState() {
    const cards = this.getAllCardsOnTable();
    return {
      turn: this.turn,
      mana: this.mana,
      handSize: this.hand.length,
      tableSize: cards.length,
      deckSize: this.drawPile.length,
      discardSize: this.discard.length,
      graveyardSize: this.graveyard.length,
      hand: this.hand,
      table: cards,
      elementalDominance: this.elementalDominance,
      tableModifiers: this.tableModifiers,
      emergentEvents: this.persistentState.emergentEvents.slice(-3)
    };
  }
}

if (typeof module !== 'undefined') module.exports = ApolloPlayer;
