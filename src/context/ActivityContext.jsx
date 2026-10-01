import { createContext, useContext, useState } from 'react';
import { mockActivity } from '../data/mock';

const ActivityContext = createContext(null);

export function ActivityProvider({ children }) {
  const [activities, setActivities] = useState(mockActivity);

  function logActivity({ type, title, sub }) {
    const entry = {
      id: 'a' + Date.now() + Math.random().toString(36).slice(2, 6),
      type: type || 'general',
      title: title || 'Activity',
      sub: sub || '',
      createdAt: new Date().toISOString()
    };
    setActivities(list => [entry, ...list]);
    return entry;
  }

  function clearActivity() {
    setActivities([]);
  }

  return (
    <ActivityContext.Provider value={{ activities, logActivity, clearActivity }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be inside ActivityProvider');
  return ctx;
}