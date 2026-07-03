import { createApp } from 'vue';
import { AppAgentProvider, useAppAgent, AppAgentPanel } from '@gakwaya/integrations-vue';
import {
  initialShopState,
  getDemoAppState,
  demoAgentConfig,
  type ShopState,
} from '../../shared/shop';

const shop: ShopState = structuredClone(initialShopState);

const Shop = {
  setup() {
    const { execute } = useAppAgent();
    return { shop, execute };
  },
  template: `
    <div>
      <h1>Vue Shop Demo</h1>
      <div v-for="product in shop.products" :key="product.id" style="border:1px solid #ccc;padding:12px;margin-bottom:8px">
        <h3>{{ product.name }}</h3>
        <p>{{ '$' + product.price }} · {{ product.rating }}★</p>
        <button id="add-to-cart" @click="shop.cart.push(product.id)">Add to cart</button>
        <button @click="execute('Tell me about ' + product.name)">Ask agent</button>
      </div>
      <p>Cart items: {{ shop.cart.length }}</p>
      <AppAgentPanel />
    </div>
  `,
  components: { AppAgentPanel },
};

createApp({
  components: {
    AppAgentProvider,
    Shop,
  },
  template: `
    <AppAgentProvider :config="agentConfig">
      <Shop />
    </AppAgentProvider>
  `,
  data() {
    return {
      agentConfig: {
        ...demoAgentConfig,
        getAppState: () => getDemoAppState(shop),
      },
    };
  },
}).mount('#app');
