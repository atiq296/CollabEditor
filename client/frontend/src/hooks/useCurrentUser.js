// src/hooks/useCurrentUser.js
import { useState, useEffect } from 'react';
import { jwtDecode }      from 'jwt-decode';

export default function useCurrentUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) return;
    try {
      // <-- use jwtDecode (named) here
      const { id, username } = jwtDecode(token);
      setUser({ _id: id, username });
    } catch (e) {
      console.error('Invalid JWT:', e);
    }
  }, []);

  return user;
}


