import React, { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const testimonials = [
    {
      id: 1,
      name: "Priya Sharma",
      role: "Senior Recruiter",
      company: "TechHire Solutions",
      image: "/api/placeholder/80/80",
      rating: 5,
      text: "RecruiterV has completely transformed how I work. The commission structure is transparent, and I've closed more positions in the last 3 months than I did in the entire previous year. The platform is intuitive and the support team is excellent!",
      // placements: 45,
      // earnings: "₹12L+"
    },
    {
      id: 2,
      name: "Rahul Mehta",
      role: "Independent Recruiter",
      company: "Freelance",
      image: "/api/placeholder/80/80",
      rating: 5,
      text: "As a freelance recruiter, finding quality leads was always a challenge. RecruiterV changed that completely. The real-time job updates and high-commission roles have helped me triple my income. Highly recommend to anyone in recruitment!",
      // placements: 32,
      // earnings: "₹8.5L+"
    },
    {
      id: 3,
      name: "Anjali Patel",
      role: "Recruitment Manager",
      company: "Staffing Pro",
      image: "/api/placeholder/80/80",
      rating: 5,
      text: "The quality of clients on RecruiterV is outstanding. I love that I can filter jobs by commission and location. The platform has helped our team become more efficient, and we've built lasting relationships with some amazing companies.",
      // placements: 67,
      // earnings: "₹18L+"
    },
    {
      id: 4,
      name: "Vikram Singh",
      role: "HR Consultant",
      company: "Talent Bridge",
      image: "/api/placeholder/80/80",
      rating: 5,
      text: "What sets RecruiterV apart is the community. I've networked with other recruiters, learned best practices, and grown my business exponentially. The recognition program motivates me to perform better every month!",
      // placements: 54,
      // earnings: "₹15L+"
    },
    {
      id: 5,
      name: "Sneha Reddy",
      role: "Campus Recruiter",
      company: "FreshTalent Inc",
      image: "/api/placeholder/80/80",
      rating: 5,
      text: "I started using RecruiterV just 6 months ago, and I'm amazed at the opportunities available. The interview drive section is particularly useful for bulk hiring. Payment processing is quick and hassle-free!",
      // placements: 28,
      // earnings: "₹6.5L+"
    }
  ];

  useEffect(() => {
    if (!isAutoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlay(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlay(false);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlay(false);
  };

  return (
    <div className="bg-white py-20 px-6 relative overflow-hidden">
     

      <div className="w-full max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Star className="w-4 h-4 fill-current" />
            <span>Success Stories</span>
          </div>
          <h2 className="text-4xl font-bold text-[#CB202D] mb-4">
            What Our Recruiters Say
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Join thousands of successful recruiters who have transformed their careers with RecruiterV.
          </p>
        </div>

        {/* Main Testimonial Card */}
        <div className="relative">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-5xl mx-auto border-2 border-gray-100">
            
            {/* Quote Icon */}
            <div className="absolute top-8 left-8 opacity-10">
              <Quote className="w-20 h-20 text-blue-600" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Rating */}
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-6 h-6 text-orange-500 fill-current"
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 text-lg md:text-xl leading-relaxed text-center mb-8 min-h-[120px] flex items-center justify-center">
                "{testimonials[currentIndex].text}"
              </p>

              {/* Author Info */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Left: Profile */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-orange-400 flex items-center justify-center text-white text-2xl font-bold">
                      {testimonials[currentIndex].name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {testimonials[currentIndex].name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {testimonials[currentIndex].role}
                    </p>
                    {/* <p className="text-blue-600 text-sm font-semibold">
                      {testimonials[currentIndex].company}
                    </p> */}
                  </div>
                </div>

                {/* Right: Stats */}
                {/* <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {testimonials[currentIndex].placements}
                    </div>
                    <div className="text-xs text-gray-600">Placements</div>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {testimonials[currentIndex].earnings}
                    </div>
                    <div className="text-xs text-gray-600">Earned</div>
                  </div>
                </div> */}

              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-600 text-blue-600 hover:text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 group"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-600 text-blue-600 hover:text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 group"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-blue-600"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Stats Bar */}
        {/* <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all">
            <div className="text-3xl font-bold text-blue-700 mb-2">5000+</div>
            <div className="text-gray-600 font-medium">Happy Recruiters</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg border-2 border-orange-100 hover:border-orange-300 transition-all">
            <div className="text-3xl font-bold text-orange-700 mb-2">25,000+</div>
            <div className="text-gray-600 font-medium">Successful Placements</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg border-2 border-green-100 hover:border-green-300 transition-all">
            <div className="text-3xl font-bold text-green-700 mb-2">₹50Cr+</div>
            <div className="text-gray-600 font-medium">Total Commissions Paid</div>
          </div>
        </div> */}

      </div>
    </div>
  );
};

export default Testimonials;