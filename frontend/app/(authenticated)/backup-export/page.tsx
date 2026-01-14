"use client";

import React, { useState } from "react";
import { FiDownload, FiDatabase, FiFileText, FiUsers, FiPackage, FiCreditCard, FiClock, FiCheckCircle } from "react-icons/fi";

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  estimatedSize: string;
  recordCount: number;
}

interface BackupHistory {
  id: string;
  type: "manual" | "scheduled";
  dataTypes: string[];
  size: string;
  date: string;
  time: string;
  status: "completed" | "failed" | "in_progress";
  downloadUrl?: string;
}

export default function BackupExport() {
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [dateRange, setDateRange] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);

  // Export options
  const exportOptions: ExportOption[] = [
    { id: "transactions", name: "All Transactions", description: "Income and expense records with payment details", icon: FiCreditCard, estimatedSize: "2.5 MB", recordCount: 1250 },
    { id: "orders", name: "Orders", description: "Complete order history with customer details", icon: FiPackage, estimatedSize: "1.8 MB", recordCount: 875 },
    { id: "income", name: "Income Records", description: "All income entries and payment receipts", icon: FiDownload, estimatedSize: "1.2 MB", recordCount: 650 },
    { id: "expenses", name: "Expense Records", description: "All expense entries and vendor payments", icon: FiFileText, estimatedSize: "800 KB", recordCount: 420 },
    { id: "clients", name: "Client Database", description: "Customer information and contact details", icon: FiUsers, estimatedSize: "500 KB", recordCount: 350 },
    { id: "payments", name: "Payment History", description: "Payment notifications and transaction logs", icon: FiCreditCard, estimatedSize: "1.5 MB", recordCount: 980 },
    { id: "branches", name: "Branch Information", description: "Branch details, managers, and locations", icon: FiDatabase, estimatedSize: "150 KB", recordCount: 4 },
  ];

  // Mock backup history
  const backupHistory: BackupHistory[] = [
    { id: "backup-001", type: "manual", dataTypes: ["transactions", "orders", "clients"], size: "4.8 MB", date: "2025-01-06", time: "14:30:00", status: "completed", downloadUrl: "#" },
    { id: "backup-002", type: "scheduled", dataTypes: ["transactions", "income", "expenses"], size: "3.2 MB", date: "2025-01-05", time: "23:00:00", status: "completed", downloadUrl: "#" },
    { id: "backup-003", type: "manual", dataTypes: ["orders", "clients", "payments"], size: "3.8 MB", date: "2025-01-04", time: "16:45:00", status: "completed", downloadUrl: "#" },
    { id: "backup-004", type: "scheduled", dataTypes: ["transactions"], size: "2.1 MB", date: "2025-01-03", time: "23:00:00", status: "failed" },
  ];

  const handleDataTypeToggle = (dataTypeId: string) => {
    setSelectedDataTypes(prev => prev.includes(dataTypeId) ? prev.filter(id => id !== dataTypeId) : [...prev, dataTypeId]);
  };

  const handleSelectAll = () => {
    setSelectedDataTypes(
      selectedDataTypes.length === exportOptions.length ? [] : exportOptions.map(option => option.id)
    );
  };

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) {
      alert("Please select at least one data type to export");
      return;
    }

    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const selectedOptions = exportOptions.filter(option => selectedDataTypes.includes(option.id));
      const totalSize = selectedOptions.reduce((acc, option) => {
        const size = parseFloat(option.estimatedSize);
        const unit = option.estimatedSize.includes("MB") ? "MB" : "KB";
        return acc + (unit === "MB" ? size : size / 1024);
      }, 0);

      alert(`Export completed! File size: ${totalSize.toFixed(1)} MB`);

      setSelectedDataTypes([]);
      setDateRange("all");
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const estimatedTotalSize = selectedDataTypes.reduce((acc, dataTypeId) => {
    const option = exportOptions.find(opt => opt.id === dataTypeId);
    if (!option) return acc;
    const size = parseFloat(option.estimatedSize);
    const unit = option.estimatedSize.includes("MB") ? "MB" : "KB";
    return acc + (unit === "MB" ? size : size / 1024);
  }, 0);

  const totalRecords = selectedDataTypes.reduce((acc, dataTypeId) => {
    const option = exportOptions.find(opt => opt.id === dataTypeId);
    return acc + (option?.recordCount || 0);
  }, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Backup & Export</h1>
        <button
          onClick={handleExport}
          disabled={selectedDataTypes.length === 0 || isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isExporting ? <><FiClock className="animate-spin" /> Exporting...</> : <><FiDownload /> Export Data</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Select Data to Export</h3>
              <button onClick={handleSelectAll} className="text-sm text-blue-600 hover:underline">
                {selectedDataTypes.length === exportOptions.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportOptions.map(option => {
                const Icon = option.icon;
                return (
                  <div key={option.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedDataTypes.includes(option.id)}
                      onChange={() => handleDataTypeToggle(option.id)}
                      id={option.id}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <label htmlFor={option.id} className="font-medium cursor-pointer">{option.name}</label>
                      </div>
                      <p className="text-sm text-gray-500">{option.description}</p>
                      <p className="text-xs text-gray-400">{option.recordCount.toLocaleString()} records • {option.estimatedSize}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-lg mb-2">Export Options</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Export Format</label>
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="w-full border rounded p-2">
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel</option>
                  <option value="json">JSON</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Date Range</label>
                <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full border rounded p-2">
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>

            {dateRange === "custom" && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <input type="date" value={customStartDate ? customStartDate.toISOString().split("T")[0] : ""} onChange={e => setCustomStartDate(new Date(e.target.value))} className="border rounded p-2" />
                <input type="date" value={customEndDate ? customEndDate.toISOString().split("T")[0] : ""} onChange={e => setCustomEndDate(new Date(e.target.value))} className="border rounded p-2" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-lg mb-2">Export Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Selected items:</span><span>{selectedDataTypes.length}</span></div>
              <div className="flex justify-between"><span>Total records:</span><span>{totalRecords.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Estimated size:</span><span>{estimatedTotalSize.toFixed(1)} MB</span></div>
              <div className="flex justify-between"><span>Format:</span><span>{exportFormat.toUpperCase()}</span></div>
              <div className="flex justify-between"><span>Date range:</span><span>{dateRange}</span></div>
            </div>
          </div>

          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-lg mb-2">Recent Backups</h3>
            <div className="space-y-2">
              {backupHistory.map(backup => (
                <div key={backup.id} className="flex justify-between items-start p-2 border rounded gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {backup.status === "completed" && <FiCheckCircle className="text-green-500" />}
                      {backup.status === "failed" && <FiDatabase className="text-red-500" />}
                      {backup.status === "in_progress" && <FiClock className="text-yellow-500" />}
                      <span className="font-medium text-sm">{backup.type === "manual" ? "Manual Backup" : "Scheduled Backup"}</span>
                    </div>
                    <p className="text-xs text-gray-500">{backup.dataTypes.length} data types • {backup.size}</p>
                    <p className="text-xs text-gray-500">{backup.date} at {backup.time}</p>
                    <span className={`text-xs px-1 py-0.5 rounded ${getStatusColor(backup.status)}`}>{backup.status}</span>
                  </div>
                  {backup.status === "completed" && backup.downloadUrl && (
                    <a href={backup.downloadUrl} className="text-blue-600 hover:underline"><FiDownload /></a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
