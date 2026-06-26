// ═══════════════════════════════════════
// FARM BUILDER · Demeter's Realm
// gaia/demeter/js/farm-builder.js
//
// Agricultural structures for field scenes.
// Fences, grain stores, hovels, stone walls.
// Called second by Aristaeus.
//
// v1.0
// ═══════════════════════════════════════

class FarmBuilder {

    // ═══════════════════════════════════
    // STRUCTURE REGISTRY
    // ═══════════════════════════════════

    static STRUCTURES = {
        fence: {
            label: 'Fence Line',
            build: (mason, x, y, opts = {}) => FarmBuilder._buildFence(mason, x, y, opts),
        },
        grain_store: {
            label: 'Grain Store',
            build: (mason, x, y, opts = {}) => FarmBuilder._buildGrainStore(mason, x, y, opts),
        },
        hovel: {
            label: 'Hare Hovel',
            build: (mason, x, y, opts = {}) => FarmBuilder._buildHovel(mason, x, y, opts),
        },
        stone_wall: {
            label: 'Stone Wall',
            build: (mason, x, y, opts = {}) => FarmBuilder._buildStoneWall(mason, x, y, opts),
        },
        well: {
            label: 'Field Well',
            build: (mason, x, y, opts = {}) => FarmBuilder._buildWell(mason, x, y, opts),
        },
        threshing_floor: {
            label: 'Threshing Floor',
            build: (mason, x, y, opts = {}) => FarmBuilder._buildThreshingFloor(mason, x, y, opts),
        },
    };

    // ═══════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════

    constructor(containerId, masonInstance) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`FarmBuilder: "#${containerId}" not found`);
        this.mason = masonInstance || new GaiaMason(containerId);
        this.structures = [];
    }

    // ═══════════════════════════════════
    // BUILD FROM CONFIG
    // Called by Aristaeus with a layout plan
    // ═══════════════════════════════════

    build(config = {}) {
        const {
            seed = null,
            layout = 'scattered',  // scattered | row | ring
            structures = ['fence', 'grain_store', 'hovel', 'stone_wall'],
            density = 1.0,
        } = config;

        const w = this.container.offsetWidth || window.innerWidth;
        const h = this.container.offsetHeight || window.innerHeight;

        // Ground zone — lower 45% of scene
        const groundTop = h * 0.55;
        const groundH   = h * 0.38;

        if (layout === 'scattered') {
            this._buildScattered(structures, w, groundTop, groundH, density);
        } else if (layout === 'row') {
            this._buildRow(structures, w, groundTop, groundH);
        } else if (layout === 'ring') {
            this._buildRing(structures, w, h, groundTop);
        }

        return this;
    }

    // ═══════════════════════════════════
    // LAYOUTS
    // ═══════════════════════════════════

    _buildScattered(types, w, groundTop, groundH, density) {
        const slots = Math.floor(types.length * density);
        const used = types.slice(0, slots);

        used.forEach((type, i) => {
            // Distribute left to right with some randomness
            const segment = w / used.length;
            const x = segment * i + segment * 0.1 + Math.random() * segment * 0.5;
            const y = groundTop + Math.random() * groundH * 0.5;
            this._place(type, x, y);
        });

        // Always add a fence line along the horizon
        this._place('fence', 20, groundTop - 10, { width: w - 40 });
    }

    _buildRow(types, w, groundTop, groundH) {
        const spacing = w / (types.length + 1);
        types.forEach((type, i) => {
            const x = spacing * (i + 1) - 60;
            const y = groundTop + groundH * 0.2;
            this._place(type, x, y);
        });
        this._place('fence', 20, groundTop - 10, { width: w - 40 });
    }

    _buildRing(types, w, h, groundTop) {
        const cx = w / 2;
        const cy = groundTop + 80;
        const r = Math.min(w, h) * 0.25;
        types.forEach((type, i) => {
            const angle = (i / types.length) * Math.PI; // semicircle on ground
            const x = cx + Math.cos(angle) * r - 60;
            const y = cy + Math.sin(angle) * r * 0.4;
            this._place(type, x, y);
        });
    }

    _place(type, x, y, opts = {}) {
        const def = FarmBuilder.STRUCTURES[type];
        if (!def) return;
        def.build(this.mason, x, y, opts);
        this.structures.push({ type, x, y });
    }

    // ═══════════════════════════════════
    // STRUCTURE BUILDERS
    // ═══════════════════════════════════

    static _buildFence(mason, x, y, opts = {}) {
        const width = opts.width || 200;
        const postCount = Math.floor(width / 40);

        // Rail
        mason.buildWall({
            ...GaiaMason.mat('deep_stone'),
            x, y: y + 8,
            width, height: 6,
            z: 8,
        });
        mason.buildWall({
            ...GaiaMason.mat('deep_stone'),
            x, y: y + 20,
            width, height: 5,
            z: 8,
        });

        // Posts
        for (let i = 0; i <= postCount; i++) {
            mason.buildPillar({
                ...GaiaMason.mat('deep_stone'),
                x: x + i * 40 - 3, y: y,
                width: 6, height: 32,
                z: 9,
                fontSize: 8,
            });
        }
    }

    static _buildGrainStore(mason, x, y, opts = {}) {
        // Base
        mason.buildWall({
            ...GaiaMason.mat('storm_grey'),
            x, y: y + 20,
            width: 90, height: 70,
            z: 8,
        });
        // Roof
        mason.buildWall({
            ...GaiaMason.mat('wheat_gold'),
            x: x - 8, y,
            width: 106, height: 28,
            z: 9,
        });
        // Door
        mason.buildWall({
            ...GaiaMason.mat('void_black'),
            x: x + 30, y: y + 55,
            width: 28, height: 35,
            z: 10,
        });
        // Label
        mason.buildInscription({
            text: 'GRAIN',
            x: x + 22, y: y + 92,
            fontSize: 7,
            color: 'rgba(180,160,80,0.4)',
            z: 11,
        });
    }

    static _buildHovel(mason, x, y, opts = {}) {
        // Low stone burrow structure for hares
        mason.buildWall({
            ...GaiaMason.mat('deep_stone'),
            x, y: y + 18,
            width: 60, height: 35,
            z: 8,
        });
        // Low roof
        mason.buildWall({
            ...GaiaMason.mat('storm_grey'),
            x: x - 5, y: y + 8,
            width: 70, height: 16,
            z: 9,
        });
        // Burrow mouth
        mason.buildWall({
            ...GaiaMason.mat('void_black'),
            x: x + 16, y: y + 28,
            width: 26, height: 22,
            z: 10,
            openings: [],
        });
        // Entrance arch
        mason.buildInscription({
            text: '⌒',
            x: x + 14, y: y + 22,
            fontSize: 22,
            color: 'rgba(80,60,40,0.8)',
            z: 11,
        });
        mason.buildInscription({
            text: 'HOVEL',
            x: x + 10, y: y + 53,
            fontSize: 6,
            color: 'rgba(140,120,80,0.35)',
            z: 11,
        });
    }

    static _buildStoneWall(mason, x, y, opts = {}) {
        const width = opts.width || 120;
        mason.buildWall({
            ...GaiaMason.mat('deep_stone'),
            x, y,
            width, height: 22,
            z: 7,
            weathering: 0.15,
        });
    }

    static _buildWell(mason, x, y, opts = {}) {
        // Well base (circle approximation)
        mason.buildWall({
            ...GaiaMason.mat('storm_grey'),
            x: x + 10, y: y + 20,
            width: 44, height: 30,
            z: 8,
            shape: 'circle',
        });
        // Well rim
        mason.buildWall({
            ...GaiaMason.mat('marble_white'),
            x: x + 5, y: y + 14,
            width: 54, height: 12,
            z: 9,
        });
        // Void inside
        mason.buildWall({
            ...GaiaMason.mat('void_black'),
            x: x + 18, y: y + 18,
            width: 28, height: 20,
            z: 10,
            shape: 'circle',
        });
        // Crossbar
        mason.buildPillar({
            ...GaiaMason.mat('deep_stone'),
            x: x + 28, y: y - 10,
            width: 4, height: 28,
            z: 10,
            fontSize: 8,
        });
        mason.buildInscription({
            text: '—',
            x: x + 12, y: y - 6,
            fontSize: 18,
            color: '#3d362f',
            z: 11,
        });
    }

    static _buildThreshingFloor(mason, x, y, opts = {}) {
        mason.buildFloor({
            ...GaiaMason.mat('wheat_gold'),
            x, y,
            width: 140, height: 30,
            z: 6,
            perspectiveStrength: 8,
        });
        mason.buildInscription({
            text: '✦ THRESHING FLOOR ✦',
            x: x + 10, y: y + 32,
            fontSize: 7,
            color: 'rgba(200,160,60,0.35)',
            z: 7,
        });
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = FarmBuilder;
