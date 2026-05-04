const hillsLayer = document.getElementById('hillsLayer');
const cityLandscape = document.getElementById('cityLandscape');
const rearGroundBlock = document.getElementById('rearGroundBlock');
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

const screenshotFiles = ['1777300186.850243.jpg'];
const videoFiles = ['feed.mp4', 'final_cropped_bitebuddy.mp4', 'secret pokemon ending.mp4', 'tutorial.mp4', 'UV app.mp4', '256 Project 3.mp4', 'video-export-feed-4x5-hq.mov', 'video-export-story-9x16-hq.mov'];

function getVideoBillboardSize(fileName) {
  // Portrait exports should use tall billboards.
  return /story|9x16|vertical/i.test(fileName) ? 'video-tall' : 'video-wide';
}

const BILLBOARD_MEDIA = [];
screenshotFiles.forEach((fileName, idx) => {
  BILLBOARD_MEDIA.push({
    type: 'image',
    src: `assets/screenshots/${fileName}`,
    size: idx % 2 === 0 ? 'web' : 'mobile',
  });
});

videoFiles.forEach((fileName) => {
  BILLBOARD_MEDIA.push({
    type: 'video',
    src: `assets/videos/${fileName}`,
    size: getVideoBillboardSize(fileName),
  });
});

const IMAGE_MEDIA = BILLBOARD_MEDIA.filter((media) => media.type === 'image');

// Shuffle array for random billboard order
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
shuffle(BILLBOARD_MEDIA);
const foregroundBillboardCount = Math.max(8, BILLBOARD_MEDIA.length);
const sceneWidth = Math.max(
  window.innerWidth * 4,
  800 + (foregroundBillboardCount - 1) * foregroundSpacing
);
const layerWidth = sceneWidth * 2 + window.innerWidth;

hillsLayer.style.width = `${layerWidth}px`;
cityLandscape.style.width = `${layerWidth}px`;
rearGroundBlock.style.width = `${layerWidth}px`;
stripLayer.style.width = `${layerWidth}px`;
buildingsContainer.style.width = `${layerWidth}px`;
foregroundBillboards.style.width = `${layerWidth}px`;

function createBillboard(media, variant, idx) {
  const frame = document.createElement('div');
  frame.className = `billboard-frame ${variant}`;

  const billboard = document.createElement('div');
  billboard.className = `billboard ${media.size}`;

  const applyAspect = (aspect) => {
    if (!Number.isFinite(aspect) || aspect <= 0) return;
    const clamped = Math.min(2.4, Math.max(0.5, aspect));
    billboard.style.setProperty('--media-aspect', String(clamped));
  };

  const fallbackImageSrc = IMAGE_MEDIA[0]?.src || null;
  let attempt = 0;

  const renderMedia = (nextMedia) => {
    if (!nextMedia || attempt >= BILLBOARD_MEDIA.length) return;
    attempt += 1;
    billboard.className = `billboard ${nextMedia.size} media-${nextMedia.type}`;
    billboard.replaceChildren();

    if (nextMedia.type === 'image') {
      const img = document.createElement('img');
      img.src = nextMedia.src;
      img.alt = 'Showcase';
      img.addEventListener('load', () => {
        applyAspect(img.naturalWidth / img.naturalHeight);
      }, { once: true });
      img.addEventListener('error', () => {
        const fallbackMedia = BILLBOARD_MEDIA[(idx + attempt) % BILLBOARD_MEDIA.length];
        renderMedia(fallbackMedia);
      }, { once: true });
      billboard.appendChild(img);
      return;
    }

    if (fallbackImageSrc) {
      const placeholder = document.createElement('img');
      placeholder.src = fallbackImageSrc;
      placeholder.alt = 'Showcase';
      placeholder.className = 'billboard-placeholder';
      billboard.appendChild(placeholder);
    }

    const video = document.createElement('video');
    video.src = nextMedia.src;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.preload = 'auto';
    video.playsInline = true;
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.addEventListener('loadedmetadata', () => {
      applyAspect(video.videoWidth / video.videoHeight);
    }, { once: true });
    video.addEventListener('loadeddata', () => {
      billboard.classList.add('is-ready');
      const readyPlayAttempt = video.play();
      if (readyPlayAttempt && typeof readyPlayAttempt.catch === 'function') {
        readyPlayAttempt.catch(() => {
          // Ignore transient autoplay timing failures here.
        });
      }
    }, { once: true });
    video.addEventListener('error', () => {
      billboard.classList.remove('is-ready');
      const fallbackMedia = BILLBOARD_MEDIA[(idx + attempt) % BILLBOARD_MEDIA.length];
      renderMedia(fallbackMedia);
    }, { once: true });
    billboard.appendChild(video);

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        const fallbackMedia = BILLBOARD_MEDIA[(idx + attempt) % BILLBOARD_MEDIA.length];
        renderMedia(fallbackMedia);
      });
    }
  };

  renderMedia(media);

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
  const blimpVideo = document.createElement('video');
  blimpVideo.className = 'blimp-billboard-video';
  blimpVideo.autoplay = true;
  blimpVideo.loop = true;
  blimpVideo.muted = true;
  blimpVideo.defaultMuted = true;
  blimpVideo.preload = 'auto';
  blimpVideo.playsInline = true;
  blimpVideo.setAttribute('autoplay', '');
  blimpVideo.setAttribute('muted', '');
  blimpVideo.setAttribute('loop', '');
  blimpVideo.setAttribute('playsinline', '');
  blimpBillboard.appendChild(blimpVideo);

  const blimpVideos = shuffle(videoFiles.map((fileName) => `assets/videos/${fileName}`));
  let blimpVideoIndex = 0;

  const setBlimpVideo = () => {
    if (!blimpVideos.length) return;
    const src = blimpVideos[blimpVideoIndex % blimpVideos.length];
    blimpVideoIndex += 1;
    blimpVideo.src = src;
    blimpVideo.load();
    const playAttempt = blimpVideo.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        setBlimpVideo();
      });
    }
  };

  blimpVideo.addEventListener('loadedmetadata', () => {
    const aspect = blimpVideo.videoWidth / blimpVideo.videoHeight;
    if (Number.isFinite(aspect) && aspect > 0) {
      const clamped = Math.min(2.6, Math.max(0.55, aspect));
      blimpBillboard.style.setProperty('--blimp-media-aspect', String(clamped));
    }
  });
  blimpVideo.addEventListener('loadeddata', () => {
    const readyPlayAttempt = blimpVideo.play();
    if (readyPlayAttempt && typeof readyPlayAttempt.catch === 'function') {
      readyPlayAttempt.catch(() => {
        // Ignore transient autoplay timing failures here.
      });
    }
  });
  blimpVideo.addEventListener('error', setBlimpVideo);

  setBlimpVideo();
  // Rotate the blimp video each time it finishes a full cruise and restarts.
  blimp.addEventListener('animationiteration', setBlimpVideo);

  blimp.appendChild(blimpBillboard);
  const blimpCabin = document.createElement('div');
  blimpCabin.className = 'blimp-cabin';
  blimp.appendChild(blimpCabin);
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
      const mediaIndex = (idx + copy * baseForegroundPositions.length) % BILLBOARD_MEDIA.length;
      const media = BILLBOARD_MEDIA[mediaIndex];
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
    const wideMedia = mediaSize === 'web' || mediaSize === 'video-wide';
    if (wideMedia) {
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
const baseSpeed = 33;
let lastScrollTimestamp = performance.now();
function autoScroll(timestamp) {
  const deltaSeconds = Math.min(0.05, (timestamp - lastScrollTimestamp) / 1000);
  lastScrollTimestamp = timestamp;
  scrollPos += baseSpeed * deltaSeconds;
  const hillsOffset = (scrollPos * 0.35) % sceneWidth;
  const cityOffset = (scrollPos * 0.6) % sceneWidth;
  const groundOffset = (scrollPos * 0.75) % sceneWidth;
  const stripOffset = (scrollPos * 0.9) % sceneWidth;
  const foregroundOffset = scrollPos % sceneWidth;

  hillsLayer.style.transform = `translateX(${-hillsOffset}px)`;
  cityLandscape.style.transform = `translateX(${-cityOffset}px)`;
  rearGroundBlock.style.transform = `translateX(${-groundOffset}px)`;
  stripLayer.style.transform = `translateX(${-stripOffset}px)`;
  foregroundBillboards.style.transform = `translateX(${-foregroundOffset}px)`;
  requestAnimationFrame(autoScroll);
}
requestAnimationFrame(autoScroll);

// Car visual update
const car = document.getElementById('car');
if (car) {
  car.className = 'car-fleet';
  const carColors = ['#e63946', '#3a86ff', '#ff7b00', '#8d5cf6', '#2ec4b6'];
  const carAccent = ['#f1faee', '#e9f3ff', '#ffe5cc', '#efe6ff', '#ddfff7'];

  const assignCarSpeed = (sprite) => {
    const duration = 7 + Math.random() * 7;
    sprite.style.setProperty('--car-duration', `${duration.toFixed(2)}s`);
  };

  for (let i = 0; i < 3; i++) {
    const sprite = document.createElement('div');
    sprite.className = 'car-sprite';
    sprite.style.setProperty('--car-color', carColors[Math.floor(Math.random() * carColors.length)]);
    sprite.style.setProperty('--car-accent', carAccent[Math.floor(Math.random() * carAccent.length)]);
    sprite.style.setProperty('--car-bottom', '102px');
    sprite.style.setProperty('--car-delay', `${-Math.random() * 8}s`);
    assignCarSpeed(sprite);
    sprite.addEventListener('animationiteration', () => {
      assignCarSpeed(sprite);
    });
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
