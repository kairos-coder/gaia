// ═══════════════════════════════════════
// GAIA MASON · Olympian Stonemason
// gaia/js/gaia-mason.js
//
// Fork of font-mason.js adapted for GAIA's visual language.
// Builds altars, temples, and ritual spaces from typography.
// Olympic palette. Divine materials. Sacred geometry.
//
// v2.1 — Added: multi-openings on walls, perspective, fullCircle arches,
//        circle-shaped walls, glyph-carved floors, ember/particle system
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
        marble_white:      { chars:['M','N','H','M','N','·','·','M','N','·'], textColor:'#d8d0c8', mortarColor:'#c8c0b8', fontSize:40, lineHeight:0.48, letterSpacing:-3, fontFamily:"'Cinzel','Georgia',serif" },
        marble_veined:     { chars:['M','N','H','M','N','·','·','M','N','·'], textColor:'#c8c0b8', mortarColor:'#b0a8a0', fontSize:40, lineHeight:0.48, letterSpacing:-3, fontFamily:"'Cinzel','Georgia',serif" },
        storm_grey:        { chars:['▓','▒','░','█','▓'], textColor:'#4a4550', mortarColor:'#2a2530', fontSize:38, lineHeight:0.52, letterSpacing:-2, fontFamily:'monospace' },
        deep_stone:        { chars:['▓','▒','░','▓','▒'], textColor:'#3d362f', mortarColor:'#1f1a15', fontSize:41, lineHeight:0.52, letterSpacing:-3, fontFamily:"'UnifrakturMaguntia','Cinzel','Georgia',serif" },
        
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
    // WALL (v2.1 — supports openings array, perspective, shape)
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
            openings = null,      // ← NEW: array of { x, y, width, height, arch?, glass?, glassFrost? }
            opening = null,       // ← BACKWARD COMPAT: single opening object
            className = '',
            id = null,
            shape = null,         // ← NEW: 'circle'
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

        // Shape
        if (shape === 'circle') {
            el.style.borderRadius = '50%';
            el.style.overflow = 'hidden';
        }

        // Perspective
        if (perspective === 'recede-left') {
            el.style.transform = 'perspective(800px) rotateY(12deg)';
            el.style.transformOrigin = 'right center';
        } else if (perspective === 'recede-right') {
            el.style.transform = 'perspective(800px) rotateY(-12deg)';
            el.style.transformOrigin = 'left center';
        } else if (typeof perspective === 'number') {
            el.style.transform = `perspective(800px) rotateY(${perspective}deg)`;
        }

        // Openings (new multi-opening support + backward compat)
        const allOpenings = openings || (opening ? [opening] : []);
        for (const op of allOpenings) {
            const cutout = document.createElement('div');
            cutout.className = 'wall-opening';
            const rad = op.arch ? op.width / 2 : 0;
            Object.assign(cutout.style, {
                position: 'absolute',
                left: op.x + 'px', top: op.y + 'px',
                width: op.width + 'px', height: op.height + 'px',
                background: op.glass ? 
                    `rgba(42,74,106,${0.3 + (op.glassFrost || 0) / 200})` : 
                    '#0a0806',
                borderRadius: op.arch ? `${rad}px ${rad}px 0 0` : '2px',
                boxShadow: op.glass ?
                    `inset 0 0 30px rgba(100,150,200,0.3), 0 0 15px rgba(100,150,200,0.1)` :
                    'inset 0 0 30px rgba(0,0,0,0.7)',
                pointerEvents: 'none',
                zIndex: 2,
            });
            
            // Frost effect on glass
            if (op.glass && op.glassFrost > 0) {
                const frost = document.createElement('div');
                frost.style.cssText = `
                    position: absolute; inset: 0;
                    background: rgba(200,216,228,${op.glassFrost / 100 * 0.5});
                    border-radius: inherit;
                    pointer-events: none;
                `;
                cutout.appendChild(frost);
            }
            
            el.appendChild(cutout);
        }

        this.container.appendChild(el);
        this.walls.push({ el, config });
        return el;
    }

    // ═══════════════════════════════════
    // ARCH (v2.1 — fullCircle support)
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
            fullCircle = false,    // ← NEW: rose window mode
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
        const keystoneIndex = fullCircle ? -1 : Math.floor(count / 2);

        for (let i = 0; i < count; i++) {
            const angle = start + (span / count) * i;
            const keystone = (i === keystoneIndex);
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
    // FLOOR (v2.1 — glyphCarving support)
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
            glyphCarving = null,   // ← NEW: { text, x, y, size, spacing, color }
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

        // Glyph carving overlay
        if (glyphCarving) {
            const carving = document.createElement('div');
            carving.className = 'floor-glyph-carving';
            carving.textContent = glyphCarving.text;
            Object.assign(carving.style, {
                position: 'absolute',
                left: (x + glyphCarving.x) + 'px',
                top: (y + glyphCarving.y) + 'px',
                fontSize: (glyphCarving.size || 18) + 'px',
                color: glyphCarving.color || 'rgba(184,134,11,0.08)',
                fontFamily: "'Georgia',serif",
                letterSpacing: (glyphCarving.spacing || 38) + 'px',
                zIndex: z + 1,
                pointerEvents: 'none',
                userSelect: 'none',
                transform: `perspective(600px) rotateX(${perspectiveStrength}deg)`,
                transformOrigin: 'top center',
            });
            this.container.appendChild(carving);
        }

        return el;
    }

    // ═══════════════════════════════════
    // VAULT (CEILING)
    // ═══════════════════════════════════

    buildVault(config = {}) {
        const {
            x = 100, y = -20, width = 600, height = 90, z = -1,
            chars = ['⌢','⌣','~','⋅',' '],
            textColor = '#2a2520',
            fontSize = 15,
            lineHeight = 0.85,
            letterSpacing = 2,
            fontFamily = "'Georgia','Times New Roman',serif",
            ribs = [],
        } = config;

        const el = document.createElement('div');
        el.className = 'gaia-vault';

        const charW = fontSize * 0.5;
        const perRow = Math.ceil(width / charW);
        const rowH = fontSize * lineHeight;
        const rows = Math.ceil(height / rowH);

        let text = '';
        for (let r = 0; r < rows; r++) {
            const indent = Math.floor((rows - r) * 0.8);
            text += ' '.repeat(Math.max(0, indent));
            for (let c = 0; c < perRow - indent * 2; c++) {
                text += chars[r % chars.length];
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
            color: textColor,
            textAlign: 'center', whiteSpace: 'pre',
            userSelect: 'none', overflow: 'hidden',
            borderRadius: '50% 50% 0 0',
        });

        this.container.appendChild(el);
        this.walls.push({ el, config, type: 'vault' });

        for (const rib of ribs) {
            const rEl = document.createElement('div');
            Object.assign(rEl.style, {
                position: 'absolute',
                left: rib.x + 'px', top: (y + 8) + 'px',
                width: (rib.depth || 6) + 'px', height: (height - 10) + 'px',
                background: rib.color || '#3d362f',
                zIndex: z + 1,
                borderRadius: '3px 3px 0 0',
            });
            this.container.appendChild(rEl);
        }

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

            this.buildWall({
                ...GaiaMason.mat(altar.material || 'marble_white'),
                x: ax, y: ay + 40,
                width: 100, height: 70,
                z: 10,
                id: `altar-${altar.god}`,
            });

            this.buildWall({
                ...GaiaMason.mat(altar.material || 'marble_white'),
                x: ax - 5, y: ay + 30,
                width: 110, height: 15,
                z: 11,
            });

            this.buildInscription({
                text: altar.glyph || '✦',
                x: ax + 35, y: ay + 50,
                fontSize: 28,
                color: altar.glowColor || '#d4af37',
                fontFamily: "'Georgia',serif",
                z: 12,
            });

            this.buildInscription({
                text: altar.name || altar.god,
                x: ax + 10, y: ay + 15,
                fontSize: 9,
                color: 'rgba(200,180,150,0.6)',
                fontFamily: "'Cinzel',serif",
                z: 12,
            });

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
                    zone.dispatchEvent(new CustomEvent('altar-interact', {
                        detail: { god: altar.god, altar },
                        bubbles: true,
                    }));
                });
                this.container.appendChild(zone);
            }
        });

        this.buildCentralHearth(centerX, centerY, hearthSize);
    }

    // ═══════════════════════════════════
    // CENTRAL HEARTH
    // ═══════════════════════════════════

    buildCentralHearth(cx, cy, size) {
        this.buildWall({
            ...GaiaMason.mat('marble_white'),
            x: cx - size / 2 - 10, y: cy - size / 2 - 10,
            width: size + 20, height: size + 20,
            z: 8,
        });

        this.buildWall({
            ...GaiaMason.mat('iron_dark'),
            x: cx - size / 2 + 5, y: cy - size / 2 + 5,
            width: size - 10, height: size - 10,
            z: 9,
        });

        this.buildWall({
            ...GaiaMason.mat('flame_gold'),
            x: cx - size / 4, y: cy - size / 3,
            width: size / 2, height: size / 2,
            z: 10,
        });

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

        this.buildPillar({
            ...mat,
            x: x + 20, y: y + 25,
            width: 20, height: 35,
            z,
            fontSize: 12,
        });

        this.buildWall({
            ...mat,
            x: x + 5, y: y,
            width: 50, height: 30,
            z: z + 1,
        });

        this.buildWall({
            ...GaiaMason.mat('void_black'),
            x: x + 12, y: y + 5,
            width: 36, height: 20,
            z: z + 2,
        });
    }

    // ═══════════════════════════════════
    // PARTICLE SYSTEM (NEW — v2.1)
    // ═══════════════════════════════════

    /**
     * Spawn embers/sparks from a point. Returns array of particle elements.
     * @param {Object} config
     * @param {number} config.x - center X
     * @param {number} config.y - center Y
     * @param {number} [config.count=8] - number of particles
     * @param {string} [config.color='#ff6b2b'] - particle color
     * @param {number} [config.minSize=2] - min particle size in px
     * @param {number} [config.maxSize=5] - max particle size in px
     * @param {number} [config.riseDistance=160] - how far particles float up
     * @param {number} [config.spreadX=60] - horizontal spread
     * @param {number} [config.durationMin=1.2] - min animation duration in seconds
     * @param {number} [config.durationMax=3.5] - max animation duration in seconds
     * @param {number} [config.z=80] - z-index
     * @param {number} [config.delayMax=0.3] - max random delay before animation starts
     */
    spawnParticles(config = {}) {
        const {
            x = 400, y = 300,
            count = 8,
            color = '#ff6b2b',
            minSize = 2, maxSize = 5,
            riseDistance = 160,
            spreadX = 60,
            durationMin = 1.2, durationMax = 3.5,
            z = 80,
            delayMax = 0.3,
        } = config;

        const particles = [];
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            const dx = (Math.random() - 0.5) * spreadX;
            const size = minSize + Math.random() * (maxSize - minSize);
            const dur = durationMin + Math.random() * (durationMax - durationMin);
            const delay = Math.random() * delayMax;

            p.style.cssText = `
                position: absolute;
                left: ${x}px; top: ${y}px;
                width: ${size}px; height: ${size}px;
                background: radial-gradient(circle, ${color}, transparent);
                border-radius: 50%;
                pointer-events: none;
                z-index: ${z};
                --dx: ${dx}px;
                animation: gaiaParticleRise ${dur}s ease-out ${delay}s forwards;
            `;
            this.container.appendChild(p);
            particles.push(p);

            // Auto-cleanup
            const lifetime = (dur + delay) * 1000 + 200;
            setTimeout(() => {
                if (p.parentNode) p.remove();
            }, lifetime);
        }
        this.particles.push(...particles);
        return particles;
    }

    // ═══════════════════════════════════
    // AMBIENT SNOW / ASH (NEW — v2.1)
    // ═══════════════════════════════════

    /**
     * Spawn persistent snowfall or ashfall across the container.
     * @param {Object} config
     * @param {number} [config.count=30] - number of flakes
     * @param {string} [config.color='rgba(200,216,228,0.5)'] - flake color
     * @param {number} [config.minSize=2] - min flake size
     * @param {number} [config.maxSize=4] - max flake size
     * @param {number} [config.speedMin=5] - min fall duration in seconds
     * @param {number} [config.speedMax=12] - max fall duration in seconds
     * @param {number} [config.z=90] - z-index
     */
    spawnAmbientFall(config = {}) {
        const {
            count = 30,
            color = 'rgba(200,216,228,0.5)',
            minSize = 2, maxSize = 4,
            speedMin = 5, speedMax = 12,
            z = 90,
        } = config;

        const particles = [];
        for (let i = 0; i < count; i++) {
            const flake = document.createElement('div');
            const size = minSize + Math.random() * (maxSize - minSize);
            const dur = speedMin + Math.random() * (speedMax - speedMin);
            const drift = Math.random() * 30;
            const startX = Math.random() * 100;

            flake.style.cssText = `
                position: absolute;
                left: ${startX}%; top: -10px;
                width: ${size}px; height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: ${z};
                animation: gaiaAmbientFall ${dur}s linear ${Math.random() * dur}s infinite;
                --drift: ${drift}px;
            `;
            this.container.appendChild(flake);
            particles.push(flake);
        }
        this.particles.push(...particles);
        return particles;
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
// GLOBAL GAIA ANIMATIONS (v2.1 — added particle + ambient fall)
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
        @keyframes gaiaParticleRise {
            0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.9; }
            100% { transform: translateY(calc(-1 * var(--target-rise, 160px))) translateX(var(--dx, 0px)) scale(0); opacity: 0; }
        }
        @keyframes gaiaAmbientFall {
            0% { transform: translateY(-20px) translateX(0); }
            100% { transform: translateY(105vh) translateX(var(--drift, 30px)); }
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
