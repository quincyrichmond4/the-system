// The System — scheduled push notification
// Fires daily at 5:00 PM US Eastern (auto-adjusts for daylight saving).
// Sends a push ONLY if the player has unfinished Daily Quests for today.

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();

// Weekday index used by the app: 0 = Monday .. 6 = Sunday.
function appDayIndex(date) {
  const d = date.getDay(); // JS: 0 = Sunday .. 6 = Saturday
  return d === 0 ? 6 : d - 1;
}

// Is a quest scheduled for today? (empty/missing days = every day)
function questActiveToday(q, dayIdx) {
  if (!q || !Array.isArray(q.days) || q.days.length === 0) return true;
  return q.days.indexOf(dayIdx) !== -1;
}

exports.dailyQuestReminder = onSchedule(
  {
    schedule: '0 17 * * *',          // 5:00 PM, every day
    timeZone: 'America/New_York',    // Eastern — DST handled automatically
    region: 'us-central1',
  },
  async () => {
    // 1. Read the player document.
    const playerSnap = await db.collection('players').doc('strive').get();
    if (!playerSnap.exists) {
      console.log('No player document — nothing to do.');
      return;
    }
    const player = playerSnap.data() || {};

    // 2. Work out today's weekday in Eastern time.
    const easternNow = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    );
    const dayIdx = appDayIndex(easternNow);

    // 3. Check today's quests.
    const quests = Array.isArray(player.dailyQuests) ? player.dailyQuests : [];
    const todays = quests.filter((q) => questActiveToday(q, dayIdx));
    const unfinished = todays.filter((q) => !q.completed).length;

    if (todays.length === 0) {
      console.log('No quests scheduled today — no reminder.');
      return;
    }
    if (unfinished === 0) {
      console.log('All quests complete — no reminder.');
      return;
    }

    // 4. Collect this player's push tokens.
    const tokensSnap = await db
      .collection('players')
      .doc('strive')
      .collection('fcmTokens')
      .get();
    const tokens = [];
    tokensSnap.forEach((doc) => {
      const t = doc.data() && doc.data().token;
      if (t) tokens.push(t);
    });
    if (tokens.length === 0) {
      console.log('No push tokens registered — cannot notify.');
      return;
    }

    // 5. Send the push.
    const body =
      unfinished === 1
        ? '1 Daily Quest still unfinished. Complete it before the day ends.'
        : `${unfinished} Daily Quests still unfinished. Complete them before the day ends.`;

    const message = {
      notification: {
        title: 'The System — Daily Quest',
        body: body,
      },
      tokens: tokens,
    };

    const res = await getMessaging().sendEachForMulticast(message);
    console.log(`Sent: ${res.successCount} ok, ${res.failureCount} failed.`);

    // 6. Clean up any dead tokens so they don't pile up.
    const dead = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error && r.error.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          dead.push(tokens[i]);
        }
      }
    });
    for (const t of dead) {
      const q = await db
        .collection('players')
        .doc('strive')
        .collection('fcmTokens')
        .where('token', '==', t)
        .get();
      q.forEach((doc) => doc.ref.delete());
    }
  }
);
