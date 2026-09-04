import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronLeft, ChevronRight, Star } from "lucide-react";

const HiringPart = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const partners = [
    { name: "ACFL", logo: "/partner/acfl.jpg", industry: "Finance" },
    { name: "Aditya Birla", logo: "/partner/adityabirla.jpg", industry: "Conglomerate" },
    { name: "Affine", logo: "/partner/affine1.jpg", industry: "Analytics" },
    { name: "Asian Paints", logo: "/partner/asianpaints.png", industry: "Manufacturing" },
    { name: "AU Small Finance", logo: "/partner/ausmallfinance.jpg", industry: "Banking" },
    { name: "Auth Bridge", logo: "/partner/authbridge.jpg", industry: "Technology" },
    { name: "Bajaj Capital", logo: "/partner/bajajcapital.png", industry: "Finance" },
    { name: "Brillio", logo: "/partner/brillio.jpg", industry: "Technology" },
    { name: "Coherent", logo: "/partner/coherent.png", industry: "Technology" },
    { name: "Dainik Bhaskar", logo: "/partner/dainikbhaskar.jpg", industry: "Media" },
    { name: "Great Learning", logo: "/partner/greatlearning.jpg", industry: "EdTech" },
    { name: "Indusind Bank", logo: "/partner/indusindbank.jpg", industry: "Banking" },
    { name: "Konica Minolta", logo: "/partner/konicaminota.jpg", industry: "Technology" },
    { name: "Latent View", logo: "/partner/latentview.jpg", industry: "Analytics" },
    { name: "LTI Mindtree", logo: "/partner/ltimind.jpg", industry: "IT Services" },
    { name: "Motilal Oswal", logo: "/partner/motilaloswal.jpg", industry: "Finance" },
    { name: "Muthoot Finance", logo: "/partner/muthootfinance.jpg", industry: "Finance" },
    { name: "One Banc", logo: "/partner/onebanc.jpg", industry: "Finance" },
    { name: "RBL Bank", logo: "/partner/rbl.jpg", industry: "Banking" },
    { name: "SMC", logo: "/partner/smc.png", industry: "Finance" },
    { name: "Sun TV", logo: "/partner/suntv.jpg", industry: "Media" },
    { name: "Tata Capital", logo: "/partner/tatacapital.jpg", industry: "Finance" },
    { name: "Tech Mahindra", logo: "/partner/techahindra.png", industry: "IT Services" },
    { name: "Tiger Analytics", logo: "/partner/tigeranalytics.webp", industry: "Analytics" },
  ];

  const itemsPerSlide = 8;
  const totalSlides = Math.ceil(partners.length / itemsPerSlide);

  useEffect(() => {
    if (!isAutoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlay, totalSlides]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setIsAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setIsAutoPlay(false);
  };

  const getCurrentPartners = () => {
    const start = currentIndex * itemsPerSlide;
    return partners.slice(start, start + itemsPerSlide);
  };

  // Group by industry
  // const industries = [...new Set(partners.map(p => p.industry))];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 py-20 px-4 sm:px-6">
      <div className="w-full max-w-7xl mx-auto">

        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Building2 size={16} />
            <span>Trusted by Leading Companies</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Hiring Partners
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Work with 100+ leading companies across industries
          </p>
        </div>

        {/* Industry Tags
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {industries.slice(0, 6).map((industry, index) => (
            <div
              key={index}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
            >
              {industry}
            </div>
          ))}
          <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-full text-sm font-semibold">
            +{industries.length - 6} more
          </div>
        </div> */}

        {/* Partners Carousel */}
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
            
            {/* Partners Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {getCurrentPartners().map((partner, index) => (
                <div
                  key={index}
                  className="group bg-gray-50 hover:bg-white border-2 border-gray-100 hover:border-blue-300 rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg cursor-pointer"
                  style={{
                    animation: `fadeInScale 0.5s ease-out ${index * 0.05}s both`
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-full h-20 flex items-center justify-center mb-3">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-xs font-semibold text-center text-gray-700 group-hover:text-blue-600 transition-colors">
                      {partner.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {partner.industry}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-600 text-blue-600 hover:text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 group border-2 border-gray-200 hover:border-blue-600"
              aria-label="Previous partners"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-600 text-blue-600 hover:text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 group border-2 border-gray-200 hover:border-blue-600"
              aria-label="Next partners"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsAutoPlay(false);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-gradient-to-r from-blue-600 to-orange-500"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        {/* <div className="mt-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-8 text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star size={24} className="fill-yellow-300 text-yellow-300" />
            <Star size={24} className="fill-yellow-300 text-yellow-300" />
            <Star size={24} className="fill-yellow-300 text-yellow-300" />
            <Star size={24} className="fill-yellow-300 text-yellow-300" />
            <Star size={24} className="fill-yellow-300 text-yellow-300" />
          </div>
          <h3 className="text-2xl font-bold mb-3">
            Want to Become a Hiring Partner?
          </h3>
          <p className="text-blue-50 mb-6 max-w-2xl mx-auto">
            Join 100+ leading companies who trust RecruiterV for their hiring needs. 
            Get access to 1000+ qualified recruiters and fill positions faster.
          </p>
          <Link
            to="/check-eligibility"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Building2 size={20} />
            <span>Become a Partner</span>
          </Link>
        </div> */}

        {/* Stats Bar */}
        {/* <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-md border-2 border-gray-100 hover:border-blue-300 transition-all">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2">
              100+
            </div>
            <div className="text-gray-600 font-medium">Hiring Partners</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md border-2 border-gray-100 hover:border-orange-300 transition-all">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2">
              4 Hours
            </div>
            <div className="text-gray-600 font-medium">Resume Submisson Time</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md border-2 border-gray-100 hover:border-blue-300 transition-all">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2">
              2000+
            </div>
            <div className="text-gray-600 font-medium">Positions Filled</div>
          </div>
        </div> */}
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default HiringPart;
