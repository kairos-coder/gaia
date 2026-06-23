// ═══════════════════════════════════════
// GAIA SCENE LOADER · Ritual Space Composer
// gaia/js/gaia-scene-loader.js
//
// Reads scene JSON. Resolves Olympian materials.
// Builds rooms, altar rings, hearths, offering bowls.
// Integrates Ouranos sky and Pontus wave canvases.
// Wires interactions to GAIA state.
// ═══════════════════════════════════════

class GaiaSceneLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`GaiaSceneLoader: "#${containerId}" not found`);
        this.mason = null;
        this.scene = null;
        this.state = null;
        this.materials = {};
        this.builtElements = [];
        this.canvasLayers = {};
        this.interactiveZones = [];
        this.onInteract = null;
        this.onAltarInteract = null;
        this.onExit = null;
    }
    async loadFromIndex(indexUrl, sceneName) {
    // Fetch the index
    const resp = await fetch(indexUrl);
    if (!resp.ok) throw new Error(`GaiaSceneLoader: ${resp.status} loading index`);
    const index = await resp.json();
    
    // Load materials first
    const matFile = index.files?.materials?.['olympian-materials.json'];
    if (matFile) {
        try {
            const matResp = await fetch(matFile.path);
            if (matResp.ok) {
                const extMats = await matResp.json();
                for (const category of Object.values(extMats)) {
                    if (typeof category === 'object') {
                        Object.assign(this.materials, category);
                    }
                }
            }
        } catch (e) {
            console.warn('GaiaSceneLoader: could not load materials from index');
        }
    }
    
    // Find the scene path
    let scenePath = null;
    
    // Search all categories
    for (const [category, files] of Object.entries(index.files || {})) {
        if (files[sceneName]) {
            scenePath = files[sceneName].path;
            break;
        }
    }
    
    if (!scenePath) {
        throw new Error(`GaiaSceneLoader: scene "${sceneName}" not found in index`);
    }
    
    // Load the scene
    return this.load(scenePath);
}
    // ═══════════════════════════════════
    // LOAD
    // ═══════════════════════════════════

    async load(sceneUrl) {
    // Load materials FIRST
    this.materials = { ...GaiaMason.MATERIALS };
    await this._loadExternalMaterials();
    
    // Then load scene
    const resp = await fetch(sceneUrl);
    if (!resp.ok) throw new Error(`GaiaSceneLoader: ${resp.status} loading ${sceneUrl}`);
    this.scene = await resp.json();

    // Merge scene-specific materials
    if (this.scene.materials) {
        Object.assign(this.materials, this.scene.materials);
    }

    // Clear and build
    this.container.innerHTML = '';
    this.builtElements = [];
    this.canvasLayers = {};
    this.interactiveZones = [];

    if (this.scene.size) {
        this.container.style.width = this.scene.size.w + 'px';
        this.container.style.height = this.scene.size.h + 'px';
    }

    this.mason = new GaiaMason(this.container.id);

    // Build layers
    if (this.scene.background) this._buildBackground();
    if (this.scene.room) this._buildRoom();
    if (this.scene.altarRing) this._buildAltarRing();
    if (this.scene.hearth) this._buildHearth();
    if (this.scene.floor) this._buildFloor();
    if (this.scene.objects) this._buildObjects();
    if (this.scene.inscriptions) this._buildInscriptions();
    if (this.scene.exits) this._buildExits();
    if (this.scene.atmosphere) this._buildAtmosphere();
}

async _loadExternalMaterials() {
    // Try multiple paths for olympian-materials.json
    const paths = [
        '../json/olympian-materials.json',
        'json/olympian-materials.json',
        './json/olympian-materials.json',
    ];
    
    for (const path of paths) {
        try {
            const resp = await fetch(path);
            if (resp.ok) {
                const data = await resp.json();
                for (const category of Object.values(data)) {
                    if (typeof category === 'object' && !Array.isArray(category)) {
                        Object.assign(this.materials, category);
                    }
                }
                return; // Success — stop trying
            }
        } catch(e) {
            continue;
        }
    }
}

    // ═══════════════════════════════════
    // MATERIAL RESOLVER
    // ═══════════════════════════════════

    resolveMaterial(name) {
        if (!name) return GaiaMason.mat('marble_white');
        const mat = this.materials[name];
        if (!mat) {
            console.warn(`GaiaSceneLoader: material "${name}" not found, using marble_white`);
            return GaiaMason.mat('marble_white');
        }
        if (!mat.chars && mat.characters) mat.chars = mat.characters;
        if (!mat.chars) mat.chars = ['M','N','H'];
        return { ...mat };
    }

    // ═══════════════════════════════════
    // OBJECT PLACER (from objectDefinitions)
    // ═══════════════════════════════════

    _placeObject(type, x, y, config = {}) {
        const objDef = this.scene.objectDefinitions?.[type];
        if (!objDef) {
            this.mason.buildInscription({ text: type, x, y, fontSize: 10, color: '#8b7d6b', z: 10 });
            return;
        }
        for (const layer of objDef.layers || []) {
            const lx = x + (layer.position?.x || 0);
            const ly = y + (layer.position?.y || 0);
            const lw = layer.dimensions?.width || 60;
            const lh = layer.dimensions?.height || 60;
            const mat = this.resolveMaterial(layer.material);

            switch (layer.type) {
                case 'wall':
                    this.mason.buildWall({ ...mat, x: lx, y: ly, width: lw, height: lh, z: layer.position?.z || 10 });
                    break;
                case 'pillar':
                    this.mason.buildPillar({ ...mat, x: lx, y: ly, width: lw, height: lh, z: layer.position?.z || 10, capital: layer.capital });
                    break;
                case 'arch':
                    this.mason.buildArch({ ...mat, cx: lx + lw/2, cy: ly, innerRadius: lw/2, z: layer.position?.z || 12, stoneCount: layer.stoneCount || 13, stoneDepth: layer.stoneDepth || 18 });
                    break;
                case 'inscription':
                    this.mason.buildInscription({
                        text: layer.content || '', x: lx, y: ly,
                        fontSize: layer.style?.fontSize || 12,
                        color: layer.style?.color || '#8b7d6b',
                        fontFamily: layer.style?.fontFamily || "'Georgia',serif",
                        z: layer.position?.z || 12,
                        animation: layer.style?.animation,
                    });
                    break;
            }
        }

        // Build interaction zone if defined
        if (objDef.interaction || config.interaction) {
            const iz = objDef.interaction || config.interaction;
            const zx = x + (iz.zone?.x || 0);
            const zy = y + (iz.zone?.y || 0);
            const zw = iz.zone?.width || (objDef.bounds?.width || 60);
            const zh = iz.zone?.height || (objDef.bounds?.height || 60);

            const zone = document.createElement('div');
            zone.className = 'altar-object-zone';
            zone.title = iz.label || type;
            zone.style.cssText = `position:absolute;left:${zx}px;top:${zy}px;width:${zw}px;height:${zh}px;z-index:30;cursor:pointer;`;
            zone.addEventListener('click', (e) => {
                e.stopPropagation();
                zone.dispatchEvent(new CustomEvent('object-interact', {
                    detail: { object: type, action: iz.action, label: iz.label, x, y },
                    bubbles: true,
                }));
            });
            this.container.appendChild(zone);
            this.interactiveZones.push({ el: zone, type, config });
        }
    }

    // ═══════════════════════════════════
    // ROOM BUILDER
    // ═══════════════════════════════════

    _buildRoom() {
        const room = this.scene.room;
        if (!room) return;

        const size = this.scene.size;
        const margin = room.margin || 5;
        const leftWidth = room.leftWall?.width || 40;
        const rightWidth = room.rightWall?.width || 40;
        const farWidth = size.w - margin * 2 - leftWidth - rightWidth;
        const farX = margin + leftWidth;
        const wallHeight = room.wallHeight || (size.h * 0.65);
        const wallY = margin;
        const floorY = wallY + wallHeight;
        const floorHeight = size.h - floorY - margin;

        // FAR WALL
        if (room.farWall) {
            const mat = this.resolveMaterial(room.farWall.material);
            const openings = room.farWall.openings || [];
            const features = room.farWall.features || [];

            this.mason.buildWall({
                ...mat, x: farX, y: wallY,
                width: farWidth, height: wallHeight,
                z: 1, openings, id: 'far-wall',
            });

            features.forEach((f, i) => {
                const fx = farX + (f.position?.x || 30 + i * 80);
                const fy = wallY + (f.position?.y || 40);
                this._placeObject(f.type || f, fx, fy, f);
            });
        }

        // LEFT WALL
        if (room.leftWall) {
            const mat = this.resolveMaterial(room.leftWall.material);
            const openings = room.leftWall.openings || [];
            const features = room.leftWall.features || [];
            const leftH = room.leftWall.height || wallHeight;

            this.mason.buildWall({
                ...mat, x: margin, y: wallY,
                width: leftWidth, height: leftH,
                z: 0, perspective: 'recede-left',
                openings, id: 'left-wall',
            });

            features.forEach((f, i) => {
                const fx = margin + (f.position?.x || 5);
                const fy = wallY + (f.position?.y || 40);
                this._placeObject(f.type || f, fx, fy, f);
            });
        }

        // RIGHT WALL
        if (room.rightWall) {
            const mat = this.resolveMaterial(room.rightWall.material);
            const openings = room.rightWall.openings || [];
            const features = room.rightWall.features || [];
            const rightX = size.w - margin - rightWidth;
            const rightH = room.rightWall.height || wallHeight;

            this.mason.buildWall({
                ...mat, x: rightX, y: wallY,
                width: rightWidth, height: rightH,
                z: 0, perspective: 'recede-right',
                openings, id: 'right-wall',
            });

            features.forEach((f, i) => {
                const fx = rightX + (f.position?.x || 5);
                const fy = wallY + (f.position?.y || 40);
                this._placeObject(f.type || f, fx, fy, f);
            });
        }

        // FLOOR
        if (room.floor) {
            const mat = this.resolveMaterial(room.floor.material);
            this.mason.buildFloor({
                ...mat,
                x: margin,
                y: room.floor.y || floorY,
                width: size.w - margin * 2,
                height: room.floor.height || floorHeight,
                z: 0,
                perspectiveStrength: room.floor.perspective || 10,
            });

            const floorFeatures = room.floor.features || [];
            floorFeatures.forEach((f, i) => {
                const fx = margin + (f.position?.x || 50 + i * 100);
                const fy = (room.floor.y || floorY) + (f.position?.y || 20);
                this._placeObject(f.type || f, fx, fy, f);
            });
        }

        // CEILING
        if (room.ceiling) {
            const mat = this.resolveMaterial(room.ceiling.material);
            this.mason.buildVault({
                ...mat,
                x: farX, y: wallY - 18,
                width: farWidth, height: 35,
                z: -1,
                ribs: room.ceiling.ribs || [],
            });
        }

        // Room-level inscriptions
        if (room.inscriptions) {
            room.inscriptions.forEach(insc => {
                this.mason.buildInscription({
                    text: insc.text, x: insc.x, y: insc.y,
                    fontSize: insc.fontSize || 12,
                    color: insc.color || 'rgba(212,175,55,0.5)',
                    fontFamily: insc.fontFamily || "'Cinzel',serif",
                    z: insc.z || 10,
                    animation: insc.animation,
                });
            });
        }
    }

    // ═══════════════════════════════════
    // BACKGROUND
    // ═══════════════════════════════════

    _buildBackground() {
        const bg = this.scene.background;
        const size = this.scene.size;

        if (bg === 'ouranos' || bg.type === 'ouranos') {
            this._setupOuranosCanvas(bg, size);
        } else if (bg === 'pontus' || bg.type === 'pontus') {
            this._setupPontusCanvas(bg, size);
        } else if (bg === 'starfield' || bg.type === 'starfield') {
            this._setupStarfieldCanvas(bg, size);
        } else if (typeof bg === 'string') {
            this.container.style.background = bg;
        }
    }

    _setupOuranosCanvas(bg, size) {
        const canvas = document.createElement('canvas');
        canvas.id = 'ouranos-bg';
        canvas.width = size.w;
        canvas.height = size.h;
        canvas.style.cssText = 'position:absolute;left:0;top:0;z-index:-5;pointer-events:none;';
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const W = size.w, H = size.h;
        const cx = W / 2, cy = H / 2;

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.55);
            grad.addColorStop(0, 'rgba(12,16,40,0.95)');
            grad.addColorStop(1, 'rgba(2,4,15,0.99)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            ctx.strokeStyle = 'rgba(201,168,76,0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 7]);
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(W, H) * 0.4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            for (let i = 0; i < 80; i++) {
                const sx = ((i * 137.5) % W);
                const sy = ((i * 97.3) % H);
                const twinkle = 0.2 + 0.3 * Math.sin(Date.now() * 0.001 + i);
                ctx.fillStyle = `rgba(200,210,240,${twinkle})`;
                ctx.fillRect(sx, sy, 1.2, 1.2);
            }

            this._ouranosFrame = requestAnimationFrame(draw);
        };
        draw();
        this.canvasLayers['ouranos'] = { canvas, ctx };
    }

    _setupPontusCanvas(bg, size) {
        const canvas = document.createElement('canvas');
        canvas.id = 'pontus-bg';
        canvas.width = size.w;
        canvas.height = size.h;
        canvas.style.cssText = 'position:absolute;left:0;top:0;z-index:-4;pointer-events:none;';
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const W = size.w, H = size.h;
        const waveTitans = [
            { freq: 0.8, amp: 1.0, color: [30, 100, 160] },
            { freq: 0.9, amp: 0.7, color: [40, 110, 170] },
            { freq: 1.0, amp: 0.6, color: [35, 105, 165] },
            { freq: 0.7, amp: 0.9, color: [25, 95, 155] },
            { freq: 1.1, amp: 0.5, color: [45, 115, 175] },
        ];
        const offsets = waveTitans.map(() => Math.random() * Math.PI * 2);

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, '#0a1828');
            bgGrad.addColorStop(1, '#1a3048');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            waveTitans.forEach((t, i) => {
                offsets[i] += 0.01 * t.freq;
                const yC = 30 + i * (H / 6);
                const amp = 6 + t.amp * 12;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${t.color[0]},${t.color[1]},${t.color[2]},0.4)`;
                ctx.lineWidth = 1.2;
                for (let x = 0; x <= W; x += 3) {
                    const y = yC + Math.sin(x * 0.005 + offsets[i]) * amp + Math.sin(x * 0.012 + offsets[i] * 0.7) * (amp * 0.3);
                    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            });

            this._pontusFrame = requestAnimationFrame(draw);
        };
        draw();
        this.canvasLayers['pontus'] = { canvas, ctx };
    }

    _setupStarfieldCanvas(bg, size) {
        const canvas = document.createElement('canvas');
        canvas.id = 'starfield-bg';
        canvas.width = size.w;
        canvas.height = size.h;
        canvas.style.cssText = 'position:absolute;left:0;top:0;z-index:-3;pointer-events:none;';
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const W = size.w, H = size.h;
        const stars = Array.from({ length: 50 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.2, a: Math.random() * 0.5 + 0.1,
            tw: Math.random() * Math.PI * 2,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            stars.forEach(s => {
                const a = s.a * (0.7 + 0.3 * Math.sin(Date.now() * 0.001 + s.tw));
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,216,228,${a})`;
                ctx.fill();
            });
            this._starFrame = requestAnimationFrame(draw);
        };
        draw();
        this.canvasLayers['starfield'] = { canvas, ctx };
    }

    // ═══════════════════════════════════
    // ALTAR RING
    // ═══════════════════════════════════

    _buildAltarRing() {
        const ring = this.scene.altarRing;
        const altars = ring.altars || [];

        const processedAltars = altars.map(altar => ({
            ...altar,
            material: altar.material || 'marble_white',
            interaction: altar.interaction || {
                label: `Approach the Altar of ${altar.name || altar.god}`,
                action: (a) => { if (this.onAltarInteract) this.onAltarInteract(a.god, a); },
            },
        }));

        this.mason.buildAltarRing({
            centerX: ring.centerX || this.scene.size.w / 2,
            centerY: ring.centerY || this.scene.size.h / 2,
            radius: ring.radius || 200,
            altars: processedAltars,
            hearthSize: ring.hearthSize || 60,
        });

        this.container.addEventListener('altar-interact', (e) => {
            if (this.onAltarInteract) this.onAltarInteract(e.detail.god, e.detail.altar);
        });
    }

    // ═══════════════════════════════════
    // HEARTH
    // ═══════════════════════════════════

    _buildHearth() {
        const hearth = this.scene.hearth;
        const size = this.scene.size;

        this.mason.buildCentralHearth(hearth.x || size.w / 2, hearth.y || size.h / 2, hearth.size || 60);

        const flame = document.createElement('div');
        flame.style.cssText = `
            position:absolute; left:${(hearth.x || size.w/2)-15}px; top:${(hearth.y || size.h/2)-20}px;
            width:30px; height:40px;
            background:radial-gradient(ellipse at 50% 30%,#ffd700,#ffaa00 40%,#c44f1c 80%);
            border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
            z-index:12; pointer-events:none;
            animation:hearthFlame 1.5s ease-in-out infinite;
        `;
        this.container.appendChild(flame);
        this.builtElements.push(flame);

        const glow = document.createElement('div');
        glow.style.cssText = `
            position:absolute; left:${(hearth.x || size.w/2)-50}px; top:${(hearth.y || size.h/2)-40}px;
            width:100px; height:80px;
            background:radial-gradient(ellipse,rgba(255,180,30,0.3) 0%,transparent 70%);
            border-radius:50%; z-index:11; pointer-events:none;
            animation:gaiaLightPulse 3s ease-in-out infinite;
        `;
        this.container.appendChild(glow);
        this.builtElements.push(glow);
    }

    // ═══════════════════════════════════
    // FLOOR (standalone, outside of room)
    // ═══════════════════════════════════

    _buildFloor() {
        const floor = this.scene.floor;
        const size = this.scene.size;
        const mat = this.resolveMaterial(floor.material);

        this.mason.buildFloor({
            ...mat,
            x: floor.x || 0,
            y: floor.y || size.h * 0.7,
            width: floor.width || size.w,
            height: floor.height || size.h * 0.3,
            z: 0,
            perspectiveStrength: floor.perspective || 10,
        });
    }

    // ═══════════════════════════════════
    // OBJECTS (top-level, outside of room)
    // ═══════════════════════════════════

    _buildObjects() {
        if (!this.scene.objects) return;
        this.scene.objects.forEach(obj => {
            switch (obj.type) {
                case 'offering_bowl':
                    this.mason.buildOfferingBowl({ x: obj.x, y: obj.y, z: obj.z || 15, material: obj.material || 'gold_leaf' });
                    break;
                case 'pillar':
                    this.mason.buildPillar({ ...this.resolveMaterial(obj.material), x: obj.x, y: obj.y, width: obj.width || 30, height: obj.height || 150, z: obj.z || 8, capital: obj.capital !== false });
                    break;
                case 'arch':
                    this.mason.buildArch({ ...this.resolveMaterial(obj.material), cx: obj.x + (obj.width||100)/2, cy: obj.y, innerRadius: (obj.width||100)/2, stoneCount: obj.stoneCount||15, stoneDepth: obj.stoneDepth||20, z: obj.z||12 });
                    break;
                case 'brazier':
                    const bmat = this.resolveMaterial(obj.material);
                    this.mason.buildWall({ ...bmat, x: obj.x, y: obj.y+25, width: 60, height: 30, z: obj.z||10 });
                    this.mason.buildWall({ ...GaiaMason.mat('flame_gold'), x: obj.x+10, y: obj.y+5, width: 40, height: 25, z: (obj.z||10)+1 });
                    break;
                default:
                    this._placeObject(obj.type, obj.x, obj.y, obj);
            }
        });
    }

    // ═══════════════════════════════════
    // INSCRIPTIONS (top-level)
    // ═══════════════════════════════════

    _buildInscriptions() {
        if (!this.scene.inscriptions) return;
        this.scene.inscriptions.forEach(insc => {
            this.mason.buildInscription({
                text: insc.text, x: insc.x, y: insc.y,
                fontSize: insc.fontSize || 14,
                color: insc.color || 'rgba(212,175,55,0.5)',
                fontFamily: insc.fontFamily || "'Cinzel',serif",
                z: insc.z || 10,
                animation: insc.animation,
            });
        });
    }

    // ═══════════════════════════════════
    // EXITS
    // ═══════════════════════════════════

    _buildExits() {
        if (!this.scene.exits) return;
        this.scene.exits.forEach(exit => {
            const size = this.scene.size;
            let x, y, w, h;
            switch (exit.direction) {
                case 'south': x = size.w/2-40; y = size.h-50; w = 80; h = 45; break;
                case 'north': x = size.w/2-40; y = 5; w = 80; h = 40; break;
                case 'east': x = size.w-45; y = size.h/2-40; w = 40; h = 80; break;
                case 'west': x = 5; y = size.h/2-40; w = 40; h = 80; break;
                default: x = exit.x || size.w/2-40; y = exit.y || size.h-50; w = exit.w || 80; h = exit.h || 45;
            }
            const zone = document.createElement('div');
            zone.className = 'zone';
            zone.title = exit.label || 'Exit';
            zone.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:35;cursor:pointer;`;
            zone.addEventListener('click', () => {
                if (this.onExit) this.onExit(exit);
                if (exit.target) setTimeout(() => { window.location.href = exit.target + (exit.param ? `?from=gwalenn` : ''); }, 600);
            });
            this.container.appendChild(zone);
            this.interactiveZones.push({ el: zone, exit });
        });
    }

    // ═══════════════════════════════════
    // ATMOSPHERE
    // ═══════════════════════════════════

    _buildAtmosphere() {
        const atm = this.scene.atmosphere;
        if (!atm) return;
        if (atm.lights) {
            atm.lights.forEach(light => {
                this.mason.buildLight({
                    color: light.color || '#d4af37', radius: light.radius || 150,
                    x: light.x || '50%', y: light.y || '45%',
                    pulse: light.pulse !== false, z: light.z || 0,
                });
            });
        }
        if (atm.particles) {
            atm.particles.forEach(p => this._spawnParticles(p));
        }
    }

    _spawnParticles(config) {
        const count = config.count || 15;
        const color = config.color || 'rgba(244,228,193,0.3)';
        const minSize = config.minSize || 1;
        const maxSize = config.maxSize || 3;
        const zone = config.zone || { x: 0, y: 0, w: this.scene.size.w, h: this.scene.size.h };
        const z = config.z || 3;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = minSize + Math.random() * (maxSize - minSize);
            const dur = 10 + Math.random() * 20;
            const delay = Math.random() * 10;
            particle.style.cssText = `
                position:absolute; left:${zone.x + Math.random()*zone.w}px; top:${zone.y + Math.random()*zone.h}px;
                width:${size}px; height:${size}px; background:${color}; border-radius:50%;
                pointer-events:none; z-index:${z};
                animation:particleFloat ${dur}s linear ${delay}s infinite;
            `;
            this.container.appendChild(particle);
            this.builtElements.push(particle);
        }
    }

    // ═══════════════════════════════════
    // STATE BINDINGS
    // ═══════════════════════════════════

    _refreshBindings() {
        if (!this.state) return;
    }

    // ═══════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════

    destroy() {
        if (this._ouranosFrame) cancelAnimationFrame(this._ouranosFrame);
        if (this._pontusFrame) cancelAnimationFrame(this._pontusFrame);
        if (this._starFrame) cancelAnimationFrame(this._starFrame);
        this.container.innerHTML = '';
        this.builtElements = [];
        this.canvasLayers = {};
        this.interactiveZones = [];
    }
}

// ═══════════════════════════════════
// GLOBAL PARTICLE ANIMATION
// ═══════════════════════════════════

if (!document.getElementById('gaia-scene-loader-styles')) {
    const style = document.createElement('style');
    style.id = 'gaia-scene-loader-styles';
    style.textContent = `
        @keyframes particleFloat {
            0% { transform: translateY(0) translateX(0); opacity: 0.3; }
            50% { opacity: 0.6; }
            100% { transform: translateY(-80px) translateX(12px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ═══════════════════════════════════
// EXPORT
// ═══════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaiaSceneLoader;
}
