import { analytics, EcommerceEvent, EcommerceItem } from "./analytics.service";

export interface Product {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  variant?: string;
  price: number;
  quantity?: number;
  position?: number;
}

export interface Cart {
  items: Product[];
  total: number;
  currency?: string;
}

export interface Order {
  id: string;
  items: Product[];
  revenue: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  coupon?: string;
}

class EcommerceAnalytics {
  private currency = "USD";
  private cart: Cart = { items: [], total: 0 };

  setCurrency(currency: string) {
    this.currency = currency;
  }

  viewItem(product: Product, listName?: string) {
    const item = this.productToItem(product);
    if (listName) {
      item.item_list_name = listName;
    }

    analytics.trackEcommerce({
      event: "view_item",
      currency: this.currency,
      value: product.price,
      items: [item],
    });
  }

  viewItemList(products: Product[], listName: string) {
    const items = products.map((product, index) => ({
      ...this.productToItem(product),
      item_list_name: listName,
      index: index + 1,
    }));

    analytics.trackEvent({
      category: "ecommerce",
      action: "view_item_list",
      label: listName,
      properties: {
        item_list_name: listName,
        items: items,
      },
    });
  }

  selectItem(product: Product, listName?: string) {
    const item = this.productToItem(product);
    if (listName) {
      item.item_list_name = listName;
    }

    analytics.trackEvent({
      category: "ecommerce",
      action: "select_item",
      label: product.name,
      properties: {
        items: [item],
      },
    });
  }

  addToCart(product: Product, quantity: number = 1) {
    const item = this.productToItem({ ...product, quantity });

    // Update internal cart state
    const existingIndex = this.cart.items.findIndex((p) => p.id === product.id);
    if (existingIndex >= 0) {
      this.cart.items[existingIndex].quantity =
        (this.cart.items[existingIndex].quantity || 0) + quantity;
    } else {
      this.cart.items.push({ ...product, quantity });
    }
    this.cart.total += product.price * quantity;

    analytics.trackEcommerce({
      event: "add_to_cart",
      currency: this.currency,
      value: product.price * quantity,
      items: [item],
    });
  }

  removeFromCart(product: Product, quantity?: number) {
    const item = this.productToItem(product);

    // Update internal cart state
    const existingIndex = this.cart.items.findIndex((p) => p.id === product.id);
    if (existingIndex >= 0) {
      if (quantity && this.cart.items[existingIndex].quantity) {
        this.cart.items[existingIndex].quantity -= quantity;
        if (this.cart.items[existingIndex].quantity! <= 0) {
          this.cart.items.splice(existingIndex, 1);
        }
      } else {
        this.cart.items.splice(existingIndex, 1);
      }
    }

    analytics.trackEcommerce({
      event: "remove_from_cart",
      currency: this.currency,
      value: product.price * (quantity || 1),
      items: [item],
    });
  }

  viewCart() {
    const items = this.cart.items.map((product) => this.productToItem(product));

    analytics.trackEvent({
      category: "ecommerce",
      action: "view_cart",
      value: this.cart.total,
      properties: {
        currency: this.currency,
        value: this.cart.total,
        items: items,
      },
    });
  }

  beginCheckout(coupon?: string) {
    const items = this.cart.items.map((product) => this.productToItem(product));

    analytics.trackEcommerce({
      event: "begin_checkout",
      currency: this.currency,
      value: this.cart.total,
      items: items,
      coupon: coupon,
    });
  }

  addPaymentInfo(paymentType: string) {
    analytics.trackEvent({
      category: "ecommerce",
      action: "add_payment_info",
      label: paymentType,
      value: this.cart.total,
      properties: {
        currency: this.currency,
        value: this.cart.total,
        payment_type: paymentType,
        items: this.cart.items.map((product) => this.productToItem(product)),
      },
    });
  }

  addShippingInfo(shippingTier: string, shippingCost: number) {
    analytics.trackEvent({
      category: "ecommerce",
      action: "add_shipping_info",
      label: shippingTier,
      value: shippingCost,
      properties: {
        currency: this.currency,
        value: this.cart.total,
        shipping_tier: shippingTier,
        items: this.cart.items.map((product) => this.productToItem(product)),
      },
    });
  }

  purchase(order: Order) {
    const items = order.items.map((product) => this.productToItem(product));

    analytics.trackEcommerce({
      event: "purchase",
      currency: order.currency || this.currency,
      value: order.revenue,
      transaction_id: order.id,
      tax: order.tax,
      shipping: order.shipping,
      coupon: order.coupon,
      items: items,
    });

    // Clear cart after purchase
    this.cart = { items: [], total: 0 };
  }

  refund(orderId: string, products?: Product[], amount?: number) {
    const items = products?.map((product) => this.productToItem(product));

    analytics.trackEvent({
      category: "ecommerce",
      action: "refund",
      label: orderId,
      value: amount,
      properties: {
        currency: this.currency,
        transaction_id: orderId,
        value: amount,
        items: items,
      },
    });
  }

  trackPromotion(
    promotionId: string,
    promotionName: string,
    creative?: string,
    position?: string,
  ) {
    analytics.trackEvent({
      category: "promotion",
      action: "view",
      label: promotionName,
      properties: {
        promotion_id: promotionId,
        promotion_name: promotionName,
        creative_name: creative,
        creative_slot: position,
      },
    });
  }

  selectPromotion(
    promotionId: string,
    promotionName: string,
    creative?: string,
    position?: string,
  ) {
    analytics.trackEvent({
      category: "promotion",
      action: "select",
      label: promotionName,
      properties: {
        promotion_id: promotionId,
        promotion_name: promotionName,
        creative_name: creative,
        creative_slot: position,
      },
    });
  }

  private productToItem(product: Product): EcommerceItem {
    return {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      item_brand: product.brand,
      item_variant: product.variant,
      price: product.price,
      quantity: product.quantity || 1,
      index: product.position,
    };
  }

  // Wishlist tracking
  addToWishlist(product: Product) {
    analytics.trackEvent({
      category: "ecommerce",
      action: "add_to_wishlist",
      label: product.name,
      value: product.price,
      properties: {
        currency: this.currency,
        value: product.price,
        items: [this.productToItem(product)],
      },
    });
  }

  // Product comparison
  compareProducts(products: Product[]) {
    analytics.trackEvent({
      category: "ecommerce",
      action: "compare_products",
      label: products.map((p) => p.name).join(" vs "),
      properties: {
        items: products.map((product) => this.productToItem(product)),
      },
    });
  }

  // Search tracking
  searchProducts(
    searchTerm: string,
    resultsCount: number,
    products?: Product[],
  ) {
    analytics.trackSearch(searchTerm, resultsCount);

    if (products && products.length > 0) {
      analytics.trackEvent({
        category: "ecommerce",
        action: "view_search_results",
        label: searchTerm,
        value: resultsCount,
        properties: {
          search_term: searchTerm,
          results_count: resultsCount,
          items: products
            .slice(0, 10)
            .map((product) => this.productToItem(product)),
        },
      });
    }
  }
}

export const ecommerceAnalytics = new EcommerceAnalytics();
