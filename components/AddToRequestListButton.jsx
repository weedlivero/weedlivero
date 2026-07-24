'use client';

import { useEffect, useState } from 'react';
import {
  addProductToRequestList,
  isProductInRequestList,
} from '@/lib/requestList';

export default function AddToRequestListButton({ product }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setAdded(isProductInRequestList(product.id));
  }, [product.id]);

  function addProduct() {
    addProductToRequestList(product);
    setAdded(true);
  }

  return (
    <button
      type="button"
      onClick={addProduct}
      disabled={added}
      className={`w-full rounded-2xl p-4 text-lg font-black transition ${
        added
          ? 'bg-green-100 text-green-700'
          : 'bg-green-600 text-white hover:bg-green-700'
      }`}
    >
      {added ? '✓ Aggiunto alla lista' : '📋 Aggiungi alla lista'}
    </button>
  );
}