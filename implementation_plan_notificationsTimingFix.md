# Fix Prayer Notifications Scheduling at Wrong Times for Non-Local Users

Users in London and America are receiving prayer notifications at incorrect times, while notifications work correctly for Lahore/Pakistan users. This is a timezone conversion bug in `parseTimeToDateWithTimezone` and the notification scheduling pipeline.

## Root Cause Analysis

I found **3 bugs** that collectively cause wrong notification times:

### Bug 1: `parseTimeToDateWithTimezone` — Timezone offset parsing fails for non-GMT+ abbreviations (CRITICAL)

The function at [PrayerTimeService.js:174-209](file:///Users/waleedahmad/Downloads/AJR_APP_V2_3/src/services/PrayerTimeService.js#L174-L209) extracts the UTC offset by parsing the `timeZoneName` part from `Intl.DateTimeFormat`. It expects a format like `GMT+5` or `GMT-4`.

**The problem:** Different platforms/locales return timezone abbreviations like `BST`, `EDT`, `EST`, `CDT`, `PDT`, etc. — **not** `GMT+X`. The regex `GMT([+-]\d{1,2})(?::?(\d{2}))?` simply **does not match** these abbreviations, so `offsetMatch` is `null`, and the offset defaults to **0** (i.e., UTC).

**Impact:** For a London user during BST (British Summer Time = UTC+1):
- Prayer time `18:46` in London should be `17:46 UTC`
- But offset resolves to 0, so it schedules at `18:46 UTC` = `19:46 BST`
- **Notification arrives ~1 hour late**

For a US Eastern user during EDT (UTC-4):
- Prayer time `18:30` in New York should be `22:30 UTC`
- But offset resolves to 0, so it schedules at `18:30 UTC` = `14:30 EDT`
- **Notification arrives ~4 hours early**

For Lahore (Asia/Karachi = PKT, UTC+5):
- Some iOS devices render this as `GMT+5` which the regex **does** match
- This is why it works in Lahore — it's coincidentally in a timezone where the abbreviation format matches

### Bug 2: London API always returns today's times regardless of requested date

The function [fetchLondonPrayerTimes](file:///Users/waleedahmad/Downloads/AJR_APP_V2_3/src/services/PrayerTimeService.js#L294-L429) hardcodes today's London date. When the notification scheduler fetches timings for future days (day+1 through day+5), it calls `fetchPrayerTimes(lat, lng, futureDate, school)` which routes to `fetchLondonPrayerTimes(school)` for London users — but that function **ignores the `date` parameter** and always fetches today's date.

The comment on line 470-472 even acknowledges this:
```js
// Note: fetchLondonPrayerTimes currently only fetches today's. 
// If date is not today, we might need to adjust it there too
```

**Impact:** London users get today's prayer times scheduled for all 6 days. While the times won't differ by much day-to-day, in combination with Bug 1, this compounds the error.

### Bug 3: `_scheduleSingleDay` uses `date` as baseDate — but `date` is a device-local Date object

In [NotificationService.js:400-402](file:///Users/waleedahmad/Downloads/AJR_APP_V2_3/src/services/NotificationService.js#L400-L402):
```js
const date = new Date();
date.setDate(date.getDate() + dayOffset);
```

This `date` is created in the **device's local timezone**. It's passed to `_parseTime()` as `baseDate`, which passes it to `parseTimeToDateWithTimezone()`. The function uses `baseDate` to determine the year/month/day in the prayer location's timezone. 

If the device timezone is far from the prayer location's timezone, the day might be off by one. For example, if it's 11 PM in New York (UTC-4) = 4 AM next day in Karachi (UTC+5), the `baseDate` would be today's date on the device but tomorrow's date in the prayer timezone. The function handles this correctly through the `Intl.DateTimeFormat` parsing of `baseDate` — BUT only if Bug 1's offset calculation works, which it doesn't.

## Proposed Changes

### [PrayerTimeService.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_3/src/services/PrayerTimeService.js)

#### Fix 1: Rewrite `parseTimeToDateWithTimezone` to use a robust offset calculation

Instead of parsing the timezone abbreviation string (which is platform/locale-dependent), **calculate the UTC offset mathematically** by comparing the wall-clock time in the target timezone against UTC:

```js
// Get the local wall-clock components in the target timezone
// We already have: tzYear, tzMonth, tzDay from formatToParts

// Build a UTC timestamp as if these local values WERE UTC
const asIfUtcMs = Date.UTC(tzYear, tzMonth, tzDay, tzHours, tzMinutes, tzSeconds);

// The actual UTC time is baseDate.getTime()
// The difference = offset of the timezone
const offsetMs = asIfUtcMs - baseDate.getTime();

// Now build the prayer time using the same date but prayer hours/minutes
const localPrayerUtcMs = Date.UTC(tzYear, tzMonth, tzDay, prayerHours, prayerMinutes, 0) - offsetMs;
```

This approach is **100% platform-independent** — no string parsing of timezone names, no regex, works for BST/EDT/CDT/IST/PKT/any abbreviation.

#### Fix 2: Pass the `date` parameter through to `fetchLondonPrayerTimes`

Update `fetchLondonPrayerTimes` to accept and use the requested date instead of always computing today's London date. The London API supports arbitrary dates via the `date` query parameter.

### NotificationService.js — No changes needed

The notification scheduling logic itself is correct. Once `parseTimeToDateWithTimezone` returns the correct UTC Date, the `scheduleAt` function already uses a `DATE` trigger with the absolute Date object, which expo-notifications handles correctly on both platforms.

## Verification Plan

### Automated Tests
After making changes, add diagnostic logging to verify:
1. Run the app and check console logs for `[NOTIFICATION] Parsed` lines — verify that prayer times are converted to correct UTC timestamps
2. For London BST: `18:46` should parse to `17:46:00 UTC` (UTC = BST - 1)
3. For US EDT: `18:30` should parse to `22:30:00 UTC` (UTC = EDT + 4)
4. For Pakistan PKT: `18:46` should parse to `13:46:00 UTC` (UTC = PKT - 5)

### Manual Verification
- Ask the London and US testers to:
  1. Update the app from TestFlight
  2. Open the Notifications screen and toggle any prayer off/on to force re-scheduling
  3. Verify notifications arrive at the correct prayer time

> [!IMPORTANT]
> The timezone offset bug affects **all non-GMT timezone users** on platforms where `Intl.DateTimeFormat` returns abbreviations like BST, EDT, etc. instead of GMT+X. This is the primary cause and fixing it should resolve the issue globally.
