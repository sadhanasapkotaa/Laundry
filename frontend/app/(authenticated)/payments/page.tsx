"use client";

import React, { useState } from 'react';
import "../../types/i18n";
import { useTranslation } from 'react-i18next';
import { FiBell, FiCheckCircle, FiXCircle, FiClock, FiArrowDownLeft, FiArrowUpRight, FiUser } from 'react-icons/fi';

// ---------- Types ----------
interface PaymentNotification {
  id: string;
  type: 'received' | 'made';
  transactionId: string;
  amount: number;
  payee?: string;
  receiver?: string;
  branchId: string;
  branchName: string;
  paymentMethod: 'cash' | 'card' | 'digital_wallet' | 'bank_transfer' | 'online';
  status: 'completed' | 'pending' | 'failed';
  date: string;
  time: string;
  orderId?: string;
  description: string;
  fees?: number;
  isRead: boolean;
}

// ---------- Small UI primitives ----------
const Card: React.FC<React.PropsWithChildren<{ className?: string; onClick?: () => void }>> = ({ className = '', onClick, children }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white/70 dark:bg-slate-900/60 shadow-sm backdrop-blur ${className}`} onClick={onClick}>{children}</div>
);
const CardHeader: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div className={`p-5 border-b border-slate-100 dark:border-slate-800 ${className}`}>{children}</div>
);
const CardTitle: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <h3 className={`text-lg font-semibold tracking-tight ${className}`}>{children}</h3>
);
const CardContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);
const Badge: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 ${className}`}>{children}</span>
);

// ---------- Main Component ----------
const PaymentNotifications: React.FC = () => {
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<PaymentNotification[]>([
    // --- Mock Data ---
    { id: 'PAY-001', type: 'received', transactionId: 'TXN-987654321', amount: 1200, payee: 'Sita Rai', receiver: 'Main Branch', branchId: 'BR-001', branchName: 'Main Branch', paymentMethod: 'card', status: 'completed', date: '2025-01-06', time: '14:30:45', orderId: 'ORD-002', description: 'Payment for dry cleaning', isRead: false },
    { id: 'PAY-002', type: 'made', transactionId: 'TXN-987654322', amount: 2500, payee: 'Chemical Solutions Ltd', receiver: 'Purchasing', branchId: 'BR-001', branchName: 'Main Branch', paymentMethod: 'bank_transfer', status: 'completed', date: '2025-01-06', time: '11:20:30', description: 'Payment for detergent supplies', fees: 50, isRead: true },
    // ...add other notifications as needed
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'received' | 'made'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.description.toLowerCase().includes(searchTerm.toLowerCase()) || n.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) || n.payee?.toLowerCase().includes(searchTerm.toLowerCase()) || n.branchName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || n.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="text-green-500" />;
      case 'pending': return <FiClock className="text-yellow-500" />;
      case 'failed': return <FiXCircle className="text-red-500" />;
      default: return null;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 p-4 md:p-6 pt-16 md:pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('payments.title')}</h1>
        <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 border rounded-lg">
          <FiBell /> {t('payments.markAllRead')}
        </button>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payments.notifications')} ({filteredNotifications.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="text"
            placeholder={t('payments.searchPlaceholder')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-3 mt-3">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="rounded-lg border px-3 py-2 text-sm">
              <option value="all">{t('payments.allTypes')}</option>
              <option value="received">{t('payments.received')}</option>
              <option value="made">{t('payments.made')}</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="rounded-lg border px-3 py-2 text-sm">
              <option value="all">{t('payments.allStatus')}</option>
              <option value="completed">{t('payments.completed')}</option>
              <option value="pending">{t('payments.pending')}</option>
              <option value="failed">{t('payments.failed')}</option>
            </select>
          </div>

          {filteredNotifications.map(n => (
            <Card
              key={n.id}
              className={`p-4 cursor-pointer ${!n.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => markAsRead(n.id)}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-medium">{n.description}</p>
                  <div className="text-sm text-slate-500 flex gap-2 items-center">
                    <FiUser className="h-3 w-3" /> {n.type === 'received' ? `From: ${n.payee}` : `To: ${n.payee}`} • {n.branchName}
                    <span>TXN: {n.transactionId}</span>
                    {n.orderId && <span>Order: {n.orderId}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">₨ {n.amount.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-sm">{getStatusIcon(n.status)} {n.status}</div>
                  <p className="text-xs text-slate-400">{n.date} {n.time}</p>
                </div>
              </div>
            </Card>
          ))}
          {filteredNotifications.length === 0 && <p className="text-sm text-slate-500">{t('payments.noNotifications')}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentNotifications;