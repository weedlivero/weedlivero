const STORAGE_KEY = 'weedlivero_request_list';

function isBrowser() {
  return typeof window !== 'undefined';
}

function toNumber(value) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function normalizeSelections(item) {
  if (
    item.selections &&
    typeof item.selections === 'object' &&
    !Array.isArray(item.selections)
  ) {
    return item.selections;
  }

  return {};
}

export function getRequestList() {
  if (!isBrowser()) {
    return [];
  }

  try {
    const savedList =
      window.localStorage.getItem(STORAGE_KEY);

    if (!savedList) {
      return [];
    }

    const parsedList = JSON.parse(savedList);

    if (!Array.isArray(parsedList)) {
      return [];
    }

    return parsedList.map((item) => ({
      ...item,
      selections: normalizeSelections(item),
    }));
  } catch (error) {
    console.error(
      'Errore lettura lista prodotti:',
      error
    );

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
      new CustomEvent(
        'weedlivero-request-list-updated',
        {
          detail: {
            products,
          },
        }
      )
    );
  } catch (error) {
    console.error(
      'Errore salvataggio lista prodotti:',
      error
    );
  }
}

export function addProductToRequestList(product) {
  const currentList = getRequestList();

  const existingProduct =
    currentList.find(
      (item) => item.id === product.id
    );

  // Se il prodotto è già presente,
  // non lo duplichiamo.
  if (existingProduct) {
    return currentList;
  }

  const nextList = [
    ...currentList,
    {
      id: product.id,
      name: product.name,
      brand: product.brand || '',
      category: product.category || '',
      description:
        product.description || '',
      image_url:
        product.image_url || '',

      price_unit:
        toNumber(product.price_unit),

      price_1g:
        toNumber(product.price_1g),

      price_3g:
        toNumber(product.price_3g),

      price_5g:
        toNumber(product.price_5g),

      price_10g:
        toNumber(product.price_10g),

      price_20g:
        toNumber(product.price_20g),

      price_50g:
        toNumber(product.price_50g),

      price_100g:
        toNumber(product.price_100g),

      price_promo:
        product.price_promo || '',

      // Qui salveremo separatamente
      // le quantità delle varie pezzature.
      //
      // Esempio:
      // {
      //   "3g": 1,
      //   "5g": 2,
      //   "10g": 1
      // }
      selections: {},
    },
  ];

  saveRequestList(nextList);

  return nextList;
}

export function updateProductSelection(
  productId,
  size,
  quantity
) {
  const numericQuantity = Math.max(
    0,
    Math.floor(Number(quantity) || 0)
  );

  const nextList = getRequestList().map(
    (product) => {
      if (product.id !== productId) {
        return product;
      }

      const selections = {
        ...(product.selections || {}),
      };

      if (numericQuantity === 0) {
        delete selections[size];
      } else {
        selections[size] = numericQuantity;
      }

      return {
        ...product,
        selections,
      };
    }
  );

  saveRequestList(nextList);

  return nextList;
}

export function increaseProductSelection(
  productId,
  size
) {
  const currentList = getRequestList();

  const nextList = currentList.map(
    (product) => {
      if (product.id !== productId) {
        return product;
      }

      const selections = {
        ...(product.selections || {}),
      };

      selections[size] =
        (Number(selections[size]) || 0) + 1;

      return {
        ...product,
        selections,
      };
    }
  );

  saveRequestList(nextList);

  return nextList;
}

export function decreaseProductSelection(
  productId,
  size
) {
  const currentList = getRequestList();

  const nextList = currentList.map(
    (product) => {
      if (product.id !== productId) {
        return product;
      }

      const selections = {
        ...(product.selections || {}),
      };

      const nextQuantity = Math.max(
        0,
        (Number(selections[size]) || 0) - 1
      );

      if (nextQuantity === 0) {
        delete selections[size];
      } else {
        selections[size] = nextQuantity;
      }

      return {
        ...product,
        selections,
      };
    }
  );

  saveRequestList(nextList);

  return nextList;
}

export function removeProductFromRequestList(
  productId
) {
  const nextList =
    getRequestList().filter(
      (product) =>
        product.id !== productId
    );

  saveRequestList(nextList);

  return nextList;
}

export function clearRequestList() {
  saveRequestList([]);
}

export function isProductInRequestList(
  productId
) {
  return getRequestList().some(
    (product) =>
      product.id === productId
  );
}

export function getRequestListCount() {
  return getRequestList().length;
}