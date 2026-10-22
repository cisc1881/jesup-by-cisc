import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createPublicDataClient } from './public-data-client.functions';
import { fetchEventById, fetchEvents } from './events';

export const getPublicEvent = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    try {
      return JSON.stringify(await fetchEventById(data.id, createPublicDataClient()));
    } catch (error) {
      console.error('[public-event] Read failed', error);
      throw new Error('This event could not be loaded. Please try again.');
    }
  });

export const getPublicEvents = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      return JSON.stringify(await fetchEvents({ activeOnly: true }, createPublicDataClient()));
    } catch (error) {
      console.error('[public-events] Read failed', error);
      throw new Error('Events could not be loaded. Please try again.');
    }
  });

export const getPublicConferenceCatalog = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ eventId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: products, error } = await createPublicDataClient().from('event_products')
      .select('id,name,kind,beneficiary,description,price_cents,currency,sort_order')
      .eq('event_id', data.eventId).eq('is_active', true).order('sort_order').order('name');
    if (error) throw new Error('Catalog unavailable. Please try again.');
    return products ?? [];
  });