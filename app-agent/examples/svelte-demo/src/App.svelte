<script lang="ts">
  import { setAppAgentContext } from '@gakwaya/app-agent-svelte';
  import AppAgentPanel from '@gakwaya/app-agent-svelte/AppAgentPanel.svelte';
  import {
    initialShopState,
    getDemoAppState,
    demoAgentConfig,
    type ShopState,
  } from '../../shared/shop';

  const shop: ShopState = structuredClone(initialShopState);

  const agent = setAppAgentContext({
    ...demoAgentConfig,
    getAppState: () => getDemoAppState(shop),
  });
</script>

<main>
  <h1>Svelte Shop Demo</h1>
  {#each shop.products as product (product.id)}
    <article style="border:1px solid #ccc;padding:12px;margin-bottom:8px">
      <h3>{product.name}</h3>
      <p>${product.price} · {product.rating}★</p>
      <button id="add-to-cart" on:click={() => shop.cart.push(product.id)}>Add to cart</button>
      <button on:click={() => agent.execute(`Tell me about ${product.name}`)}>Ask agent</button>
    </article>
  {/each}
  <p>Cart items: {shop.cart.length}</p>
  <AppAgentPanel />
</main>
