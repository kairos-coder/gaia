// ═══════════════════════════════════════
// GAIA OBJECT RENDERER · Sacred Object Placer
// gaia/js/gaia-object-renderer.js
//
// Reads altar-objects.json. Renders offering bowls,
// braziers, tripods, lyres, thunderbolts, and other
// sacred objects onto Olympian altars.
// ═══════════════════════════════════════

class GaiaObjectRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`GaiaObjectRenderer: "#${containerId}" not found`);
        this.mason = null;
        this.objects = {};
        this.placedObjects = [];
    }

    setMason(mason) {
        this.mason = mason;
    }

    async loadObjects(objectsUrl) {
        const resp = await fetch(objectsUrl);
        if (!resp.ok) throw new Error(`GaiaObjectRenderer: ${resp.status} loading ${objectsUrl}`);
        const data = await resp.json();
        this.objects = data;
    }

    place(objectName, x, y, config = {}) {
        if (!this.mason) throw new Error('GaiaObjectRenderer: no mason set. Call setMason() first.');

        const objDef = this.objects[objectName];
        if (!objDef) {
            console.warn(`GaiaObjectRenderer: object "${objectName}" not found`);
            // Fallback: render as inscription
            this.mason.buildInscription({
                text: objectName,
                x, y,
                fontSize: 12,
                color: 'rgba(200,180,150,0.5)',
                fontFamily: "'Cinzel',serif",
                z: 10,
            });
            return null;
        }

        // Render each layer
        for (const layer of objDef.layers || []) {
            const lx = x + (layer.position?.x || 0);
            const ly = y + (layer.position?.y || 0);
            const lw = layer.dimensions?.width || 60;
            const lh = layer.dimensions?.height || 60;
            const matName = layer.material || 'marble_white';
            const mat = GaiaMason.mat(matName);

            switch (layer.type) {
                case 'wall':
                    this.mason.buildWall({
                        ...mat,
                        x: lx, y: ly,
                        width: lw, height: lh,
                        z: layer.position?.z || 10,
                    });
                    break;
                case 'pillar':
                    this.mason.buildPillar({
                        ...mat,
                        x: lx, y: ly,
                        width: lw, height: lh,
                        z: layer.position?.z || 10,
                        capital: layer.capital,
                    });
                    break;
                case 'inscription':
                    this.mason.buildInscription({
                        text: layer.content || '',
                        x: lx, y: ly,
                        fontSize: layer.style?.fontSize || 14,
                        color: layer.style?.color || 'rgba(212,175,55,0.5)',
                        fontFamily: layer.style?.fontFamily || "'Cinzel',serif",
                        z: layer.position?.z || 12,
                        animation: layer.style?.animation,
                    });
                    break;
            }
        }

        // Build interaction zone
        if (objDef.interaction && config.interactive !== false) {
            const interaction = objDef.interaction;
            const zoneX = x + (interaction.zone?.x || 0);
            const zoneY = y + (interaction.zone?.y || 0);
            const zoneW = interaction.zone?.width || (objDef.bounds?.width || 60);
            const zoneH = interaction.zone?.height || (objDef.bounds?.height || 60);

            const zone = document.createElement('div');
            zone.className = 'altar-object-zone';
            zone.title = interaction.label || objectName;
            zone.style.cssText = `
                position: absolute;
                left: ${zoneX}px; top: ${zoneY}px;
                width: ${zoneW}px; height: ${zoneH}px;
                z-index: 30; cursor: pointer;
            `;
            zone.addEventListener('click', (e) => {
                e.stopPropagation();
                zone.dispatchEvent(new CustomEvent('object-interact', {
                    detail: {
                        object: objectName,
                        action: interaction.action,
                        label: interaction.label,
                        x, y,
                    },
                    bubbles: true,
                }));
            });
            this.container.appendChild(zone);
            this.placedObjects.push({ el: zone, name: objectName, config });
        }

        return { name: objectName, x, y, def: objDef };
    }

    placeOnAltar(objectName, altarX, altarY, config = {}) {
        // Center the object on the altar
        const objDef = this.objects[objectName];
        const bounds = objDef?.bounds || { width: 50, height: 50 };
        const ox = altarX + 50 - bounds.width / 2;
        const oy = altarY + 35 - bounds.height / 2;
        return this.place(objectName, ox, oy, config);
    }

    clear() {
        this.placedObjects.forEach(p => {
            if (p.el && p.el.parentNode) p.el.remove();
        });
        this.placedObjects = [];
    }
}

// ═══════════════════════════════════
// EXPORT
// ═══════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaiaObjectRenderer;
}
