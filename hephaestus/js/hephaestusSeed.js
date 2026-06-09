// ══════════════════════════════════════════════
// HEPHAESTUS SEED — The God of the Forge
// Sacred timing: φ·1000ms material arrival, φ²·1000ms golden tick
// π-force: Recycle grid after π turns without a forge
// ══════════════════════════════════════════════

const PHI = 1.618033988749895;
const PI = Math.PI;
const TAU = PI * 2;

class HephaestusForge {
  constructor(materials, recipes) {
    this.materials = materials;
    this.recipes = recipes;
    
    this.arrivalInterval = Math.round(PHI * 1000);       // 1618ms
    this.goldenInterval = Math.round(PHI * PHI * 1000);  // 2618ms
    this.STUCK_TURNS = Math.round(PI);                    // 3
    
    // 3×3 crafting grid
    this.gridRows = 3;
    this.gridCols = 3;
    this.grid = this._createEmptyGrid();
    
    // Inventory
    this.inventory = [];
    this.materialPool = this.shuffle([...materials]);
    
    this.forgeCount = 0;
    this.turn = 0;
    this.mana = 0;
    this.maxMana = 10;
    this.running = false;
    this.intervalId = null;
    this.goldenId = null;
    this._monacoReader = null;
    
    this.forgeHistory = [];
    this.emergentEvents = [];
    
    this._lastGridState = '';
    this._stuckTurns = 0;
    
    this.onMaterialArrive = null;
    this.onForge = null;
    this.onGridChange = null;
    this.onGoldenTick = null;
    this.onStatePersist = null;
    this.onEmergence = null;
  }

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
    const slots = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (!this.grid[row][col]) slots.push({ row, col });
      }
    }
    if (slots.length === 0) return null;
    return slots[Math.floor(Math.random() * slots.length)];
  }

  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  getGridCards() {
    const cards = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (this.grid[row][col]) cards.push({ ...this.grid[row][col], row, col });
      }
    }
    return cards;
  }

  // ══ Material Arrival ══
  _arriveMaterial() {
    if (this.materialPool.length === 0) {
      this.materialPool = this.shuffle([...this.materials]);
    }
    const material = { ...this.materialPool.pop() };
    const slot = this._findEmptySlot();
    if (slot) {
      material.row = slot.row;
      material.col = slot.col;
      material.arrivedAt = this.turn;
      this.grid[slot.row][slot.col] = material;
      if (this.onMaterialArrive) this.onMaterialArrive(material);
      return material;
    }
    return null;
  }

  // ══ Recipe Check ══
  _checkRecipes() {
    const gridCards = this.getGridCards();
    if (gridCards.length < 2) return null;
    
    // Sort grid cards by position
    const positions = gridCards.map(c => ({ row: c.row, col: c.col, material: c }));
    
    for (const recipe of this.recipes) {
      const required = recipe.materials;
      const pattern = recipe.pattern;
      
      // Check if all required materials exist on the grid
      const available = positions.map(p => p.material.id);
      const hasAll = required.every(r => available.includes(r));
      
      if (hasAll && positions.length >= pattern.length) {
        // Found a match! Forge the item.
        const usedPositions = [];
        const usedMaterials = [];
        
        for (const reqId of required) {
          const idx = positions.findIndex(p => p.material.id === reqId && !usedPositions.includes(p));
          if (idx >= 0) {
            usedPositions.push(positions[idx]);
            usedMaterials.push(positions[idx].material);
          }
        }
        
        // Remove used materials from grid
        usedPositions.forEach(pos => {
          this.grid[pos.row][pos.col] = null;
        });
        
        // Create forged item
        const item = {
          id: recipe.id,
          name: recipe.name,
          emoji: recipe.emoji,
          tier: recipe.tier,
          description: recipe.description,
          forgedAt: this.turn,
          materials: usedMaterials.map(m => m.name),
          instanceId: `${recipe.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
        };
        
        this.inventory.push(item);
        this.forgeCount++;
        this.forgeHistory.push({ turn: this.turn, item: item.name, materials: usedMaterials.map(m => m.name) });
        
        return item;
      }
    }
    
    return null;
  }

  // ══ Forge Tick ══
  tick() {
    this.turn++;
    this.mana = Math.min(this.mana + 1, this.maxMana);
    
    // Arrive 1-2 materials per tick
    const count = Math.random() < 0.3 ? 2 : 1;
    for (let i = 0; i < count; i++) this._arriveMaterial();
    
    // Check for recipes
    const forged = this._checkRecipes();
    if (forged && this.onForge) this.onForge(forged);
    if (this.onGridChange) this.onGridChange(this.getGridCards());
    
    // Detect stuck grid
    const currentState = JSON.stringify(this.getGridCards().map(c => c.id));
    if (currentState === this._lastGridState) {
      this._stuckTurns++;
    } else {
      this._stuckTurns = 0;
      this._lastGridState = currentState;
    }
    
    // π-force: Recycle grid if stuck
    if (this._stuckTurns >= this.STUCK_TURNS) {
      this._recycleGrid();
    }
    
    // Sync memory
    if (typeof HephaestusDB !== 'undefined' && this.turn % 2 === 0) {
      HephaestusDB.syncToVault(this);
    }
  }

  _recycleGrid() {
    const cards = this.getGridCards();
    cards.forEach(c => this.grid[c.row][c.col] = null);
    // Return materials to pool
    this.materialPool.push(...this.shuffle(cards.map(c => ({ ...c }))));
    this._stuckTurns = 0;
    this._lastGridState = '';
  }

  // ══ Sacred Timing ══
  start() {
    if (this.running) return;
    this.running = true;
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.goldenId) { clearInterval(this.goldenId); this.goldenId = null; }
    this.mana = 3;
    this.intervalId = setInterval(() => this.tick(), this.arrivalInterval);
    this.goldenId = setInterval(() => {
      if (this.onGoldenTick) this.onGoldenTick(this.getState());
    }, this.goldenInterval);
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.goldenId) { clearInterval(this.goldenId); this.goldenId = null; }
    this.running = false;
  }

  getState() {
    return {
      turn: this.turn, mana: this.mana,
      gridSize: this.getGridCards().length,
      inventorySize: this.inventory.length,
      forgeCount: this.forgeCount,
      grid: this.getGridCards(),
      inventory: this.inventory.slice(-10),
      forgeHistory: this.forgeHistory.slice(-5),
      emergentEvents: this.emergentEvents.slice(-3)
    };
  }
}

if (typeof module !== 'undefined') module.exports = HephaestusForge;
