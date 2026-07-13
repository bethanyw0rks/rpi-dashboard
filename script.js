const dashboard = document.querySelector('.shortcut-grid');

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
