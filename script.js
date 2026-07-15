const dashboard = document.querySelector('.shortcut-grid');
const refreshButton = document.querySelector('#refresh-page');
const settingsButton = document.querySelector('#settings-button');
const settingsModal = document.querySelector('#settings-modal');
const settingsForm = document.querySelector('#settings-form');
const apiUrlInput = document.querySelector('#api-url-input');
const activeAppEndpointInput = document.querySelector('#active-app-endpoint-input');
const calendarNextEndpointInput = document.querySelector('#calendar-next-endpoint-input');
const calendarNowEndpointInput = document.querySelector('#calendar-now-endpoint-input');
const modalCloseButton = document.querySelector('.modal-close');
const cancelSettingsButton = document.querySelector('#cancel-settings');
const SETTINGS_KEY = 'rpiDashboardSettings';

refreshButton?.addEventListener('click', () => {
  window.location.reload();
});

settingsButton?.addEventListener('click', () => {
  openSettingsModal();
});

modalCloseButton?.addEventListener('click', () => {
  closeSettingsModal();
});

cancelSettingsButton?.addEventListener('click', () => {
  closeSettingsModal();
});

settingsModal?.addEventListener('click', (event) => {
  if (event.target === settingsModal) {
    closeSettingsModal();
  }
});

settingsForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  saveSettings();
  renderTextCards();
  closeSettingsModal();
});

function openSettingsModal() {
  loadSettings();
  settingsModal?.classList.add('open');
  settingsModal?.setAttribute('aria-hidden', 'false');
  apiUrlInput?.focus();
}

function closeSettingsModal() {
  settingsModal?.classList.remove('open');
  settingsModal?.setAttribute('aria-hidden', 'true');
}

function saveSettings() {
  const settings = {
    apiUrl: apiUrlInput?.value.trim() || '',
    activeAppEndpoint: activeAppEndpointInput?.value.trim() || '',
    calendarNextEndpoint: calendarNextEndpointInput?.value.trim() || '',
    calendarNowEndpoint: calendarNowEndpointInput?.value.trim() || ''
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
  if (!apiUrlInput || !activeAppEndpointInput || !calendarNextEndpointInput || !calendarNowEndpointInput) return;
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    apiUrlInput.value = '';
    activeAppEndpointInput.value = '';
    calendarNextEndpointInput.value = '';
    calendarNowEndpointInput.value = '';
    return;
  }

  try {
    const settings = JSON.parse(stored);
    apiUrlInput.value = settings.apiUrl || '';
    activeAppEndpointInput.value = settings.activeAppEndpoint || '';
    calendarNextEndpointInput.value = settings.calendarNextEndpoint || '';
    calendarNowEndpointInput.value = settings.calendarNowEndpoint || '';
  } catch (error) {
    apiUrlInput.value = '';
    activeAppEndpointInput.value = '';
    calendarNextEndpointInput.value = '';
    calendarNowEndpointInput.value = '';
  }
}

function getStoredSettings() {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}

function parseTextCards(rawValue) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    console.warn('Invalid text cards config', error);
    return [];
  }
}

function renderTextCards() {
  if (!dashboard) return;

  document.querySelectorAll('[data-custom-text-card="true"]').forEach((card) => card.remove());

  const settings = getStoredSettings();
  const cards = parseTextCards(settings?.textCards || '');

  cards.forEach((cardConfig, index) => {
    const cardId = String(cardConfig?.id || `text-card-${index + 1}`).trim();
    const card = document.createElement('section');
    card.className = 'card';
    card.dataset.cardId = cardId;
    card.dataset.customTextCard = 'true';

    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';

    if (cardConfig?.title) {
      const title = document.createElement('h2');
      title.textContent = cardConfig.title;
      cardHeader.appendChild(title);
    }

    if (cardConfig?.subtitle) {
      const subtitle = document.createElement('h3');
      subtitle.textContent = cardConfig.subtitle;
      cardHeader.appendChild(subtitle);
    }

    if (cardConfig?.text) {
      const text = document.createElement('p');
      text.textContent = cardConfig.text;
      cardHeader.appendChild(text);
    }

    card.appendChild(cardHeader);
    dashboard.appendChild(card);
  });
}

function renderCard({
  cardId,
  title,
  subtitle,
  text,
  isHighlighted = false,
  datasetKey,
  datasetValue,
}) {
  if (!dashboard) return null;

  const existingCard = datasetKey && datasetValue
    ? document.querySelector(`[data-${datasetKey}="${datasetValue}"]`)
    : null;

  const card = existingCard || document.createElement('section');
  card.className = `card${isHighlighted ? ' highlight' : ''}`;
  card.dataset.cardId = cardId;

  if (datasetKey && datasetValue) {
    card.dataset[datasetKey] = datasetValue;
  }

  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';
  cardHeader.innerHTML = '';

  if (title) {
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    cardHeader.appendChild(titleElement);
  }

  if (subtitle) {
    const subtitleElement = document.createElement('h3');
    subtitleElement.textContent = subtitle;
    cardHeader.appendChild(subtitleElement);
  }

  if (text) {
    const textElement = document.createElement('p');
    textElement.textContent = text;
    cardHeader.appendChild(textElement);
  }

  if (existingCard) {
    existingCard.replaceChildren(cardHeader);
    return existingCard;
  }

  card.appendChild(cardHeader);
  dashboard.appendChild(card);
  return card;
}

function formatCalendarTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return time.replace(':00', '').replace(/\s+/g, '').toLowerCase();
}

function buildCalendarNextSubtitle(data) {
  const summary = data?.summary ? String(data.summary).trim() : '';
  const startTime = formatCalendarTime(data?.start);

  if (summary && startTime) {
    return `${summary} @ ${startTime}`;
  }

  return summary || startTime || '';
}

function hasCalendarData(data) {
  if (!data || typeof data !== 'object') return false;
  return Object.values(data).some((value) => value !== null && value !== undefined && value !== '');
}

function clearCalendarCards() {
  if (!dashboard) return;

  document.querySelectorAll('[data-calendar-next-card="true"], [data-calendar-now-card="true"]').forEach((card) => card.remove());
}

function renderCalendarNextCard(data) {
  if (!dashboard) return;

  const existingCard = document.querySelector('[data-calendar-next-card="true"]');
  if (!hasCalendarData(data)) {
    existingCard?.remove();
    return;
  }

  const subtitleText = buildCalendarNextSubtitle(data);
  renderCard({
    cardId: 'calendar-next',
    title: 'Next Up',
    subtitle: subtitleText,
    datasetKey: 'calendarNextCard',
    datasetValue: 'true',
  });
}

function renderCalendarNowCard(data) {
  if (!dashboard) return;

  const existingCard = document.querySelector('[data-calendar-now-card="true"]');
  if (!hasCalendarData(data)) {
    existingCard?.remove();
    return;
  }

  const subtitleText = buildCalendarNextSubtitle(data);
  renderCard({
    cardId: 'calendar-now',
    title: 'Happening Now',
    subtitle: subtitleText,
    datasetKey: 'calendarNowCard',
    datasetValue: 'true',
    isHighlighted: true,
  });
}

function buildApiUrl(apiUrl, endpoint) {
  return new URL(endpoint, apiUrl).toString();
}

let activeAppIntervalId = null;
let calendarIntervalId = null;
const CALENDAR_POLL_INTERVAL_MS = 60 * 1000; // 1 minute
const ACTIVE_APP_POLL_INTERVAL_MS = 2 * 1000; // 2 seconds

function startActiveAppPolling() {
  if (activeAppIntervalId) {
    clearInterval(activeAppIntervalId);
    activeAppIntervalId = null;
  }

  const settings = getStoredSettings();
  if (!settings || !settings.apiUrl || !settings.activeAppEndpoint) {
    hideAllApplicationCards();
    return;
  }

  fetchActiveApp(settings);
  activeAppIntervalId = setInterval(() => fetchActiveApp(settings), ACTIVE_APP_POLL_INTERVAL_MS);
}

function startCalendarPolling() {
  if (calendarIntervalId) {
    clearInterval(calendarIntervalId);
    calendarIntervalId = null;
  }

  const settings = getStoredSettings();
  if (!settings || !settings.apiUrl) {
    clearCalendarCards();
    return;
  }

  const calendarEndpoints = [settings.calendarNextEndpoint, settings.calendarNowEndpoint].filter(Boolean);
  if (calendarEndpoints.length === 0) {
    clearCalendarCards();
    return;
  }

  clearCalendarCards();
  calendarEndpoints.forEach((endpoint) => fetchCalendarEndpoint(settings, endpoint));
  calendarIntervalId = setInterval(() => {
    clearCalendarCards();
    calendarEndpoints.forEach((endpoint) => fetchCalendarEndpoint(settings, endpoint));
  }, CALENDAR_POLL_INTERVAL_MS);
}

function startPolling() {
  startActiveAppPolling();
  startCalendarPolling();
}

async function fetchActiveApp(settings) {
  const { apiUrl, activeAppEndpoint } = settings;
  let url;
  try {
    url = buildApiUrl(apiUrl, activeAppEndpoint);
  } catch (e) {
    console.warn('Invalid API URL or endpoint', e);
    return;
  }

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.warn('Active app fetch failed', res.status);
      return;
    }
    const data = await res.json();
    if (data && data.name) {
      showApplicationByName(String(data.name));
    } else {
      hideAllApplicationCards();
    }
  } catch (err) {
    console.warn('Active app fetch error', err);
  }
}

async function fetchCalendarEndpoint(settings, endpoint) {
  const { apiUrl } = settings;
  let url;
  try {
    url = buildApiUrl(apiUrl, endpoint);
  } catch (e) {
    console.warn('Invalid calendar API URL or endpoint', e);
    return;
  }

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.warn('Calendar endpoint fetch failed', res.status, endpoint);
      return;
    }

    const data = await res.json();
    if (endpoint === settings.calendarNextEndpoint) {
      renderCalendarNextCard(data);
    } else if (endpoint === settings.calendarNowEndpoint) {
      renderCalendarNowCard(data);
    }
  } catch (err) {
    console.warn('Calendar endpoint fetch error', err, endpoint);
  }
}

function normalizeAppName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function showApplicationByName(activeName) {
  const appCards = document.querySelectorAll('[data-application-card]');
  const targetName = normalizeAppName(activeName);
  let found = false;

  appCards.forEach((card) => {
    const cardNames = [card.dataset.applicationName, card.dataset.cardId]
      .filter(Boolean)
      .map((name) => normalizeAppName(name));

    const matches = cardNames.some((name) => {
      if (!name || !targetName) return false;
      return name === targetName || name.includes(targetName) || targetName.includes(name);
    });

    if (matches) {
      card.hidden = false;
      found = true;
    } else {
      card.hidden = true;
    }
  });

  if (!found) {
    appCards.forEach((card) => (card.hidden = true));
  }
}

function hideAllApplicationCards() {
  const appCards = document.querySelectorAll('[data-application-card]');
  appCards.forEach((card) => (card.hidden = true));
}

renderTextCards();

// Start polling on load if settings are present
startPolling();

if (dashboard) {
  const cards = [...dashboard.querySelectorAll(':scope > .card')];
  const cardById = new Map(cards.map((card) => [card.dataset.cardId, card]));
  let orderedCards = cards;

  function setCardOrder(cardIds) {
    const seenIds = new Set();
    const requestedCards = cardIds.reduce((result, id) => {
      const card = cardById.get(id);
      if (card && !seenIds.has(id)) {
        seenIds.add(id);
        result.push(card);
      }
      return result;
    }, []);
    const requestedIds = new Set(requestedCards.map((card) => card.dataset.cardId));

    orderedCards = [
      ...requestedCards,
      ...cards.filter((card) => !requestedIds.has(card.dataset.cardId)),
    ];
    orderedCards.forEach((card) => dashboard.append(card));
  }

  // Public hooks for future configuration or drag-and-drop ordering.
  window.dashboardCards = {
    getCardOrder: () => orderedCards.map((card) => card.dataset.cardId),
    setCardOrder,
  };
}
