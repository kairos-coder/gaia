// ═══════════════════════════════════════
// ARISTAEUS · The Strategist
// gaia/demeter/js/aristaeus.js
//
// Son of Apollo and Cyrene.
// God of beekeeping, animal husbandry,
// rural craft. He does not build.
// He directs the builders.
//
// Calls in order:
//   1. FieldBuilder  — ground layer
//   2. FarmBuilder   — structures
//   3. HiveBuilder   — hives + bees
//   4. HareBuilder   — animals
//
// Then exports the composed scene as HTML.
//
// v1.0
// ═══════════════════════════════════════

class Aristaeus {

    // ═══════════════════════════════════
    // SCENE PRESETS
    // Named configurations Aristaeus knows
    // ═══════════════════════════════════

    static PRESETS = {
        spring_morning: {
            label: 'Spring Morning',
            field:  { season: 'spring', time: 'dawn',  templeVisible: true  },
            farm:   { layout: 'scattered', structures: ['fence','hovel','well','stone_wall'], density: 0.9 },
            hive:   { count: 2, type: 'skep',  swarm: true,  swarmDensity: 0.8 },
            hares:  { count: 4, variant: 'meadow', types: ['real','grass','mythic','fantasy'] },
        },
        summer_day: {
            label: 'Summer Day',
            field:  { season: 'summer', time: 'day',   templeVisible: true  },
            farm:   { layout: 'row',     structures: ['fence','grain_store','hovel','threshing_floor'], density: 1.0 },
            hive:   { count: 4, type: ['skep','clay','log','skep'], swarm: true, swarmDensity: 1.2 },
            hares:  { count: 6, variant: 'meadow', types: null },
        },
        autumn_dusk: {
            label: 'Autumn Dusk',
            field:  { season: 'autumn', time: 'dusk',  templeVisible: true  },
            farm:   { layout: 'scattered', structures: ['grain_store','stone_wall','hovel','fence'], density: 0.8 },
            hive:   { count: 3, type: 'log',   swarm: true,  swarmDensity: 0.6 },
            hares:  { count: 3, variant: 'nervous', types: ['real','grass','psalter'] },
        },
        winter_night: {
            label: 'Winter Night',
            field:  { season: 'winter', time: 'night', templeVisible: false },
            farm:   { layout: 'ring',    structures: ['stone_wall','hovel','well','fence'], density: 0.7 },
            hive:   { count: 1, type: 'log',   swarm: false, swarmDensity: 0 },
            hares:  { count: 2, variant: 'dream', types: ['mythic','psalter'] },
        },
        chaos_field: {
            label: 'Chaos Field',
            field:  { season: 'summer', time: 'dusk',  templeVisible: true  },
            farm:   { layout: 'scattered', structures: ['fence','grain_store','hovel','stone_wall','well','threshing_floor'], density: 1.0 },
            hive:   { count: 5, type: ['skep','clay','log','skep','clay'], swarm: true, swarmDensity: 2.0 },
            hares:  { count: 11, variant: 'chaos', types: null },
        },
    };

    // ═══════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════

    constructor(sceneId) {
        this.sceneId = sceneId;
        this.scene = document.getElementById(sceneId);
        if (!this.scene) throw new Error(`Aristaeus: "#${sceneId}" not found`);

        this.fieldBuilder = null;
        this.farmBuilder  = null;
        this.hiveBuilder  = null;
        this.hareBuilder  = null;

        this.currentConfig = null;
        this.currentPreset = null;
        this._buildCount = 0;
    }

    // ═══════════════════════════════════
    // COMPOSE — main entry point
    // ═══════════════════════════════════

    compose(presetName = 'spring_morning', overrides = {}) {
        const preset = Aristaeus.PRESETS[presetName];
        if (!preset) throw new Error(`Aristaeus: unknown preset "${presetName}"`);

        // Merge overrides
        const config = {
            field: { ...preset.field,  ...(overrides.field  || {}) },
            farm:  { ...preset.farm,   ...(overrides.farm   || {}) },
            hive:  { ...preset.hive,   ...(overrides.hive   || {}) },
            hares: { ...preset.hares,  ...(overrides.hares  || {}) },
        };

        this.currentConfig = config;
        this.currentPreset = presetName;
        this._buildCount++;

        // Clear previous scene
        this._clear();

        // ── STEP 1: FIELD ──
        this.scene.insertAdjacentHTML('beforeend', '<div id="field-layer" style="position:absolute;inset:0;z-index:0;"></div>');
        this.fieldBuilder = new FieldBuilder('field-layer');
        this.fieldBuilder.build(config.field);

        // ── STEP 2: FARM ──
        this.scene.insertAdjacentHTML('beforeend', '<div id="farm-layer" style="position:absolute;inset:0;z-index:10;pointer-events:none;"></div>');
        // FarmBuilder shares the field mason for efficiency
        this.farmBuilder = new FarmBuilder('farm-layer', null);
        this.farmBuilder.build(config.farm);

        // ── STEP 3: HIVES ──
        this.scene.insertAdjacentHTML('beforeend', '<div id="hive-layer" style="position:absolute;inset:0;z-index:12;pointer-events:none;"></div>');
        this.hiveBuilder = new HiveBuilder('hive-layer', null);
        this.hiveBuilder.build(config.hive);

        // ── STEP 4: HARES ──
        this.scene.insertAdjacentHTML('beforeend', '<div id="hare-layer" style="position:absolute;inset:0;z-index:20;"></div>');
        this.hareBuilder = new HareBuilder('hare-layer', {
            imagePath: 'images/',
            variant: config.hares.variant || 'meadow',
            bounds: this.fieldBuilder.hareZone(),
        });
        this._spawnHares(config.hares);

        // Dispatch event for control panel
        this.scene.dispatchEvent(new CustomEvent('aristaeus-composed', {
            detail: { preset: presetName, config, buildCount: this._buildCount },
            bubbles: true,
        }));

        return this;
    }

    // ═══════════════════════════════════
    // SPAWN HARES
    // ═══════════════════════════════════

    _spawnHares(haresConfig) {
        const { count = 3, types = null, variant = 'meadow' } = haresConfig;
        const allTypes = Object.keys(HareBuilder.HARES);

        for (let i = 0; i < count; i++) {
            const type = types
                ? types[i % types.length]
                : allTypes[Math.floor(Math.random() * allTypes.length)];
            setTimeout(() => {
                this.hareBuilder.spawn({ type, variant });
            }, i * 250);
        }
    }

    // ═══════════════════════════════════
    // RANDOMIZE — generate a random config
    // ═══════════════════════════════════

    randomize() {
        const presets = Object.keys(Aristaeus.PRESETS);
        const pick = presets[Math.floor(Math.random() * presets.length)];
        return this.compose(pick);
    }

    // ═══════════════════════════════════
    // EXPORT — serialize scene to HTML string
    // ═══════════════════════════════════

    export(options = {}) {
        const {
            filename = `field${this._buildCount}.html`,
            includeConfig = true,
        } = options;

        const sceneHTML = this.scene.outerHTML;
        const config = this.currentConfig;
        const preset = this.currentPreset;

        const configComment = includeConfig ? `
<!--
    ARISTAEUS SCENE CONFIG
    Preset: ${preset}
    Season: ${config.field.season}
    Time: ${config.field.time}
    Hares: ${config.hares.count} × ${config.hares.variant}
    Hives: ${config.hive.count} × ${config.hive.type}
    Farm layout: ${config.farm.layout}
    Generated: ${new Date().toISOString()}
-->` : '';

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Field · Demeter's Realm · GAIA</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cinzel+Decorative&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0e06;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
        }
        #field-scene {
            position: relative;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
        }
    </style>
</head>
<body>
${configComment}
<div id="field-scene">
${sceneHTML}
</div>
<script src="../js/gaia-mason.js"></script>
<script src="js/field-builder.js"></script>
<script src="js/farm-builder.js"></script>
<script src="js/hive-builder.js"></script>
<script src="js/hare-builder.js"></script>
<script>
// Scene was generated by Aristaeus
// Preset: ${preset}
// To regenerate: open aristaeus.html
</script>
</body>
</html>`;

        return { html, filename };
    }

    // ═══════════════════════════════════
    // CLEAR
    // ═══════════════════════════════════

    _clear() {
        // Stop hive swarm if running
        if (this.hiveBuilder) this.hiveBuilder.stopSwarm();
        // Stop hares
        if (this.hareBuilder) this.hareBuilder.clear();
        // Clear scene layers
        ['field-layer','farm-layer','hive-layer','hare-layer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = Aristaeus;
