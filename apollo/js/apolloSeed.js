    // π-FORCE: Dealer after π turns stuck
    if (this._handStuckTurns >= this.STUCK_TURNS) {
        const dealt = this._dealerDeal(7);
        if (dealt && dealt.length > 0 && this.onDeal) this.onDeal(dealt);
        return;
    }

    if (typeof ApolloDB !== 'undefined' && this.turn % 2 === 0) {
        ApolloDB.syncToVault(this);
    }

    // 🜏 DRAW
    const drawn = this.draw();
    if (!drawn) return;

    // 🜏 MIND: Apollo thinks before he acts
    // think() returns the chosen card AND writes _mindScript
    let cardToPlay = null;
    if (typeof ApolloMind !== 'undefined') {
        cardToPlay = ApolloMind.think(this);
    } else {
        cardToPlay = this.chooseCardToPlay(); // fallback if mind not loaded
    }

    if (cardToPlay) this.play(cardToPlay);
}
