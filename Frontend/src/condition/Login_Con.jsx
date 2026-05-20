import React from "react";
import { useNavigate } from "react-router-dom";

const Login_Con = () => {
    const navigate=useNavigate();
    const handleDone=()=>{
        navigate('/log_rec')
    }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-6 md:p-10 border border-blue-100">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
          RecruiterV – Login Terms & Conditions
        </h1>

        <div className="space-y-6 text-gray-700 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">1. Acceptance and Scope</h2>
            <p>
              By logging into the RecruiterV platform ("Platform") using an
              approved account, the recruiter ("Recruiter") confirms acceptance
              of these Terms and Conditions ("Terms") and agrees to comply with
              all platform rules, policies and mandate-specific commercial terms
              displayed inside the system. These Terms apply in addition to any
              prior registration terms and any separate agreements executed
              between RecruiterV ("Company") and the Recruiter.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">2. Account Security and Access</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Login credentials must be kept confidential and not shared.</li>
              <li>All activity from the account is presumed authorised.</li>
              <li>Suspected misuse must be reported immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">3. Permitted Use of the System</h2>
            <p>The Platform may be used only for professional recruitment activities.</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>No unauthorised access to modules, data or APIs.</li>
              <li>No malicious activity, disruption or testing without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">4. Data Entry and Candidate Submissions</h2>
            <p>
              All candidate data must be accurate, current and submitted with
              candidate consent. Recruiters must use prescribed workflows and
              keep statuses updated for reliability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">5. Confidentiality and Privacy</h2>
            <p>
              All information visible inside the system is confidential and may
              be used only for executing recruitment work related to assigned
              mandates, in compliance with privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">6. Non-Circumvention Inside the Platform</h2>
            <p>
              Recruiters must not bypass the Platform to approach clients or
              candidates directly using system data. Breach may result in
              suspension, recovery of commissions or legal action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">7. Communication and Conduct</h2>
            <p>
              All communication through the system must remain professional,
              respectful and accurate. False promises or misrepresentation are
              strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">8. System Features and Availability</h2>
            <p>
              RecruiterV may modify or remove system features at any time. The
              Platform may experience downtime due to maintenance or outages and
              uninterrupted access is not guaranteed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">9. Compliance and Audit Trail</h2>
            <p>
              RecruiterV may maintain logs of access, activity and communication
              for compliance, dispute resolution and security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">10. Intellectual Property</h2>
            <p>
              All system software, workflows, AI outputs and UI elements remain
              the intellectual property of RecruiterV. Use is limited to active
              account access only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">11. Commission, Payouts and Records</h2>
            <p>
              System records determine commission eligibility. Recruiters must
              review dashboards and raise discrepancies within defined timelines
              or records may be treated as accepted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">12. Misuse, Fraud and Enforcement</h2>
            <p>
              Fake profiles, manipulation, collusion or fraud may result in
              restricted access, withheld payments, termination or reporting to
              authorities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">13. Suspension and Termination</h2>
            <p>
              RecruiterV may suspend or terminate access for breach, inactivity,
              complaints or security concerns. Certain obligations survive
              termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">14. Limitation of Liability</h2>
            <p>
              RecruiterV is not liable for loss of opportunity, data or business
              interruption. Liability is limited to commissions paid within the
              defined look-back period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">15. Changes to These Login Terms</h2>
            <p>
              Updated Terms will be made available within the Platform. Continued
              use after updates constitutes acceptance. Disagreement requires
              cessation of use and account closure request.
            </p>
          </section>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={handleDone}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition duration-300"
          >
            I Agree & Continue
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} RecruiterV. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login_Con;