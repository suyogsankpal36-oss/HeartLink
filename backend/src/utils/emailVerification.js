function isEmailVerificationComplete(user) {
  return !user?.emailVerificationRequired || user.isEmailVerified === true;
}

module.exports = { isEmailVerificationComplete };
