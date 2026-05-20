import React from "react";
import { useNavigate } from "react-router-dom";

const Reg_Con = () => {

   const navigate= useNavigate();
   const handleAgree=()=>{
    navigate('/reg')
   }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-6 md:p-10 border border-blue-100">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
          RecruiterV – Registration Terms & Conditions
        </h1>

        <div className="space-y-6 text-gray-700 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">1. Introduction</h2>
            <p>
              These Terms and Conditions ("Terms") govern the access and use of
              RecruiterV.com and any related mobile or web applications
              ("Platform") by freelance recruiters, independent recruiters and
              recruitment agencies (collectively, "Recruiters"). By registering
              on the Platform, creating a profile, or submitting any candidate
              profiles, the Recruiter accepts these Terms and enters into a
              binding agreement with RecruiterV ("Company").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">2. Eligibility and Account</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>The Recruiter must be at least 18 years old and legally capable of entering into binding contracts under the Indian Contract Act, 1872.</li>
              <li>The Recruiter must provide accurate, complete and updated information during registration and maintain confidentiality of login credentials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">3. Nature of Relationship</h2>
            <p>
              RecruiterV acts solely as an online intermediation platform and does
              not employ Recruiters or candidates. Nothing herein creates a
              partnership, joint venture, employment, or agency relationship.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">4. Use of Platform</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Platform only for lawful recruitment-related activities.</li>
              <li>No fake profiles, fabricated CVs, data scraping, or security interference.</li>
              <li>No defamatory, obscene, discriminatory, or illegal content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">5. Recruiter Obligations</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Verify candidate details before submission.</li>
              <li>Submit candidates only with their explicit consent.</li>
              <li>No misrepresentation of role, employer, or compensation.</li>
              <li>No fees may be charged to candidates.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">6. Candidate Data & Confidentiality</h2>
            <p>
              All candidate data is confidential and must be processed strictly
              for recruitment purposes through the Platform only, in compliance
              with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">7. Non-Circumvention</h2>
            <p>
              Recruiters shall not bypass the Platform to directly approach
              clients or candidates introduced via RecruiterV for a defined
              lock-in period (typically 12–24 months). Breach may result in
              suspension, recovery of commissions, or liquidated damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">8. Submission Rules & Ownership</h2>
            <p>
              All submissions must be made through the Platform. Platform
              timestamps determine first-submission rights, subject to employer
              validation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">9. No Guarantee</h2>
            <p>
              RecruiterV does not guarantee shortlisting, interviews, or hiring.
              All hiring decisions are made solely by employers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">10. Commission & Payout</h2>
            <p>
              Commission terms are defined per mandate. Payment is due only after
              candidate joining, completion of guarantee period, and receipt of
              client payment by RecruiterV.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">11. Replacement / Refund</h2>
            <p>
              Recruiters may be required to provide replacements or accept
              commission adjustments if a candidate exits within the guarantee
              period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">12. Invoicing & Taxes</h2>
            <p>
              Recruiters must comply with GST, income tax, and invoicing
              requirements. Payments are subject to statutory deductions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">13. Legal Compliance</h2>
            <p>
              Recruiters must comply with all applicable recruitment, labor, data
              protection, and anti-discrimination laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">14. Intellectual Property</h2>
            <p>
              All Platform IP belongs to RecruiterV. Recruiters receive a limited,
              revocable license for Platform use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">15. Ratings & Conduct</h2>
            <p>
              Recruiters agree to professional conduct. Platform may display and
              use ratings or reviews.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">16. Suspension & Termination</h2>
            <p>
              RecruiterV may suspend or terminate accounts for violations,
              suspected fraud, or misuse. Certain obligations survive
              termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">17. Limitation of Liability</h2>
            <p>
              RecruiterV’s liability is limited to commissions paid in the
              preceding defined period, to the maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">18. Indemnity</h2>
            <p>
              Recruiters agree to indemnify RecruiterV against claims arising from
              breach, data misuse, misrepresentation, or legal violations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">19. Governing Law & Disputes</h2>
            <p>
              These Terms are governed by Indian law. Disputes shall be resolved
              via arbitration under the Arbitration and Conciliation Act, 1996.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">20. Changes to Terms</h2>
            <p>
              RecruiterV may update these Terms at any time. Continued use of the
              Platform constitutes acceptance of revised Terms.
            </p>
          </section>
        </div>


        <div className="mt-10 flex justify-center">
          <button
            onClick={handleAgree}
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

export default Reg_Con;
