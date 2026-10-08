// client/src/pages/legal/CookiePolicy.jsx
import React from 'react';
import LegalLayout from './LegalLayout';

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="October 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">1. What Are Cookies & Web Storage?</h2>
        <p>
          Cookies and modern web browser storage mechanisms (such as localStorage and sessionStorage) are small data files saved on your computer or mobile device when you access our website. They enable web applications to maintain active user login states, store visual preferences, and ensure seamless service delivery.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">2. How BrandVox AI Uses Cookies & Local Storage</h2>
        <p>We believe in transparent and minimal data tracking. BrandVox AI utilizes only the following essential technologies:</p>
        
        <div className="space-y-4 pt-2">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
            <h3 className="font-bold text-white text-sm">A. Strictly Necessary & Session Storage (Essential)</h3>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              <strong>Purpose:</strong> Used by our Supabase authentication provider to maintain your secure authenticated workspace session. Without this, you would be forced to sign in every time you generate a video or switch pages.
            </p>
            <p className="text-[11px] text-primary-hover font-mono mt-2">Key: sb-[project-id]-auth-token · Type: LocalStorage</p>
          </div>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
            <h3 className="font-bold text-white text-sm">B. Functional & Preference Storage</h3>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              <strong>Purpose:</strong> Remembers your consent decisions (such as dismissing the cookie advisory notice) so you are not prompted redundantly on subsequent visits.
            </p>
            <p className="text-[11px] text-primary-hover font-mono mt-2">Key: brandvox_cookie_consent · Type: LocalStorage</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">3. Third-Party Analytics & Advertising Cookies</h2>
        <p>
          <strong>BrandVox AI does not employ third-party behavioral advertising trackers, invasive spyware, or retargeting marketing pixels.</strong>
        </p>
        <p>
          External typography assets (Inter font family) are loaded from Google Fonts servers to ensure optimal aesthetic delivery. Google may log standard technical HTTP header telemetry (such as IP address) strictly for font asset delivery.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">4. Managing & Disabling Cookies</h2>
        <p>
          You have full control over your browser's cookie and local storage settings. You can clear or block cookies through your browser preferences (Chrome, Safari, Firefox, Edge). Please note that disabling local storage will prevent you from signing in to your BrandVox AI account.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">5. Contact Information</h2>
        <p>
          If you have questions regarding our use of cookies or privacy practices, please contact us at <span className="text-primary-hover font-semibold">legal@brandvox.ai</span>.
        </p>
      </section>
    </LegalLayout>
  );
}
