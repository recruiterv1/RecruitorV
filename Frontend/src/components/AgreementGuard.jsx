import { useContext, Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import { UserStateContext } from '../context/AuthPro';
import AgreementAcceptGate from './AgreementAcceptGate';

// Agreement gate — only ever catches accounts created BEFORE the Terms & Conditions
// checkbox existed on the sign-up form. New sign-ups accept at registration
// (agreementSigned = true) and never see this. Admins / SuperAdmins / ClientSPOCs
// are never gated.
//
// Rather than redirecting these users into the long clause-by-clause agreement page,
// we show a blocking acceptance modal with the same lightweight consent new users
// give: role terms summary + mandatory tick + link to the full agreement.

// Pages that must stay usable without the gate:
//  • auth pages (nobody is signed in yet)
//  • the agreement pages themselves, so "View full agreement" is readable
const UNGATED = new Set([
  '/log_rec',
  '/reg',
  '/otp',
  '/',
  '/forgot-password',
  '/reset-password',
  '/recruiter-agreement',
  '/coach-agreement',
  '/expert-agreement',
]);

const isSuperAdminRole = (user) => {
  const rc = (user?.roleCategory || '').toLowerCase().replace(/\s/g, '');
  const r  = (user?.role         || '').toLowerCase().replace(/\s/g, '');
  return rc === 'superadmin' || r === 'superadmin';
};

const AgreementGuard = ({ children }) => {
  const { user, isChecking } = useContext(UserStateContext);
  const location = useLocation();

  const isAdmin      = user?.type === 'admin' || isSuperAdminRole(user);
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  // Never gate while auth is still resolving, or for admins/clientspoc
  // A recruiter registered by a vendor works under that vendor's agreement, so
  // they are never asked to sign one themselves.
  const isVendorTeam = !!user?.vendorEmail;
  const needsAgreement = !isChecking && user && !isAdmin && !isClientSpoc && !isVendorTeam && !user.agreementSigned;

  return (
    <Fragment>
      {children}
      {needsAgreement && !UNGATED.has(location.pathname) && <AgreementAcceptGate />}
    </Fragment>
  );
};

export default AgreementGuard;
