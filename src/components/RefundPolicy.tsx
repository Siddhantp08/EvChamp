import React from 'react';
import { Link } from 'react-router-dom';

const RefundPolicy: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 text-gray-800">
    <h1 className="text-3xl font-bold mb-6">Refund & Cancellation Policy</h1>
    <ol className="list-decimal pl-6 space-y-4">
      <li>
        <strong>Hardware + Installation</strong>
        <ul className="list-disc pl-6">
          <li>All device + installation purchases are final – no refunds.</li>
          <li>You may cancel your order before it is dispatched for a full refund, minus any processing fee.</li>
        </ul>
      </li>
      <li>
        <strong>Software Subscriptions</strong>
        <ul className="list-disc pl-6">
          <li>Annual subscriptions may be canceled within 14 days of purchase for a full refund.</li>
          <li>No refunds are issued after the 14-day period.</li>
        </ul>
      </li>
      <li>
        <strong>Renewal Policy</strong>
        <ul className="list-disc pl-6">
          <li>Software renewals are automatic. To avoid renewal, cancel at least 7 days before expiry.</li>
        </ul>
      </li>
      <li>
        <strong>How to Request</strong>
        <ul className="list-disc pl-6">
          <li>To request a refund or cancellation, contact support at <a href="mailto:hello@zip-bolt.com" className="text-green-700 underline">hello@zip-bolt.com</a> with your order or subscription ID.</li>
        </ul>
      </li>
    </ol>

    {/* Delete Account Section */}
    <div className="mt-10 p-6 border border-red-200 bg-red-50 rounded-2xl">
      <h2 className="text-xl font-bold text-red-700 mb-2">Delete Your Account</h2>
      <p className="text-gray-700 text-sm mb-4">
        If you wish to permanently delete your EVChamp account and all associated data, you can do so below.
        Please note this action is <strong>irreversible</strong> and will cancel any active subscriptions.
      </p>
      <Link
        to="/delete-account"
        className="inline-block bg-red-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition shadow-md"
      >
        Delete My Account
      </Link>
    </div>
  </div>
);

export default RefundPolicy; 