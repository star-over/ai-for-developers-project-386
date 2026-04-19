const STORAGE_KEY = 'my_booking_ids';

const loadIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const saveIds = ({ ids }: { ids: string[] }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

let bookingIds = $state<string[]>(loadIds());

export const getBookingIds = () => bookingIds;

export const addBookingId = ({ id }: { id: string }) => {
  if (!bookingIds.includes(id)) {
    bookingIds = [...bookingIds, id];
    saveIds({ ids: bookingIds });
  }
};

export const removeBookingId = ({ id }: { id: string }) => {
  bookingIds = bookingIds.filter((b) => b !== id);
  saveIds({ ids: bookingIds });
};
