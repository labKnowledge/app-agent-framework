import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppAgentProvider, useAppAgent, AppAgentPanel } from '@gakwaya/app-agent-react';
import {
  initialShopState,
  getDemoAppState,
  demoAgentConfig,
  type ShopState,
} from '../../shared/shop';

const shop: ShopState = structuredClone(initialShopState);

function Shop() {
  const { execute } = useAppAgent();

  return (
    <div>
      <h1>React Shop Demo</h1>
      {shop.products.map((product) => (
        <div key={product.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 8 }}>
          <h3>{product.name}</h3>
          <p>
            ${product.price} · {product.rating}★
          </p>
          <button
            id="add-to-cart"
            onClick={() => {
              shop.cart.push(product.id);
            }}
          >
            Add to cart
          </button>
          <button onClick={() => execute(`Tell me about ${product.name}`)}>Ask agent</button>
        </div>
      ))}
      <p>Cart items: {shop.cart.length}</p>
      <AppAgentPanel />
    </div>
  );
}

function App() {
  return (
    <AppAgentProvider
      config={{
        ...demoAgentConfig,
        getAppState: () => getDemoAppState(shop),
      }}
    >
      <Shop />
    </AppAgentProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
