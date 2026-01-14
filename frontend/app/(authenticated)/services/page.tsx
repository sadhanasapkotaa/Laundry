"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FiSettings, FiPlus, FiTrash2, FiDollarSign, FiSave, FiX, FiCheckCircle } from "react-icons/fi";
import {
    settingsAPI, washTypeAPI, clothNameAPI, clothTypeAPI, pricingRuleAPI,
    SystemSettings, WashType, ClothName, ClothType, PricingRule
} from "../../services/settingsService";

type TabType = 'settings' | 'wash-types' | 'cloth-names' | 'cloth-types' | 'pricing';

export default function ServicesSettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('settings');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Data states
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [washTypes, setWashTypes] = useState<WashType[]>([]);
    const [clothNames, setClothNames] = useState<ClothName[]>([]);
    const [clothTypes, setClothTypes] = useState<ClothType[]>([]);
    const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

    // Edit states
    const [editingSettings, setEditingSettings] = useState<Partial<SystemSettings>>({});
    const [newItem, setNewItem] = useState<{ name: string; description: string }>({ name: '', description: '' });
    const [newPricing, setNewPricing] = useState({ wash_type: 0, cloth_name: 0, cloth_type: 0, price: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [settingsData, washData, clothNameData, clothTypeData, pricingData] = await Promise.all([
                settingsAPI.get(),
                washTypeAPI.list(),
                clothNameAPI.list(),
                clothTypeAPI.list(),
                pricingRuleAPI.list()
            ]);
            setSettings(settingsData);
            setEditingSettings({
                pickup_cost: settingsData.pickup_cost,
                delivery_cost: settingsData.delivery_cost,
                urgent_cost: settingsData.urgent_cost
            });
            setWashTypes(washData);
            setClothNames(clothNameData);
            setClothTypes(clothTypeData);
            setPricingRules(pricingData);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load settings data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const showSuccess = (message: string) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 3000);
    };

    // Save system settings
    const saveSettings = async () => {
        setSaving(true);
        try {
            const updated = await settingsAPI.update(editingSettings);
            setSettings(updated);
            showSuccess("Settings saved successfully!");
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setError("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    // Generic add item
    const addItem = async (type: 'wash-types' | 'cloth-names' | 'cloth-types') => {
        if (!newItem.name.trim()) return;
        setSaving(true);
        try {
            const api = type === 'wash-types' ? washTypeAPI : type === 'cloth-names' ? clothNameAPI : clothTypeAPI;
            await api.create({ name: newItem.name, description: newItem.description, is_active: true });
            setNewItem({ name: '', description: '' });
            showSuccess(`${type.replace('-', ' ')} added successfully!`);
            fetchData();
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setError(`Failed to add ${type}`);
        } finally {
            setSaving(false);
        }
    };

    // Delete item
    const deleteItem = async (id: number, type: 'wash-types' | 'cloth-names' | 'cloth-types') => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const api = type === 'wash-types' ? washTypeAPI : type === 'cloth-names' ? clothNameAPI : clothTypeAPI;
            await api.delete(id);
            showSuccess("Item deleted successfully!");
            fetchData();
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setError("Failed to delete item");
        }
    };

    // Add pricing rule
    const addPricingRule = async () => {
        if (!newPricing.wash_type || !newPricing.cloth_name || !newPricing.cloth_type || !newPricing.price) {
            setError("Please fill all fields for pricing rule");
            return;
        }
        setSaving(true);
        try {
            await pricingRuleAPI.create({
                wash_type: newPricing.wash_type,
                cloth_name: newPricing.cloth_name,
                cloth_type: newPricing.cloth_type,
                price: newPricing.price,
                is_active: true
            });
            setNewPricing({ wash_type: 0, cloth_name: 0, cloth_type: 0, price: '' });
            showSuccess("Pricing rule added successfully!");
            fetchData();
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setError("Failed to add pricing rule. It may already exist.");
        } finally {
            setSaving(false);
        }
    };

    // Delete pricing rule
    const deletePricingRule = async (id: number) => {
        if (!confirm('Delete this pricing rule?')) return;
        try {
            await pricingRuleAPI.delete(id);
            showSuccess("Pricing rule deleted!");
            fetchData();
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setError("Failed to delete pricing rule");
        }
    };

    const tabs = [
        { id: 'settings', label: 'Service Costs', icon: FiDollarSign },
        { id: 'wash-types', label: 'Wash Types', icon: FiSettings },
        { id: 'cloth-names', label: 'Cloth Names', icon: FiSettings },
        { id: 'cloth-types', label: 'Cloth Types', icon: FiSettings },
        { id: 'pricing', label: 'Pricing Matrix', icon: FiDollarSign },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Service Settings</h1>
                    <p className="text-gray-500 mt-1">Manage pricing and service options</p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><FiX /></button>
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <FiCheckCircle /> {success}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex gap-4 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                {/* Service Costs Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Service Costs</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Pickup Cost (₨)
                                </label>
                                <input
                                    type="number"
                                    value={editingSettings.pickup_cost || ''}
                                    onChange={(e) => setEditingSettings({ ...editingSettings, pickup_cost: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Delivery Cost (₨)
                                </label>
                                <input
                                    type="number"
                                    value={editingSettings.delivery_cost || ''}
                                    onChange={(e) => setEditingSettings({ ...editingSettings, delivery_cost: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Urgent Cost (₨)
                                </label>
                                <input
                                    type="number"
                                    value={editingSettings.urgent_cost || ''}
                                    onChange={(e) => setEditingSettings({ ...editingSettings, urgent_cost: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </div>
                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                            <FiSave /> {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                )}

                {/* Wash Types Tab */}
                {activeTab === 'wash-types' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Wash Types</h2>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Name (e.g., Dry Wash)"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            />
                            <button
                                onClick={() => addItem('wash-types')}
                                disabled={saving || !newItem.name.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                            >
                                <FiPlus /> Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {washTypes.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                                    <button onClick={() => deleteItem(item.id, 'wash-types')} className="text-red-500 hover:text-red-700">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                            {washTypes.length === 0 && <p className="text-gray-500 text-center py-4">No wash types defined</p>}
                        </div>
                    </div>
                )}

                {/* Cloth Names Tab */}
                {activeTab === 'cloth-names' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cloth Names</h2>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Name (e.g., Saree, Suit)"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            />
                            <button
                                onClick={() => addItem('cloth-names')}
                                disabled={saving || !newItem.name.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                            >
                                <FiPlus /> Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {clothNames.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                                    <button onClick={() => deleteItem(item.id, 'cloth-names')} className="text-red-500 hover:text-red-700">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                            {clothNames.length === 0 && <p className="text-gray-500 text-center py-4">No cloth names defined</p>}
                        </div>
                    </div>
                )}

                {/* Cloth Types Tab */}
                {activeTab === 'cloth-types' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cloth Types (Materials)</h2>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Name (e.g., Cotton, Siphon)"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            />
                            <button
                                onClick={() => addItem('cloth-types')}
                                disabled={saving || !newItem.name.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                            >
                                <FiPlus /> Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {clothTypes.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                                    <button onClick={() => deleteItem(item.id, 'cloth-types')} className="text-red-500 hover:text-red-700">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                            {clothTypes.length === 0 && <p className="text-gray-500 text-center py-4">No cloth types defined</p>}
                        </div>
                    </div>
                )}

                {/* Pricing Matrix Tab */}
                {activeTab === 'pricing' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pricing Rules</h2>
                        <p className="text-gray-500 text-sm">Set prices for each Wash Type + Cloth Name + Cloth Type combination</p>

                        {/* Add new pricing rule */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <select
                                value={newPricing.wash_type}
                                onChange={(e) => setNewPricing({ ...newPricing, wash_type: Number(e.target.value) })}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            >
                                <option value={0}>Select Wash Type</option>
                                {washTypes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <select
                                value={newPricing.cloth_name}
                                onChange={(e) => setNewPricing({ ...newPricing, cloth_name: Number(e.target.value) })}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            >
                                <option value={0}>Select Cloth Name</option>
                                {clothNames.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select
                                value={newPricing.cloth_type}
                                onChange={(e) => setNewPricing({ ...newPricing, cloth_type: Number(e.target.value) })}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            >
                                <option value={0}>Select Cloth Type</option>
                                {clothTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <input
                                type="number"
                                placeholder="Price (₨)"
                                value={newPricing.price}
                                onChange={(e) => setNewPricing({ ...newPricing, price: e.target.value })}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                            <button
                                onClick={addPricingRule}
                                disabled={saving}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                            >
                                <FiPlus /> Add Rule
                            </button>
                        </div>

                        {/* Pricing rules table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Wash Type</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Cloth Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Cloth Type</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Price</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pricingRules.map(rule => (
                                        <tr key={rule.id} className="border-b border-gray-200 dark:border-gray-700">
                                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{rule.wash_type_name}</td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{rule.cloth_name_name}</td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{rule.cloth_type_name}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">₨ {rule.price}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => deletePricingRule(rule.id)} className="text-red-500 hover:text-red-700">
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {pricingRules.length === 0 && (
                                <p className="text-gray-500 text-center py-8">No pricing rules defined. Add wash types, cloth names, and cloth types first, then create pricing rules.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}