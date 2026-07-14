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
