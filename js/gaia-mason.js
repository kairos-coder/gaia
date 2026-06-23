// ═══════════════════════════════════════
// GAIA MASON · Olympian Stonemason
// gaia/js/gaia-mason.js
//
// Fork of font-mason.js adapted for GAIA's visual language.
// Builds altars, temples, and ritual spaces from typography.
// Olympic palette. Divine materials. Sacred geometry.
// ═══════════════════════════════════════

class GaiaMason {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`GaiaMason: "#${containerId}" not found`);
        this.walls = [];
        this.arches = [];
        this.lights = [];
        this.particles = [];
    }

    // ═══════════════════════════════════
    // OLYMPIAN MATERIALS
    // ═══════════════════════════════════

    static MATERIALS = {
        // Stone
        marble_white:      { chars:['M','N','H','M','N'], textColor:'#d8d0c8', mortarColor:'#c0b8b0', fontSize:40, lineHeight:0.5, letterSpacing:-3, fontFamily:"'Cinzel','Georgia',serif" },
        marble_veined:     { chars:['M','N','H','M','N'], textColor:'#c8c0b8', mortarColor:'#b0a8a0', fontSize:40, lineHeight:0.5, letterSpacing:-3, fontFamily:"'Cinzel','Georgia',serif" },
        storm_grey:        { chars:['▓','▒','░','█','▓'], textColor:'#4a4550', mortarColor:'#2a2530', fontSize:38, lineHeight:0.52, letterSpacing:-2, fontFamily:'monospace' },
        
        // Metals
        gold_leaf:         { chars:['◆','◇','◆','◇','◆'], textColor:'#d4af37', mortarColor:'#b8860b', fontSize:22, lineHeight:0.5, letterSpacing:0, fontFamily:"'Georgia',serif" },
        bronze_weathered:  { chars:['▬','▬','▬','▬','▬'], textColor:'#6b8a5a', mortarColor:'#4a6b3a', fontSize:22, lineHeight:0.5, letterSpacing:-1, fontFamily:'monospace' },
        iron_dark:         { chars:['▬','▬','▬','▬','▬'], textColor:'#3d362f', mortarColor:'#2a2520', fontSize:20, lineHeight:0.5, letterSpacing:-1, fontFamily:'monospace' },
        quicksilver:       { chars:['~','≈','~','≈','~'], textColor:'#a8b8c8', mortarColor:'#8898a8', fontSize:24, lineHeight:0.5, letterSpacing:0, fontFamily:"'Georgia',serif" },
        silver_frost:      { chars:['◇','◈','◇','◈','◇'], textColor:'#c8d8e8', mortarColor:'#a0b0c0', fontSize:22, lineHeight:0.5, letterSpacing:0, fontFamily:"'Georgia',serif" },

        // Sacred
        rose_quartz:       { chars:['◆','◇','◆','◇','◆'], textColor:'#d8a0b8', mortarColor:'#b08098', fontSize:24, lineHeight:0.5, letterSpacing:0, fontFamily:"'Georgia',serif" },
        peacock_blue:      { chars:['◈','◇','◈','◇','◈'], textColor:'#4a8aaa', mortarColor:'#2a6a8a', fontSize:24, lineHeight:0.5, letterSpacing:0, fontFamily:"'Georgia',serif" },
        wheat_gold:        { chars:['╎','╎','╎','╎','╎'], textColor:'#c8a848', mortarColor:'#a88828', fontSize:20, lineHeight:0.5, letterSpacing:1, fontFamily:'monospace' },
        
        // Elements
        void_black:        { chars:[' '], textColor:'#0a0806', mortarColor:'#0a0806', fontSize:10, lineHeight:0.5, letterSpacing:0, fontFamily:'monospace' },
        flame_gold:        { chars:['●','○','●','○','●'], textColor:'#ffcc44', mortarColor:'#daa520', fontSize:18, lineHeight:0.45, letterSpacing:0, fontFamily:"'Georgia',serif" },
        flame_orange:      { chars:['●','○','●','○','●'], textColor:'#ff6b2b', mortarColor:'#c44f1c', fontSize:18, lineHeight:0.4, letterSpacing:-1, fontFamily:'monospace' },
        water_pontus:      { chars:['~','≈','≋','~','≈'], textColor:'#3a6b8c', mortarColor:'#2a4a6a', fontSize:28, lineHeight:0.5, letterSpacing:0, fontFamily:"'Georgia',serif" },
        cloud_olympus:     { chars:['⌒','⌣','~','⋅','⌒'], textColor:'#c8c8d8', mortarColor:'#a0a0b0', fontSize:18, lineHeight:0.6, letterSpacing:2, fontFamily:"'Georgia',serif" },
        starfield_void:    { chars:['·','✦','·','✧','·'], textColor:'#8899bb', mortarColor:'#1a1a2a', fontSize:14, lineHeight:0.7, letterSpacing:4, fontFamily:"'Georgia',serif" },
    };

    static mat(name) {
        return { ...GaiaMason.MATERIALS[name] || GaiaMason.MATERIALS['marble_white'] };
    }

    // ═══════════════════════════════════
    // ALTAR RING BUILDER
    // ═══════════════════════════════════

    buildAltarRing(config = {}) {
        const {
            centerX = 430, centerY = 300,
            radius = 220,
            altars = [],
            hearthSize = 60,
        } = config;

        const count = altars.length;
        if (count === 0) return;

        altars.forEach((altar, i) => {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            const ax = centerX + Math.cos(angle) * radius - 50;
            const ay = centerY + Math.sin(angle) * radius - 60;

            // Altar base
            this.buildWall({
                ...GaiaMason.mat(altar.material || 'marble_white'),
                x: ax, y: ay + 40,
                width: 100, height: 70,
                z: 10,
                id: `altar-${altar.god}`,
            });

            // Altar top
            this.buildWall({
                ...GaiaMason.mat(altar.material || 'marble_white'),
                x: ax - 5, y: ay + 30,
                width: 110, height: 15,
                z: 11,
            });

            // God glyph
            this.buildInscription({
                text: altar.glyph || '✦',
                x: ax + 35, y: ay + 50,
                fontSize: 28,
                color: altar.glowColor || '#d4af37',
                fontFamily: "'Georgia',serif",
                z: 12,
            });

            // God name
            this.buildInscription({
                text: altar.name || altar.god,
                x: ax + 10, y: ay + 15,
                fontSize: 9,
                color: 'rgba(200,180,150,0.6)',
                fontFamily: "'Cinzel',serif",
                z: 12,
            });

            // Click zone for the altar
            if (altar.interaction) {
                const zone = document.createElement('div');
                zone.className = 'altar-zone';
                zone.title = altar.interaction.label || `Approach the Altar of ${altar.name}`;
                zone.style.cssText = `
                    position: absolute;
                    left: ${ax - 10}px; top: ${ay + 20}px;
                    width: 120px; height: 100px;
                    z-index: 30; cursor: pointer;
                `;
                zone.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof altar.interaction.action === 'function') {
        altar.interaction.action(altar);
    }
    // Always dispatch the custom event — the scene loader handles string actions
    zone.dispatchEvent(new CustomEvent('altar-interact', {
        detail: { god: altar.god, altar },
        bubbles: true,
    }));
});
                this.container.appendChild(zone);
            }
        });

        // Central hearth
        this.buildCentralHearth(centerX, centerY, hearthSize);
    }

    // ═══════════════════════════════════
    // CENTRAL HEARTH
    // ═══════════════════════════════════

    buildCentralHearth(cx, cy, size) {
        // Hearth ring
        this.buildWall({
            ...GaiaMason.mat('marble_white'),
            x: cx - size / 2 - 10, y: cy - size / 2 - 10,
            width: size + 20, height: size + 20,
            z: 8,
        });

        // Fire pit
        this.buildWall({
            ...GaiaMason.mat('iron_dark'),
            x: cx - size / 2 + 5, y: cy - size / 2 + 5,
            width: size - 10, height: size - 10,
            z: 9,
        });

        // Flame (state-bound — placeholder, replaced by animation overlay)
        this.buildWall({
            ...GaiaMason.mat('flame_gold'),
            x: cx - size / 4, y: cy - size / 3,
            width: size / 2, height: size / 2,
            z: 10,
        });

        // Hearth inscription
        this.buildInscription({
            text: 'THE FIRE HOLDS',
            x: cx - 60, y: cy + size / 2 + 15,
            fontSize: 8,
            color: 'rgba(212,175,55,0.5)',
            fontFamily: "'Cinzel',serif",
            z: 11,
        });

        return { cx, cy, size };
    }

    // ═══════════════════════════════════
    // OFFERING BOWL
    // ═══════════════════════════════════

    buildOfferingBowl(config = {}) {
        const { x = 200, y = 300, z = 15, material = 'gold_leaf' } = config;
        const mat = GaiaMason.mat(material);

        // Bowl base
        this.buildPillar({
            ...mat,
            x: x + 20, y: y + 25,
            width: 20, height: 35,
            z,
            fontSize: 12,
        });

        // Bowl
        this.buildWall({
            ...mat,
            x: x + 5, y: y,
            width: 50, height: 30,
            z: z + 1,
        });

        // Inner darkness
        this.buildWall({
            ...GaiaMason.mat('void_black'),
            x: x + 12, y: y + 5,
            width: 36, height: 20,
            z: z + 2,
        });
    }

    // ═══════════════════════════════════
    // WALL
    // ═══════════════════════════════════

    buildWall(config = {}) {
        const {
            x = 0, y = 0, width = 400, height = 300, z = 1,
            chars = ['M','N','H','M','N'],
            textColor = '#d8d0c8',
            mortarColor = '#c0b8b0',
            fontSize = 40,
            lineHeight = 0.5,
            letterSpacing = -3,
            fontFamily = "'Cinzel','Georgia',serif",
            highlightColor = 'rgba(255,255,255,0.04)',
            shadowColor = 'rgba(0,0,0,0.2)',
            perspective = null,
            weathering = 0.05,
            opening = null,
            className = '',
            id = null,
            shape = null,
        } = config;

        const el = document.createElement('div');
        el.className = 'gaia-wall ' + className;
        if (id) el.id = id;

        const charW = fontSize * 0.58;
        const perRow = Math.ceil(width / (charW + letterSpacing)) + 2;
        const rowH = fontSize * lineHeight;
        const rows = Math.ceil(height / rowH) + 1;

        let text = '';
        const wearChars = ['░','▒',' ','·'];
        for (let r = 0; r < rows; r++) {
            const off = Math.floor(r * 0.6) % chars.length;
            for (let c = 0; c < perRow; c++) {
                if (weathering > 0 && Math.random() < weathering * 0.08) {
                    text += wearChars[Math.floor(Math.random() * wearChars.length)];
                } else {
                    text += chars[(c + off) % chars.length];
                }
            }
            text += '\n';
        }

        el.textContent = text;

        Object.assign(el.style, {
            position: 'absolute',
            left: x + 'px', top: y + 'px',
            width: width + 'px', height: height + 'px',
            zIndex: z,
            fontFamily, fontSize: fontSize + 'px',
            lineHeight, letterSpacing: letterSpacing + 'px',
            color: textColor, background: mortarColor,
            textShadow: `1px 1px 0 ${highlightColor}, -1px -1px 0 ${shadowColor}`,
            wordBreak: 'break-all', overflow: 'hidden',
            userSelect: 'none', whiteSpace: 'pre-line',
        });

        if (shape === 'circle') {
            el.style.borderRadius = '50%';
            el.style.overflow = 'hidden';
        }

        if (perspective === 'recede-left') {
            el.style.transform = 'perspective(800px) rotateY(12deg)';
            el.style.transformOrigin = 'right center';
        } else if (perspective === 'recede-right') {
            el.style.transform = 'perspective(800px) rotateY(-12deg)';
            el.style.transformOrigin = 'left center';
        }

        if (opening) {
            const cutout = document.createElement('div');
            cutout.className = 'wall-opening';
            const rad = opening.arch ? opening.width / 2 : 0;
            Object.assign(cutout.style, {
                position: 'absolute',
                left: opening.x + 'px', top: opening.y + 'px',
                width: opening.width + 'px', height: opening.height + 'px',
                background: '#0a0806',
                borderRadius: opening.arch ? `${rad}px ${rad}px 0 0` : '2px',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.7)',
                pointerEvents: 'none',
                zIndex: 2,
            });
            el.appendChild(cutout);
        }

        this.container.appendChild(el);
        this.walls.push({ el, config });
        return el;
    }

    // ═══════════════════════════════════
    // ARCH
    // ═══════════════════════════════════

    buildArch(config = {}) {
        const {
            cx = 400, cy = 150, innerRadius = 100,
            stoneCount = 17, stoneDepth = 24, z = 5,
            chars = ['H','N','M','W'],
            textColor = '#d4af37',
            fontSize = 27,
            fontFamily = "'Cinzel','Georgia',serif",
            highlightColor = 'rgba(255,255,255,0.04)',
            shadowColor = 'rgba(0,0,0,0.2)',
            keystoneOversize = 1.5,
            keystoneChar = 'M',
            fullCircle = false,
        } = config;

        const group = document.createElement('div');
        group.className = 'gaia-arch';
        Object.assign(group.style, {
            position: 'absolute', left: '0', top: '0',
            width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: z,
        });

        const span = fullCircle ? Math.PI * 2 : Math.PI;
        const start = fullCircle ? 0 : Math.PI;
        const count = fullCircle ? stoneCount * 2 : stoneCount;

        for (let i = 0; i < count; i++) {
            const angle = start + (span / (count - 1)) * i;
            const keystone = !fullCircle && (i === Math.floor(count / 2));
            const depth = keystone ? stoneDepth * keystoneOversize : stoneDepth;
            const sx = cx + Math.cos(angle) * innerRadius;
            const sy = cy - Math.sin(angle) * innerRadius;
            const arcLen = (span / count) * innerRadius;
            const sw = Math.max(6, arcLen * 0.75);

            const stone = document.createElement('div');
            stone.className = 'arch-stone' + (keystone ? ' keystone' : '');
            stone.textContent = keystone ? keystoneChar : chars[i % chars.length];

            Object.assign(stone.style, {
                position: 'absolute',
                left: (sx - sw / 2) + 'px', top: (sy - depth / 2) + 'px',
                width: sw + 'px', height: depth + 'px',
                fontFamily, fontSize: fontSize + 'px',
                color: textColor, textAlign: 'center',
                lineHeight: depth + 'px',
                textShadow: `1px 1px 0 ${highlightColor}, -1px -1px 0 ${shadowColor}`,
                transform: `rotate(${(angle - Math.PI / 2) * (180 / Math.PI)}deg)`,
                transformOrigin: 'center center',
                userSelect: 'none',
            });

            group.appendChild(stone);
        }

        this.container.appendChild(group);
        this.arches.push({ el: group, config });
        return group;
    }

    // ═══════════════════════════════════
    // PILLAR
    // ═══════════════════════════════════

    buildPillar(config = {}) {
        const {
            x = 200, y = 100, width = 30, height = 120, z = 2,
            chars = ['H','H','H'],
            textColor = '#d8d0c8',
            mortarColor = '#c0b8b0',
            fontSize = 20,
            lineHeight = 0.55,
            fontFamily = "'Cinzel','Georgia',serif",
            capital = false,
            capitalHeight = 26,
        } = config;

        const el = document.createElement('div');
        el.className = 'gaia-pillar';

        const rowH = fontSize * lineHeight;
        const rows = Math.ceil(height / rowH);
        let text = '';
        for (let r = 0; r < rows; r++) text += chars.join('') + '\n';

        el.textContent = text;

        Object.assign(el.style, {
            position: 'absolute',
            left: x + 'px', top: y + 'px',
            width: width + 'px', height: height + 'px',
            zIndex: z,
            fontFamily, fontSize: fontSize + 'px',
            lineHeight, letterSpacing: '-2px',
            color: textColor, background: mortarColor,
            textShadow: '1px 1px 0 rgba(255,255,255,0.03), -1px -1px 0 rgba(0,0,0,0.12)',
            textAlign: 'center', overflow: 'hidden',
            userSelect: 'none', whiteSpace: 'pre-line',
            borderRadius: '3px',
        });

        this.container.appendChild(el);

        if (capital) {
            const cap = document.createElement('div');
            cap.textContent = chars[0] + '  ' + chars[0];
            Object.assign(cap.style, {
                position: 'absolute',
                left: (x - 8) + 'px', top: (y - capitalHeight) + 'px',
                width: (width + 16) + 'px', height: capitalHeight + 'px',
                fontFamily, fontSize: (fontSize * 1.2) + 'px',
                color: '#e8d8c8', textAlign: 'center',
                lineHeight: capitalHeight + 'px',
                zIndex: z + 1,
                textShadow: '1px 1px 0 rgba(255,255,255,0.04)',
                userSelect: 'none',
            });
            this.container.appendChild(cap);
        }

        return el;
    }

    // ═══════════════════════════════════
    // FLOOR
    // ═══════════════════════════════════

    buildFloor(config = {}) {
        const {
            x = 0, y = 350, width = 800, height = 200, z = 0,
            chars = ['◆','◇','◆','◇','◆'],
            textColor = '#c8c0b8',
            mortarColor = '#b0a8a0',
            fontSize = 36,
            lineHeight = 0.47,
            letterSpacing = -2,
            fontFamily = "'Georgia','Times New Roman',serif",
            perspectiveStrength = 12,
        } = config;

        const el = document.createElement('div');
        el.className = 'gaia-floor';

        const charW = fontSize * 0.55;
        const perRow = Math.ceil(width / (charW + letterSpacing)) + 2;
        const rowH = fontSize * lineHeight;
        const rows = Math.ceil(height / rowH) + 1;

        let text = '';
        for (let r = 0; r < rows; r++) {
            const off = Math.floor(r * 0.7) % chars.length;
            for (let c = 0; c < perRow; c++) {
                text += chars[(c + off) % chars.length];
            }
            text += '\n';
        }

        el.textContent = text;

        Object.assign(el.style, {
            position: 'absolute',
            left: x + 'px', top: y + 'px',
            width: width + 'px', height: height + 'px',
            zIndex: z,
            fontFamily, fontSize: fontSize + 'px',
            lineHeight, letterSpacing: letterSpacing + 'px',
            color: textColor, background: mortarColor,
            textShadow: '0 2px 3px rgba(0,0,0,0.2)',
            wordBreak: 'break-all', overflow: 'hidden',
            userSelect: 'none', whiteSpace: 'pre-line',
            transform: `perspective(600px) rotateX(${perspectiveStrength}deg)`,
            transformOrigin: 'top center',
        });

        this.container.appendChild(el);
        this.walls.push({ el, config, type: 'floor' });
        return el;
    }

    // ═══════════════════════════════════
    // INSCRIPTION
    // ═══════════════════════════════════

    buildInscription(config = {}) {
        const {
            x = 300, y = 100,
            text = '',
            fontSize = 14,
            color = 'rgba(212,175,55,0.6)',
            fontFamily = "'Cinzel','Georgia',serif",
            z = 10,
            rotation = 0,
            animation = null,
        } = config;

        const el = document.createElement('div');
        el.className = 'gaia-inscription';
        el.textContent = text;

        Object.assign(el.style, {
            position: 'absolute',
            left: x + 'px', top: y + 'px',
            fontSize: fontSize + 'px', color,
            fontFamily, letterSpacing: '4px',
            zIndex: z,
            pointerEvents: 'none', userSelect: 'none',
            transform: `rotate(${rotation}deg)`,
            textShadow: '0 0 10px rgba(212,175,55,0.2)',
        });

        if (animation) el.style.animation = animation;
        this.container.appendChild(el);
        return el;
    }

    // ═══════════════════════════════════
    // LIGHT OVERLAY
    // ═══════════════════════════════════

    buildLight(config = {}) {
        const {
            color = '#d4af37',
            radius = 200,
            x = '50%',
            y = '45%',
            pulse = false,
            z = 0,
        } = config;

        const el = document.createElement('div');
        el.className = 'gaia-light';
        el.style.cssText = `
            position: absolute;
            left: ${typeof x === 'string' ? x : x + 'px'};
            top: ${typeof y === 'string' ? y : y + 'px'};
            transform: translate(-50%, -50%);
            width: ${radius * 2}px;
            height: ${radius * 2}px;
            background: radial-gradient(circle, ${color}33 0%, ${color}11 40%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: ${z};
            ${pulse ? 'animation: gaiaLightPulse 3s ease-in-out infinite;' : ''}
        `;
        this.container.appendChild(el);
        this.lights.push(el);
        return el;
    }

    // ═══════════════════════════════════
    // UTILITY
    // ═══════════════════════════════════

    clear() {
        this.container.innerHTML = '';
        this.walls = [];
        this.arches = [];
        this.lights = [];
        this.particles = [];
    }
}

// ═══════════════════════════════════
// GLOBAL GAIA ANIMATIONS
// ═══════════════════════════════════

if (!document.getElementById('gaia-mason-styles')) {
    const style = document.createElement('style');
    style.id = 'gaia-mason-styles';
    style.textContent = `
        @keyframes gaiaLightPulse {
            0%,100% { opacity: 0.7; }
            50% { opacity: 1; }
        }
        @keyframes hearthFlame {
            0%,100% { transform: scaleY(1); opacity: 0.9; }
            25% { transform: scaleY(1.15); opacity: 1; }
            50% { transform: scaleY(0.9); opacity: 0.85; }
            75% { transform: scaleY(1.1); opacity: 0.95; }
        }
        @keyframes starTwinkle {
            0%,100% { opacity: 0.3; }
            50% { opacity: 0.8; }
        }
    `;
    document.head.appendChild(style);
}

// ═══════════════════════════════════
// EXPORT
// ═══════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaiaMason;
}
