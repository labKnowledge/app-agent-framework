import type { AppState, EntitySchema, WorkflowDefinition } from '@app-agent/entities';

export const productEntity: EntitySchema = {
  type: 'Product',
  name: 'Product',
  description: 'E-commerce product',
  properties: [
    { name: 'id', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'rating', type: 'number', required: false },
  ],
  operations: [],
};

export const checkoutWorkflow: WorkflowDefinition = {
  id: 'checkout',
  name: 'Checkout',
  description: 'Add product to cart and proceed to checkout',
  steps: [
    { id: 'add-to-cart', action: 'click', target: '#add-to-cart', description: 'Add to cart' },
    { id: 'open-cart', action: 'click', target: '#view-cart', description: 'View cart' },
    { id: 'checkout', action: 'click', target: '#checkout', description: 'Checkout' },
  ],
  preconditions: ['user.isAuthenticated'],
};

export interface ShopState {
  products: Array<{ id: string; name: string; price: number; rating: number }>;
  cart: string[];
}

export const initialShopState: ShopState = {
  products: [
    { id: 'laptop-1', name: 'Pro Laptop', price: 899, rating: 4.7 },
    { id: 'laptop-2', name: 'Budget Laptop', price: 649, rating: 4.2 },
    { id: 'mouse-1', name: 'Wireless Mouse', price: 29, rating: 4.5 },
  ],
  cart: [],
};

export async function getDemoAppState(shop: ShopState): Promise<AppState> {
  return {
    currentView: 'shop',
    user: {
      id: 'demo-user',
      role: 'customer',
      isAuthenticated: true,
      attributes: { name: 'Demo User' },
    },
    context: {
      products: shop.products,
      cartItems: shop.cart,
    },
    timestamp: Date.now(),
  };
}

export const demoAgentConfig = {
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  maxSteps: 20,
  trackState: true,
  enableMemory: true,
  enableMultiAgent: true,
  enableLearning: true,
  learningConfig: { storage: 'memory' as const },
  entities: { Product: productEntity },
  workflows: { checkout: checkoutWorkflow },
};
