import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  AppAgentSessionProvider,
  AppAgentShell,
  useAppAgent,
  routesToNavigation,
  useAppAgentLiveContext,
} from '@gakwaya/app-agent-react';
import {
  initialShopState,
  getDemoAppState,
  demoAgentConfig,
  type ShopState,
} from '../../shared/shop';

const shop: ShopState = structuredClone(initialShopState);
let demoLocale = 'en';

const navigation = routesToNavigation([
  { path: '/', label: 'Shop', aliases: ['home', 'products'] },
  { path: '/cart', label: 'Cart', aliases: ['checkout cart'] },
  { path: '/profile', label: 'Profile', aliases: ['my account'] },
  { path: '/settings/language', label: 'Language', category: 'settings', aliases: ['language settings'] },
]);

const capabilities = [
  {
    id: 'changeLanguage',
    name: 'Change Language',
    description: 'Update shop UI language without opening profile',
    kind: 'setting' as const,
    toolName: 'setLanguage',
    aliases: ['change language', 'locale', 'switch language'],
  },
  {
    id: 'cartSummary',
    name: 'Cart Summary',
    description: 'Summarize current cart contents from app state',
    kind: 'query' as const,
    toolName: 'getCartSummary',
    aliases: ['cart summary', 'summarize cart'],
  },
];

function AgentConsole() {
  const { status, activity, messages, execute } = useAppAgent();
  const [input, setInput] = useState("what's in my cart?");

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>App-Agent Console</h3>
      <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
        Status: {status} {activity ? `· ${activity}` : ''} · locale: {demoLocale}
      </p>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          margin: '12px 0',
          fontSize: 13,
          border: '1px solid #eee',
          borderRadius: 8,
          padding: 8,
        }}
      >
        {messages.length === 0 ? (
          <p style={{ color: '#888' }}>
            Try &quot;what&apos;s in my cart?&quot; (answers) vs &quot;go to cart&quot; (navigates).
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: 8 }}>
              <strong>{msg.role}:</strong> {msg.content}
            </div>
          ))
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button type="button" onClick={() => void execute(input)}>
          Run
        </button>
      </div>
    </div>
  );
}

function AgentLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <AppAgentShell
      open={open}
      onOpenChange={setOpen}
      launcher={
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1300,
            padding: '10px 16px',
            borderRadius: 24,
            border: 'none',
            background: '#1976d2',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          AI Assistant
        </button>
      }
    >
      <AgentConsole />
    </AppAgentShell>
  );
}

function ShopPage() {
  const { execute } = useAppAgent();

  return (
    <div style={{ padding: 24 }}>
      <nav style={{ marginBottom: 16 }}>
        <Link to="/">Shop</Link> · <Link to="/cart">Cart ({shop.cart.length})</Link> ·{' '}
        <Link to="/profile">Profile</Link>
      </nav>
      <h1>React Shop Demo</h1>
      {shop.products.map((product) => (
        <div key={product.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 8 }}>
          <h3>{product.name}</h3>
          <p>
            ${product.price} · {product.rating}★
          </p>
          <div
            role="button"
            tabIndex={0}
            id="add-to-cart"
            onClick={() => shop.cart.push(product.id)}
            onKeyDown={(e) => e.key === 'Enter' && shop.cart.push(product.id)}
            style={{
              display: 'inline-block',
              padding: '6px 12px',
              background: '#eee',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Add to cart
          </div>
          <button type="button" onClick={() => execute(`Tell me about ${product.name}`)}>
            Ask agent
          </button>
        </div>
      ))}
    </div>
  );
}

function CartPage() {
  return (
    <div style={{ padding: 24 }}>
      <nav style={{ marginBottom: 16 }}>
        <Link to="/">Shop</Link> · <Link to="/cart">Cart ({shop.cart.length})</Link>
      </nav>
      <h1>Cart</h1>
      <p>{shop.cart.length} item(s)</p>
    </div>
  );
}

function ProfilePage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Profile</h1>
      <p>User profile page — agent should NOT land here for &quot;change language&quot;.</p>
    </div>
  );
}

function LanguageSettingsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Language Settings</h1>
      <p>Current locale: {demoLocale}</p>
    </div>
  );
}

function RoutedApp() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ShopPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings/language" element={<LanguageSettingsPage />} />
      </Routes>
      <AgentLauncher />
    </>
  );
}

function AppShell() {
  const navigate = useNavigate();

  const config = useAppAgentLiveContext({
    navigation,
    capabilities,
    getAppState: async () => {
      const state = await getDemoAppState(shop);
      return {
        ...state,
        context: { ...state.context, locale: demoLocale },
      };
    },
    baseConfig: {
      ...demoAgentConfig,
      enableMultiAgent: false,
      strictNavigation: true,
      executionMode: 'quiet',
      onNavigate: (path) => navigate(path),
      customTools: {
        setLanguage: {
          name: 'setLanguage',
          description: 'Change UI language',
          inputSchema: z.object({ language: z.string().optional() }),
          execute: async (params) => {
            const lang = params.language ?? 'es';
            demoLocale = lang;
            return `Language updated to ${lang}`;
          },
        },
        getCartSummary: {
          name: 'getCartSummary',
          description: 'Summarize cart contents from app state',
          inputSchema: z.object({}),
          execute: async () => {
            const items = shop.cart.length;
            return items === 0
              ? 'Your cart is empty.'
              : `Your cart has ${items} item(s): ${shop.cart.join(', ')}`;
          },
        },
      },
    },
  });

  return (
    <AppAgentSessionProvider sessionKey="react-demo" persistSession mountPanel={false} config={config}>
      <RoutedApp />
    </AppAgentSessionProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
