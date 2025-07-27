interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  location: string;
  description: string;
  organizer?: { name: string; email: string };
}

export class CalendarService {
  static generateICS(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      // Format: YYYYMMDDTHHMMSSZ
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@reactfasttraining.co.uk`;
    const now = new Date();
    const organizerName = event.organizer?.name || 'React Fast Training';
    const organizerEmail = event.organizer?.email || 'info@reactfasttraining.co.uk';

    // Escape special characters in text fields
    const escapeText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//React Fast Training//Course Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'X-WR-CALNAME:React Fast Training',
      'X-WR-TIMEZONE:Europe/London',
      'BEGIN:VTIMEZONE',
      'TZID:Europe/London',
      'X-LIC-LOCATION:Europe/London',
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:+0000',
      'TZOFFSETTO:+0100',
      'TZNAME:BST',
      'DTSTART:19700329T010000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0000',
      'TZNAME:GMT',
      'DTSTART:19701025T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD',
      'END:VTIMEZONE',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${formatDate(event.start)}`,
      `DTEND:${formatDate(event.end)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      `LOCATION:${escapeText(event.location)}`,
      `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'TRANSP:OPAQUE',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${event.title} tomorrow`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${event.title} starts in 2 hours`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    return icsContent.join('\r\n');
  }

  static generateMultiDayICS(events: CalendarEvent[]): string {
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    };

    const now = new Date();
    const escapeText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//React Fast Training//Course Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'X-WR-CALNAME:React Fast Training',
      'X-WR-TIMEZONE:Europe/London',
      'BEGIN:VTIMEZONE',
      'TZID:Europe/London',
      'X-LIC-LOCATION:Europe/London',
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:+0000',
      'TZOFFSETTO:+0100',
      'TZNAME:BST',
      'DTSTART:19700329T010000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0000',
      'TZNAME:GMT',
      'DTSTART:19701025T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD',
      'END:VTIMEZONE',
    ];

    // Add each event
    events.forEach((event, index) => {
      const uid = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}@reactfasttraining.co.uk`;
      const organizerName = event.organizer?.name || 'React Fast Training';
      const organizerEmail = event.organizer?.email || 'info@reactfasttraining.co.uk';

      icsContent = icsContent.concat([
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatDate(now)}`,
        `DTSTART:${formatDate(event.start)}`,
        `DTEND:${formatDate(event.end)}`,
        `SUMMARY:${escapeText(event.title)}`,
        `DESCRIPTION:${escapeText(event.description)}`,
        `LOCATION:${escapeText(event.location)}`,
        `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'TRANSP:OPAQUE',
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        `DESCRIPTION:Reminder: ${event.title} tomorrow`,
        'END:VALARM',
        'END:VEVENT',
      ]);
    });

    icsContent.push('END:VCALENDAR');

    return icsContent.join('\r\n');
  }
}