// ═══════════════════════════════════════
// HARE BUILDER · Demeter's Meadow
// gaia/demeter/js/hare-builder.js
//
// Spawns, animates, and manages hares
// across Demeter's realm (and beyond).
//
// v1.0 — Initial: spawn, hop, variant system
// ═══════════════════════════════════════

class HareBuilder {

    // ═══════════════════════════════════
    // HARE REGISTRY
    // All 11 NightCafe assets + metadata
    // ═══════════════════════════════════

    static HARES = {
        real:    { file: 'hare-real.jpg',    label: 'The Real One',     weight: 3, size: 80,  domain: 'demeter' },
        grass:   { file: 'hare-grass.jpg',   label: 'Field Runner',     weight: 3, size: 90,  domain: 'demeter' },
        mythic:  { file: 'hare-mythic.jpg',  label: 'The Mythic',       weight: 2, size: 100, domain: 'all'     },
        fantasy: { file: 'hare-fantasy.jpg', label: 'The Dreamer',      weight: 2, size: 95,  domain: 'all'     },
        psalter: { file: 'hare-psalter.jpg', label: 'The Psalter Hare', weight: 1, size: 85,  domain: 'all'     },
        tarot:   { file: 'hare-tarot.jpg',   label: 'The Tarot Hare',   weight: 1, size: 85,  domain: 'all'     },
        card:    { file: 'hare-card.jpg',    label: 'The Card',         weight: 1, size: 80,  domain: 'all'     },
        king:    { file: 'hare-king.png',    label: 'The King',         weight: 1, size: 110, domain: 'zeus'    },
        cyber:   { file: 'hare-cyber.jpg',   label: 'Cyber Hare',       weight: 1, size: 90,  domain: 'all'     },
        cyber0:  { file: 'hare-cyber0.jpg',  label: 'Cyber Hare Mk.0',  weight: 1, size: 90,  domain: 'all'     },
        cyber1:  { file: 'hare-cyber1.jpg',  label: 'Cyber Hare Mk.1',  weight: 1, size: 90,  domain: 'all'     },
    };

    // ═══════════════════════════════════
    // HOP VARIANTS
    // ═══════════════════════════════════

    static VARIANTS = {
        meadow: {
            label: 'Meadow Hop',
            pauseMin: 1200, pauseMax: 4000,
            hopDistance: 80, hopScatter: 60,
            speed: 320,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            bounceHeight: 18,
            description: 'Natural grazing hop. Pause, burst, pause.',
        },
        nervous: {
            label: 'Nervous Run',
            pauseMin: 200, pauseMax: 800,
            hopDistance: 120, hopScatter: 100,
            speed: 180,
            easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
            bounceHeight: 10,
            description: 'Spooked. Short pauses, erratic direction.',
        },
        dream: {
            label: 'Dream Float',
            pauseMin: 2000, pauseMax: 6000,
            hopDistance: 60, hopScatter: 30,
            speed: 800,
            easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
            bounceHeight: 30,
            description: 'Slow, ethereal. Moon-hare movement.',
        },
        king: {
            label: 'King\'s Pace',
            pauseMin: 3000, pauseMax: 8000,
            hopDistance: 150, hopScatter: 20,
            speed: 600,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            bounceHeight: 40,
            description: 'Deliberate. Long pauses, powerful leaps.',
        },
        chaos: {
            label: 'Chaos',
            pauseMin: 100, pauseMax: 600,
            hopDistance: 200, hopScatter: 180,
            speed: 120,
            easing: 'linear',
            bounceHeight: 8,
            description: 'Pure chaos. No pattern. Goes everywhere.',
        },
    };

    // ═══════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════

    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`HareBuilder: "#${containerId}" not found`);

        this.imagePath = options.imagePath || 'images/';
        this.hares = [];
        this.activeVariant = options.variant || 'meadow';
        this.bounds = options.bounds || null; // { x, y, width, height }
        this._running = true;

        // Inject CSS once
        HareBuilder._injectStyles();
    }

    // ═══════════════════════════════════
    // SPAWN A SINGLE HARE
    // ═══════════════════════════════════

    spawn(options = {}) {
        const {
            type = this._randomType(),
            x = null,
            y = null,
            variant = this.activeVariant,
            scale = 1,
            flip = Math.random() > 0.5,
            z = 20,
            label = true,
        } = options;

        const def = HareBuilder.HARES[type];
        if (!def) throw new Error(`HareBuilder: unknown hare type "${type}"`);

        const bounds = this._getBounds();
        const startX = x !== null ? x : bounds.x + Math.random() * (bounds.width - def.size);
        const startY = y !== null ? y : bounds.y + bounds.height * 0.4 + Math.random() * bounds.height * 0.45;

        const el = document.createElement('div');
        el.className = 'hare';
        el.dataset.type = type;
        el.dataset.variant = variant;

        const img = document.createElement('img');
        img.src = this.imagePath + def.file;
        img.alt = def.label;
        img.draggable = false;

        const size = def.size * scale;
        Object.assign(el.style, {
            position: 'absolute',
            left: startX + 'px',
            top: startY + 'px',
            width: size + 'px',
            height: size + 'px',
            zIndex: z,
            cursor: 'pointer',
            transition: 'opacity 0.4s',
            userSelect: 'none',
        });

        // Unique SVG feather filter per hare
        const filterId = `hare-feather-${Date.now()}-${Math.floor(Math.random()*9999)}`;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;';
        svg.innerHTML = `
            <defs>
                <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="atop"/>
                </filter>
            </defs>
        `;
        document.body.appendChild(svg);
        el._svgFilter = svg;

        Object.assign(img.style, {
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: flip ? 'scaleX(-1)' : 'scaleX(1)',
            filter: `url(#${filterId}) drop-shadow(0 4px 8px rgba(0,0,0,0.4))`,
            clipPath: 'ellipse(44% 46% at 50% 48%)',
            WebkitClipPath: 'ellipse(44% 46% at 50% 48%)',
            borderRadius: '4px',
        });

        el.appendChild(img);

        // Label
        if (label) {
            const tag = document.createElement('div');
            tag.className = 'hare-label';
            tag.textContent = def.label;
            el.appendChild(tag);
        }

        // Click to inspect
        el.addEventListener('click', () => this._onHareClick(el, type, def));

        this.container.appendChild(el);

        const hare = {
            el, img, type, def,
            x: startX, y: startY,
            size, flip,
            variant,
            _timer: null,
            _hopping: false,
        };

        this.hares.push(hare);
        this._scheduleHop(hare);
        return hare;
    }

    // ═══════════════════════════════════
    // SPAWN MULTIPLE
    // ═══════════════════════════════════

    spawnAll(options = {}) {
        const { variant = this.activeVariant, stagger = 400 } = options;
        const types = Object.keys(HareBuilder.HARES);
        types.forEach((type, i) => {
            setTimeout(() => {
                this.spawn({ type, variant });
            }, i * stagger);
        });
    }

    spawnPack(count = 5, options = {}) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => this.spawn(options), i * 300);
        }
    }

    // ═══════════════════════════════════
    // HOP ENGINE
    // ═══════════════════════════════════

    _scheduleHop(hare) {
        if (!this._running) return;
        const v = HareBuilder.VARIANTS[hare.variant] || HareBuilder.VARIANTS.meadow;
        const pause = v.pauseMin + Math.random() * (v.pauseMax - v.pauseMin);

        hare._timer = setTimeout(() => {
            if (!this._running) return;
            this._doHop(hare);
        }, pause);
    }

    _doHop(hare) {
        const v = HareBuilder.VARIANTS[hare.variant] || HareBuilder.VARIANTS.meadow;
        const bounds = this._getBounds();

        // Direction: generally forward with scatter
        const angle = (Math.random() * v.hopScatter * 2 - v.hopScatter) * (Math.PI / 180);
        const baseAngle = hare.flip ? Math.PI : 0; // face direction
        const finalAngle = baseAngle + angle + (Math.random() > 0.85 ? Math.PI : 0); // occasional reversal

        const dist = v.hopDistance * (0.5 + Math.random() * 0.8);
        let newX = hare.x + Math.cos(finalAngle) * dist;
        let newY = hare.y + Math.sin(finalAngle) * dist * 0.4; // flatten vertical

        // Clamp to bounds
        const maxX = bounds.x + bounds.width - hare.size;
        const maxY = bounds.y + bounds.height - hare.size;
        newX = Math.max(bounds.x, Math.min(maxX, newX));
        newY = Math.max(bounds.y + bounds.height * 0.3, Math.min(maxY, newY));

        // Flip image if changing direction
        const movingLeft = newX < hare.x;
        if (movingLeft !== hare.flip) {
            hare.flip = movingLeft;
            hare.img.style.transform = hare.flip ? 'scaleX(-1)' : 'scaleX(1)';
        }

        // Animate the hop
        const duration = v.speed + Math.random() * 100;
        hare.el.style.transition = `left ${duration}ms ${v.easing}, top ${duration}ms ${v.easing}`;
        hare.el.style.left = newX + 'px';
        hare.el.style.top = newY + 'px';

        // Bounce arc via CSS animation
        hare.el.style.animation = `hareBounce ${duration}ms ease-out 1`;
        hare.el.style.setProperty('--bounce-height', `-${v.bounceHeight}px`);

        hare.x = newX;
        hare.y = newY;

        // Schedule next hop after this one lands
        setTimeout(() => {
            hare.el.style.animation = '';
            this._scheduleHop(hare);
        }, duration + 50);
    }

    // ═══════════════════════════════════
    // VARIANT SWITCHER
    // Apply new variant to all or one hare
    // ═══════════════════════════════════

    setVariant(variantName, hare = null) {
        if (!HareBuilder.VARIANTS[variantName]) return;
        if (hare) {
            hare.variant = variantName;
            hare.el.dataset.variant = variantName;
        } else {
            this.activeVariant = variantName;
            this.hares.forEach(h => {
                h.variant = variantName;
                h.el.dataset.variant = variantName;
            });
        }
    }

    // ═══════════════════════════════════
    // CONTROLS
    // ═══════════════════════════════════

    pause() {
        this._running = false;
        this.hares.forEach(h => {
            clearTimeout(h._timer);
            h.el.style.transition = 'none';
        });
    }

    resume() {
        this._running = true;
        this.hares.forEach(h => this._scheduleHop(h));
    }

    clear() {
        this.pause();
        this.hares.forEach(h => {
            if (h.el._svgFilter) h.el._svgFilter.remove();
            h.el.remove();
        });
        this.hares = [];
    }

    removeHare(hare) {
        clearTimeout(hare._timer);
        hare.el.style.opacity = '0';
        setTimeout(() => {
            if (hare.el._svgFilter) hare.el._svgFilter.remove();
            hare.el.remove();
            this.hares = this.hares.filter(h => h !== hare);
        }, 400);
    }

    // ═══════════════════════════════════
    // UTILITY
    // ═══════════════════════════════════

    _getBounds() {
        if (this.bounds) return this.bounds;
        // Use offsetWidth/Height which are available after layout
        const w = this.container.offsetWidth || window.innerWidth;
        const h = this.container.offsetHeight || 300;
        return { x: 20, y: 0, width: w - 40, height: h - 20 };
    }

    _randomType() {
        // Weighted random
        const pool = [];
        for (const [key, def] of Object.entries(HareBuilder.HARES)) {
            for (let i = 0; i < (def.weight || 1); i++) pool.push(key);
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    _onHareClick(el, type, def) {
        el.classList.toggle('hare-selected');
        const event = new CustomEvent('hare-click', {
            detail: { type, def },
            bubbles: true,
        });
        el.dispatchEvent(event);
    }

    static _injectStyles() {
        if (document.getElementById('hare-builder-styles')) return;
        const style = document.createElement('style');
        style.id = 'hare-builder-styles';
        style.textContent = `
            .hare {
                position: absolute;
                pointer-events: auto;
            }
            .hare img {
                display: block;
                pointer-events: none;
            }
            .hare-label {
                position: absolute;
                bottom: -18px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 9px;
                font-family: 'Cinzel', Georgia, serif;
                color: rgba(200,180,140,0.7);
                white-space: nowrap;
                letter-spacing: 1px;
                pointer-events: none;
            }
            .hare-selected img {
                filter: drop-shadow(0 0 12px rgba(212,175,55,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.4)) !important;
            }
            .hare-info-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(10,8,6,0.92);
                border: 1px solid rgba(212,175,55,0.3);
                color: #c8b890;
                font-family: 'Cinzel', Georgia, serif;
                font-size: 11px;
                padding: 12px 16px;
                border-radius: 4px;
                z-index: 999;
                pointer-events: none;
                letter-spacing: 1px;
            }
            @keyframes hareBounce {
                0%   { transform: translateY(0); }
                40%  { transform: translateY(var(--bounce-height, -18px)); }
                70%  { transform: translateY(-4px); }
                100% { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// ═══════════════════════════════════
// EXPORT
// ═══════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HareBuilder;
}
