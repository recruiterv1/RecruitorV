import { Fragment } from 'react';

// Profile-completion gate — DISABLED.
//
// This used to force Recruiter / Coach / Expert users with a profile completion
// below the threshold to /profile, blocking every other page until they filled
// it in. That requirement has been removed: users may now use the platform at
// any completion level, for every user type.
//
// The component is intentionally kept (and still mounted in App.jsx) so the gate
// can be switched back on by restoring the check here — nothing else needs to
// change. Profile completion is still calculated and surfaced elsewhere (the
// profile page, the completion popup, and the post-login landing choice); this
// only removes the hard block.
const ProfileGuard = ({ children }) => <Fragment>{children}</Fragment>;

export default ProfileGuard;
