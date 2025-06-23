import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Revolutionize Your Laundry Business with One Powerful Platform
          </h1>
          <p className="text-xl mb-8">
            Manage branches, track expenses, and monitor orders – all in one place.
          </p>
          <div className="space-x-4">
            <Link href="/contact" className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition">
              Book a Demo
            </Link>
            <Link href="/pricing" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition">
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 mb-4 text-blue-600">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Overview Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Comprehensive Features for Your Laundry Business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 border border-gray-200 rounded-xl">
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-8 py-12">
              <h2 className="text-3xl font-bold text-center mb-8">Simple, Transparent Pricing</h2>
              <div className="text-center mb-8">
                <span className="text-4xl font-bold">NPR 175,000</span>
              </div>
              <div className="space-y-4">
                {included.map((item, index) => (
                  <div key={index} className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </div>
                ))}
                {excluded.map((item, index) => (
                  <div key={index} className="flex items-center text-red-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Transform Your Laundry Business?</h2>
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span>+977 123-456-789</span>
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>contact@laundrychowk.com</span>
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
                </svg>
                <span>WhatsApp</span>
              </div>
            </div>
            <Link href="/contact" className="bg-white text-blue-600 px-12 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition inline-block">
              Let&apos;s Talk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const benefits = [
  {
    title: "Multi-Branch Management",
    description: "Efficiently manage multiple locations from a single dashboard",
    icon: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  },
  {
    title: "Real-Time Admin Dashboard",
    description: "Monitor all operations in real-time with comprehensive analytics",
    icon: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
    </svg>
  },
  {
    title: "Automated Order Tracking",
    description: "Track orders from pickup to delivery with automated updates",
    icon: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
    </svg>
  },
  {
    title: "Income & Expense Reports",
    description: "Detailed financial reporting for better business decisions",
    icon: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  },
  {
    title: "Customer Database",
    description: "Maintain detailed customer histories and preferences",
    icon: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
    </svg>
  },
  {
    title: "Nepali Language Support",
    description: "Full interface support in both English and Nepali",
    icon: <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  }
];

const features = [
  {
    title: "Branch Management",
    description: "Centralized control of multiple locations with individual performance tracking"
  },
  {
    title: "Admin Dashboard",
    description: "Comprehensive overview of all operations, orders, and analytics"
  },
  {
    title: "Expense & Income Tracking",
    description: "Detailed financial monitoring and reporting system"
  },
  {
    title: "Client Tracking",
    description: "Customer history, preferences, and order management"
  },
  {
    title: "Order Management",
    description: "End-to-end order tracking from receipt to delivery"
  },
  {
    title: "Payment Notification",
    description: "Automated payment tracking and notification system"
  },
  {
    title: "Role-Based Access",
    description: "Secure, customizable access levels for different staff roles"
  },
  {
    title: "Nepali Translation",
    description: "Complete interface available in both English and Nepali"
  },
  {
    title: "Backup & Export",
    description: "Regular automated backups and data export capabilities"
  }
];

const included = [
  "Admin system",
  "Centralized review platform",
  "Live working software",
  "Multi-branch support",
  "24/7 technical support"
];

const excluded = [
  "Bank/eSewa API integration",
  "Domain & hosting costs",
  "Custom feature development"
];

const faqs = [
  {
    question: "Does the system support multiple locations?",
    answer: "Yes, our system is designed to handle multiple branches with centralized management and individual performance tracking."
  },
  {
    question: "Is the software available in Nepali?",
    answer: "Yes, the entire interface is available in both English and Nepali languages, making it accessible for all staff members."
  },
  {
    question: "What is excluded in the price?",
    answer: "The price excludes bank/eSewa API integration, domain and hosting costs, and any custom feature development beyond the standard package."
  },
  {
    question: "How secure is the system?",
    answer: "We implement role-based access control, secure data encryption, and regular backups to ensure your business data remains safe and protected."
  }
];
