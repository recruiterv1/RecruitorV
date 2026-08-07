// Guidance emails sent to the recruiter who shared a profile when a candidate is
// set to "Screen Reject" with a specific reason. Keyed by the exact reason label
// used in the candidate modal dropdown.
const REASON_TEXTS = {
  'Experience Short':
`Thank you for sharing this profile. The candidate appears to have relevant exposure and could be a strong fit for opportunities aligned with their current experience level.

For this role, the client's minimum experience requirement is very strict. Even a small shortfall in experience is generally not accepted. Please also verify whether any internship period has been included in the total experience calculation. While internships add value to a profile, the client does not consider them as full-time work experience. However, they do require proper offer letters and relieving/completion documents for any internship mentioned.

Your sourcing efforts are appreciated. A quick validation of total relevant experience before submission will help improve acceptance rates and save valuable time.`,

  'Experience High':
`Thank you for identifying this candidate. The profile demonstrates strong experience and domain expertise.

For this position, however, the total experience exceeds the client's preferred range. The client may consider candidates up to approximately 20% above the maximum requirement, but this profile appears beyond that threshold. Please check whether any internship period has been counted as employment experience. If so, the profile may still be worth reviewing. Please note that internships are not considered work experience by the client, though supporting documents are still required.

You are sourcing experienced talent well. Matching experience levels more closely to the JD will improve profile acceptance and interview conversion.`,

  'Skill Mismatch':
`Thank you for sharing this profile. The candidate may have valuable experience; however, the skills and responsibilities reflected in the CV do not align closely enough with the JD requirements.

Please spend a few minutes researching the role through ChatGPT, Google, or discussions with your coach to better understand how the required skills work together and what the client is actually seeking. Understanding the JD more deeply will help reduce rejections and improve profile quality.

Your sourcing skills will continue to improve with every role you work on. Investing a little extra time in understanding the JD will help you work more effectively and achieve better results.`,

  'Notice Period':
`Thank you for sharing this candidate. The profile appears suitable for the role in many respects.

Unfortunately, the client's hiring timeline requires someone who can join much sooner, and the candidate's notice period exceeds what the client can accommodate. Please prioritize immediate joiners or candidates who are already serving notice.

Reviewing the JD before sourcing will help identify the acceptable notice period and improve submission success.`,

  'Budget Mismatch':
`Thank you for identifying this profile. The candidate appears qualified and may be suitable for opportunities with a higher compensation range.

For this role, however, the compensation expectation is beyond the client's approved budget. As a guideline, please avoid considering candidates seeking more than a 35% hike unless they already hold a competing offer. If the client's budget allows a smaller increase, align sourcing accordingly.

Early compensation validation will improve offer conversion rates and reduce last-stage dropouts.`,

  'Notice Verification':
`Thank you for sharing this profile. The candidate appears interested in making a career move.

The notice period mentioned seems inconsistent with information received from other candidates working in the same organization, where the official notice period is generally higher. Please verify this carefully before submission. If the candidate is on the bench or serving notice, obtain proof of resignation acceptance or last working day.

A little extra verification at the sourcing stage helps build client confidence and reduces avoidable rejections later.`,

  'Relevant Experience':
`Thank you for sharing this candidate. The overall experience level falls within the required range.

However, the relevant experience required for this specific role is lower than the client's expectation. Please review the JD carefully and focus on matching the role-specific experience requirements rather than only total years of experience.

This small adjustment can significantly improve interview selection rates.`,

  'Job Stability':
`Thank you for identifying this profile. The candidate has gained experience across multiple organizations.

However, the client is concerned about the frequency of job changes and prefers candidates with a more stable employment history. Frequent movement between companies may create concerns about long-term retention.

Evaluating tenure patterns during screening will help improve profile acceptance and client confidence.`,

  'Recent Switch':
`Thank you for sharing this candidate. The profile has relevant experience and appears professionally capable.

However, the candidate has recently changed jobs. In such situations, candidates are often less willing to move unless offered a significant compensation increase, which may not fit the client's budget.

Please verify compensation expectations early in the process. This helps avoid unnecessary effort and improves closure rates.`,

  'Employer Concern':
`Thank you for sharing this profile. The candidate may have relevant skills and experience.

Unfortunately, the employer background does not align with the client's preferred hiring criteria. As a best practice, review the employer's website, LinkedIn presence, market reputation, and online reviews before sourcing similar profiles.

Developing this habit will improve profile quality and help you identify stronger candidates for future requirements.`,

  'Employment Gap':
`Thank you for sharing this profile. The candidate may have relevant experience and capabilities.

However, the employment gap falls outside the client's hiring guidelines. The client believes extended career gaps may impact current skill readiness for the role.

Reviewing employment timelines carefully before submission will help reduce avoidable rejections and improve sourcing effectiveness.`,

  'Location Mismatch':
`Thank you for identifying this candidate. The profile may be suitable for opportunities in the future.

For this position, the client is specifically looking for candidates already based in the location mentioned in the JD. At present, the client is not considering candidates who are open to relocation.

Referring to the JD before sourcing will help focus efforts on profiles that have a higher chance of selection.`,

  'Industry Mismatch':
`Thank you for sharing this profile. The candidate has relevant skills and experience.

However, the client's preference is for candidates coming from a specific industry background, and this profile does not align with that requirement. Industry knowledge and exposure are important factors for this role.

Please review the JD and map similar organizations from the target industry. This will help improve profile quality and increase selection rates.`,

  'Communication':
`Thank you for sharing this candidate. The profile demonstrates relevant experience and technical capability.

However, the communication skills currently do not meet the client's expectations for this role. Since communication is a key success factor in many positions, clients often evaluate it very closely.

Assessing communication during the initial screening stage will help improve submission quality and interview success rates.`,

  'Skills Not Evident':
`Thank you for sharing this profile. The candidate has mentioned the required skills in the CV.

However, these skills are not reflected within the projects, responsibilities, achievements, or work experience sections. Clients typically expect to see evidence of how and where a skill has been applied, rather than only finding it in the keyword section.

Please work with the candidate to update the CV and clearly demonstrate the use of these skills. This will strengthen the profile and improve its chances of selection.`,
};

module.exports = { REASON_TEXTS };
