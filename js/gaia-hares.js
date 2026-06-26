// ══════════════════════════════════════════════
// GAIA HARES · Autonomous Browser Species
// gaia/js/gaia-hares.js
// 
// The Hare Engine. Detects dispatched hares,
// renders them in the page, handles interactions,
// and writes updated state back to localStorage.
// ══════════════════════════════════════════════

const GaiaHares = (() => {
  
  // ═══════════════════════════════════
  // HARE TEMPLATE (also see json/hare.json)
  // ═══════════════════════════════════
  
  const HARE_TEMPLATE = {
    id: null,
    name: 'Wanderer',
    glyph: '🐇',
    god: 'Demeter',
    godColor: '#88bb66',
    traits: [],
    generation: 1,
    energy: 100,
    inventory: [],
    currentTask: null,
    pilgrimage: false,
    artifactsFound: []
  };
  
  const HARE_GLYPHS = ['🐇','🐰','🐇','🐰','🐇','🐰'];
  const TRAIT_POOL = ['speed','endurance','luck','cunning','strength','beauty','wisdom','radiance','stealth','fury','grace','patience'];
  
  // ═══════════════════════════════════
  // REALM REGISTRY
  // Each realm registers its edible elements,
  // collectible items, and artifact location
  // ═══════════════════════════════════
  
  const REALM_REGISTRY = {
    demeter: {
      name: 'Demeter\'s Fields',
      edibleSelectors: ['.tree', '.canopy', '.crop', '.bloom', '.sapling'],
      collectibleItems: [
        { item: '🌾', name: 'Wheat', selector: '.wheat-row' },
        { item: '🥕', name: 'Carrot', selector: '.carrot-row' },
        { item: '🍯', name: 'Honey', selector: '.hive-cell' },
        { item: '🌿', name: 'Herb', selector: '.herb' },
      ],
      artifact: { id: 'demeter_seed', glyph: '🌾', selector: '[data-artifact="demeter_seed"]' },
      plantable: true
    },
    apollo: {
      name: 'Apollo\'s Realm',
      edibleSelectors: [],
      collectibleItems: [
        { item: '✨', name: 'Solar Fragment', selector: '.flare' },
        { item: '☀️', name: 'Sunbeam', selector: '.sun-card' },
      ],
      artifact: { id: 'apollo_lyre', glyph: '☀️', selector: '[data-artifact="apollo_lyre"]' },
      plantable: false
    },
    zeus: {
      name: 'Mount Olympus',
      edibleSelectors: [],
      collectibleItems: [
        { item: '⚡', name: 'Spark', selector: '.thunderbolt' },
      ],
      artifact: { id: 'zeus_thunderbolt', glyph: '⚡', selector: '[data-artifact="zeus_thunderbolt"]' },
      plantable: false
    },
    // Default for unregistered realms
    _default: {
      name: 'Unknown Realm',
      edibleSelectors: [],
      collectibleItems: [],
      artifact: null,
      plantable: false
    }
  };
  
  // ═══════════════════════════════════
  // DETECT DISPATCHED HARES
  // Call on page load. Returns array of
  // hares assigned to this realm.
  // ═══════════════════════════════════
  
  function detectHares(realmName) {
    const found = [];
    
    // Scan all localStorage keys for hare dispatches
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith('hare_dispatch_')) continue;
      
      try {
        const dispatch = JSON.parse(localStorage.getItem(key));
        if (dispatch.realm === realmName) {
          // Check if dispatch is recent (within 5 minutes)
          const age = Date.now() - dispatch.timestamp;
          if (age < 300000) {
            found.push(dispatch);
          }
        }
      } catch(e) { /* skip corrupted entries */ }
    }
    
    return found;
  }
  
  // ═══════════════════════════════════
  // RENDER A HARE IN THE PAGE
  // Creates a small GaiaMason figure or
  // DOM element representing the hare
  // ═══════════════════════════════════
  
  function renderHare(dispatch, container) {
    const hare = dispatch.hare;
    const task = dispatch.task;
    
    // Create hare element
    const hareEl = document.createElement('div');
    hareEl.className = 'gaia-hare';
    hareEl.id = `hare-${hare.id}`;
    hareEl.title = `${hare.name} · ${hare.god} · ${task}`;
    hareEl.style.cssText = `
      position: absolute; z-index: 100; cursor: pointer;
      font-size: 2rem; transition: all 0.5s ease;
      filter: drop-shadow(0 0 8px ${hare.godColor || '#c9a84c'});
      animation: hareHop 0.8s ease-in-out infinite alternate;
    `;
    hareEl.textContent = hare.glyph || '🐇';
    
    // Position randomly in container
    const containerRect = container.getBoundingClientRect();
    const x = 50 + Math.random() * (containerRect.width - 100);
    const y = 50 + Math.random() * (containerRect.height - 150);
    hareEl.style.left = x + 'px';
    hareEl.style.top = y + 'px';
    
    // Task badge
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
      font-family: 'Cinzel', serif; font-size: 0.4rem; white-space: nowrap;
      background: rgba(10,8,6,0.8); padding: 0.1rem 0.4rem; border-radius: 2px;
      color: #c9a84c; letter-spacing: 0.08em;
    `;
    badge.textContent = task;
    hareEl.appendChild(badge);
    
    // Inventory count badge
    if (hare.inventory && hare.inventory.length > 0) {
      const invBadge = document.createElement('div');
      invBadge.style.cssText = `
        position: absolute; bottom: -14px; left: 50%; transform: translateX(-50%);
        font-family: 'Cinzel', serif; font-size: 0.35rem; white-space: nowrap;
        background: rgba(10,8,6,0.8); padding: 0.1rem 0.3rem; border-radius: 2px;
        color: #aabb88; letter-spacing: 0.06em;
      `;
      invBadge.textContent = `${hare.inventory.length} items`;
      hareEl.appendChild(invBadge);
    }
    
    container.appendChild(hareEl);
    
    // Add hop animation if not exists
    if (!document.getElementById('hare-hop-style')) {
      const style = document.createElement('style');
      style.id = 'hare-hop-style';
      style.textContent = `
        @keyframes hareHop {
          0% { transform: translateY(0); }
          100% { transform: translateY(-6px); }
        }
        .gaia-hare:hover { filter: brightness(1.4) drop-shadow(0 0 14px currentColor) !important; transform: scale(1.2) !important; z-index: 200 !important; }
      `;
      document.head.appendChild(style);
    }
    
    return hareEl;
  }
  
  // ═══════════════════════════════════
  // HARE INTERACTION — NIBBLE
  // Hare eats a DOM element, reducing it
  // ═══════════════════════════════════
  
  function nibble(hare, targetElement) {
    if (!targetElement) return false;
    
    const currentOpacity = parseFloat(targetElement.style.opacity || 1);
    const newOpacity = Math.max(0.1, currentOpacity - 0.15);
    targetElement.style.opacity = newOpacity;
    targetElement.style.transition = 'opacity 0.5s ease';
    
    // Add fiber to inventory
    const existingFiber = hare.inventory.find(i => i.item === '🌿');
    if (existingFiber) {
      existingFiber.qty = (existingFiber.qty || 1) + 1;
    } else {
      hare.inventory.push({ item: '🌿', qty: 1 });
    }
    
    // Leave trace
    const trace = document.createElement('span');
    trace.textContent = '🐾';
    trace.style.cssText = 'position:absolute;font-size:0.6rem;pointer-events:none;opacity:0.4;';
    trace.style.left = (Math.random() * 80 + 10) + '%';
    trace.style.top = (Math.random() * 80 + 10) + '%';
    if (targetElement.style.position !== 'absolute' && targetElement.style.position !== 'relative') {
      targetElement.style.position = 'relative';
    }
    targetElement.appendChild(trace);
    setTimeout(() => { if (trace.parentNode) trace.remove(); }, 30000);
    
    return true;
  }
  
  // ═══════════════════════════════════
  // HARE INTERACTION — COLLECT
  // Hare gathers an item from the page
  // ═══════════════════════════════════
  
  function collect(hare, itemType, targetElement) {
    const existing = hare.inventory.find(i => i.item === itemType);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      hare.inventory.push({ item: itemType, qty: 1 });
    }
    
    // Visual feedback on target
    if (targetElement) {
      const sparkle = document.createElement('span');
      sparkle.textContent = '✨';
      sparkle.style.cssText = 'position:absolute;font-size:0.8rem;pointer-events:none;animation:sparkFade 1s ease-out forwards;z-index:150;';
      sparkle.style.left = (Math.random() * 80 + 10) + '%';
      sparkle.style.top = (Math.random() * 80 + 10) + '%';
      if (targetElement.style.position !== 'absolute' && targetElement.style.position !== 'relative') {
        targetElement.style.position = 'relative';
      }
      targetElement.appendChild(sparkle);
      setTimeout(() => { if (sparkle.parentNode) sparkle.remove(); }, 1200);
    }
    
    return true;
  }
  
  // ═══════════════════════════════════
  // HARE INTERACTION — FIND ARTIFACT
  // Pilgrim hare claims a relic
  // ═══════════════════════════════════
  
  function findArtifact(hare, artifactId) {
    if (!hare.pilgrimage && hare.currentTask !== 'pilgrimage') return false;
    if (hare.artifactsFound.includes(artifactId)) return false;
    
    hare.artifactsFound.push(artifactId);
    return true;
  }
  
  // ═══════════════════════════════════
  // WRITE HARE STATE BACK
  // Updates the dispatch in localStorage
  // ═══════════════════════════════════
  
  function updateDispatch(hareId, updatedHare) {
    const key = `hare_dispatch_${hareId}`;
    const dispatch = JSON.parse(localStorage.getItem(key) || 'null');
    if (!dispatch) return false;
    
    dispatch.hare = { ...dispatch.hare, ...updatedHare };
    localStorage.setItem(key, JSON.stringify(dispatch));
    return true;
  }
  
  // ═══════════════════════════════════
  // REMOVE HARE FROM PAGE
  // Cleans up the dispatch when hare leaves
  // ═══════════════════════════════════
  
  function departHare(hareId) {
    const key = `hare_dispatch_${hareId}`;
    localStorage.removeItem(key);
    
    const hareEl = document.getElementById(`hare-${hareId}`);
    if (hareEl) {
      hareEl.style.opacity = '0';
      hareEl.style.transform = 'scale(0.5)';
      setTimeout(() => { if (hareEl.parentNode) hareEl.remove(); }, 500);
    }
  }
  
  // ═══════════════════════════════════
  // AUTO-RUN: Process all hares for a realm
  // Call this on page load. It detects,
  // renders, and runs hare interactions.
  // ═══════════════════════════════════
  
  function processRealm(realmName, container) {
    const dispatches = detectHares(realmName);
    if (!dispatches.length) return [];
    
    const realmConfig = REALM_REGISTRY[realmName] || REALM_REGISTRY._default;
    const rendered = [];
    
    dispatches.forEach(dispatch => {
      const hareEl = renderHare(dispatch, container || document.body);
      rendered.push({ dispatch, hareEl });
      
      const hare = dispatch.hare;
      const task = dispatch.task;
      
      // Perform task after a short delay
      setTimeout(() => {
        switch(task) {
          case 'nibble':
            if (realmConfig.edibleSelectors.length > 0) {
              const selector = realmConfig.edibleSelectors[Math.floor(Math.random() * realmConfig.edibleSelectors.length)];
              const targets = document.querySelectorAll(selector);
              if (targets.length > 0) {
                const target = targets[Math.floor(Math.random() * targets.length)];
                const targetRect = target.getBoundingClientRect();
                hareEl.style.left = (targetRect.left + targetRect.width/2 - 16) + 'px';
                hareEl.style.top = (targetRect.top + targetRect.height/2 - 16) + 'px';
                
                setTimeout(() => {
                  nibble(hare, target);
                  updateDispatch(hare.id, hare);
                }, 600);
              }
            }
            break;
            
          case 'scout':
          case 'harvest':
            if (realmConfig.collectibleItems.length > 0) {
              const item = realmConfig.collectibleItems[Math.floor(Math.random() * realmConfig.collectibleItems.length)];
              const targets = document.querySelectorAll(item.selector);
              if (targets.length > 0) {
                const target = targets[Math.floor(Math.random() * targets.length)];
                const targetRect = target.getBoundingClientRect();
                hareEl.style.left = (targetRect.left + targetRect.width/2 - 16) + 'px';
                hareEl.style.top = (targetRect.top + targetRect.height/2 - 16) + 'px';
                
                setTimeout(() => {
                  collect(hare, item.item, target);
                  updateDispatch(hare.id, hare);
                }, 600);
              }
            }
            break;
            
          case 'pilgrimage':
            if (realmConfig.artifact) {
              const artifactTarget = document.querySelector(realmConfig.artifact.selector);
              if (artifactTarget) {
                const targetRect = artifactTarget.getBoundingClientRect();
                hareEl.style.left = (targetRect.left + targetRect.width/2 - 16) + 'px';
                hareEl.style.top = (targetRect.top + targetRect.height/2 - 16) + 'px';
                
                setTimeout(() => {
                  const found = findArtifact(hare, realmConfig.artifact.id);
                  if (found) {
                    updateDispatch(hare.id, hare);
                    // Visual burst
                    const burst = document.createElement('div');
                    burst.style.cssText = `
                      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
                      width: 40px; height: 40px; border-radius: 50%;
                      background: radial-gradient(circle, rgba(255,200,60,0.6), transparent);
                      pointer-events: none; z-index: 150;
                      animation: artifactBurst 1.5s ease-out forwards;
                    `;
                    hareEl.appendChild(burst);
                    setTimeout(() => burst.remove(), 1600);
                    
                    if (!document.getElementById('artifact-burst-style')) {
                      const style = document.createElement('style');
                      style.id = 'artifact-burst-style';
                      style.textContent = '@keyframes artifactBurst { 0%{transform:translate(-50%,-50%) scale(0.5);opacity:1} 100%{transform:translate(-50%,-50%) scale(3);opacity:0} }';
                      document.head.appendChild(style);
                    }
                  }
                }, 600);
              }
            }
            break;
        }
        
        // Depart after task completes (8-15 seconds)
        const departTime = 8000 + Math.random() * 7000;
        setTimeout(() => {
          updateDispatch(hare.id, hare);
          departHare(hare.id);
        }, departTime);
        
      }, 1500 + Math.random() * 2000);
    });
    
    return rendered;
  }
  
  // ═══════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════
  
  return {
    detectHares,
    renderHare,
    processRealm,
    nibble,
    collect,
    findArtifact,
    updateDispatch,
    departHare,
    REALM_REGISTRY,
    HARE_TEMPLATE,
    HARE_GLYPHS,
    TRAIT_POOL
  };
  
})();

// ═══════════════════════════════════
// AUTO-ADD SPARKFADE KEYFRAMES
// ═══════════════════════════════════
if (!document.getElementById('gaia-hares-styles')) {
  const style = document.createElement('style');
  style.id = 'gaia-hares-styles';
  style.textContent = `
    @keyframes sparkFade {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    @keyframes artifactBurst {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
    }
    @keyframes hareHop {
      0% { transform: translateY(0); }
      100% { transform: translateY(-6px); }
    }
    .gaia-hare {
      cursor: pointer; transition: all 0.5s ease;
      filter: drop-shadow(0 0 8px #c9a84c);
      animation: hareHop 0.8s ease-in-out infinite alternate;
    }
    .gaia-hare:hover {
      filter: brightness(1.4) drop-shadow(0 0 14px currentColor) !important;
      transform: scale(1.2) !important; z-index: 200 !important;
    }
  `;
  document.head.appendChild(style);
}

console.log('🐇 Gaia Hares engine loaded. Call GaiaHares.processRealm("demeter", document.body) to activate.');
