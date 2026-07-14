const dashboard = document.querySelector('.shortcut-grid');
const refreshButton = document.querySelector('#refresh-page');
const settingsButton = document.querySelector('#settings-button');
const settingsModal = document.querySelector('#settings-modal');
const settingsForm = document.querySelector('#settings-form');
const apiUrlInput = document.querySelector('#api-url-input');
const activeAppEndpointInput = document.querySelector('#active-app-endpoint-input');
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
    activeAppEndpoint: activeAppEndpointInput?.value.trim() || ''
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
  if (!apiUrlInput || !activeAppEndpointInput) return;
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    apiUrlInput.value = '';
    activeAppEndpointInput.value = '';
    return;
  }

  try {
    const settings = JSON.parse(stored);
    apiUrlInput.value = settings.apiUrl || '';
    activeAppEndpointInput.value = settings.activeAppEndpoint || '';
  } catch (error) {
    apiUrlInput.value = '';
    activeAppEndpointInput.value = '';
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

let activeAppIntervalId = null;
const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

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

  // run immediately then schedule
  fetchActiveApp(settings);
  activeAppIntervalId = setInterval(() => fetchActiveApp(settings), POLL_INTERVAL_MS);
}

async function fetchActiveApp(settings) {
  const { apiUrl, activeAppEndpoint } = settings;
  let url;
  try {
    url = new URL(activeAppEndpoint, apiUrl).toString();
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

function showApplicationByName(activeName) {
  const appCards = document.querySelectorAll('[data-application-card]');
  let found = false;
  appCards.forEach((card) => {
    const name = card.dataset.applicationName;
    if (name && name === activeName) {
      card.hidden = false;
      found = true;
    } else {
      card.hidden = true;
    }
  });
  if (!found) {
    // no match -> hide all application cards
    appCards.forEach((card) => (card.hidden = true));
  }
}

function hideAllApplicationCards() {
  const appCards = document.querySelectorAll('[data-application-card]');
  appCards.forEach((card) => (card.hidden = true));
}

// Start polling on load if settings are present
startActiveAppPolling();

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
