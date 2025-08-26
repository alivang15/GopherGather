// filepath: /Users/alivang/Desktop/PersonalProjects/umn-events/packages/webapp/src/components/SessionStatus.tsx
"use client";

import { useEffect, useState } from 'react';

export default function SessionStatus() {
  const [sessionInfo, setSessionInfo] = useState<{
    type: string;
    expiresAt: string;
    daysLeft: number;
  } | null>(null);

  useEffect(() => {
    const updateSessionInfo = () => {
      const sessionExpiration = localStorage.getItem('sessionExpiration');
      const sessionType = localStorage.getItem('sessionType');
      const rememberMe = localStorage.getItem('rememberMe') === 'true';

      if (sessionExpiration && sessionType) {
        const expirationDate = new Date(sessionExpiration);
        const now = new Date();
        const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        setSessionInfo({
          type: rememberMe ? '14-day session' : '3-day session',
          expiresAt: expirationDate.toLocaleDateString(),
          daysLeft: Math.max(0, daysLeft)
        });
      }
    };

    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!sessionInfo) return null;

  return (
    <div className="text-xs text-gray-500 px-2 py-1">
      {sessionInfo.type} • {sessionInfo.daysLeft} days left
    </div>
  );
}
