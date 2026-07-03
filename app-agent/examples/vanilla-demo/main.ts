import { AppAgent } from '@app-agent/app-agent';
import { AppAgentPanel } from '@app-agent/ui';
import {
  initialShopState,
  getDemoAppState,
  demoAgentConfig,
  type ShopState,
} from '../shared/shop';

const shop: ShopState = structuredClone(initialShopState);

function renderProducts() {
  const container = document.getElementById('products');
  const cartCount = document.getElementById('cart-count');
  if (!container || !cartCount) return;

  container.innerHTML = shop.products
    .map(
      (p) => `
    <div class="product">
      <h3>${p.name}</h3>
      <p>$${p.price} · ${p.rating}★</p>
      <button id="add-to-cart" data-id="${p.id}">Add to cart</button>
    </div>`
    )
    .join('');

  cartCount.textContent = String(shop.cart.length);

  container.querySelectorAll('[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLButtonElement).dataset.id;
      if (id) shop.cart.push(id);
      renderProducts();
    });
  });
}

const agent = new AppAgent({
  ...demoAgentConfig,
  getAppState: () => getDemoAppState(shop),
  enableToolCaching: true,
});

const panel = new AppAgentPanel();
panel.onSubmit((task) => {
  void agent.execute(task);
});

renderProducts();

console.log('App-Agent vanilla demo ready. Use the agent panel to run tasks like:');
console.log('"Find the best laptop under $1000 and add it to cart"');

export { agent, shop };
