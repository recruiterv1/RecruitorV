import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Zap, Crown, ArrowRight, Sparkles } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const Pricing = () => {
  const plans = [
    {
      name: 'Free Plan',
      price: '₹0',
      period: '30 Days',
      description: 'Perfect for trying out our platform',
      icon: Zap,
      gradient: 'from-blue-500 to-blue-600',
      popular: false,
      features: [
        { text: 'Up to 2 positions', included: true },
        { text: '30 days access', included: true },
        { text: 'Basic candidate management', included: true },
        { text: 'Email notifications', included: true },
        { text: 'Standard support', included: true },
        { text: 'Unlimited positions', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'Priority support', included: false },
        { text: 'Coach & Expert Support', included: false },
      ],
    },
    {
      name: 'Paid Plan',
      price: 'Custom',
      period: '',
      description: 'For professional recruiters who need more',
      icon: Crown,
      gradient: 'from-orange-500 to-red-500',
      popular: true,
      features: [
        { text: 'Unlimited positions', included: true },
        { text: 'No time limit', included: true },
        { text: 'Advanced candidate management', included: true },
        { text: 'Email & SMS notifications', included: true },
        { text: 'Priority support', included: true },
        { text: 'Advanced analytics & reports', included: true },
        { text: 'Coach & Expert Support', included: true },
        { text: 'API access', included: true },
        { text: 'Dedicated account manager', included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-orange-500 py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-6">
            <Sparkles size={16} />
            <span>Simple, Transparent Pricing</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-blue-50 max-w-2xl mx-auto">
            Start for free or unlock unlimited potential with our paid plan. No hidden fees, no surprises.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16 -mt-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-orange-500 ring-opacity-50' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-bl-2xl font-bold text-sm flex items-center gap-2">
                    <Crown size={16} />
                    <span>MOST POPULAR</span>
                  </div>
                )}

                {/* Card Header */}
                <div className={`bg-gradient-to-r ${plan.gradient} p-8 text-white`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Icon size={24} />
                    </div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-blue-100">/ {plan.period}</span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-blue-50">{plan.description}</p>
                </div>

                {/* Features List */}
                <div className="p-8">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                            <Check size={16} className="text-green-600" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                            <X size={16} className="text-gray-400" />
                          </div>
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <a
                    href="https://www.recruiterv.com/reg"
                    className={`block w-full text-center py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                      plan.popular
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Get Started Now
                      <ArrowRight size={20} />
                    </span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl p-8 max-w-3xl mx-auto border-2 border-blue-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Not sure which plan is right for you?
            </h3>
            <p className="text-gray-600 mb-6">
              Start with our Free Plan and upgrade anytime when you are ready for more features and unlimited access.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://www.recruiterv.com/reg"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                Start Free Trial
                <ArrowRight size={20} />
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-3 rounded-xl font-semibold border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-bold text-gray-800 mb-2">Can I upgrade from Free to Paid plan later?</h4>
              <p className="text-gray-600">
                Yes! You can upgrade to the Paid plan at any time. Your data and positions will be preserved.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-bold text-gray-800 mb-2">What happens after 30 days on the Free plan?</h4>
              <p className="text-gray-600">
                After 30 days, you will need to upgrade to the Paid plan to continue creating new positions. Your existing data remains accessible.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-bold text-gray-800 mb-2">How do I get started with the Paid plan?</h4>
              <p className="text-gray-600">
                Click Get Started Now on the Paid plan card, register, and our team will contact you to set up your account with custom pricing.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-bold text-gray-800 mb-2">Is there a contract or commitment?</h4>
              <p className="text-gray-600">
                The Free plan has no commitment. For the Paid plan, we offer flexible terms based on your needs. Contact us for details.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
