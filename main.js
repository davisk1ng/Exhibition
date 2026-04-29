const hillsLayer = document.getElementById('hillsLayer');
const cityLandscape = document.getElementById('cityLandscape');
const stripLayer = document.getElementById('stripLayer');
const buildingsContainer = document.getElementById('buildings');
const foregroundBillboards = document.getElementById('foregroundBillboards');
const fullscreenBtn = document.getElementById('fullscreenBtn');

if (fullscreenBtn) {
  const updateFullscreenButton = () => {
    const isFullscreen = !!document.fullscreenElement;
    fullscreenBtn.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
  };

  fullscreenBtn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_err) {
      // Ignore rejected fullscreen requests (browser/user policy).
    }
    updateFullscreenButton();
  });

  document.addEventListener('fullscreenchange', updateFullscreenButton);
  updateFullscreenButton();
}

const foregroundSpacing = 460;

const BILLBOARD_MEDIA = [];
for (let i = 1; i <= 9; i++) {
  BILLBOARD_MEDIA.push({ type: 'image', src: `assets/screenshots/example${i}.jpg`, size: i % 3 === 0 ? 'mobile' : 'web' });
  BILLBOARD_MEDIA.push({ type: 'video', src: `assets/videos/example${i}.mp4`, size: i % 2 === 0 ? 'web' : 'mobile' });
}
const foregroundBillboardCount = Math.max(1, Math.floor(BILLBOARD_MEDIA.length / 3));
const frontRowMediaCount = Math.max(1, Math.floor(foregroundBillboardCount / 2));
const sceneWidth = Math.max(
  window.innerWidth * 4,
  800 + (foregroundBillboardCount - 1) * foregroundSpacing
);
const layerWidth = sceneWidth * 2 + window.innerWidth;

hillsLayer.style.width = `${layerWidth}px`;
cityLandscape.style.width = `${layerWidth}px`;
stripLayer.style.width = `${layerWidth}px`;
buildingsContainer.style.width = `${layerWidth}px`;
foregroundBillboards.style.width = `${layerWidth}px`;

function createBillboard(media, variant, idx) {
  const frame = document.createElement('div');
  frame.className = `billboard-frame ${variant}`;

  const billboard = document.createElement('div');
  billboard.className = `billboard ${media.size}`;

  if (media.type === 'image') {
    const img = document.createElement('img');
    img.src = media.src;
    img.alt = 'Showcase';
    billboard.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.src = media.src;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    billboard.appendChild(video);
  }

  frame.appendChild(billboard);
  return frame;
}

function buildHills() {
  const baseHillCount = Math.ceil(sceneWidth / 260) + 3;
  const hillSpecs = [];
  for (let i = 0; i < baseHillCount; i++) {
    hillSpecs.push({
      className: `hill-shape hill-${(i % 3) + 1}`,
      width: 260 + Math.random() * 220,
      height: 100 + Math.random() * 90,
      left: i * 260,
    });
  }

  for (let copy = 0; copy < 2; copy++) {
    hillSpecs.forEach((spec) => {
      const hill = document.createElement('div');
      hill.className = spec.className;
      hill.style.width = `${spec.width}px`;
      hill.style.height = `${spec.height}px`;
      hill.style.left = `${spec.left + copy * sceneWidth}px`;
      hillsLayer.appendChild(hill);
    });
  }
}

function buildCityLandscape() {
  const mountainCount = Math.ceil(sceneWidth / 230) + 3;
  const mountainSpecs = [];
  for (let i = 0; i < mountainCount; i++) {
    mountainSpecs.push({
      left: i * 230 + (Math.random() * 60),
      width: 180 + Math.random() * 120,
      height: 80 + Math.random() * 90,
    });
  }

  const towerCount = Math.ceil(sceneWidth / 95) + 6;
  const towerSpecs = [];
  for (let i = 0; i < towerCount; i++) {
    towerSpecs.push({
      left: i * 95,
      width: 30 + Math.random() * 55,
      height: 70 + Math.random() * 170,
    });
  }

  const cloudSpecs = [];
  for (let i = 0; i < 4; i++) {
    cloudSpecs.push({
      left: 200 + i * 520,
      top: 35 + (i % 2) * 30,
    });
  }

  for (let copy = 0; copy < 2; copy++) {
    mountainSpecs.forEach((spec) => {
      const mountain = document.createElement('div');
      mountain.className = 'mountain-shape';
      mountain.style.left = `${spec.left + copy * sceneWidth}px`;
      mountain.style.width = `${spec.width}px`;
      mountain.style.height = `${spec.height}px`;
      cityLandscape.appendChild(mountain);
    });

    towerSpecs.forEach((spec) => {
      const tower = document.createElement('div');
      tower.className = 'skyline-tower';
      tower.style.height = `${spec.height}px`;
      tower.style.width = `${spec.width}px`;
      tower.style.left = `${spec.left + copy * sceneWidth}px`;
      cityLandscape.appendChild(tower);
    });

    cloudSpecs.forEach((spec) => {
      const cloud = document.createElement('div');
      cloud.className = 'cloud';
      cloud.style.left = `${spec.left + copy * sceneWidth}px`;
      cloud.style.top = `${spec.top}px`;
      cityLandscape.appendChild(cloud);
    });
  }

  const blimp = document.createElement('div');
  blimp.className = 'sky-blimp';
  blimp.style.top = `${8 + Math.floor(Math.random() * 26)}px`;
  blimp.style.animationDuration = `${34 + Math.floor(Math.random() * 16)}s`;
  blimp.style.animationDelay = `${-Math.floor(Math.random() * 18)}s`;

  const blimpBillboard = document.createElement('div');
  blimpBillboard.className = 'blimp-billboard';
  blimp.appendChild(blimpBillboard);
  cityLandscape.appendChild(blimp);
}

function buildStripAndBillboards() {
  const buildings = [];
  const baseBuildingCount = Math.ceil(sceneWidth / 130) + 8;
  const buildingSpecs = [];
  for (let i = 0; i < baseBuildingCount; i++) {
    const height = 180 + Math.random() * 220;
    const windowRows = 5 + Math.floor(Math.random() * 6);
    buildingSpecs.push({
      type: i % 4,
      height,
      width: 90 + Math.random() * 80,
      windowCount: windowRows * 3,
    });
  }

  for (let copy = 0; copy < 2; copy++) {
    buildingSpecs.forEach((spec) => {
      const building = document.createElement('div');
      building.className = `building type-${spec.type}`;
      building.style.height = `${spec.height}px`;
      building.style.width = `${spec.width}px`;

      const windows = document.createElement('div');
      windows.className = 'window-grid';
      for (let w = 0; w < spec.windowCount; w++) {
        const windowCell = document.createElement('span');
        windowCell.className = 'window-cell';
        if (Math.random() > 0.5) windowCell.classList.add('lit');
        windows.appendChild(windowCell);
      }
      building.appendChild(windows);

      const storefront = document.createElement('div');
      storefront.className = 'storefront-band';
      building.appendChild(storefront);

      const roof = document.createElement('div');
      roof.className = 'building-roof';
      building.appendChild(roof);

      buildingsContainer.appendChild(building);
      buildings.push(building);
    });
  }

  const foregroundStart = 220;
  const baseForegroundPositions = [];
  for (let x = foregroundStart; x <= sceneWidth + 300; x += foregroundSpacing * 2) {
    baseForegroundPositions.push(x);
  }
  for (let copy = 0; copy < 2; copy++) {
    baseForegroundPositions.forEach((x, idx) => {
      const media = BILLBOARD_MEDIA[idx % frontRowMediaCount];
      const frontFrame = createBillboard(media, 'foreground', idx + copy * baseForegroundPositions.length);
      frontFrame.style.left = `${x + copy * sceneWidth}px`;
      const centerPole = document.createElement('div');
      centerPole.className = 'billboard-pole roadside-pole center';
      frontFrame.appendChild(centerPole);
      foregroundBillboards.appendChild(frontFrame);
    });
  }

  const buildingsPerSegment = buildingSpecs.length;
  const canPlaceRooftopBillboard = (specs, idx, mediaSize) => {
    const current = specs[idx];
    if (!current) return false;

    const left = specs[Math.max(0, idx - 1)];
    const right = specs[Math.min(specs.length - 1, idx + 1)];
    const currentHeight = current.height;
    const neighborMax = Math.max(left ? left.height : 0, right ? right.height : 0);

    // Safeguard: wide billboards only mount on sufficiently tall/clear rooftops.
    if (mediaSize === 'web') {
      return currentHeight >= neighborMax + 30 && currentHeight >= 265 && current.width >= 120;
    }

    // Mobile billboards still need a modest clearance.
    return currentHeight >= neighborMax - 12;
  };

  for (let copy = 0; copy < 2; copy++) {
    let rooftopMediaIdx = 0;
    for (let localIndex = 1; localIndex < buildingsPerSegment; localIndex += 4) {
      const media = BILLBOARD_MEDIA[rooftopMediaIdx % BILLBOARD_MEDIA.length];
      rooftopMediaIdx++;
      if (!canPlaceRooftopBillboard(buildingSpecs, localIndex, media.size)) continue;
      const rooftopFrame = createBillboard(media, 'rooftop', localIndex + copy * buildingsPerSegment);
      const support = document.createElement('div');
      support.className = 'billboard-pole rooftop-pole';
      rooftopFrame.appendChild(support);

      const anchor = document.createElement('div');
      anchor.className = 'rooftop-anchor';
      anchor.appendChild(rooftopFrame);

      const buildingIndex = copy * buildingsPerSegment + localIndex;
      const targetBuilding = buildings[buildingIndex];
      if (targetBuilding) targetBuilding.appendChild(anchor);
    }
  }
}

function preventBillboardTouching(selector, minGap) {
  const frames = Array.from(document.querySelectorAll(selector));
  if (!frames.length) return;

  const ordered = frames
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .sort((a, b) => a.rect.left - b.rect.left);

  let lastRight = -Infinity;
  ordered.forEach((item) => {
    if (item.rect.left < lastRight + minGap) {
      item.el.style.display = 'none';
      return;
    }
    lastRight = item.rect.right;
  });
}

buildHills();
buildCityLandscape();
buildStripAndBillboards();
requestAnimationFrame(() => {
  preventBillboardTouching('.billboard-frame.foreground', 28);
  preventBillboardTouching('.billboard-frame.rooftop', 20);
});

let scrollPos = 0;
const baseSpeed = 0.55;
function autoScroll() {
  scrollPos += baseSpeed;
  const loopWidth = sceneWidth;
  if (scrollPos > loopWidth) scrollPos = 0;

  hillsLayer.style.transform = `translateX(${-scrollPos * 0.35}px)`;
  cityLandscape.style.transform = `translateX(${-scrollPos * 0.6}px)`;
  stripLayer.style.transform = `translateX(${-scrollPos * 0.9}px)`;
  foregroundBillboards.style.transform = `translateX(${-scrollPos}px)`;
  requestAnimationFrame(autoScroll);
}
autoScroll();

// Car visual update
const car = document.getElementById('car');
if (car) {
  car.className = 'car-fleet';
  const carColors = ['#e63946', '#3a86ff', '#ff7b00', '#8d5cf6', '#2ec4b6'];
  const carAccent = ['#f1faee', '#e9f3ff', '#ffe5cc', '#efe6ff', '#ddfff7'];
  for (let i = 0; i < 3; i++) {
    const sprite = document.createElement('div');
    sprite.className = 'car-sprite';
    sprite.style.setProperty('--car-color', carColors[Math.floor(Math.random() * carColors.length)]);
    sprite.style.setProperty('--car-accent', carAccent[Math.floor(Math.random() * carAccent.length)]);
    sprite.style.setProperty('--car-bottom', '102px');
    sprite.style.setProperty('--car-duration', `${9 + Math.random() * 5}s`);
    sprite.style.setProperty('--car-delay', `${-Math.random() * 8}s`);
    sprite.innerHTML = `
      <div class="car-body"></div>
      <div class="car-roof"></div>
      <div class="car-window"></div>
      <div class="car-window2"></div>
      <div class="car-headlight"></div>
      <div class="car-beam"></div>
      <div class="car-wheel"></div>
      <div class="car-wheel2"></div>
    `;
    car.appendChild(sprite);
  }
}
