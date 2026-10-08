// client/src/pages/legal/PrivacyPolicy.jsx
import React from 'react';
import LegalLayout from './LegalLayout';

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="October 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">1. Introduction & Overview</h2>
        <p>
          BrandVox AI ("we", "our", or "us") operates the BrandVox AI generative video and image synthesis platform. We are committed to protecting your privacy and processing your personal data strictly in accordance with applicable global data protection regulations, including the European Union General Data Protection Regulation (GDPR), the California Consumer Privacy Act / California Privacy Rights Act (CCPA/CPRA), and the Digital Personal Data Protection Act, 2023 (DPDP Act, India).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">2. Information We Collect</h2>
        <p>We adhere strictly to the principle of data minimization. We collect only what is essential to provide our services:</p>
        <ul className="list-disc pl-5 space-y-2 text-white/70">
          <li><strong>Account Information:</strong> Your email address, encrypted password hash, and full name provided during registration.</li>
          <li><strong>Creative Inputs:</strong> Text prompts, aspect ratio selections, and duration parameters you submit to synthesize media.</li>
          <li><strong>Uploaded Reference Assets:</strong> Images and video files you explicitly upload for Image-to-Video synthesis or Character Motion Transfer.</li>
          <li><strong>Transaction Records:</strong> Package selection, amount in Indian Rupees (INR), UPI transaction reference IDs (UTR), and credit ledger history. We do not store credit card numbers or bank credentials.</li>
          <li><strong>Technical Identifiers:</strong> Session authentication tokens managed via secure local storage for persistent account access.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">3. How We Use Your Data</h2>
        <p>Your information is processed strictly for the following purposes:</p>
        <ul className="list-disc pl-5 space-y-2 text-white/70">
          <li>Executing AI rendering pipelines requested by you.</li>
          <li>Managing your credit balance and transaction receipts.</li>
          <li>Authenticating your session and safeguarding your workspace against unauthorized access.</li>
          <li>Enforcing our Acceptable Use Policy against malicious or illegal content generation.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">4. Artificial Intelligence & Model Training Disclaimers</h2>
        <p>
          <strong>We do not use your private creative generations, uploaded personal photos, or prompts to train public artificial intelligence models.</strong>
        </p>
        <p>
          Generative inference operations are executed via enterprise cloud GPU sub-processors (Fal.ai and Replicate). Cloud requests sent to our inference partners are processed under enterprise zero-data-retention terms where inputs and outputs are not retained or used for foundation model training.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">5. Third-Party Sub-Processors</h2>
        <p>We work with trusted infrastructure providers to deliver the platform:</p>
        <ul className="list-disc pl-5 space-y-2 text-white/70">
          <li><strong>Supabase Inc.:</strong> Cloud database, user authentication, and encrypted asset storage.</li>
          <li><strong>Fal.ai & Replicate Inc.:</strong> Secure enterprise AI model inference execution.</li>
          <li><strong>NPCI / UPI Banking Rails:</strong> Indian Rupee payment verification and credit fulfillment.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">6. Data Retention & Account Deletion</h2>
        <p>
          Your account data and generation records are maintained as long as your account remains active. You possess the right to permanently purge your profile, generations, and assets at any time through the <strong>Privacy & Deletion</strong> tab within your account Settings page. Upon deletion request, all database records associated with your account are immediately purged.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">7. Your Statutory Rights</h2>
        <p>Depending on your jurisdiction, you have the following legal rights:</p>
        <ul className="list-disc pl-5 space-y-2 text-white/70">
          <li>The right to access and receive a copy of your personal data.</li>
          <li>The right to rectify inaccurate or incomplete personal records.</li>
          <li>The right to erasure ("Right to be Forgotten").</li>
          <li>The right to withdraw consent at any time without affecting prior lawful processing.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">8. Grievance Officer & Contact</h2>
        <p>
          In accordance with the Information Technology Act, 2000 and rules made thereunder, as well as the DPDP Act 2023, for any questions, concerns, or data requests, please contact our designated Grievance Officer:
        </p>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-xs space-y-1 text-white/80">
          <p><strong>Grievance Officer:</strong> Legal & Compliance Desk</p>
          <p><strong>Email:</strong> legal@brandvox.ai / support@brandvox.ai</p>
          <p><strong>Entity:</strong> BrandVox AI SaaS Operations</p>
          <p><strong>Jurisdiction:</strong> India</p>
        </div>
      </section>
    </LegalLayout>
  );
}
