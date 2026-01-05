import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Terms of Service - TypingThrust"
        description="Read TypingThrust's terms of service to understand the rules and guidelines for using our typing speed test platform."
        url="/terms-of-service"
        noindex={true}
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="sm:hidden mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="w-full bg-card/50 rounded-xl border border-border/50 p-6 sm:p-8 lg:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 text-left">Terms of Service</h1>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base text-left">
            Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="space-y-8 text-foreground/80 prose prose-invert max-w-none text-left">
            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">1. Acceptance of Terms</h2>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                By accessing and using TypingThrust ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="leading-relaxed text-sm sm:text-base">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and TypingThrust regarding your use of our typing test application and related services. Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>
            </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">2. Description of Service</h2>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                TypingThrust is an online platform that provides typing tests, performance analytics, and tools to help users improve their typing skills. The Service includes:
              </p>
              <ul className="list-disc list-outside space-y-2 text-sm sm:text-base ml-6 text-foreground/70 mb-4 text-left">
                <li>Interactive typing tests with various difficulty levels and languages</li>
                <li>Performance tracking and analytics</li>
                <li>Gamification features including levels, badges, and achievements</li>
                <li>Leaderboards and social features</li>
                <li>Personalized typing practice recommendations</li>
              </ul>
              <p className="leading-relaxed text-sm sm:text-base">
                We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.
              </p>
            </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">3. User Accounts and Registration</h2>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-4 text-left">3.1 Account Creation</h3>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                To access certain features of the Service, you may be required to create an account. When creating an account, you agree to:
              </p>
              <ul className="list-disc list-outside space-y-2 text-sm sm:text-base ml-6 text-foreground/70 mb-4 text-left">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-4">3.2 Account Security</h3>
              <p className="leading-relaxed text-sm sm:text-base">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to share your account credentials with any third party. TypingThrust is not liable for any loss or damage arising from your failure to comply with this section.
              </p>
            </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">4. Acceptable Use</h2>
              <p className="leading-relaxed text-sm sm:text-base mb-3 text-left">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc list-outside space-y-2 text-sm sm:text-base ml-6 text-foreground/70 mb-4 text-left">
                <li>Use the Service in any way that violates any applicable federal, state, local, or international law or regulation</li>
                <li>Attempt to gain unauthorized access to any portion of the Service or any other systems or networks connected to the Service</li>
                <li>Use automated systems, scripts, bots, or other means to manipulate test results, scores, or rankings</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                <li>Impersonate or attempt to impersonate another user, person, or entity</li>
                <li>Engage in any form of cheating, fraud, or manipulation of the Service</li>
                <li>Use the Service to transmit any malicious code, viruses, or harmful data</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Collect or store personal data about other users without their express permission</li>
                <li>Use the Service for any commercial purpose without our express written consent</li>
              </ul>
            </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">5. Intellectual Property Rights</h2>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-4 text-left">5.1 Our Intellectual Property</h3>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                The Service and its original content, features, and functionality are owned by TypingThrust and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. This includes, but is not limited to:
              </p>
              <ul className="list-disc list-outside space-y-2 text-sm sm:text-base ml-6 text-foreground/70 mb-4 text-left">
                <li>The TypingThrust name, logo, and branding</li>
                <li>All software, code, and technical implementations</li>
                <li>User interface designs and layouts</li>
                <li>Typing test content and text samples</li>
                <li>Analytics algorithms and methodologies</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-4 text-left">5.2 Your Content</h3>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                You retain ownership of any content you submit, post, or display on or through the Service ("User Content"). By submitting User Content, you grant TypingThrust a worldwide, non-exclusive, royalty-free, perpetual, irrevocable, and fully sublicensable license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such User Content in connection with the Service.
              </p>
              <p className="leading-relaxed text-sm sm:text-base">
                You represent and warrant that you own or have the necessary rights to grant the license described above and that your User Content does not violate any third-party rights.
              </p>
            </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">6. Prohibited Activities</h2>
              <p className="leading-relaxed text-sm sm:text-base mb-3 text-left">
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-outside space-y-2 text-sm sm:text-base ml-6 text-foreground/70 mb-4 text-left">
                <li className="text-left"><strong className="text-foreground">Cheating:</strong> Using automated tools, scripts, or any method to artificially inflate typing speed, accuracy, or scores</li>
                <li className="text-left"><strong className="text-foreground">Account Sharing:</strong> Sharing your account credentials with others or using someone else's account</li>
                <li className="text-left"><strong className="text-foreground">Manipulation:</strong> Attempting to manipulate leaderboards, rankings, or statistics through any means</li>
                <li className="text-left"><strong className="text-foreground">Spam:</strong> Sending unsolicited messages or communications to other users</li>
                <li className="text-left"><strong className="text-foreground">Harassment:</strong> Engaging in any form of harassment, bullying, or abusive behavior</li>
                <li className="text-left"><strong className="text-foreground">Reverse Engineering:</strong> Attempting to reverse engineer, decompile, or disassemble any part of the Service</li>
              </ul>
              <p className="leading-relaxed text-sm sm:text-base text-left">
                Violation of these prohibitions may result in immediate termination of your account and legal action.
              </p>
            </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">7. Service Availability and Modifications</h2>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                We strive to provide continuous access to the Service, but we do not guarantee that the Service will be available at all times. The Service may be unavailable due to:
              </p>
              <ul className="list-disc list-outside space-y-2 text-sm sm:text-base ml-6 text-foreground/70 mb-4 text-left">
                <li>Scheduled maintenance or updates</li>
                <li>Technical failures or malfunctions</li>
                <li>Circumstances beyond our reasonable control</li>
              </ul>
              <p className="leading-relaxed text-sm sm:text-base">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
              </p>
            </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">8. Termination</h2>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-4 text-left">8.1 Termination by You</h3>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                You may terminate your account at any time by contacting us or using the account deletion feature in your account settings. Upon termination, your right to use the Service will immediately cease.
              </p>

              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-4 text-left">8.2 Termination by Us</h3>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including but not limited to:
              </p>
              <ul className="list-disc list-outside space-y-2 text-sm sm:text-base ml-6 text-foreground/70 mb-4 text-left">
                <li>Breach of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Extended periods of inactivity</li>
                <li>At our sole discretion, for any other reason</li>
              </ul>
              <p className="leading-relaxed text-sm sm:text-base">
                Upon termination, your right to use the Service will immediately cease, and we may delete your account and all associated data.
              </p>
            </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">9. Disclaimers</h2>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-outside space-y-2 text-sm sm:text-base ml-6 text-foreground/70 mb-4 text-left">
                <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
                <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
                <li>Warranties that defects will be corrected or that the Service is free of viruses or other harmful components</li>
                <li>Warranties regarding the accuracy, reliability, or quality of any information obtained through the Service</li>
              </ul>
              <p className="leading-relaxed text-sm sm:text-base">
                We do not warrant, endorse, guarantee, or assume responsibility for any product or service advertised or offered by a third party through the Service.
              </p>
            </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">10. Limitation of Liability</h2>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL TYPINGTHRUST, ITS AFFILIATES, AGENTS, DIRECTORS, EMPLOYEES, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO THE USE OF, OR INABILITY TO USE, THE SERVICE.
              </p>
              <p className="leading-relaxed text-base mb-4">
                UNDER NO CIRCUMSTANCES WILL TYPINGTHRUST BE RESPONSIBLE FOR ANY DAMAGE, LOSS, OR INJURY RESULTING FROM HACKING, TAMPERING, OR OTHER UNAUTHORIZED ACCESS OR USE OF THE SERVICE OR YOUR ACCOUNT OR THE INFORMATION CONTAINED THEREIN.
              </p>
              <p className="leading-relaxed text-sm sm:text-base">
                Our total liability to you for all claims arising from or related to the use of the Service shall not exceed the amount you paid us, if any, in the twelve (12) months prior to the claim.
              </p>
          </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">11. Indemnification</h2>
              <p className="leading-relaxed text-sm sm:text-base text-left">
                You agree to defend, indemnify, and hold harmless TypingThrust and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including without limitation reasonable legal and accounting fees, arising out of or in any way connected with your access to or use of the Service, your User Content, or your violation of these Terms.
              </p>
          </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">12. Governing Law and Dispute Resolution</h2>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-4 text-left">12.1 Governing Law</h3>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which TypingThrust operates, without regard to its conflict of law provisions.
              </p>

              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-4 text-left">12.2 Dispute Resolution</h3>
              <p className="leading-relaxed text-sm sm:text-base text-left">
                Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of a recognized arbitration organization, except where prohibited by law. You waive any right to a jury trial or to participate in a class-action lawsuit.
              </p>
          </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">13. Changes to Terms</h2>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you must stop using the Service.
              </p>
              <p className="leading-relaxed text-sm sm:text-base text-left">
                We may notify you of changes to these Terms by:
              </p>
              <ul className="list-disc list-outside space-y-2 text-sm sm:text-base ml-6 text-foreground/70 text-left">
                <li>Posting the updated Terms on this page</li>
                <li>Sending an email notification to the address associated with your account</li>
                <li>Displaying a prominent notice within the Service</li>
              </ul>
          </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">14. Severability</h2>
              <p className="leading-relaxed text-sm sm:text-base text-left">
                If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. The invalid or unenforceable provision will be replaced with a valid, enforceable provision that most closely approximates the intent of the original provision.
              </p>
          </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">15. Entire Agreement</h2>
              <p className="leading-relaxed text-sm sm:text-base text-left">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and TypingThrust regarding the use of the Service and supersede all prior agreements and understandings, whether written or oral, relating to the subject matter hereof.
              </p>
          </section>

            <section className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 text-left">16. Contact Information</h2>
              <p className="leading-relaxed text-sm sm:text-base mb-4 text-left">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-card/50 rounded-lg border border-border/50 p-4 text-left">
                <p className="text-sm sm:text-base text-foreground mb-2 text-left">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:support@typingthrust.com" className="text-primary hover:opacity-80 underline">
                    support@typingthrust.com
                  </a>
                </p>
                <p className="text-sm sm:text-base text-foreground/80 text-left">
                  We will respond to your inquiry within a reasonable timeframe.
                </p>
              </div>
          </section>
        </div>
        </div>
      </div>
      <Footer />
    </div>
    </>
  );
} 
