// ═══════════════════════════════════════
// HIVE BUILDER · Demeter's Realm
// gaia/demeter/js/hive-builder.js
//
// Bee hives and swarm particles.
// Aristaeus's original domain.
// Called third by Aristaeus.
//
// v1.0
// ═══════════════════════════════════════

class HiveBuilder {

    // ═══════════════════════════════════
    // HIVE TYPES
    // ═══════════════════════════════════

    static HIVE_TYPES = {
        skep: {
            label: 'Skep Hive',
            width: 44, height: 52,
            material: 'wheat_gold',
            roofMaterial: 'deep_stone',
            description: 'Traditional woven straw hive',
        },
        log: {
            label: 'Log Hive',
            width: 36, height: 60,
            material: 'deep_stone',
            roofMaterial: 'storm_grey',
            description: 'Hollowed log, oldest form',
        },
        clay: {
            label: 'Clay Hive',
            width: 40, height: 48,
            material: 'bronze_weathered',
            roofMaterial: 'wheat_gold',
            description: 'Fired clay vessel',
        },
    };

    // ═══════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════

    constructor(containerId, masonInstance) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`HiveBuilder: "#${containerId}" not found`);
        this.mason = masonInstance || new GaiaMason(containerId);
        this.hives = [];
        this._swarmInterval = null;
    }

    // ═══════════════════════════════════
    // BUILD FROM CONFIG
    // ═══════════════════════════════════

    build(config = {}) {
        const {
            count = 3,
            type = 'skep',
            swarm = true,
            swarmDensity = 1.0,
            placement = 'auto',   // auto | manual (pass positions array)
            positions = [],
        } = config;

        const w = this.container.offsetWidth || window.innerWidth;
        const h = this.container.offsetHeight || window.innerHeight;
        const groundTop = h * 0.56;

        const finalPositions = placement === 'manual' && positions.length
            ? positions
            : this._autoPlace(count, w, groundTop, h);

        finalPositions.forEach((pos, i) => {
            const hiveType = Array.isArray(type) ? type[i % type.length] : type;
            this._buildHive(pos.x, pos.y, hiveType);
        });

        if (swarm) {
            this._startSwarm(finalPositions, swarmDensity);
        }

        return this;
    }

    // ═══════════════════════════════════
    // AUTO PLACEMENT
    // ═══════════════════════════════════

    _autoPlace(count, w, groundTop, h) {
        const positions = [];
        // Right side of scene, near farm structures
        const startX = w * 0.6;
        const spacing = (w * 0.35) / Math.max(count, 1);

        for (let i = 0; i < count; i++) {
            positions.push({
                x: startX + spacing * i,
                y: groundTop + 20 + Math.random() * 40,
            });
        }
        return positions;
    }

    // ═══════════════════════════════════
    // BUILD SINGLE HIVE
    // ═══════════════════════════════════

    _buildHive(x, y, typeName = 'skep') {
        const def = HiveBuilder.HIVE_TYPES[typeName] || HiveBuilder.HIVE_TYPES.skep;

        // Base stand
        this.mason.buildPillar({
            ...GaiaMason.mat('deep_stone'),
            x: x + 8, y: y + def.height,
            width: def.width - 16, height: 12,
            z: 9, fontSize: 8,
        });

        // Hive body
        this.mason.buildWall({
            ...GaiaMason.mat(def.material),
            x, y: y + 12,
            width: def.width, height: def.height,
            z: 10,
            weathering: 0.08,
        });

        // Roof cap
        this.mason.buildWall({
            ...GaiaMason.mat(def.roofMaterial),
            x: x - 4, y,
            width: def.width + 8, height: 16,
            z: 11,
        });

        // Entry hole
        this.mason.buildWall({
            ...GaiaMason.mat('void_black'),
            x: x + Math.floor(def.width * 0.35), y: y + def.height - 10,
            width: 10, height: 8,
            z: 12,
        });

        // Amber glow
        this.mason.buildLight({
            color: '#d4a020',
            radius: 40,
            x: (x + def.width / 2) + 'px',
            y: (y + def.height / 2) + 'px',
            pulse: true,
            z: 8,
        });

        // Label
        this.mason.buildInscription({
            text: def.label.toUpperCase(),
            x: x + 2, y: y + def.height + 16,
            fontSize: 6,
            color: 'rgba(200,160,40,0.4)',
            z: 13,
        });

        const hive = { x, y, type: typeName, def };
        this.hives.push(hive);
        return hive;
    }

    // ═══════════════════════════════════
    // BEE SWARM PARTICLES
    // ═══════════════════════════════════

    _startSwarm(positions, density = 1.0) {
        const beeCount = Math.floor(positions.length * 6 * density);

        const spawnBees = () => {
            if (!document.body.contains(this.container)) {
                clearInterval(this._swarmInterval);
                return;
            }
            positions.forEach(pos => {
                const count = Math.floor(2 * density);
                this.mason.spawnParticles({
                    x: pos.x + 22,
                    y: pos.y + 20,
                    count,
                    color: '#d4a020',
                    minSize: 2, maxSize: 4,
                    riseDistance: 60 + Math.random() * 80,
                    spreadX: 80,
                    durationMin: 1.5,
                    durationMax: 3.0,
                    z: 15,
                    delayMax: 0.5,
                });
            });
        };

        // Initial burst
        spawnBees();

        // Continuous swarm
        this._swarmInterval = setInterval(spawnBees, 2200);
    }

    stopSwarm() {
        if (this._swarmInterval) {
            clearInterval(this._swarmInterval);
            this._swarmInterval = null;
        }
    }

    // ═══════════════════════════════════
    // HIVE ZONE — returns coords for reference
    // ═══════════════════════════════════

    hivePositions() {
        return this.hives.map(h => ({ x: h.x, y: h.y }));
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = HiveBuilder;
