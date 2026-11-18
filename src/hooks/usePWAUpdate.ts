import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const checkForUpdates = () => {
      const reg = registrationRef.current;
      if (!reg) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      void reg.update().catch(() => {
        // Ignore transient network errors during background update check
      });
    };

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
        setDismissed(false);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        registrationRef.current = registration;
        checkForUpdates();
      },
    });

    updateSWRef.current = updateSW;

    const intervalId = window.setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    window.addEventListener('focus', checkForUpdates);
    window.addEventListener('online', checkForUpdates);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', checkForUpdates);
      window.removeEventListener('online', checkForUpdates);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!updateSWRef.current || updating) return;
    setUpdating(true);
    try {
      await updateSWRef.current(true);
    } catch {
      setUpdating(false);
    }
  }, [updating]);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    showUpdateBanner: needRefresh && !dismissed,
    updating,
    applyUpdate,
    dismissUpdate,
  };
}
