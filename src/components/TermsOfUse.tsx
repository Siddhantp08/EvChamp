import React from 'react';

const TermsOfUse: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 text-gray-800">
    <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
    <ol className="list-decimal pl-6 space-y-4">
      <li>
        <strong>Acceptance of Terms</strong><br />
        By using the ZipSure AI app, web dashboard, or hardware services, you agree to these Terms of Use and our Privacy Policy.
      </li>
      <li>
        <strong>License to Use</strong><br />
        We grant you a non-exclusive, non-transferable license to access and use the platform solely for managing your EV(s), fleet, or related business operations.
      </li>
      <li>
        <strong>Restrictions</strong>
        <ul className="list-disc pl-6">
          <li>Reproduce, distribute, modify, or publicly display content from the platform.</li>
          <li>Reverse-engineer, decompile, or attempt to derive source code.</li>
          <li>Use the platform for illegal or unauthorized purposes.</li>
        </ul>
      </li>
      <li>
        <strong>User Responsibilities</strong>
        <ul className="list-disc pl-6">
          <li>Maintaining confidentiality of account credentials.</li>
          <li>Ensuring your use of the platform complies with applicable local laws and regulations.</li>
        </ul>
      </li>
      <li>
        <strong>Warranty</strong><br />
        The platform and services are provided “as-is,” without any express or implied warranties. ZipBolt Technologies disclaims all warranties, including merchantability or fitness for a particular purpose.
      </li>
      <li>
        <strong>Limitation of Liability</strong><br />
        ZipBolt Technologies (and its affiliates) will not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
      </li>
      <li>
        <strong>Termination</strong><br />
        We may suspend or terminate your account and access immediately if you violate these Terms.
      </li>
      <li>
        <strong>Modifications</strong><br />
        These Terms may be updated from time to time. Continued use of the platform constitutes acceptance of changes.
      </li>
    </ol>
  </div>
);

export default TermsOfUse; 