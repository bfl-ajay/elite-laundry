import React, { useEffect, useRef } from 'react';

/**
 * ScreenReaderAnnouncement component for making announcements to screen readers
 * Uses aria-live regions to announce dynamic content changes
 */
const ScreenReaderAnnouncement = ({ message, priority = 'polite', clearAfter = 3000 }) => {
  const announcementRef = useRef(null);

  useEffect(() => {
    if (message && announcementRef.current) {
      // Set the message
      announcementRef.current.textContent = message;
      
      // Clear the message after specified time to prevent repetition
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = '';
          }
        }, clearAfter);
        
        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <div
      ref={announcementRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  );
};

export default ScreenReaderAnnouncement;