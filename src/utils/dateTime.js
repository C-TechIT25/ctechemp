const INDIA_TIME_ZONE = 'Asia/Kolkata';

const indianTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: INDIA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const formatWithZoneLabel = (date) =>
  `${indianTimeFormatter.format(date).toUpperCase()} IST`;

/**
 * Formats times for display in India Standard Time.
 *
 * Plain database TIME values (for example, "09:30:00") represent the clock
 * time entered by the employee, so they are formatted without shifting them.
 * Timestamp values that contain a date/timezone are converted to Asia/Kolkata.
 */
export const formatIndianTime = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '') return fallback;

  const rawValue = String(value).trim();
  const plainTimeMatch = rawValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/);
  const zonedTimeMatch = rawValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}(?::?\d{2})?)$/i);

  let date;

  if (plainTimeMatch) {
    const [, hour, minute, second = '00'] = plainTimeMatch;
    const numericHour = Number(hour);
    const numericMinute = Number(minute);
    const numericSecond = Number(second);

    if (numericHour > 23 || numericMinute > 59 || numericSecond > 59) return rawValue;

    const localIndianTime = `2000-01-01T${String(numericHour).padStart(2, '0')}:${minute}:${second}+05:30`;
    date = new Date(localIndianTime);
  } else if (zonedTimeMatch) {
    // Handles database TIME WITH TIME ZONE values such as 09:30:00+00.
    const [, hour, minute, second = '00', rawOffset] = zonedTimeMatch;
    let offset = rawOffset.toUpperCase();

    if (/^[+-]\d{2}$/.test(offset)) offset = `${offset}:00`;
    if (/^[+-]\d{4}$/.test(offset)) offset = `${offset.slice(0, 3)}:${offset.slice(3)}`;

    date = new Date(`2000-01-01T${hour.padStart(2, '0')}:${minute}:${second}${offset}`);
  } else {
    date = value instanceof Date ? value : new Date(rawValue);
  }

  if (Number.isNaN(date.getTime())) return rawValue;

  return formatWithZoneLabel(date);
};
