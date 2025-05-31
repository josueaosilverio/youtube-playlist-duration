console.log('[YT Playlist Extension] Content script loaded.');

function parseDuration(duration) {
  const parts = duration.trim().split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

function getDurations() {
  const elements = document.querySelectorAll(
    'ytd-playlist-video-renderer span.ytd-thumbnail-overlay-time-status-renderer'
  );
  let total = 0;
  elements.forEach(el => {
    const timeText = el.textContent.trim();
    if (timeText.includes(':')) {
      total += parseDuration(timeText);
    }
  });
  return total;
}

function injectTotalDurationDisplay(totalSeconds) {
  let titleElement = document.querySelector('yt-dynamic-text-view-model.page-header-view-model-wiz__page-header-title:nth-child(2) > h1:nth-child(1) > span:nth-child(1)');
  
  if (!!titleElement) {
    let titleHeader = document.querySelector('yt-dynamic-text-view-model.page-header-view-model-wiz__page-header-title:nth-child(2)');
    titleHeader.style.overflow = 'auto'
    titleHeader.style.display = 'block'
    titleHeader.style.maxHeight  = 'initial'
  } else {
    titleElement = document.querySelector('.metadata-wrapper.style-scope.ytd-playlist-header-renderer #container');
  }

  

  if (!titleElement) {
      console.warn('[YT Playlist Extension] Playlist title not found.');
      return;
    }
  
    let display = document.querySelector('#total-playlist-duration');
    const formatted = formatDuration(totalSeconds);
  
    if (!display) {
      display = document.createElement('div');
      display.id = 'total-playlist-duration';
      display.style.marginTop = '8px';
      display.style.fontSize = '16px';
      display.style.fontWeight = '500';
      display.style.color = 'white';
      display.textContent = `🕒 Total Duration: ${formatted}`;
  
      titleElement.insertAdjacentElement('afterend', display);
    } else {
      display.textContent = `🕒 Total Duration: ${formatted}`;
    }
  }
  

function updateDuration() {
  const totalSeconds = getDurations();
  injectTotalDurationDisplay(totalSeconds);
}

function waitForAllVideosLoaded(callback) {
  const interval = setInterval(() => {
    const durations = document.querySelectorAll(
      'ytd-playlist-video-renderer span.ytd-thumbnail-overlay-time-status-renderer'
    );

    const validDurations = Array.from(durations).filter(el => el.textContent.trim().match(/\d+:\d+/));

    if (validDurations.length > 0) {
      clearInterval(interval);
      callback();
    }
  }, 500);
}

function setupObserver() {
  const listContainer = document.querySelector('ytd-playlist-video-list-renderer');
  if (!listContainer) {
    console.warn('[YT Playlist Extension] Video list container not found.');
    return;
  }

  const observer = new MutationObserver(() => {
    clearTimeout(observer._debounce);
    observer._debounce = setTimeout(updateDuration, 500);
  });

  observer.observe(listContainer, {
    childList: true,
    subtree: true
  });
}

function initialize() {
  waitForAllVideosLoaded(() => {
    updateDuration();
    setupObserver();
    console.log('[YT Playlist Extension] Initialized and observing changes.');
  });
}

initialize();
