"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaHistory, FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";
import { PaymentService, PaymentData } from "../../../services/paymentService";
import "../../../types/i18n";

export default function PaymentHistoryPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchPayments();
  }, [currentPage]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await PaymentService.getPaymentHistory({
        page: currentPage,
        page_size: pageSize
      });

      if (response.success) {
        setPayments(response.payments);
        setTotalPages(response.pagination.total_pages);
      } else {
        setError('Failed to load payment history');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('An error occurred while loading payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "px-2.5 py-0.5 rounded-full text-xs font-semibold";
    const statusStyles: Record<string, string> = {
      'COMPLETE': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'PENDING': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'FAILED': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'CANCELED': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
    };
    return `${baseClass} ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {t('customer.paymentHistory.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            View all your past transactions
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading transaction history...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 inline-block px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
            <button
              onClick={fetchPayments}
              className="block mx-auto px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <div className="bg-gray-50 dark:bg-gray-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHistory className="h-6 w-6 opacity-50" />
            </div>
            <p className="font-medium text-lg text-gray-900 dark:text-gray-100">{t('customer.paymentHistory.noPayments')}</p>
            <p className="text-sm mt-1">Transactions will appear here once you make a payment.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('customer.paymentHistory.date')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('customer.paymentHistory.method')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('customer.paymentHistory.amount')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('customer.paymentHistory.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{new Date(payment.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">
                        {payment.transaction_uuid.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 capitalize">
                        <div className="flex items-center gap-2">
                          {payment.payment_type}
                          {payment.payment_source === 'order' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                              Order
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {payment.branch_name ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-gray-200">{payment.branch_name}</span>
                            {payment.orders_count && payment.orders_count > 0 && (
                              <span className="text-xs text-gray-500">
                                {payment.orders_count} order{payment.orders_count > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        ) : <span className="text-gray-400 italic">No Branch</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="text-base">₨ {payment.total_amount.toLocaleString()}</div>
                        {payment.excess_amount && payment.excess_amount > 0 ? (
                          <div className="text-xs mt-1 space-y-0.5">
                            <div className="text-green-600 dark:text-green-400">
                              Applied: ₨ {payment.amount_applied?.toLocaleString() ?? 0}
                            </div>
                            <div className="text-blue-600 dark:text-blue-400 font-medium">
                              Credit: ₨ {payment.excess_amount.toLocaleString()}
                            </div>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getStatusBadge(payment.status)}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page <span className="font-medium text-gray-900 dark:text-gray-200">{currentPage}</span> of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                  >
                    <FaChevronLeft className="h-3 w-3" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                  >
                    Next
                    <FaChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

