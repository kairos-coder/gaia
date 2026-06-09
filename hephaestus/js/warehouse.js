// ══════════════════════════════════════════════
// HEPHAESTUS WAREHOUSE — Active Inventory Layer
// Stores materials and forged items.
// Ships to Hermes, supplies Ares, feeds Athena's analysis.
// ══════════════════════════════════════════════

class HephaestusWarehouse {
  constructor() {
    this.inventory = {
      materials: {},   // { "fire_T2": 5, "earth_T1": 12 }
      items: {}        // { "Flame Blade": 2, "Aegis Shield": 1 }
    };
    
    this.history = [];
    this.totalStored = 0;
    this.totalShipped = 0;
  }

  // ══ Storage ══
  addMaterial(material) {
    const key = `${material.element}_T${material.tier}`;
    if (!this.inventory.materials[key]) this.inventory.materials[key] = 0;
    this.inventory.materials[key]++;
    this.totalStored++;
    this.history.push({ action: 'store_material', key, name: material.name, timestamp: Date.now() });
    return this.inventory.materials[key];
  }

  addItem(item) {
    const key = item.name;
    if (!this.inventory.items[key]) this.inventory.items[key] = 0;
    this.inventory.items[key]++;
    this.totalStored++;
    this.history.push({ action: 'store_item', key: item.name, tier: item.tier, timestamp: Date.now() });
    return this.inventory.items[key];
  }

  // ══ Removal ══
  removeMaterial(element, tier, qty = 1) {
    const key = `${element}_T${tier}`;
    if (!this.inventory.materials[key] || this.inventory.materials[key] < qty) return false;
    this.inventory.materials[key] -= qty;
    if (this.inventory.materials[key] <= 0) delete this.inventory.materials[key];
    this.totalShipped += qty;
    this.history.push({ action: 'remove_material', key, qty, timestamp: Date.now() });
    return true;
  }

  removeItem(name, qty = 1) {
    if (!this.inventory.items[name] || this.inventory.items[name] < qty) return false;
    this.inventory.items[name] -= qty;
    if (this.inventory.items[name] <= 0) delete this.inventory.items[name];
    this.totalShipped += qty;
    this.history.push({ action: 'remove_item', key: name, qty, timestamp: Date.now() });
    return true;
  }

  // ══ Queries ══
  getMaterialCount(element, tier) {
    return this.inventory.materials[`${element}_T${tier}`] || 0;
  }

  getItemCount(name) {
    return this.inventory.items[name] || 0;
  }

  getInventory() {
    return {
      materials: { ...this.inventory.materials },
      items: { ...this.inventory.items }
    };
  }

  getSummary() {
    const matCount = Object.values(this.inventory.materials).reduce((a, b) => a + b, 0);
    const itemCount = Object.values(this.inventory.items).reduce((a, b) => a + b, 0);
    return {
      totalMaterials: matCount,
      totalItems: itemCount,
      uniqueMaterials: Object.keys(this.inventory.materials).length,
      uniqueItems: Object.keys(this.inventory.items).length,
      totalStored: this.totalStored,
      totalShipped: this.totalShipped
    };
  }

  getHistory(limit = 20) {
    return this.history.slice(-limit);
  }
}
