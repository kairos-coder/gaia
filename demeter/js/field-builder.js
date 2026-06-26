// ═══════════════════════════════════════
// FIELD BUILDER · Demeter's Realm
// gaia/demeter/js/field-builder.js
//
// Ground layer for generated field scenes.
// Sky, terrain, horizon, light, particles.
// Called first by Aristaeus.
//
// v1.0
// ═══════════════════════════════════════

class FieldBuilder {

    // ═══════════════════════════════════
    // SEASON PALETTES
    // ═══════════════════════════════════

    static SEASONS = {
        spring: {
            label: 'Spring',
            sky: ['#1a2a0a', '#2a3a10', '#3a4a18', '#4a5a20', '#5a6a28'],
            ground: ['#2a3a10', '#3a4e18', '#4a5e20', '#3a4a14'],
            horizon: 'rgba(140,160,60,0.5)',
            light: '#88aa44',
            lightAlt: '#d4af37',
            particle: 'rgba(200,220,100,0.35)',
            particleCount: 22,
            particleSize: [1, 3],
            particleSpeed: [8, 18],
            inscription: 'THE EARTH WAKES',
        },
        summer: {
            label: 'Summer',
            sky: ['#0a1a0a', '#1a2a08', '#2a3a10', '#3a4a18', '#4a5a20'],
            ground: ['#1a2a08', '#2a3a10', '#3a4a18', '#2a3a0c'],
            horizon: 'rgba(160,180,40,0.6)',
            light: '#aacc22',
            lightAlt: '#e8c830',
            particle: 'rgba(220,240,80,0.25)',
            particleCount: 30,
            particleSize: [1, 2],
            particleSpeed: [6, 14],
            inscription: 'THE GRAIN HOLDS',
        },
        autumn: {
            label: 'Autumn',
            sky: ['#1a1408', '#2a1e0c', '#3a2a10', '#4a3618', '#5a4220'],
            ground: ['#3a2a10', '#4a3818', '#5a4820', '#3a2a0c'],
            horizon: 'rgba(180,140,60,0.5)',
            light: '#cc8833',
            lightAlt: '#d4af37',
            particle: 'rgba(220,160,60,0.3)',
            particleCount: 25,
            particleSize: [2, 5],
            particleSpeed: [10, 22],
            inscription: 'THE HARVEST TURNS',
        },
        winter: {
            label: 'Winter',
            sky: ['#080c14', '#0c1220', '#141a2a', '#1a2030', '#202838'],
            ground: ['#141a22', '#1a2030', '#20283a', '#181e28'],
            horizon: 'rgba(140,160,200,0.4)',
            light: '#4466aa',
            lightAlt: '#8899cc',
            particle: 'rgba(200,216,228,0.5)',
            particleCount: 35,
            particleSize: [1, 4],
            particleSpeed: [6, 16],
            inscription: 'THE EARTH SLEEPS',
        },
    };

    // ═══════════════════════════════════
    // TIME OF DAY
    // ═══════════════════════════════════

    static TIMES = {
        dawn: {
            label: 'Dawn',
            skyOverlay: 'linear-gradient(180deg, rgba(180,80,20,0.15) 0%, transparent 40%)',
            lightOpacity: 0.7,
            groundDark: 0.85,
        },
        day: {
            label: 'Day',
            skyOverlay: null,
            lightOpacity: 1,
            groundDark: 1,
        },
        dusk: {
            label: 'Dusk',
            skyOverlay: 'linear-gradient(180deg, rgba(200,100,20,0.2) 0%, rgba(180,60,10,0.1) 50%, transparent 80%)',
            lightOpacity: 0.8,
            groundDark: 0.9,
        },
        night: {
            label: 'Night',
            skyOverlay: 'linear-gradient(180deg, rgba(10,10,40,0.6) 0%, rgba(10,10,30,0.3) 60%, transparent 100%)',
            lightOpacity: 0.5,
            groundDark: 0.6,
        },
    };

    // ═══════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════

    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`FieldBuilder: "#${containerId}" not found`);
        this.mason = null;
        this.config = null;
    }

    // ═══════════════════════════════════
    // BUILD
    // ═══════════════════════════════════

    build(config = {}) {
        const {
            season = 'spring',
            time = 'day',
            templeVisible = true,
            seed = null,
        } = config;

        this.config = { season, time, templeVisible, seed };

        const s = FieldBuilder.SEASONS[season] || FieldBuilder.SEASONS.spring;
        const t = FieldBuilder.TIMES[time] || FieldBuilder.TIMES.day;

        // ── SKY ──
        const sky = document.createElement('div');
        sky.id = 'field-sky';
        sky.style.cssText = `
            position: absolute; inset: 0;
            background: linear-gradient(180deg,
                ${s.sky[0]} 0%,
                ${s.sky[1]} 25%,
                ${s.sky[2]} 50%,
                ${s.sky[3]} 72%,
                ${s.sky[4]} 100%
            );
            z-index: 0;
        `;
        this.container.appendChild(sky);

        // Time overlay
        if (t.skyOverlay) {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: absolute; inset: 0;
                background: ${t.skyOverlay};
                z-index: 1; pointer-events: none;
            `;
            this.container.appendChild(overlay);
        }

        // ── GROUND ──
        const ground = document.createElement('div');
        ground.id = 'field-ground';
        ground.style.cssText = `
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 45%;
            background: linear-gradient(180deg,
                ${s.ground[0]} 0%,
                ${s.ground[1]} 25%,
                ${s.ground[2]} 65%,
                ${s.ground[3]} 100%
            );
            z-index: 1;
            opacity: ${t.groundDark};
        `;
        this.container.appendChild(ground);

        // Grass texture
        const grassTex = document.createElement('div');
        grassTex.style.cssText = `
            position: absolute; inset: 0;
            background: repeating-linear-gradient(
                90deg,
                transparent 0px, transparent 8px,
                rgba(80,100,30,0.12) 8px, rgba(80,100,30,0.12) 9px
            );
            pointer-events: none;
        `;
        ground.appendChild(grassTex);

        // ── HORIZON ──
        const horizon = document.createElement('div');
        horizon.id = 'field-horizon';
        horizon.style.cssText = `
            position: absolute;
            bottom: 44.5%; left: 0; right: 0;
            height: 2px;
            background: linear-gradient(90deg,
                transparent,
                ${s.horizon} 20%,
                ${s.horizon.replace('0.5', '0.8').replace('0.6', '0.9')} 50%,
                ${s.horizon} 80%,
                transparent
            );
            z-index: 2;
        `;
        this.container.appendChild(horizon);

        // ── GAIA MASON LAYER ──
        const masonContainer = document.createElement('div');
        masonContainer.id = 'field-mason';
        masonContainer.style.cssText = `
            position: absolute; inset: 0;
            z-index: 3; pointer-events: none;
        `;
        this.container.appendChild(masonContainer);

        this.mason = new GaiaMason('field-mason');

        // Temple of Demeter
        if (templeVisible) {
            this._buildTemple(s, t);
        }

        // Ambient particles (pollen/snow/leaves)
        this.mason.spawnAmbientFall({
            count: s.particleCount,
            color: s.particle,
            minSize: s.particleSize[0],
            maxSize: s.particleSize[1],
            speedMin: s.particleSpeed[0],
            speedMax: s.particleSpeed[1],
            z: 5,
        });

        return this;
    }

    // ═══════════════════════════════════
    // TEMPLE
    // ═══════════════════════════════════

    _buildTemple(s, t) {
        const w = this.container.offsetWidth || window.innerWidth;
        const h = this.container.offsetHeight || window.innerHeight;
        const cx = Math.floor(w / 2);
        const ty = Math.floor(h * 0.16);

        // Main wall
        this.mason.buildWall({
            ...GaiaMason.mat('marble_veined'),
            x: cx - 180, y: ty,
            width: 360, height: 220,
            z: 2,
            openings: [
                { x: 60,  y: 20, width: 80, height: 160, arch: true },
                { x: 220, y: 20, width: 80, height: 160, arch: true },
            ],
        });

        // Pillars
        this.mason.buildPillar({ ...GaiaMason.mat('marble_white'), x: cx - 202, y: ty, width: 22, height: 200, z: 3, capital: true });
        this.mason.buildPillar({ ...GaiaMason.mat('marble_white'), x: cx - 172, y: ty, width: 18, height: 200, z: 3, capital: true });
        this.mason.buildPillar({ ...GaiaMason.mat('marble_white'), x: cx + 152, y: ty, width: 18, height: 200, z: 3, capital: true });
        this.mason.buildPillar({ ...GaiaMason.mat('marble_white'), x: cx + 174, y: ty, width: 22, height: 200, z: 3, capital: true });

        // Steps
        const stepsY = ty + 215;
        this.mason.buildFloor({
            ...GaiaMason.mat('marble_veined'),
            x: cx - 220, y: stepsY,
            width: 440, height: 40,
            z: 3,
            perspectiveStrength: 6,
            glyphCarving: {
                text: '𐤃 𐤀 𐤕 𐤔 𐤐 𐤌 𐤇',
                x: 60, y: 8,
                size: 14,
                color: 'rgba(180,160,80,0.12)',
                spacing: 22,
            },
        });

        this.mason.buildInscription({
            text: `ΔΗΜΗΤΗΡ · ${FieldBuilder.SEASONS[this.config.season].inscription}`,
            x: cx - 120, y: stepsY + 44,
            fontSize: 9,
            color: 'rgba(180,200,80,0.4)',
            z: 10,
        });

        // Light
        const opacity = t.lightOpacity;
        this.mason.buildLight({
            color: s.light,
            radius: 300,
            x: cx + 'px', y: (ty + 110) + 'px',
            pulse: true, z: 1,
        });
        this.mason.buildLight({
            color: s.lightAlt,
            radius: 130,
            x: cx + 'px', y: (ty + 60) + 'px',
            pulse: false, z: 1,
        });
    }

    // ═══════════════════════════════════
    // HARE ZONE — returns bounds for HareBuilder
    // ═══════════════════════════════════

    hareZone() {
        const w = this.container.offsetWidth || window.innerWidth;
        const h = this.container.offsetHeight || window.innerHeight;
        return {
            x: 20,
            y: 0,
            width: w - 40,
            height: h * 0.38,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = FieldBuilder;
