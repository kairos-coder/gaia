// ══════════════════════════════════════════════
// DEAL.JS — The Dealer Refreshes Apollo's Hand
// When the hand is stuck, the Dealer intervenes.
// 7 new cards. Fresh possibilities. The loop continues.
// ══════════════════════════════════════════════

const Dealer = {
  /**
   * Deal a fresh hand to Apollo.
   * Discards current hand, draws 7 new cards from the deck.
   * If the draw pile is empty, reshuffles the discard pile.
   * If everything is exhausted, generates a new copy of the deck.
   */
  deal: function(apollo, count = 7) {
    // Discard current hand
    while (apollo.hand.length > 0) {
      apollo.discard.push(apollo.hand.pop());
    }
    
    // Reshuffle discard into draw pile if needed
    if (apollo.drawPile.length < count) {
      apollo.drawPile.push(...apollo.shuffle([...apollo.discard]));
      apollo.discard = [];
    }
    
    // If still not enough, generate fresh copies from the original deck
    if (apollo.drawPile.length < count) {
      const freshCards = apollo.deck.cards.map(c => apollo._createCard(c));
      apollo.drawPile.push(...apollo.shuffle(freshCards));
    }
    
    // Deal the cards
    const dealt = [];
    for (let i = 0; i < count; i++) {
      const card = apollo.draw();
      if (card) dealt.push(card);
    }
    
    return dealt;
  },
  
  /**
   * Check if Apollo needs a new deal.
   * Conditions: hand is full AND no playable cards OR hand hasn't changed in 3+ turns
   */
  needsDeal: function(apollo) {
    if (apollo.hand.length === 0) return true;
    
    const playable = apollo.hand.filter(c => (c.cost || 0) <= apollo.mana);
    if (playable.length === 0 && apollo.hand.length > 0) return true;
    
    return false;
  },
  
  /**
   * Auto-deal: checks conditions and deals if needed.
   * Returns the dealt cards, or null if no deal was made.
   */
  autoDeal: function(apollo, count = 7) {
    if (this.needsDeal(apollo)) {
      const dealt = this.deal(apollo, count);
      return dealt;
    }
    return null;
  }
};

if (typeof module !== 'undefined') module.exports = Dealer;
