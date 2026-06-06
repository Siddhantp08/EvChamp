import React from 'react';

const PrivacyPolicy: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 text-gray-800">
    <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
    <ol className="list-decimal pl-6 space-y-4">
      <li>
        <strong>Information We Collect</strong>
        <ul className="list-disc pl-6">
          <li>Personal Information: Name, contact details, vehicle information.</li>
          <li>Usage Data: App usage logs, platform interactions.</li>
          <li>Telematics Data: GPS coordinates, battery status, diagnostics from IoT hardware.</li>
        </ul>
      </li>
      <li>
        <strong>How We Use It</strong>
        <ul className="list-disc pl-6">
          <li>To operate and improve the platform.</li>
          <li>To provide you with billing, diagnostics, smart usage alerts, and warranty tracking.</li>
          <li>To communicate with you, including support and service notifications.</li>
        </ul>
      </li>
      <li>
        <strong>Data Sharing</strong>
        <ul className="list-disc pl-6">
          <li>Service centers (for diagnostics and repair).</li>
          <li>Authorized warranty providers.</li>
          <li>Legal authorities when required by law.</li>
        </ul>
      </li>
      <li>
        <strong>Data Security</strong><br />
        We implement administrative, technical, and physical safeguards to protect your data from unauthorized access.
      </li>
      <li>
        <strong>Your Rights</strong>
        <ul className="list-disc pl-6">
          <li>Access and correct your personal data.</li>
          <li>Request deletion of your personal data.</li>
          <li>Opt out of non-essential communications.</li>
        </ul>
      </li>
      <li>
        <strong>Policy Changes</strong><br />
        We may update this Policy. Notification will be provided via the app or email. Continued use means you accept the changes.
      </li>
      <li>
        <strong>Contact Us</strong><br />
        If you have any questions or concerns about this Privacy Policy, please contact us at:<br />
        <a href="mailto:hello@zip-bolt.com" className="text-green-700 underline">hello@zip-bolt.com</a><br />
        ZipBolt Technologies Pvt Ltd, MGF Metropolis Mall, MG Road, Gurgaon, Haryana – 122002<br /><br />
        <strong>Developer Contact Information</strong><br />
        Developer: ZipBolt Technologies Pvt Ltd<br />
        Email: <a href="mailto:recocycledb@gmail.com" className="text-green-700 underline">recocycledb@gmail.com</a><br />
        Phone: <a href="tel:+918373969539" className="text-green-700 underline">+91-8373969539</a>
      </li>
    </ol>
  </div>
);

export default PrivacyPolicy; 