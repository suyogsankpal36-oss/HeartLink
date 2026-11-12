function activeRestrictionUntil(user, scope, now = new Date()) {
  const value = user?.moderation?.restrictions?.[`${scope}Until`];
  if (!value) return null;
  const until = new Date(value);
  return Number.isNaN(until.getTime()) || until <= now ? null : until;
}

function restrictionMessage(scope, until) {
  const label = scope === "messaging" ? "Messaging" : "Discovery";
  return `${label} is temporarily restricted until ${until.toLocaleString()}.`;
}

module.exports = { activeRestrictionUntil, restrictionMessage };
