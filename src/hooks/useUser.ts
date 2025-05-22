import { useState, useEffect } from 'react';

const USER_ID_KEY = 'blabberbox_user_id';

export function useUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let storedUserId = localStorage.getItem(USER_ID_KEY);
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  return { userId };
}
