import React from 'react'
import Header from '../pages/Header'
import Footer from '../pages/Footer'
import SearchBox from '../pages/SearchBox'
import JobLists from '../pages/JobLists'
import HiringPart from '../pages/HiringPart'
import ImmediateCards from '../pages/ImmediateCards'
import Features from '../pages/Features'
import Testimonials from '../pages/Testimonials'
import StatsSection from '../pages/StatsSection'
import Howitworks from '../pages/Howitworks'
import CategoryShowCase from '../pages/CategoryShowCase'
import WhyChooseUs from '../pages/WhyChooseUs'
import Faqs from '../pages/Faqs'
import Finalcta from '../pages/Finalcta'
import WhoWeServe from '../pages/WhoWeServe'



const Homepage = () => {
  return (
    <>
    <Header/>


    <Finalcta/>
    <SearchBox/>
    {/* <StatsSection/> */}

    <WhoWeServe />
    <HiringPart/>


    <Howitworks/>

    {/* <CategoryShowCase/> */}

    <JobLists/>
    <ImmediateCards/>

    <WhyChooseUs/>
    {/* <Features/> */}


    <Testimonials/>
    

    {/* <Faqs/> */}
    

    <Footer/>
    </>
  )
}

export default Homepage



// import React from 'react'
// import Header from '../pages/Header'
// import Footer from '../pages/Footer'

// // 1. HERO & TRUST SECTION
// import HeroSection from '../pages/HeroSection'
// import StatsSection from '../pages/StatsSection'

// // 2. EDUCATION SECTION
// import HowItWorks from '../pages/HowItWorks'
// import CategoryShowcase from '../pages/CategoryShowcase'

// // 3. OPPORTUNITIES SECTION
// import FeaturedJobs from '../pages/FeaturedJobs'
// import ImmediateHiring from '../pages/ImmediateHiring'

// // 4. VALUE PROPOSITION SECTION
// import WhyChooseUs from '../pages/WhyChooseUs'
// import Features from '../pages/Features'

// // 5. SOCIAL PROOF SECTION
// import Testimonials from '../pages/Testimonials'
// import HiringPartners from '../pages/HiringPartners'

// // 6. CONVERSION SECTION
// import FAQSection from '../pages/FAQSection'
// import FinalCTA from '../pages/FinalCTA'

// const Homepage = () => {
//   return (
//     <>
//       {/* ==================== NAVIGATION ==================== */}
//       <Header/>
      
//       {/* ==================== SECTION 1: HERO & TRUST ==================== */}
//       {/* First impression - Grab attention immediately */}
//       <HeroSection/>           {/* Line 1: Main hero with CTAs and value proposition */}
//       <StatsSection/>          {/* Line 2: Build trust with impressive numbers */}
      
//       {/* ==================== SECTION 2: EDUCATION ==================== */}
//       {/* Teach visitors how it works and what's available */}
//       <HowItWorks/>            {/* Line 3: Show the 4-step process */}
//       <CategoryShowcase/>      {/* Line 4: Display all 6 recruiter categories */}
      
//       {/* ==================== SECTION 3: OPPORTUNITIES ==================== */}
//       {/* Show what's available right now */}
//       <FeaturedJobs/>          {/* Line 5: Latest job openings */}
//       <ImmediateHiring/>       {/* Line 6: Urgent positions with tabs */}
      
//       {/* ==================== SECTION 4: VALUE PROPOSITION ==================== */}
//       {/* Convince them why RecruiterV is the best choice */}
//       <WhyChooseUs/>           {/* Line 7: Platform advantages with comparison table */}
//       <Features/>              {/* Line 8: 6 platform benefits */}
      
//       {/* ==================== SECTION 5: SOCIAL PROOF ==================== */}
//       {/* Build credibility through others' success */}
//       <Testimonials/>          {/* Line 9: Success stories from recruiters */}
//       <HiringPartners/>        {/* Line 10: 100+ company logos */}
      
//       {/* ==================== SECTION 6: CONVERSION ==================== */}
//       {/* Address concerns and final conversion push */}
//       <FAQSection/>            {/* Line 11: Answer common questions */}
//       <FinalCTA/>              {/* Line 12: Final conversion with dark gradient */}
      
//       {/* ==================== FOOTER ==================== */}
//       <Footer/>
//     </>
//   )
// }

// export default Homepage
