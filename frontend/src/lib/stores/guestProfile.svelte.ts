const STORAGE_KEY = 'guest_profile';

const load = (): { name: string; email: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { name: string; email: string }) : { name: '', email: '' };
  } catch {
    return { name: '', email: '' };
  }
};

let profile = $state(load());

export const getGuestProfile = () => profile;

export const saveGuestProfile = ({ name, email }: { name: string; email: string }) => {
  profile = { name, email };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};
