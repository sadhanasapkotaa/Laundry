"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import "../../../types/i18n";

// TODO: Replace with real payment data from API
const mockPayments = [
  {
    id: "PAY-001",
    date: "2024-08-01",
    amount: 500,
    method: "eSewa",
    status: "Completed",
    orderId: "ORD-001"
  },
  {
    id: "PAY-002",
    date: "2024-08-15",
    amount: 300,
    method: "Cash",
    status: "Completed",
    orderId: "ORD-002"
  }
];

export default function PaymentHistoryPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-8 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('customer.paymentHistory.title')}</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('customer.paymentHistory.paymentId')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('customer.paymentHistory.orderId')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('customer.paymentHistory.date')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('customer.paymentHistory.amount')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('customer.paymentHistory.method')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('customer.paymentHistory.status')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {mockPayments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{payment.id}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600 dark:text-blue-300">{payment.orderId}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{payment.date}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-green-700 dark:text-green-300">₨ {payment.amount}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{payment.method}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${payment.status === "Completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"}`}>
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mockPayments.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            {t('customer.paymentHistory.noPayments')}
          </div>
        )}
      </div>
    </div>
  );
}

