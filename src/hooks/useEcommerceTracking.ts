import { useCallback } from 'react'
import { ecommerceAnalytics, Product, Order } from '@/services/analytics/ecommerce.service'

export const useEcommerceTracking = () => {
  const trackProductView = useCallback((product: Product, listName?: string) => {
    ecommerceAnalytics.viewItem(product, listName)
  }, [])

  const trackProductListView = useCallback((products: Product[], listName: string) => {
    ecommerceAnalytics.viewItemList(products, listName)
  }, [])

  const trackProductSelect = useCallback((product: Product, listName?: string) => {
    ecommerceAnalytics.selectItem(product, listName)
  }, [])

  const trackAddToCart = useCallback((product: Product, quantity?: number) => {
    ecommerceAnalytics.addToCart(product, quantity)
  }, [])

  const trackRemoveFromCart = useCallback((product: Product, quantity?: number) => {
    ecommerceAnalytics.removeFromCart(product, quantity)
  }, [])

  const trackViewCart = useCallback(() => {
    ecommerceAnalytics.viewCart()
  }, [])

  const trackBeginCheckout = useCallback((coupon?: string) => {
    ecommerceAnalytics.beginCheckout(coupon)
  }, [])

  const trackAddPaymentInfo = useCallback((paymentType: string) => {
    ecommerceAnalytics.addPaymentInfo(paymentType)
  }, [])

  const trackAddShippingInfo = useCallback((shippingTier: string, shippingCost: number) => {
    ecommerceAnalytics.addShippingInfo(shippingTier, shippingCost)
  }, [])

  const trackPurchase = useCallback((order: Order) => {
    ecommerceAnalytics.purchase(order)
  }, [])

  const trackRefund = useCallback((orderId: string, products?: Product[], amount?: number) => {
    ecommerceAnalytics.refund(orderId, products, amount)
  }, [])

  const trackAddToWishlist = useCallback((product: Product) => {
    ecommerceAnalytics.addToWishlist(product)
  }, [])

  const trackProductComparison = useCallback((products: Product[]) => {
    ecommerceAnalytics.compareProducts(products)
  }, [])

  const trackProductSearch = useCallback((searchTerm: string, resultsCount: number, products?: Product[]) => {
    ecommerceAnalytics.searchProducts(searchTerm, resultsCount, products)
  }, [])

  const trackPromotion = useCallback((promotionId: string, promotionName: string, creative?: string, position?: string) => {
    ecommerceAnalytics.trackPromotion(promotionId, promotionName, creative, position)
  }, [])

  const trackPromotionClick = useCallback((promotionId: string, promotionName: string, creative?: string, position?: string) => {
    ecommerceAnalytics.selectPromotion(promotionId, promotionName, creative, position)
  }, [])

  return {
    trackProductView,
    trackProductListView,
    trackProductSelect,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewCart,
    trackBeginCheckout,
    trackAddPaymentInfo,
    trackAddShippingInfo,
    trackPurchase,
    trackRefund,
    trackAddToWishlist,
    trackProductComparison,
    trackProductSearch,
    trackPromotion,
    trackPromotionClick
  }
}