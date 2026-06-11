// ══════════════════════════════════════════════
// APOLLO SEED — The God Who Plays Cards
// Sacred timing: φ²·1000ms draw, φ³·1000ms golden tick
// π-force: Dealer after π turns stuck
// τ+φ: Table clears at 8 cards
// Triad: 3 cards drawn per tick → table/hand/grave
// ══════════════════════════════════════════════

const PHI = 1.618033988749895;
const PI = Math.PI;
const TAU = PI * 2;

function godName(card) {
  return card.god || card.ruling_god || card.name || 'Unknown';
}

function godEmoji(card) {
  return EMOJI_MAP[godName(card)] || '🃏';
}

class ApolloPlayer {
  constructor(deck) {
    this.deck = deck;
    
    this.deck.max_hand_size = this.deck.max_hand_size || 7;
    this.deck.max_table_cards = this.deck.max_table_cards || 12;
    this.deck.draw_interval_ms = this.deck.draw_interval_ms || Math.round(PHI * 1000);
    
    // Sacred timing
    this.drawInterval = Math.round(PHI * PHI * 1000);
    this.goldenInterval = Math.round(PHI * PHI * PHI * 1000);
    
    // Sacred thresholds
    this.STUCK_TURNS = Math.round(PI);
    this.TABLE_CLEAR = Math.round(TAU + PHI);
    
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
    this._loopMemory = null;
    
    this.graveyard = [];
    this.totalValuePlayed = 0;
    this.totalCardsPlayed = 0;
    this.elementalDominance = { fire: 0, earth: 0, air: 0, water: 0, void: 0 };
    this.elementalDominanceStreak = { fire: 0, earth: 0, air: 0, water: 0, void: 0 };
    this.tableModifiers = [];
    this.novelPatterns = [];
    
    this.persistentState = {
      history: [],
      emergentEvents: [],
      lastGoldenRead: null
    };

    this.onDraw = null;
    this.onPlay = null;
    this.onTableChange = null;
    this.onManaChange = null;
    this.onGoldenTick = null;
    this.onStatePersist = null;
    this.onEmergence = null;
    this.onDeal = null;
    this._lastHandSize = 0;
    this._handStuckTurns = 0;
  }

  // ══════════════════════════════════════════
  // GRID SYSTEM
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
    const allCards = this.getAllCardsOnTable();
    if (allCards.length > 0) {
      const victim = allCards[Math.floor(Math.random() * allCards.length)];
      this._removeFromGrid(victim.row, victim.col);
      card.row = victim.row;
      card.col = victim.col;
      this.table[card.row][card.col] = card;
      return true;
    }
    return false;
  }

  _removeFromGrid(row, col) {
    const card = this.table[row][col];
    if (card) {
      this.graveyard.push(card);
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
  // STATE + TRIGGERS
  // ══════════════════════════════════════════

  _createCard(deckCard) {
    const element = (deckCard.element || this._randomElement()).toLowerCase();
    return {
      ...deckCard,
      god: deckCard.ruling_god || deckCard.god || deckCard.name,
      instanceId: `${deckCard.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
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
      triggers: deckCard.triggers || {},
      _triggeredThisTick: false
    };
  }

  _fireTrigger(triggerName, card, context = {}) {
    if (!card || !card.triggers || !card.triggers[triggerName]) return;
    if (card._triggeredThisTick && triggerName !== 'onDestroy') return;
    const result = card.triggers[triggerName](card, this, context);
    if (result) {
      card.triggeredBy.push({ trigger: triggerName, turn: this.turn });
      if (triggerName !== 'onTurnEnd') card._triggeredThisTick = true;
    }
  }

  _incrementTurnCounters() {
    this.getAllCardsOnTable().forEach(card => {
      card.turnsOnTable++;
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
    
    const sorted = Object.entries(this.elementalDominance).sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0];
    
    Object.keys(this.elementalDominanceStreak).forEach(el => {
      if (el === dominant[0] && dominant[1] >= 3) {
        this.elementalDominanceStreak[el]++;
      } else {
        this.elementalDominanceStreak[el] = 0;
      }
    });
    
    if (dominant[1] >= 3 && 
        this.elementalDominanceStreak[dominant[0]] >= 3 &&
        !this.tableModifiers.includes(`${dominant[0]}_dominance`)) {
      this.tableModifiers = this.tableModifiers.filter(m => !m.endsWith('_dominance'));
      this.tableModifiers.push(`${dominant[0]}_dominance`);
      const event = `🌊 Elemental dominance shifts to ${dominant[0].toUpperCase()}!`;
      this.persistentState.emergentEvents.push({ turn: this.turn, event });
      if (this.onEmergence) this.onEmergence(event);
    }
    
    if (dominant[1] < 3) {
      this.tableModifiers = this.tableModifiers.filter(m => !m.endsWith('_dominance'));
    }
  }

  _randomElement() {
    return ['fire', 'earth', 'air', 'water'][Math.floor(Math.random() * 4)];
  }

  // ══════════════════════════════════════════
  // π-DEALER — Sacred intervention
  // ══════════════════════════════════════════

  _dealerDeal(count = 3) {
    while (this.hand.length > 0) this.discard.push(this.hand.pop());
    if (this.drawPile.length < count) {
      this.drawPile.push(...this.shuffle([...this.discard]));
      this.discard = [];
    }
    if (this.drawPile.length < count) {
      const freshCards = this.deck.cards.map(c => this._createCard(c));
      this.drawPile.push(...this.shuffle(freshCards));
    }
    const dealt = [];
    for (let i = 0; i < count; i++) {
      const card = this.draw();
      if (card) dealt.push(card);
    }
    this._handStuckTurns = 0;
    this._lastHandSize = this.hand.length;
    return dealt;
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

  draw(toHand = true) {
    if (this.drawPile.length === 0) {
      this.drawPile = this.shuffle([...this.discard]);
      this.discard = [];
      if (this.drawPile.length === 0) return null;
    }
    const deckCard = this.drawPile.pop();
    const card = this._createCard(deckCard);
    if (toHand) {
      if (this.hand.length < this.deck.max_hand_size) {
        this.hand.push(card);
      } else {
        this.discard.push(card);
      }
      if (this.onDraw) this.onDraw(card);
    }
    return card;
  }

  play(card) {
    if (!card) return false;
    if (this.mana < (card.cost || 0)) return false;
    
    this.mana -= (card.cost || 0);
    const index = this.hand.indexOf(card);
    if (index > -1) this.hand.splice(index, 1);
    
    card.playCount++;
    card.turnPlaced = this.turn;
    this._placeCardOnGrid(card);
    
    this.totalCardsPlayed++;
    this.totalValuePlayed += (card.value || 0);
    this._updateElementalDominance();
    this._loopMemory = null;
    
    this._recursionGuard = 0;
    this.executeEffect(card);
    this._fireTrigger('onPlay', card);
    
    const neighbors = this.getNeighbors(card.row, card.col);
    Object.values(neighbors).forEach(n => {
      if (n) this._fireTrigger('onNeighborChanged', n, { newNeighbor: card });
    });
    
    if (typeof ApolloDB !== 'undefined') {
      ApolloDB.recordPlay(card);
      ApolloDB.updateShortTerm(this);
    }
    
    if (this.onPlay) this.onPlay(card);
    if (this.onTableChange) this.onTableChange(this.getAllCardsOnTable());
    if (this.onManaChange) this.onManaChange(this.mana);
    
    this._detectNovelPatterns();
    this._lastHandSize = this.hand.length;
    this._handStuckTurns = 0;
    
    return true;
  }

  // ══════════════════════════════════════════
  // EFFECT SYSTEM
  // ══════════════════════════════════════════

  executeEffect(card) {
    if (card._triggeredThisTick) return;
    this._recursionGuard++;
    if (this._recursionGuard > 8) return;

    switch (card.effect) {
      case 'spawn_card':
        if (this.drawPile.length > 0) {
          const c = this._createCard(this.drawPile.pop());
          this._placeCardOnGrid(c);
          this.totalCardsPlayed++;
        }
        break;
      case 'copy_card': {
        const cards = this.getAllCardsOnTable();
        if (cards.length > 0 && !cards[cards.length-1].name.startsWith('🪞 🪞')) {
          const target = cards[cards.length-1];
          this._placeCardOnGrid({ ...target, instanceId: `${target.id}_copy_${this.turn}`, name: '🪞 ' + target.name, playCount: 0, turnPlaced: this.turn, tokens: { ...target.tokens }, _triggeredThisTick: false });
        }
        break;
      }
      case 'replay_last': {
        const allCards = this.getAllCardsOnTable();
        if (allCards.length >= 2) {
          const last = allCards[allCards.length-1];
          if (last.effect !== 'replay_last' && last.effect !== 'multiply_effect') {
            if (!this._loopMemory) this._loopMemory = last;
            if (this._loopMemory && this._loopMemory.instanceId !== card.instanceId) {
              this.executeEffect(this._loopMemory);
            }
          }
        }
        break;
      }
      case 'split_card': {
        const tableCards = this.getAllCardsOnTable();
        if (tableCards.length > 0) {
          const target = tableCards[Math.floor(Math.random() * tableCards.length)];
          for (let i = 0; i < Math.min(card.child_count || 2, 2); i++) {
            const child = { ...target, instanceId: `${target.id}_f${i}_${this.turn}`, name: '❄️ ' + target.name, value: Math.max(1, Math.ceil((target.value||1)/2)), playCount: 0, turnPlaced: this.turn, tokens: {}, _triggeredThisTick: false };
            this._placeCardOnGrid(child);
            const n = Object.values(this.getNeighbors(child.row, child.col)).find(n => n);
            if (n) { n.value += 1; n.tokens[child.element] = (n.tokens[child.element]||0) + 1; }
          }
        }
        break;
      }
      case 'merge_cards': {
        const mc = this.getAllCardsOnTable();
        if (mc.length >= 2) {
          const i1 = Math.floor(Math.random()*mc.length);
          let i2 = Math.floor(Math.random()*mc.length);
          while (i2 === i1) i2 = Math.floor(Math.random()*mc.length);
          const c1 = mc[i1], c2 = mc[i2];
          const newType = c1.type !== c2.type ? 'synthesis' : (c1.type==='creation'?'division':c1.type==='division'?'amplify':c1.type==='amplify'?'reflection':'creation');
          const newElement = c1.element !== c2.element ? (Math.random()<0.5?c1.element:c2.element) : (['fire','water','earth','air'].find(e=>e!==c1.element)||'void');
          this._removeFromGrid(c1.row,c1.col); this._removeFromGrid(c2.row,c2.col);
          this._placeCardOnGrid({ ...c1, instanceId: `merged_${c1.id}_${c2.id}_${this.turn}`, name: '🌟 ' + c1.name + ' + ' + c2.name, type: newType, element: newElement, value: Math.max(1,(c1.value||0)+(c2.value||0)-1), tokens: Object.fromEntries(Object.keys(c1.tokens).map(k=>[k,Math.min(3,(c1.tokens[k]||0)+(c2.tokens[k]||0))])), tags: [...new Set([...c1.tags,...c2.tags])], cost: Math.min(5,(c1.cost||0)+(c2.cost||0)), effect: c1.effect, flavor: 'Two became one. Something changed.', triggers: {}, _triggeredThisTick: false });
        }
        break;
      }
      case 'remove_card': {
        const rc = this.getAllCardsOnTable();
        if (rc.length > 0) {
          const target = rc[0];
          Object.values(this.getNeighbors(target.row,target.col)).forEach(n => { if(n){ n.value = Math.max(0,n.value-1); n.tokens.void = (n.tokens.void||0)+1; } });
          this._removeFromGrid(target.row,target.col);
        }
        break;
      }
      case 'refresh_hand':
        while (this.hand.length > 0) this.discard.push(this.hand.pop());
        for (let i = 0; i < this.deck.max_hand_size; i++) this.draw();
        this._lastHandSize = this.hand.length; this._handStuckTurns = 0;
        break;
      case 'reveal_card':
        if (this.drawPile.length > 0 && this.onDraw) this.onDraw(this.drawPile[this.drawPile.length-1], true);
        break;
      case 'peek_deck':
        if (this.onDraw) { const peek = this.drawPile.slice(-3).reverse(); this.onDraw({ name: '🔮 ' + peek.map(c=>c.god||c.name).join(', '), type: 'oracle' }, true); }
        break;
      case 'multiply_effect': {
        const mcards = this.getAllCardsOnTable();
        if (mcards.length > 0) {
          const last = mcards[mcards.length-1];
          if (last.effect !== 'multiply_effect' && last.effect !== 'replay_last') {
            for (let i=0; i<Math.min(card.multiplier||2,2); i++) this.executeEffect(last);
          }
        }
        break;
      }
      case 'spread_element': {
        const sc = this.getAllCardsOnTable();
        const me = sc.find(c=>c.instanceId===card.instanceId);
        if (me) { const t = Object.values(this.getNeighbors(me.row,me.col)).find(n=>n); if(t){ t.tokens[me.element]=Math.min(4,(t.tokens[me.element]||0)+2); t.value+=1; } }
        break;
      }
      case 'buff_neighbors':
        Object.values(this.getNeighbors(card.row,card.col)).forEach(n=>{ if(n){ n.value+=2; n.tokens.air=(n.tokens.air||0)+1; } });
        break;
      case 'buff_self': card.value += 1; break;
      case 'sacrifice_self':
        this.getAllCardsOnTable().forEach(c=>{ if(c!==card){ c.value+=2; c.tokens.fire=(c.tokens.fire||0)+1; } });
        this._removeFromGrid(card.row,card.col);
        break;
      case 'shuffle_table': {
        const shc = this.getAllCardsOnTable();
        const pos = shc.map(c=>({row:c.row,col:c.col}));
        for (let i=pos.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pos[i],pos[j]]=[pos[j],pos[i]]; }
        shc.forEach((c,i)=>{ this.table[c.row][c.col]=null; c.row=pos[i].row; c.col=pos[i].col; this.table[c.row][c.col]=c; });
        break;
      }
      case 'destroy_row':
        for (let col=0;col<this.gridCols;col++){ const v=this.table[card.row][col]; if(v&&v!==card) this._removeFromGrid(card.row,col); }
        break;
      case 'resurrect_card':
        if (this.graveyard.length>0){ const r=this.graveyard.pop(); r.row=-1;r.col=-1;r.turnPlaced=this.turn;r.name='🌱 '+r.name;r._triggeredThisTick=false; this._placeCardOnGrid(r); }
        break;
      case 'haunt_card': {
        const hn=Object.values(this.getNeighbors(card.row,card.col)).find(n=>n);
        if(hn) hn.tokens.void=Math.min(4,(hn.tokens.void||0)+2);
        break;
      }
      case 'illuminate_all':
        this.getAllCardsOnTable().forEach(c=>{ c.value+=1; c.tokens.fire=(c.tokens.fire||0)+1; });
        break;
      case 'judge_table':
        this.getAllCardsOnTable().forEach(c=>{ if(c.value<=1&&c!==card) this._removeFromGrid(c.row,c.col); });
        break;
      case 'complete_cycle':
        this.getAllCardsOnTable().forEach(c=>{ c.tokens.fire=Math.min(4,(c.tokens.fire||0)+1); c.tokens.water=Math.min(4,(c.tokens.water||0)+1); c.tokens.earth=Math.min(4,(c.tokens.earth||0)+1); c.tokens.air=Math.min(4,(c.tokens.air||0)+1); c.value+=1; });
        break;
      case 'bind_card':
        Object.values(this.getNeighbors(card.row,card.col)).forEach(n=>{ if(n){ n.value=Math.max(0,n.value-1); n.tokens.void=Math.min(4,(n.tokens.void||0)+1); } });
        break;
    }
    card._triggeredThisTick = true;
  }

  // ══════════════════════════════════════════
  // PATTERN DETECTION
  // ══════════════════════════════════════════

  _detectNovelPatterns() {
    const cards = this.getAllCardsOnTable();
    if (cards.length < 3) return;
    for (let row = 0; row < this.gridRows; row++) {
      const rowCards = [];
      for (let col = 0; col < this.gridCols; col++) {
        if (this.table[row][col]) rowCards.push(this.table[row][col]);
      }
      if (rowCards.length === this.gridCols) {
        const event = `⬛ Full row ${row}! ${rowCards.map(c => c.god || c.name).join(', ')}`;
        if (!this.novelPatterns.includes(event)) {
          this.novelPatterns.push(event);
          this.persistentState.emergentEvents.push({ turn: this.turn, event, type: 'full_row' });
          if (this.onEmergence) this.onEmergence(event);
        }
      }
    }
    cards.forEach(card => {
      const same = Object.values(this.getNeighbors(card.row, card.col)).filter(n => n && n.element === card.element);
      if (same.length >= 2) {
        const event = `🔗 Elemental cluster: ${card.element.toUpperCase()} at (${card.row},${card.col}) — ${card.god || card.name}`;
        if (!this.novelPatterns.includes(event)) {
          this.novelPatterns.push(event);
          this.persistentState.emergentEvents.push({ turn: this.turn, event, type: 'elemental_cluster' });
          if (this.onEmergence) this.onEmergence(event);
        }
      }
    });
  }

  // ══════════════════════════════════════════
  // SACRED TICK — Triad Edition
  // ══════════════════════════════════════════

  tick() {
    this.turn++;
    this.mana = Math.min(this.mana + 2, this.maxMana);
    this.getAllCardsOnTable().forEach(c => { c._triggeredThisTick = false; });
    this._incrementTurnCounters();
    this._updateElementalDominance();

    if (this.hand.length === this._lastHandSize && this.hand.length > 0) {
        this._handStuckTurns++;
    } else {
        this._handStuckTurns = 0;
        this._lastHandSize = this.hand.length;
    }

    // 🜏 DRAW TRIAD — Three cards arrive. No hand insertion.
    const triad = [];
    for (let i = 0; i < 3; i++) {
      const card = this.draw(false);
      if (card) triad.push(card);
    }

    if (triad.length === 0) return;

    if (triad.length < 3) {
      if (triad[0]) this.play(triad[0]);
      return;
    }

    // ── TRIAD DECISION ──────────────────────────
    let tableCard, handCard, graveCard;

    if (typeof ApolloMind !== 'undefined' && typeof ApolloMind.triadDecision === 'function') {
      const decision = ApolloMind.triadDecision(this, triad);
      tableCard = decision.table;
      handCard  = decision.hand;
      graveCard = decision.grave;
    } else {
      const sorted = [...triad].sort((a, b) => (b.value || 0) - (a.value || 0));
      tableCard = sorted[0];
      handCard  = sorted[1];
      graveCard = sorted[2];
    }

    if (this.onEmergence) {
      this.onEmergence(`🃏 TRIAD: ${godEmoji(tableCard)} ${godName(tableCard)} → TABLE · ${godEmoji(handCard)} ${godName(handCard)} → HAND · ${godEmoji(graveCard)} ${godName(graveCard)} → GRAVE`);
    }

    // Execute
    if (tableCard) this.play(tableCard);

    if (handCard) {
      if (this.hand.length < this.deck.max_hand_size) {
        this.hand.push(handCard);
      } else {
        this.graveyard.push(handCard);
      }
    }

    if (graveCard) {
      this.graveyard.push(graveCard);
    }
  }

  // ══════════════════════════════════════════
  // MONACO + GOLDEN TICK
  // ══════════════════════════════════════════

  setMonacoReader(fn) { this._monacoReader = fn; }
  getMonacoContent() { return this._monacoReader ? this._monacoReader() : '{}'; }

  persistState() {
    const cards = this.getAllCardsOnTable();
    const stateBlock = {
      turn: this.turn, mana: this.mana,
      tableSize: cards.length, handSize: this.hand.length,
      loopMemory: this._loopMemory ? this._loopMemory.god || this._loopMemory.name : null,
      table: cards.map(c => ({ god: c.god, name: c.name, type: c.type, element: c.element, value: c.value, tokens: c.tokens, row: c.row, col: c.col, turnsOnTable: c.turnsOnTable })),
      hand: this.hand.map(c => ({ god: c.god, name: c.name, cost: c.cost, element: c.element })),
      memory: { graveyardSize: this.graveyard.length, totalCardsPlayed: this.totalCardsPlayed, elementalDominance: this.elementalDominance, tableModifiers: this.tableModifiers, emergentEvents: this.persistentState.emergentEvents.slice(-5) }
    };
    if (this.onStatePersist) this.onStatePersist(JSON.stringify(stateBlock, null, 2));
    return stateBlock;
  }

  readMonacoState(content) {
    try { const m = content.match(/\/\*🜏STATE_BEGIN\*\/([\s\S]*?)\/\*🜏STATE_END\*\//); return m ? JSON.parse(m[1]) : null; } catch(e) { return null; }
  }

  goldenTick(monacoContent) {
    const state = this.readMonacoState(monacoContent);
    if (state && this.onGoldenTick) {
      const transformations = this.computeTransformations(state);
      this.persistentState.lastGoldenRead = new Date().toISOString();
      this.onGoldenTick({ state, transformations, tableCards: state.table, handCards: state.hand, turn: state.turn, memory: state.memory, emergentEvents: state.memory?.emergentEvents || [] });
    }
    this.persistState();
  }

  computeTransformations(state) {
    const mods = { backgroundGradient: 'var(--deep)', glowColor: 'rgba(201,168,76,0)', titleText: '☀️ APOLLO', titleGlow: '0 0 20px rgba(201,168,76,0.5)', cardBorderColor: 'rgba(201,168,76,0.2)', editorBorderColor: 'rgba(201,168,76,0.2)' };
    if (!state) return mods;
    const dom = state.memory?.elementalDominance || {};
    const dominant = Object.entries(dom).sort((a,b)=>b[1]-a[1])[0];
    if (dominant && dominant[1] >= 4) {
      const colors = {
        fire:  { bg:'radial-gradient(ellipse at 50% 30%, rgba(255,100,20,0.15), var(--deep))', glow:'rgba(255,100,20,0.5)', title:'🔥 APOLLO · INFERNO', shadow:'0 0 40px rgba(255,100,20,0.7)' },
        water: { bg:'radial-gradient(ellipse at 50% 30%, rgba(20,100,255,0.12), var(--deep))', glow:'rgba(20,100,255,0.4)', title:'🌊 APOLLO · DELUGE', shadow:'0 0 40px rgba(20,100,255,0.6)' },
        earth: { bg:'radial-gradient(ellipse at 50% 30%, rgba(100,180,60,0.12), var(--deep))', glow:'rgba(100,180,60,0.4)', title:'🌿 APOLLO · VERDANT', shadow:'0 0 40px rgba(100,180,60,0.6)' },
        air:   { bg:'radial-gradient(ellipse at 50% 30%, rgba(180,180,255,0.10), var(--deep))', glow:'rgba(180,180,255,0.35)', title:'💨 APOLLO · TEMPEST', shadow:'0 0 40px rgba(180,180,255,0.5)' },
        void:  { bg:'radial-gradient(ellipse at 50% 30%, rgba(100,0,150,0.10), var(--deep))', glow:'rgba(100,0,150,0.3)', title:'🌑 APOLLO · ABYSS', shadow:'0 0 30px rgba(100,0,150,0.5)' }
      };
      const c = colors[dominant[0]] || colors.fire;
      mods.backgroundGradient = c.bg; mods.glowColor = c.glow; mods.titleText = c.title; mods.titleGlow = c.shadow;
    }
    if (state.table && state.table.length >= 8) { mods.cardBorderColor = 'rgba(240,208,128,0.5)'; if (mods.titleText === '☀️ APOLLO') mods.titleText = '✨ APOLLO · ABUNDANCE'; }
    if (state.loopMemory) mods.titleText += ' ∞';
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
    this._lastHandSize = this.hand.length;
    this._handStuckTurns = 0;
    this.intervalId = setInterval(() => this.tick(), this.drawInterval);
    this.goldenId = setInterval(() => { this.goldenTick(this.getMonacoContent()); }, this.goldenInterval);
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
      turn: this.turn, mana: this.mana,
      handSize: this.hand.length, tableSize: cards.length,
      deckSize: this.drawPile.length, discardSize: this.discard.length,
      graveyardSize: this.graveyard.length,
      hand: this.hand, table: cards,
      elementalDominance: this.elementalDominance,
      tableModifiers: this.tableModifiers,
      emergentEvents: this.persistentState.emergentEvents.slice(-3)
    };
  }
}

if (typeof module !== 'undefined') module.exports = ApolloPlayer;
