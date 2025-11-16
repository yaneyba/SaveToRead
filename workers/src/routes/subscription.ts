/**
 * Subscription Routes
 *
 * Handles Stripe subscription management
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { Subscription } from '@readitlater/shared';

const app = new Hono<{ Bindings: Env; Variables: { userId?: string } }>();

/**
 * Get user's subscription
 */
app.get('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    // In a real implementation, fetch from Stripe
    const subscription: Subscription = {
      id: 'sub-1',
      userId,
      tier: 'free',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return c.json({ success: true, data: subscription });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'SUBSCRIPTION_ERROR', message: 'Failed to get subscription' }
    }, 500);
  }
});

/**
 * Create Stripe checkout session
 */
app.post('/checkout', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const { priceId } = await c.req.json<{ priceId: string }>();

    // In a real implementation, create Stripe checkout session
    const sessionId = `cs_${crypto.randomUUID()}`;
    const url = `https://checkout.stripe.com/${sessionId}`;

    return c.json({ success: true, data: { sessionId, url } });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'CHECKOUT_ERROR', message: 'Failed to create checkout session' }
    }, 500);
  }
});

/**
 * Create Stripe customer portal session
 */
app.post('/portal', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    // In a real implementation, create Stripe portal session
    const url = 'https://billing.stripe.com/portal';

    return c.json({ success: true, data: { url } });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'PORTAL_ERROR', message: 'Failed to create portal session' }
    }, 500);
  }
});

/**
 * Cancel subscription
 */
app.post('/cancel', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    // In a real implementation, cancel via Stripe
    return c.json({ success: true, data: undefined });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'CANCEL_ERROR', message: 'Failed to cancel subscription' }
    }, 500);
  }
});

export { app as subscriptionRoutes };
