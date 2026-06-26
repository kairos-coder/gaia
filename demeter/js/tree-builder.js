// ═══════════════════════════════════════
// TREE BUILDER · Demeter's Grove
// gaia/demeter/js/tree-builder.js
//
// Composes GaiaMason primitives into trees.
// Uses buildPillar, buildWall(circle), buildLight,
// spawnAmbientFall, and buildFloor. No monkey-patching.
//
// v1.0 — Oak, Cypress, Olive, Dead
// ═══════════════════════════════════════

class TreeBuilder {

    // ═══════════════════════════════════
    // TREE MATERIAL PRESETS
    // Passed directly to GaiaMason methods.
    // Not added to GaiaMason.MATERIALS — just
    // plain objects the methods already accept.
    // ═══════════════════════════════════

    static BARK = {
        oak_ancient: {
            chars: ['▓','▒','░','█','▓'],
            textColor: '#3d2b1a',
            mortarColor: '#2a1a0f',
            fontSize: 24,
            lineHeight: 0.52,
            letterSpacing: -2,
            fontFamily: 'monospace',
        },
        cypress_tall: {
            chars: ['╎','╎','╎','╎','╎'],
            textColor: '#2a3020',
            mortarColor: '#1a2010',
            fontSize: 20,
            lineHeight: 0.48,
            letterSpacing: -1,
            fontFamily: 'monospace',
        },
        olive_silver: {
            chars: ['~','≈','~','≈','~'],
            textColor: '#6a7a5a',
            mortarColor: '#4a5a3a',
            fontSize: 22,
            lineHeight: 0.5,
            letterSpacing: -1,
            fontFamily: "'Georgia',serif",
        },
        birch_pale: {
            chars: ['╎','╎','╎','╎','╎'],
            textColor: '#c8c0b0',
            mortarColor: '#a8a090',
            fontSize: 20,
            lineHeight: 0.5,
            letterSpacing: -1,
            fontFamily: 'monospace',
        },
        dead_grey: {
            chars: ['▓','▒','░',' ',' '],
            textColor: '#4a4540',
            mortarColor: '#2a2520',
            fontSize: 22,
            lineHeight: 0.54,
            letterSpacing: -2,
            fontFamily: 'monospace',
        },
    };

    static FOLIAGE = {
        oak_green: {
            chars: ['●','○','●','○','●'],
            textColor: '#4a6a2a',
            mortarColor: '#3a5a1a',
            fontSize: 16,
            lineHeight: 0.45,
            letterSpacing: 0,
            fontFamily: "'Georgia',serif",
        },
        cypress_dark: {
            chars: ['▲','△','▲','△','▲'],
            textColor: '#2a4020',
            mortarColor: '#1a3010',
            fontSize: 14,
            lineHeight: 0.42,
            letterSpacing: 0,
            fontFamily: "'Georgia',serif",
        },
        olive_dust: {
            chars: ['·','⋅','·','⋅','·'],
            textColor: '#6a7a4a',
            mortarColor: '#5a6a3a',
            fontSize: 12,
            lineHeight: 0.5,
            letterSpacing: 2,
            fontFamily: "'Georgia',serif",
        },
        birch_light: {
            chars: ['◇','◈','◇','◈','◇'],
            textColor: '#b8c8a0',
            mortarColor: '#a0b088',
            fontSize: 13,
            lineHeight: 0.5,
            letterSpacing: 1,
            fontFamily: "'Georgia',serif",
        },
        dead_bare: {
            chars: [' ','·',' ','·',' '],
            textColor: '#3a3530',
            mortarColor: 'transparent',
            fontSize: 10,
            lineHeight: 0.5,
            letterSpacing: 4,
            fontFamily: 'monospace',
        },
        autumn_fire: {
            chars: ['●','○','●','○','●'],
            textColor: '#cc6622',
            mortarColor: '#aa4411',
            fontSize: 15,
            lineHeight: 0.45,
            letterSpacing: 0,
            fontFamily: "'Georgia',serif",
        },
    };

    // ═══════════════════════════════════
    // TREE TYPE REGISTRY
    // ═══════════════════════════════════

    static TYPES = {
        oak: {
            label: 'Ancient Oak',
            bark: 'oak_ancient',
            foliage: 'oak_green',
            trunkWidth: 28,
            trunkHeight: 180,
            canopyLayers: [
                { radius: 70, yOffset: -30 },
                { radius: 55, yOffset: 10 },
                { radius: 40, yOffset: 40 },
            ],
            dappleColor: '#88aa44',
            leafFallColor: 'rgba(120,180,60,0.25)',
            hasHollow: true,
            hasRoots: true,
        },
        cypress: {
            label: 'Tall Cypress',
            bark: 'cypress_tall',
            foliage: 'cypress_dark',
            trunkWidth: 16,
            trunkHeight: 220,
            canopyLayers: [
                { radius: 32, yOffset: 0 },
                { radius: 24, yOffset: 30 },
            ],
            dappleColor: '#446622',
            leafFallColor: 'rgba(60,100,30,0.15)',
            hasHollow: false,
            hasRoots: false,
        },
        olive: {
            label: 'Silver Olive',
            bark: 'olive_silver',
            foliage: 'olive_dust',
            trunkWidth: 24,
            trunkHeight: 140,
            canopyLayers: [
                { radius: 55, yOffset: -10 },
                { radius: 45, yOffset: 20 },
                { radius: 35, yOffset: 45 },
                { radius: 22, yOffset: 65 },
            ],
            dappleColor: '#aabb88',
            leafFallColor: 'rgba(160,180,100,0.2)',
            hasHollow: true,
            hasRoots: true,
        },
        birch: {
            label: 'White Birch',
            bark: 'birch_pale',
            foliage: 'birch_light',
            trunkWidth: 18,
            trunkHeight: 200,
            canopyLayers: [
                { radius: 40, yOffset: -20 },
                { radius: 30, yOffset: 15 },
            ],
            dappleColor: '#dde8cc',
            leafFallColor: 'rgba(200,220,160,0.2)',
            hasHollow: false,
            hasRoots: false,
        },
        dead: {
            label: 'Dead Standing',
            bark: 'dead_grey',
            foliage: 'dead_bare',
            trunkWidth: 20,
            trunkHeight: 160,
            canopyLayers: [
                { radius: 25, yOffset: 10 },
            ],
            dappleColor: '#3a3530',
            leafFallColor: 'rgba(80,70,60,0.08)',
            hasHollow: true,
            hasRoots: true,
        },
        autumn: {
            label: 'Autumn Fire',
            bark: 'oak_ancient',
            foliage: 'autumn_fire',
            trunkWidth: 26,
            trunkHeight: 170,
            canopyLayers: [
                { radius: 60, yOffset: -20 },
                { radius: 48, yOffset: 15 },
                { radius: 32, yOffset: 42 },
            ],
            dappleColor: '#ddaa44',
            leafFallColor: 'rgba(220,140,40,0.3)',
            hasHollow: true,
            hasRoots: true,
        },
    };

    // ═══════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════

    /**
     * @param {GaiaMason} mason - existing GaiaMason instance
     * @param {Object} options
     * @param {string} [options.defaultType='oak']
     */
    constructor(mason, options = {}) {
        if (!mason || !(mason instanceof GaiaMason)) {
            throw new Error('TreeBuilder requires a GaiaMason instance');
        }
        this.mason = mason;
        this.defaultType = options.defaultType || 'oak';
        this.trees = [];
    }

    // ═══════════════════════════════════
    // BUILD A SINGLE TREE
    // ═══════════════════════════════════

    /**
     * Build a tree at the given position.
     * @param {Object} config
     * @param {number} config.x - center X of trunk base
     * @param {number} config.y - top of trunk
     * @param {string} [config.type='oak'] - tree type key
     * @param {string} [config.id] - optional DOM id
     * @param {number} [config.z=15] - base z-index
     * @param {boolean} [config.dapple=true] - add pulsing under-light
     * @param {boolean} [config.leafFall=true] - add ambient leaf particles
     * @param {boolean} [config.hollow] - override hasHollow from type
     * @param {boolean} [config.roots] - override hasRoots from type
     * @returns {Object} tree record { type, config, elements }
     */
    buildTree(config = {}) {
        const {
            x = 300,
            y = 200,
            type = this.defaultType,
            id = null,
            z = 15,
            dapple = true,
            leafFall = true,
            hollow = null,
            roots = null,
        } = config;

        const def = TreeBuilder.TYPES[type];
        if (!def) throw new Error(`TreeBuilder: unknown tree type "${type}"`);

        const bark = TreeBuilder.BARK[def.bark] || TreeBuilder.BARK.oak_ancient;
        const foliage = TreeBuilder.FOLIAGE[def.foliage] || TreeBuilder.FOLIAGE.oak_green;
        const doHollow = hollow !== null ? hollow : def.hasHollow;
        const doRoots = roots !== null ? roots : def.hasRoots;

        const elements = [];
        const trunkCenterX = x;
        const trunkTopY = y;
        const trunkBottomY = y + def.trunkHeight;
        const trunkHalfW = def.trunkWidth / 2;

        // ── ROOTS (below trunk) ──
        if (doRoots) {
            const rootFloor = this.mason.buildFloor({
                ...bark,
                x: x - def.trunkWidth * 1.6,
                y: trunkBottomY - 8,
                width: def.trunkWidth * 3.2,
                height: 22,
                z: z - 1,
                perspectiveStrength: 2,
                glyphCarving: {
                    text: def.label.toUpperCase(),
                    x: 4,
                    y: 4,
                    size: 7,
                    color: 'rgba(180,160,80,0.08)',
                    spacing: 10,
                },
            });
            elements.push({ role: 'roots', el: rootFloor });
        }

        // ── TRUNK ──
        const trunk = this.mason.buildPillar({
            ...bark,
            x: x - trunkHalfW,
            y: trunkTopY,
            width: def.trunkWidth,
            height: def.trunkHeight,
            z,
            capital: false,
        });
        if (id) trunk.id = id;
        elements.push({ role: 'trunk', el: trunk });

        // ── HOLLOW ──
        if (doHollow) {
            const hollowWall = this.mason.buildWall({
                ...bark,
                x: x - trunkHalfW,
                y: trunkTopY,
                width: def.trunkWidth,
                height: def.trunkHeight,
                z: z + 1,
                opening: {
                    x: def.trunkWidth * 0.15,
                    y: def.trunkHeight * 0.6,
                    width: def.trunkWidth * 0.7,
                    height: def.trunkHeight * 0.3,
                    arch: true,
                },
            });
            elements.push({ role: 'hollow', el: hollowWall });
        }

        // ── CANOPY LAYERS ──
        const canopyEls = [];
        for (const layer of def.canopyLayers) {
            const radius = layer.radius;
            const layerY = trunkTopY + layer.yOffset;
            const canopy = this.mason.buildWall({
                ...foliage,
                x: x - radius,
                y: layerY - radius,
                width: radius * 2,
                height: radius * 2,
                z: z + 3,
                shape: 'circle',
                weathering: 0.15,
            });
            canopy.style.opacity = '0.72';
            canopyEls.push(canopy);
        }
        elements.push({ role: 'canopy', el: canopyEls });

        // ── DAPPLED LIGHT ──
        if (dapple) {
            const light = this.mason.buildLight({
                color: def.dappleColor,
                radius: def.canopyLayers[0].radius * 1.8,
                x: x,
                y: trunkBottomY + 10,
                pulse: true,
                z: z - 2,
            });
            elements.push({ role: 'dapple', el: light });
        }

        // ── LEAF FALL ──
        if (leafFall && def.leafFallColor) {
            const particles = this.mason.spawnAmbientFall({
                count: 12,
                color: def.leafFallColor,
                minSize: 1.5,
                maxSize: 3.5,
                speedMin: 6,
                speedMax: 14,
                z: z + 5,
            });
            elements.push({ role: 'leafFall', el: particles });
        }

        // ── Store reference ──
        const treeRecord = { type, config, elements, def };
        this.trees.push(treeRecord);

        // ── Artifact attribute on trunk for hare detection ──
        trunk.setAttribute('data-tree', type);
        trunk.setAttribute('data-tree-label', def.label);
        if (doHollow) {
            trunk.setAttribute('data-tree-hollow', 'true');
        }

        return treeRecord;
    }

    // ═══════════════════════════════════
    // BUILD A GROVE
    // ═══════════════════════════════════

    /**
     * Place multiple trees at once.
     * @param {Array} treeConfigs - array of config objects for buildTree()
     * @returns {Array} array of tree records
     */
    buildGrove(treeConfigs = []) {
        return treeConfigs.map(cfg => this.buildTree(cfg));
    }

    // ═══════════════════════════════════
    // REMOVE A TREE
    // ═══════════════════════════════════

    removeTree(treeRecord) {
        if (!treeRecord) return;
        for (const { el } of treeRecord.elements) {
            if (Array.isArray(el)) {
                el.forEach(e => e.remove());
            } else if (el && el.remove) {
                el.remove();
            }
        }
        this.trees = this.trees.filter(t => t !== treeRecord);
    }

    // ═══════════════════════════════════
    // CLEAR ALL TREES
    // ═══════════════════════════════════

    clear() {
        [...this.trees].forEach(t => this.removeTree(t));
        this.trees = [];
    }
}

// ═══════════════════════════════════
// EXPORT
// ═══════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TreeBuilder;
}
