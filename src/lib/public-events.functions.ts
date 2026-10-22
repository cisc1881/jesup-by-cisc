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