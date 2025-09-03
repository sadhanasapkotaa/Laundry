"use client";

import React, { useState, useEffect } from 'react';
import "../../types/i18n";
import { useTranslation } from 'react-i18next';
import { 
  FiBell, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiUser, 
  FiSearch,
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiCreditCard,
  FiDollarSign,
  FiTrendingUp
} from 'react-icons/fi';
import { PaymentService, PaymentData } from '../../services/paymentService';
import { PaymentMethodSelector, BankDetailsModal } from '../../components/PaymentComponents';

// ---------- Types ----------
interface PaymentFilters {
  search: string;
  payment_type: string;
  status: string;
  page: number;
  page_size: number;
}

// ---------- Small UI primitives ----------
const Card: React.FC<React.PropsWithChildren<{ className?: string; onClick?: () => void }>> = ({ 
  className = '', 
  onClick, 
  children 
}) => (
  <div 
    className={`rounded-2xl border border-slate-200 bg-white/70 dark:bg-slate-900/60 shadow-sm backdrop-blur ${className}`} 
    onClick={onClick}
  >
    {children}
  </div>
);

const CardHeader: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ 
  className = '', 
  children 
}) => (
  <div className={`p-5 border-b border-slate-100 dark:border-slate-800 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ 
  className = '', 
  children 
}) => (
  <h3 className={`text-lg font-semibold tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ 
  className = '', 
  children 
}) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<React.PropsWithChildren<{ 
  className?: string; 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}>> = ({ 
  className = '', 
  variant = 'default',
  children 
}) => {
  const variantClasses = {
    default: 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200',
    success: 'border-green-200 bg-green-50 text-green-700',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ---------- Main Component ----------
const PaymentsPage: React.FC = () => {
  const { t } = useTranslation();

  // State management
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [transactionUuid, setTransactionUuid] = useState('');
  
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    payment_type: '',
    status: '',
    page: 1,
    page_size: 10,
  });
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_previous: false,
  });

  // Statistics
  const [stats, setStats] = useState({
    total_payments: 0,
    completed_payments: 0,
    pending_payments: 0,
    total_amount: 0,
  });

  // Load payment history
  const loadPaymentHistory = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    
    try {
      const response = await PaymentService.getPaymentHistory(filters);
      
      if (response.success) {
        setPayments(response.payments);
        setPagination(response.pagination);
        
        // Calculate statistics
        const stats = response.payments.reduce((acc, payment) => {
          acc.total_payments++;
          if (payment.status === 'COMPLETE') acc.completed_payments++;
          if (payment.status === 'PENDING') acc.pending_payments++;
          acc.total_amount += payment.total_amount;
          return acc;
        }, {
          total_payments: 0,
          completed_payments: 0,
          pending_payments: 0,
          total_amount: 0,
        });
        
        setStats(stats);
      }
    } catch (error) {
      console.error('Failed to load payment history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Effects
  useEffect(() => {
    loadPaymentHistory(true);
  }, [filters]);

  // Handlers
  const handleFilterChange = (key: keyof PaymentFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (typeof value === 'string' ? parseInt(value, 10) || 1 : value), // Ensure page is always a number
    }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPaymentHistory();
  };

  const handlePaymentInitiated = (result: any) => {
    if (result.success) {
      if (result.payment_type === 'bank' && result.bank_details) {
        setBankDetails(result.bank_details);
        setTransactionUuid(result.transaction_uuid);
        setShowBankModal(true);
      } else if (result.payment_type === 'cash') {
        // Show success message for cash payment
        alert('Cash on delivery order placed successfully!');
      }
      // eSewa payments will redirect automatically
      
      setShowNewPayment(false);
      loadPaymentHistory(); // Refresh the list
    } else {
      alert(`Payment failed: ${result.error}`);
    }
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETE': return <FiCheckCircle className="text-green-500" />;
      case 'PENDING': return <FiClock className="text-yellow-500" />;
      case 'FAILED': return <FiXCircle className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'COMPLETE': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'error';
      default: return 'default';
    }
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'esewa': return <FiCreditCard className="text-purple-500" />;
      case 'bank': return <FiDollarSign className="text-blue-500" />;
      case 'cash': return <FiDollarSign className="text-green-500" />;
      default: return <FiDollarSign className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6 pt-16 md:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('payments.title', 'Payments')}</h1>
          <p className="text-gray-600 mt-1">Manage your payment history and make new payments</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowNewPayment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiPlus />
            New Payment
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold">{stats.total_payments}</p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed_payments}</p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_payments}</p>
              </div>
              <FiClock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">Rs. {stats.total_amount.toLocaleString()}</p>
              </div>
              <FiDollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by transaction ID, code, or reference..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <select
              value={filters.payment_type}
              onChange={(e) => handleFilterChange('payment_type', e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Payment Types</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="esewa">eSewa</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETE">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History ({pagination.total_count})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiCreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Transaction</th>
                    <th className="text-left p-4 font-medium text-gray-700">Type</th>
                    <th className="text-left p-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700">Date</th>
                    <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-sm">{payment.transaction_uuid}</div>
                          {payment.transaction_code && (
                            <div className="text-xs text-gray-500">
                              Code: {payment.transaction_code}
                            </div>
                          )}
                          {payment.ref_id && (
                            <div className="text-xs text-gray-500">
                              Ref: {payment.ref_id}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getPaymentTypeIcon(payment.payment_type)}
                          <span className="capitalize">{payment.payment_type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">Rs. {payment.total_amount.toLocaleString()}</div>
                        {payment.tax_amount > 0 && (
                          <div className="text-xs text-gray-500">
                            Tax: Rs. {payment.tax_amount.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusVariant(payment.status)}>
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{formatDate(payment.created_at)}</div>
                        {payment.updated_at !== payment.created_at && (
                          <div className="text-xs text-gray-500">
                            Updated: {formatDate(payment.updated_at)}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.current_page - 1) * filters.page_size) + 1} to{' '}
            {Math.min(pagination.current_page * filters.page_size, pagination.total_count)} of{' '}
            {pagination.total_count} payments
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilterChange('page', pagination.current_page - 1)}
              disabled={!pagination.has_previous}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-1">
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
            
            <button
              onClick={() => handleFilterChange('page', pagination.current_page + 1)}
              disabled={!pagination.has_next}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* New Payment Modal */}
      {showNewPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Make a Payment</h3>
              <button 
                onClick={() => setShowNewPayment(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiXCircle />
              </button>
            </div>
            
            <PaymentMethodSelector
              amount={5000} // Default amount, you can make this configurable
              onPaymentInitiated={handlePaymentInitiated}
            />
          </div>
        </div>
      )}

      {/* Bank Details Modal */}
      <BankDetailsModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        bankDetails={bankDetails}
        transactionUuid={transactionUuid}
      />
    </div>
  );
};

export default PaymentsPage;