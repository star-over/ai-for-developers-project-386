import type { EventType } from '$lib/api/model/index.js';

let selectedEventType = $state<EventType | null>(null);

export const getSelectedEventType = () => selectedEventType;

export const setSelectedEventType = ({ eventType }: { eventType: EventType }) => {
  selectedEventType = eventType;
};

export const clearSelectedEventType = () => {
  selectedEventType = null;
};
