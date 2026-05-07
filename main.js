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
const foregroundDensityMultiplier = 1.5;

const BUILDING_ASSETS = [
  { buildingId: 1, src: 'assets/buildings/building1.svg', aspectW: 222.33, aspectH: 577.96 },
  { buildingId: 2, src: 'assets/buildings/building2.svg', aspectW: 303.6, aspectH: 489.48 },
  { buildingId: 3, src: 'assets/buildings/building3.svg', aspectW: 197.08, aspectH: 592.46 },
  { buildingId: 4, src: 'assets/buildings/building4.svg', aspectW: 142.9, aspectH: 717.26 },
];
const MOUNTAIN_ASSETS = [
  { src: 'assets/mountains/mountain%201.png', aspectW: 278, aspectH: 121 },
  { src: 'assets/mountains/mountain%202.png', aspectW: 278, aspectH: 121 },
];
const ROOFTOP_ELIGIBLE_BUILDING_IDS = new Set([2, 3]);
const ASSET_BUILDING_DISPLAY_HEIGHT = 400;

const screenshotFiles = ['1777300186.850243.jpg'];
const videoFiles = ['Screen RecordingSquare.mov', 'video-export 4-5.mp4', 'Finventory Recording.mov', 'Flicker Exhibition Video.mp4'];

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
const MAX_ACTIVE_AUTOPLAY_VIDEOS = 6;
const managedAutoplayVideos = new Set();
let videoIntersectionObserver = null;

function ensureVideoObserver() {
  if (videoIntersectionObserver || typeof IntersectionObserver === 'undefined') return;
  videoIntersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      video.dataset.inView = entry.isIntersecting ? '1' : '0';
    });
    syncManagedVideoPlayback();
  }, { threshold: 0.2 });
}

function syncManagedVideoPlayback() {
  const connectedVideos = [];
  managedAutoplayVideos.forEach((video) => {
    if (video.isConnected) {
      connectedVideos.push(video);
      return;
    }
    managedAutoplayVideos.delete(video);
  });

  const sorted = connectedVideos
    .sort((a, b) => Number(a.dataset.playPriority || 0) - Number(b.dataset.playPriority || 0));

  const visible = sorted.filter((video) => video.dataset.inView === '1');
  const active = visible.slice(0, MAX_ACTIVE_AUTOPLAY_VIDEOS);
  const activeSet = new Set(active);
  const canPlay = !document.hidden;

  sorted.forEach((video) => {
    const shouldPlay = canPlay && activeSet.has(video);
    if (shouldPlay) {
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {
          // Ignore autoplay-policy errors and keep trying on future syncs.
        });
      }
      return;
    }
    if (!video.paused) video.pause();
  });
}

function registerManagedAutoplayVideo(video, priority) {
  ensureVideoObserver();
  video.dataset.playPriority = String(priority);
  managedAutoplayVideos.add(video);
  if (videoIntersectionObserver) videoIntersectionObserver.observe(video);
  syncManagedVideoPlayback();
}

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

  const triedSrc = new Set();
  let attempt = 0;
  const guaranteedImageFallback = IMAGE_MEDIA.length
    ? IMAGE_MEDIA[idx % IMAGE_MEDIA.length]
    : null;
  let forcedImageFallbackUsed = false;

  const getNextFallbackMedia = () => {
    if (BILLBOARD_MEDIA.length) {
      for (let i = 0; i < BILLBOARD_MEDIA.length; i++) {
        const candidate = BILLBOARD_MEDIA[(idx + attempt + i) % BILLBOARD_MEDIA.length];
        if (candidate && !triedSrc.has(candidate.src)) return candidate;
      }
    }

    if (IMAGE_MEDIA.length) {
      for (let i = 0; i < IMAGE_MEDIA.length; i++) {
        const candidate = IMAGE_MEDIA[(idx + i) % IMAGE_MEDIA.length];
        if (candidate && !triedSrc.has(candidate.src)) return candidate;
      }
    }

    return null;
  };

  const renderMedia = (nextMedia) => {
    if (!nextMedia) {
      if (guaranteedImageFallback && !forcedImageFallbackUsed) {
        forcedImageFallbackUsed = true;
        renderMedia(guaranteedImageFallback);
        return;
      }
      // Last resort: keep a visible board shell instead of disappearing.
      billboard.className = `billboard ${media.size} media-empty`;
      billboard.replaceChildren();
      return;
    }
    attempt += 1;
    triedSrc.add(nextMedia.src);
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
        const fallbackMedia = getNextFallbackMedia();
        renderMedia(fallbackMedia);
      }, { once: true });
      billboard.appendChild(img);
      return;
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
    registerManagedAutoplayVideo(video, idx);
    video.addEventListener('loadedmetadata', () => {
      applyAspect(video.videoWidth / video.videoHeight);
    }, { once: true });
    video.addEventListener('loadeddata', () => {
      billboard.classList.add('is-ready');
      syncManagedVideoPlayback();
    }, { once: true });
    video.addEventListener('canplay', () => {
      billboard.classList.add('is-ready');
      syncManagedVideoPlayback();
    }, { once: true });
    video.addEventListener('error', () => {
      billboard.classList.remove('is-ready');
      const fallbackMedia = getNextFallbackMedia();
      renderMedia(fallbackMedia);
    }, { once: true });
    billboard.appendChild(video);

    // Guard against "forever loading" media that never reaches ready state.
    setTimeout(() => {
      if (billboard.classList.contains('is-ready') || !video.isConnected) return;
      const fallbackMedia = getNextFallbackMedia();
      renderMedia(fallbackMedia);
    }, 8000);
  };

  renderMedia(media);

  frame.appendChild(billboard);
  return frame;
}

function buildHills() {
  const mountainCount = Math.ceil(sceneWidth / 260) + 3;
  const mountainSpecs = [];
  for (let i = 0; i < mountainCount; i++) {
    const height = 58 + Math.random() * 60;
    const mountainAsset = MOUNTAIN_ASSETS[i % MOUNTAIN_ASSETS.length];
    mountainSpecs.push({
      left: i * 260 + (Math.random() * 80),
      width: (mountainAsset.aspectW / mountainAsset.aspectH) * height,
      height,
      src: mountainAsset.src,
    });
  }

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
    mountainSpecs.forEach((spec) => {
      const mountain = document.createElement('img');
      mountain.className = 'mountain-shape mountain-asset';
      mountain.style.left = `${spec.left + copy * sceneWidth}px`;
      mountain.style.width = `${spec.width}px`;
      mountain.style.height = `${spec.height}px`;
      mountain.src = spec.src;
      mountain.alt = '';
      mountain.draggable = false;
      hillsLayer.appendChild(mountain);
    });

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

  const blimpArt = document.createElement('img');
  blimpArt.className = 'blimp-art';
  blimpArt.src = 'assets/blimp.svg';
  blimpArt.alt = '';
  blimpArt.draggable = false;
  blimp.appendChild(blimpArt);

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
  registerManagedAutoplayVideo(blimpVideo, -1);
  blimpBillboard.appendChild(blimpVideo);

  const blimpVideos = shuffle(videoFiles.map((fileName) => `assets/videos/${fileName}`));
  let blimpVideoIndex = 0;

  const setBlimpVideo = () => {
    if (!blimpVideos.length) return;
    const src = blimpVideos[blimpVideoIndex % blimpVideos.length];
    blimpVideoIndex += 1;
    blimpVideo.src = src;
    blimpVideo.load();
    syncManagedVideoPlayback();
  };

  blimpVideo.addEventListener('loadeddata', () => {
    syncManagedVideoPlayback();
  });
  blimpVideo.addEventListener('error', setBlimpVideo);

  setBlimpVideo();
  // Rotate the blimp video each time it finishes a full cruise and restarts.
  blimp.addEventListener('animationiteration', setBlimpVideo);

  blimp.appendChild(blimpBillboard);
  cityLandscape.appendChild(blimp);
}

function buildStripAndBillboards() {
  const buildings = [];
  const buildingSpecs = [];
  const buildingMargin = 12;
  let coveredWidth = 0;
  let patternCursor = 0;
  const pattern = shuffle(BUILDING_ASSETS.map((_, idx) => idx));

  while (coveredWidth < sceneWidth + 600) {
    const asset = BUILDING_ASSETS[pattern[patternCursor % pattern.length]];
    patternCursor += 1;
    const displayHeight = ASSET_BUILDING_DISPLAY_HEIGHT;
    const displayWidth = (asset.aspectW / asset.aspectH) * displayHeight;
    buildingSpecs.push({
      buildingId: asset.buildingId,
      rooftopEligible: ROOFTOP_ELIGIBLE_BUILDING_IDS.has(asset.buildingId),
      src: asset.src,
      height: displayHeight,
      width: displayWidth,
    });
    coveredWidth += displayWidth + buildingMargin * 2;
  }

  for (let copy = 0; copy < 2; copy++) {
    buildingSpecs.forEach((spec) => {
      const building = document.createElement('div');
      building.className = 'building asset-building';
      building.dataset.buildingId = String(spec.buildingId);
      building.style.height = `${spec.height}px`;
      building.style.width = `${spec.width}px`;

      const img = document.createElement('img');
      img.src = spec.src;
      img.alt = '';
      img.draggable = false;
      building.appendChild(img);

      buildingsContainer.appendChild(building);
      buildings.push(building);
    });
  }

  const foregroundStart = 220;
  const baseForegroundPositions = [];
  const foregroundStep = (foregroundSpacing * 2) / foregroundDensityMultiplier;
  for (let x = foregroundStart; x <= sceneWidth + 300; x += foregroundStep) {
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

  for (let copy = 0; copy < 2; copy++) {
    let rooftopMediaIdx = 0;
    for (let localIndex = 0; localIndex < buildingsPerSegment; localIndex++) {
      if (!buildingSpecs[localIndex].rooftopEligible) continue;
      const media = BILLBOARD_MEDIA[rooftopMediaIdx % BILLBOARD_MEDIA.length];
      rooftopMediaIdx += 1;
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
  preventBillboardTouching('.billboard-frame.rooftop', 8);
});

let scrollPos = 0;
const baseSpeed = 33;
let lastScrollTimestamp = performance.now();

// Reset the timestamp when the tab becomes visible again so the first
// resumed frame does not produce an enormous delta.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastScrollTimestamp = performance.now();
  }
  syncManagedVideoPlayback();
});

function autoScroll(timestamp) {
  try {
    const deltaSeconds = Math.min(0.05, (timestamp - lastScrollTimestamp) / 1000);
    lastScrollTimestamp = timestamp;
    // Keep scrollPos bounded to avoid floating-point precision loss over time.
    scrollPos = (scrollPos + baseSpeed * deltaSeconds) % sceneWidth;
    const hillsOffset = (scrollPos * 0.35) % sceneWidth;
    const cityOffset = (scrollPos * 0.6) % sceneWidth;
    const groundOffset = (scrollPos * 0.75) % sceneWidth;
    const stripOffset = (scrollPos * 0.9) % sceneWidth;
    const foregroundOffset = scrollPos;

    hillsLayer.style.transform = `translateX(${-hillsOffset}px)`;
    cityLandscape.style.transform = `translateX(${-cityOffset}px)`;
    rearGroundBlock.style.transform = `translateX(${-groundOffset}px)`;
    stripLayer.style.transform = `translateX(${-stripOffset}px)`;
    foregroundBillboards.style.transform = `translateX(${-foregroundOffset}px)`;
  } catch (_err) {
    // Swallow any render error so the loop always continues.
  }
  requestAnimationFrame(autoScroll);
}
requestAnimationFrame(autoScroll);

// Car visual update
const car = document.getElementById('car');
if (car) {
  car.className = 'car-fleet';
  const CAR_COUNT = 3;
  const CAR_WIDTH = 132;
  const CAR_MIN_SPEED = 95;
  const CAR_MAX_SPEED = 185;
  const CAR_RESPAWN_MIN_GAP = 220;
  const CAR_RESPAWN_MAX_GAP = 540;

  // In case this script is re-run, clear previous sprites/loop state.
  car.replaceChildren();

  const fleet = [];
  const pickCarSpeed = () => CAR_MIN_SPEED + Math.random() * (CAR_MAX_SPEED - CAR_MIN_SPEED);
  const pickRespawnGap = () => CAR_RESPAWN_MIN_GAP + Math.random() * (CAR_RESPAWN_MAX_GAP - CAR_RESPAWN_MIN_GAP);

  const FULLY_OFF_LEFT = CAR_WIDTH + 96;

  const getLeftmostXExcluding = (exclude) => {
    let leftmost = Infinity;
    fleet.forEach((state) => {
      if (state === exclude) return;
      if (state.x < leftmost) leftmost = state.x;
    });
    return Number.isFinite(leftmost) ? leftmost : -FULLY_OFF_LEFT * 4;
  };

  for (let i = 0; i < CAR_COUNT; i++) {
    const sprite = document.createElement('div');
    sprite.className = 'car-sprite';
    sprite.style.setProperty('--car-bottom', '82px');
    const carArt = document.createElement('img');
    carArt.src = 'assets/car.png';
    carArt.alt = '';
    carArt.draggable = false;
    sprite.appendChild(carArt);
    car.appendChild(sprite);

    const leadOffset = (i + 1) * (CAR_RESPAWN_MIN_GAP + 80);
    fleet.push({
      sprite,
      x: -CAR_WIDTH - leadOffset,
      speed: pickCarSpeed(),
    });
  }

  let lastCarFrameTs = performance.now();
  const resetCar = (carState) => {
    // Other cars might all be far on the right, so naive spacing could place x inside the viewport.
    const leftmost = getLeftmostXExcluding(carState);
    const spacedLeft = leftmost - pickRespawnGap() - CAR_WIDTH;
    carState.x = Math.min(spacedLeft, -FULLY_OFF_LEFT);
    carState.speed = pickCarSpeed();
  };

  const tickCars = (timestamp) => {
    if (!Number.isFinite(lastCarFrameTs)) {
      lastCarFrameTs = timestamp;
    }
    const dt = Math.min(0.05, (timestamp - lastCarFrameTs) / 1000);
    lastCarFrameTs = timestamp;
    const resetThreshold = window.innerWidth + CAR_WIDTH;

    fleet.forEach((carState) => {
      if (!Number.isFinite(carState.x)) {
        resetCar(carState);
      }
      carState.x += carState.speed * dt;
      if (carState.x > resetThreshold) {
        resetCar(carState);
      }
      carState.sprite.style.transform = `translateX(${carState.x}px)`;
    });

    requestAnimationFrame(tickCars);
  };

  document.addEventListener('visibilitychange', () => {
    // Prevent giant frame deltas after tab inactivity.
    lastCarFrameTs = performance.now();
  });

  requestAnimationFrame(tickCars);
}
