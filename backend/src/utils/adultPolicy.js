function parseDateOfBirth(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

function calculateAge(dateOfBirth, today = new Date()) {
  if (!(dateOfBirth instanceof Date) || !Number.isFinite(dateOfBirth.getTime())) return null;
  let age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  if (today.getUTCMonth() < dateOfBirth.getUTCMonth() || (today.getUTCMonth() === dateOfBirth.getUTCMonth() && today.getUTCDate() < dateOfBirth.getUTCDate())) age -= 1;
  return age;
}

module.exports = { parseDateOfBirth, calculateAge };
