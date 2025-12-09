import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="sm:hidden mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="w-full bg-slate-800/50 rounded-lg p-6 sm:p-8 lg:p-10">
          <h1 className="text-4xl font-bold text-slate-100 mb-3">Privacy Policy</h1>
          <p className="text-slate-400 mb-8 text-base">
            Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="space-y-8 text-slate-300 prose prose-invert max-w-none">
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">1. Introduction</h2>
              <p className="leading-relaxed text-base mb-4">
                Welcome to TypingThrust. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our typing test application and related services.
              </p>
              <p className="leading-relaxed text-base">
                By using TypingThrust, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">2. Information We Collect</h2>
              <p className="leading-relaxed text-base mb-3">
                We collect several types of information from and about users of our services:
              </p>
              
              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">2.1 Personal Information</h3>
              <p className="leading-relaxed text-base mb-2">
                When you create an account or use our services, we may collect:
              </p>
              <ul className="list-disc list-outside space-y-2 text-base ml-6 text-slate-300 mb-4">
                <li>Email address and account credentials</li>
                <li>Name and profile information (if provided)</li>
                <li>Authentication information from third-party providers (Google, GitHub)</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">2.2 Usage Data</h3>
              <p className="leading-relaxed text-base mb-2">
                We automatically collect information about how you use our services, including:
              </p>
              <ul className="list-disc list-outside space-y-2 text-base ml-6 text-slate-300 mb-4">
                <li>Typing test results and performance statistics</li>
                <li>Keystroke data and error patterns</li>
                <li>Time spent on tests and features used</li>
                <li>Device information (browser type, operating system)</li>
                <li>IP address and general location data</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">2.3 Cookies and Tracking Technologies</h3>
              <p className="leading-relaxed text-base">
                We use cookies, web beacons, and similar tracking technologies to track activity on our service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">3. How We Use Your Information</h2>
              <p className="leading-relaxed text-base mb-3">
                We use the information we collect for various purposes:
              </p>
              <ul className="list-disc list-outside space-y-2 text-base ml-6 text-slate-300 mb-4">
                <li>To provide, maintain, and improve our services</li>
                <li>To personalize your experience and provide tailored typing practice</li>
                <li>To track and analyze your typing performance and progress</li>
                <li>To generate analytics and insights about your typing skills</li>
                <li>To communicate with you about your account and our services</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To comply with legal obligations and enforce our terms</li>
              </ul>
              <p className="leading-relaxed text-base">
                We do not sell, trade, or rent your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="leading-relaxed text-base mb-3">
                We may share your information in the following circumstances:
              </p>
              
              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">4.1 Service Providers</h3>
              <p className="leading-relaxed text-base mb-4">
                We may share your information with third-party service providers who perform services on our behalf, such as hosting, data analysis, authentication services, and customer support. These providers are contractually obligated to protect your information and use it only for the purposes we specify.
              </p>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">4.2 Legal Requirements</h3>
              <p className="leading-relaxed text-base mb-4">
                We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
              </p>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">4.3 Business Transfers</h3>
              <p className="leading-relaxed text-base">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change in ownership or control of your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">5. Data Security</h2>
              <p className="leading-relaxed text-base mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-outside space-y-2 text-base ml-6 text-slate-300 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure hosting infrastructure</li>
              </ul>
              <p className="leading-relaxed text-base">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
          </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">6. Your Privacy Rights</h2>
              <p className="leading-relaxed text-base mb-3">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-outside space-y-2 text-base ml-6 text-slate-300 mb-4">
                <li><strong className="text-slate-100">Access:</strong> Request access to your personal data</li>
                <li><strong className="text-slate-100">Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong className="text-slate-100">Deletion:</strong> Request deletion of your personal data</li>
                <li><strong className="text-slate-100">Portability:</strong> Request transfer of your data to another service</li>
                <li><strong className="text-slate-100">Objection:</strong> Object to processing of your personal data</li>
                <li><strong className="text-slate-100">Restriction:</strong> Request restriction of processing your data</li>
                <li><strong className="text-slate-100">Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="leading-relaxed text-base">
                To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
              </p>
          </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">7. Data Retention</h2>
              <p className="leading-relaxed text-base">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal or legitimate business purposes.
              </p>
          </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">8. Children's Privacy</h2>
              <p className="leading-relaxed text-base">
                Our services are not intended for children under the age of 13 (or the minimum age in your jurisdiction). We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
              </p>
          </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">9. International Data Transfers</h2>
              <p className="leading-relaxed text-base">
                Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our services, you consent to the transfer of your information to these facilities. We will take appropriate measures to ensure your data is treated securely and in accordance with this Privacy Policy.
              </p>
          </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="leading-relaxed text-base">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top. We may also notify you via email or through a prominent notice on our service. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
          </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">11. Contact Us</h2>
              <p className="leading-relaxed text-base mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-base text-slate-200 mb-2">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:support@typingthrust.com" className="text-cyan-400 hover:text-cyan-300 underline">
                    support@typingthrust.com
                  </a>
                </p>
                <p className="text-base text-slate-200">
                  We will respond to your inquiry within a reasonable timeframe.
                </p>
              </div>
          </section>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 
