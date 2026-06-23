// ═══════════════════════════════════════
// GAIA ORRERY · Living Celestial Clock
// gaia/js/gaia-orrery.js
//
// Renders a real-time zodiac ring with planet positions,
// sun/moon highlights, ascendant marker, and period indicator.
// Mounts above the Gwalenn altar ring as the roof of the haven.
// ═══════════════════════════════════════

class GaiaOrrery {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`GaiaOrrery: "#${containerId}" not found`);
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'orrery-canvas';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.sunPos = null;
        this.moonPos = null;
        this.skyState = null;
        this.period = 'SUN';
        this._frame = null;
    }

    // ═══════════════════════════════════
    // INIT
    // ═══════════════════════════════════

    init(width = 860, height = 150) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.cssText = `
            display: block;
            width: ${width}px;
            max-width: 98vw;
            height: ${height}px;
            margin: 0 auto;
            pointer-events: none;
        `;
        this._startLoop();
    }

    // ═══════════════════════════════════
    // UPDATE CELESTIAL STATE
    // ═══════════════════════════════════

    updateState(sunPos, moonPos, skyState, period) {
        this.sunPos = sunPos;
        this.moonPos = moonPos;
        this.skyState = skyState;
        this.period = period || 'SUN';
    }

    // ═══════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════

    _startLoop() {
        const draw = () => {
            this._render();
            this._frame = requestAnimationFrame(draw);
        };
        draw();
    }

    // ═══════════════════════════════════
    // RENDER
    // ═══════════════════════════════════

    _render() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        const cx = W / 2;
        const cy = H / 2 + 8;
        const ringRadius = Math.min(W, H) * 0.35;

        ctx.clearRect(0, 0, W, H);

        // Deep sky background
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0a0e1a');
        bg.addColorStop(1, 'rgba(10,14,26,0)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Zodiac ring
        this._drawZodiacRing(ctx, cx, cy, ringRadius);

        // Planet positions on the ring
        this._drawPlanets(ctx, cx, cy, ringRadius);

        // Sun and Moon highlights
        this._drawSunMoon(ctx, cx, cy, ringRadius);

        // Ascendant marker
        this._drawAscendant(ctx, cx, cy, ringRadius);

        // Info text
        this._drawInfoText(ctx, W, H);
    }

    // ═══════════════════════════════════
    // ZODIAC RING
    // ═══════════════════════════════════

    _drawZodiacRing(ctx, cx, cy, radius) {
        const SIGNS = [
            { name: 'Aries',       glyph: '♈', element: 'Fire' },
            { name: 'Taurus',      glyph: '♉', element: 'Earth' },
            { name: 'Gemini',      glyph: '♊', element: 'Air' },
            { name: 'Cancer',      glyph: '♋', element: 'Water' },
            { name: 'Leo',         glyph: '♌', element: 'Fire' },
            { name: 'Virgo',       glyph: '♍', element: 'Earth' },
            { name: 'Libra',       glyph: '♎', element: 'Air' },
            { name: 'Scorpio',     glyph: '♏', element: 'Water' },
            { name: 'Sagittarius', glyph: '♐', element: 'Fire' },
            { name: 'Capricorn',   glyph: '♑', element: 'Earth' },
            { name: 'Aquarius',    glyph: '♒', element: 'Air' },
            { name: 'Pisces',      glyph: '♓', element: 'Water' },
        ];

        // Outer ring
        ctx.strokeStyle = 'rgba(201,168,76,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Inner ring
        ctx.strokeStyle = 'rgba(201,168,76,0.06)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        // Sign glyphs
        const now = new Date();
        const ascSign = this.skyState?.ascendant?.sign;

        SIGNS.forEach((sign, i) => {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const gx = cx + Math.cos(angle) * radius;
            const gy = cy + Math.sin(angle) * radius;

            // Highlight ascendant sign
            const isAscendant = ascSign === sign.name;
            
            ctx.font = `${isAscendant ? '16' : '12'}px serif`;
            ctx.fillStyle = isAscendant 
                ? '#ffd700' 
                : `rgba(201,168,76,${isAscendant ? 0.9 : 0.35})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sign.glyph, gx, gy);

            // Ascendant glow
            if (isAscendant) {
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 12;
                ctx.fillText(sign.glyph, gx, gy);
                ctx.shadowBlur = 0;
            }
        });
    }

    // ═══════════════════════════════════
    // PLANET DOTS
    // ═══════════════════════════════════

    _drawPlanets(ctx, cx, cy, radius) {
        if (!this.skyState?.planets) return;

        const PLANET_CONFIG = {
            mercury: { color: '#aaaacc', r: 3, label: '☿' },
            venus:   { color: '#ffbbaa', r: 4, label: '♀' },
            mars:    { color: '#ff6644', r: 4, label: '♂' },
            jupiter: { color: '#ddbb88', r: 6, label: '♃' },
            saturn:  { color: '#ccaa66', r: 5, label: '♄' },
        };

        const SIGN_ORDER = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                            'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

        Object.entries(PLANET_CONFIG).forEach(([name, config]) => {
            const planet = this.skyState.planets[name];
            if (!planet?.sign) return;

            const signIdx = SIGN_ORDER.indexOf(planet.sign);
            if (signIdx < 0) return;

            const signAngle = (signIdx / 12) * Math.PI * 2 - Math.PI / 2;
            const degOffset = (planet.degree || 0) / 30 * (Math.PI * 2 / 12);
            const angle = signAngle + degOffset;

            // Slightly inside the ring
            const pr = radius * 0.92;
            const px = cx + Math.cos(angle) * pr;
            const py = cy + Math.sin(angle) * pr;

            // Glow
            ctx.shadowColor = config.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(px, py, config.r, 0, Math.PI * 2);
            ctx.fillStyle = config.color;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Label
            ctx.font = '8px serif';
            ctx.fillStyle = config.color;
            ctx.textAlign = 'center';
            ctx.fillText(config.label, px, py - config.r - 6);
        });
    }

    // ═══════════════════════════════════
    // SUN & MOON
    // ═══════════════════════════════════

    _drawSunMoon(ctx, cx, cy, radius) {
        const SIGN_ORDER = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                            'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

        // Sun
        if (this.sunPos?.sign) {
            const signIdx = SIGN_ORDER.indexOf(this.sunPos.sign);
            if (signIdx >= 0) {
                const angle = (signIdx / 12) * Math.PI * 2 - Math.PI / 2 
                            + (this.sunPos.degree || 0) / 30 * (Math.PI * 2 / 12);
                const pr = radius * 0.80;
                const sx = cx + Math.cos(angle) * pr;
                const sy = cy + Math.sin(angle) * pr;

                ctx.shadowColor = '#ffcc44';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(sx, sy, 7, 0, Math.PI * 2);
                ctx.fillStyle = '#ffd700';
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.font = '9px serif';
                ctx.fillStyle = '#ffcc44';
                ctx.fillText('☉', sx, sy - 12);
            }
        }

        // Moon
        if (this.moonPos?.sign) {
            const signIdx = SIGN_ORDER.indexOf(this.moonPos.sign);
            if (signIdx >= 0) {
                const angle = (signIdx / 12) * Math.PI * 2 - Math.PI / 2 
                            + (this.moonPos.degree || 0) / 30 * (Math.PI * 2 / 12);
                const pr = radius * 0.73;
                const mx = cx + Math.cos(angle) * pr;
                const my = cy + Math.sin(angle) * pr;

                const moonColor = this.period === 'MOON' ? '#ddeeff' : '#8899bb';
                ctx.shadowColor = moonColor;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(mx, my, 5, 0, Math.PI * 2);
                ctx.fillStyle = moonColor;
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.font = '9px serif';
                ctx.fillStyle = moonColor;
                ctx.fillText('☽', mx, my - 10);
            }
        }
    }

    // ═══════════════════════════════════
    // ASCENDANT MARKER
    // ═══════════════════════════════════

    _drawAscendant(ctx, cx, cy, radius) {
        if (!this.skyState?.ascendant?.sign) return;

        const SIGN_ORDER = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                            'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

        const signIdx = SIGN_ORDER.indexOf(this.skyState.ascendant.sign);
        if (signIdx < 0) return;

        const angle = (signIdx / 12) * Math.PI * 2 - Math.PI / 2 
                    + (this.skyState.ascendant.degree || 0) / 30 * (Math.PI * 2 / 12);

        // Arrow marker on the outer edge
        const ax = cx + Math.cos(angle) * (radius + 16);
        const ay = cy + Math.sin(angle) * (radius + 16);

        ctx.font = '10px serif';
        ctx.fillStyle = '#88ddcc';
        ctx.textAlign = 'center';
        ctx.fillText('▲', ax, ay);

        // ASC label
        ctx.font = '7px Cinzel, serif';
        ctx.fillStyle = '#88ddcc';
        ctx.fillText('ASC', ax, ay + 12);
    }

    // ═══════════════════════════════════
    // INFO TEXT
    // ═══════════════════════════════════

    _drawInfoText(ctx, W, H) {
        const periodLabel = this.period === 'SUN' ? '☀️ Apollo Reigns' : '🌙 Artemis Watches';
        const moonPhase = this.moonPos?.phaseName || '';
        const illumination = this.moonPos?.illumination || 0;

        // Left: period
        ctx.font = '9px Cinzel, serif';
        ctx.fillStyle = 'rgba(200,180,150,0.5)';
        ctx.textAlign = 'left';
        ctx.fillText(periodLabel, 20, H - 15);

        // Right: moon phase
        ctx.textAlign = 'right';
        ctx.fillText(`${moonPhase} · ${illumination}% illuminated`, W - 20, H - 15);

        // Center: title
        ctx.textAlign = 'center';
        ctx.font = '7px Cinzel, serif';
        ctx.fillStyle = 'rgba(201,168,76,0.3)';
        ctx.fillText('CELESTIAL ORRERY · GWALENN DE OLYMPIA', W / 2, H - 15);
    }

    // ═══════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════

    destroy() {
        if (this._frame) cancelAnimationFrame(this._frame);
        if (this.canvas.parentNode) this.canvas.remove();
    }
}

// ═══════════════════════════════════
// EXPORT
// ═══════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaiaOrrery;
}
