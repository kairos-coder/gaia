// ══════════════════════════════════════════════
// APOLLO SEED — The God Who Plays Cards
// Draws and plays every 1.6 seconds
// ══════════════════════════════════════════════

class ApolloPlayer {
  constructor(deck) {
    this.deck = deck;
    this.drawInterval = deck.draw_interval_ms || 1600;
    this.hand = [];
    this.table = [];
    this.discard = [];
    this.mana = 0;
    this.turn = 0;
    this.drawPile = this.shuffle([...deck.cards]);
    this.running = false;
    this.intervalId = null;
    
    // Callbacks for UI updates
    this.onDraw = null;
    this.onPlay = null;
    this.onTableChange = null;
    this.onManaChange = null;
  }

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
    
    const card = this.drawPile.pop();
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
    
    this.table.push(card);
    if (this.table.length > this.deck.max_table_cards) {
      const removed = this.table.shift();
      this.discard.push(removed);
    }
    
    this.executeEffect(card);
    
    if (this.onPlay) this.onPlay(card);
    if (this.onTableChange) this.onTableChange(this.table);
    if (this.onManaChange) this.onManaChange(this.mana);
    
    return true;
  }

  executeEffect(card) {
    switch (card.effect) {
      case 'spawn_card':
        const newCard = this.drawPile.length > 0 ? this.drawPile.pop() : null;
        if (newCard) {
          this.table.push(newCard);
          if (this.table.length > this.deck.max_table_cards) {
            this.discard.push(this.table.shift());
          }
        }
        break;
        
      case 'copy_card':
        if (this.table.length > 0) {
          const lastCard = this.table[this.table.length - 1];
          const copy = { ...lastCard, id: lastCard.id + '_copy', name: '🪞 ' + lastCard.name };
          this.table.push(copy);
        }
        break;
        
      case 'replay_last':
        if (this.table.length >= 2) {
          const lastCard = this.table[this.table.length - 1];
          this.executeEffect(lastCard);
        }
        break;
        
      case 'split_card':
        if (this.table.length > 0) {
          const target = this.table[Math.floor(Math.random() * this.table.length)];
          for (let i = 0; i < (card.child_count || 2); i++) {
            const child = { ...target, id: target.id + `_child${i}`, name: '❄️ ' + target.name };
            this.table.push(child);
          }
        }
        break;
        
      case 'merge_cards':
        if (this.table.length >= 2) {
          const idx1 = Math.floor(Math.random() * this.table.length);
          let idx2 = Math.floor(Math.random() * this.table.length);
          while (idx2 === idx1) idx2 = Math.floor(Math.random() * this.table.length);
          const card1 = this.table[idx1];
          const card2 = this.table[idx2];
          const merged = {
            id: `merged_${card1.id}_${card2.id}`,
            name: '🌟 ' + card1.name + ' + ' + card2.name,
            type: 'synthesis',
            cost: (card1.cost || 0) + (card2.cost || 0),
            effect: 'merged',
            flavor: 'Two became one.'
          };
          this.table.splice(Math.max(idx1, idx2), 1);
          this.table.splice(Math.min(idx1, idx2), 1);
          this.table.push(merged);
        }
        break;
        
      case 'remove_card':
        if (this.table.length > 0) {
          const removed = this.table.shift();
          this.discard.push(removed);
        }
        break;
        
      case 'refresh_hand':
        while (this.hand.length > 0) {
          this.discard.push(this.hand.pop());
        }
        for (let i = 0; i < this.deck.max_hand_size; i++) {
          this.draw();
        }
        break;
        
      case 'reveal_card':
        if (this.drawPile.length > 0) {
          const revealed = this.drawPile[this.drawPile.length - 1];
          if (this.onDraw) this.onDraw(revealed, true);
        }
        break;
        
      case 'peek_deck':
        const peek = this.drawPile.slice(-3).reverse();
        if (this.onDraw) this.onDraw({ name: '🔮 Prophecy: ' + peek.map(c => c.name).join(', '), type: 'oracle' }, true);
        break;
        
      case 'multiply_effect':
        if (this.table.length > 0) {
          const lastCard = this.table[this.table.length - 1];
          for (let i = 0; i < (card.multiplier || 2); i++) {
            this.executeEffect(lastCard);
          }
        }
        break;
    }
  }

  chooseCardToPlay() {
    // Apollo's strategy: play the most expensive affordable card
    const playable = this.hand.filter(c => (c.cost || 0) <= this.mana);
    if (playable.length === 0) return null;
    
    playable.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    
    // Sometimes play random for variety (Apollo is inspired, not mechanical)
    if (Math.random() < 0.2) {
      return playable[Math.floor(Math.random() * playable.length)];
    }
    
    return playable[0];
  }

  tick() {
    this.turn++;
    this.mana = Math.min(this.mana + 1, 10); // Max 10 mana
    
    const drawn = this.draw();
    
    if (drawn) {
      const cardToPlay = this.chooseCardToPlay();
      if (cardToPlay) {
        this.play(cardToPlay);
      }
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    
    // Initial hand
    for (let i = 0; i < 3; i++) this.draw();
    this.mana = 3;
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.drawInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
  }

  getState() {
    return {
      turn: this.turn,
      mana: this.mana,
      handSize: this.hand.length,
      tableSize: this.table.length,
      deckSize: this.drawPile.length,
      discardSize: this.discard.length,
      hand: this.hand,
      table: this.table
    };
  }
}

// Export for Monaco integration
if (typeof module !== 'undefined') module.exports = ApolloPlayer;
