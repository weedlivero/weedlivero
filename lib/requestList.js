const STORAGE_KEY = 'weedlivero_request_list';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getRequestList() {
  if (!isBrowser()) {
    return [];
  }

  try {
    const savedList = window.localStorage.getItem(STORAGE_KEY);

    if (!savedList) {
      return [];
    }

    const parsedList = JSON.parse(savedList);

    return Array.isArray(parsedList) ? parsedList : [];
  } catch (error) {
    console.error('Errore lettura lista prodotti:', error);
    return [];
  }
}

export function saveRequestList(products) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(products)
    );

    window.dispatchEvent(
      new CustomEvent('weedlivero-request-list-updated', {
        detail: {
          products,
        },
      })
    );
  } catch (error) {
    console.error('Errore salvataggio lista prodotti:', error);
  }
}

export function addProductToRequestList(product) {
  const currentList = getRequestList();

  const alreadyExists = currentList.some(
    (item) => item.id === product.id
  );

  if (alreadyExists) {
    return currentList;
  }

  const nextList = [
    ...currentList,
    {
      id: product.id,
      name: product.name,
      brand: product.brand || '',
      category: product.category || '',
      description: product.description || '',
      image_url: product.image_url || '',
    },
  ];

  saveRequestList(nextList);

  return nextList;
}

export function removeProductFromRequestList(productId) {
  const nextList = getRequestList().filter(
    (product) => product.id !== productId
  );

  saveRequestList(nextList);

  return nextList;
}

export function clearRequestList() {
  saveRequestList([]);
}

export function isProductInRequestList(productId) {
  return getRequestList().some(
    (product) => product.id === productId
  );
}

export function getRequestListCount() {
  return getRequestList().length;
}