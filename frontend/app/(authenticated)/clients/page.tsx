// "use client";

// import "../../types/i18n";
// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   FaUser,
//   FaPhone,
//   FaEnvelope,
//   FaMapMarkerAlt,
//   FaPlus,
//   FaEdit,
//   FaEye,
//   FaStar,
//   FaSearch,
// } from "react-icons/fa";

// interface Client {
//   id: string;
//   name: string;
//   phone: string;
//   email: string;
//   address: string;
//   loyaltyPoints: number;
//   totalOrders: number;
//   totalSpent: number;
//   joinDate: string;
//   lastOrder?: string;
//   status: "active" | "inactive";
// }

// const ClientManagement = () => {
//   const { t } = useTranslation();
//   const [searchTerm, setSearchTerm] = useState("");

//   const [clients] = useState<Client[]>([
//     {
//       id: "CL-001",
//       name: "Ram Sharma",
//       phone: "+977-9841234567",
//       email: "ram.sharma@email.com",
//       address: "Thamel, Kathmandu",
//       loyaltyPoints: 450,
//       totalOrders: 15,
//       totalSpent: 12500,
//       joinDate: "2024-01-15",
//       lastOrder: "2025-01-06",
//       status: "active",
//     },
//     {
//       id: "CL-002",
//       name: "Sita Rai",
//       phone: "+977-9851234567",
//       email: "sita.rai@email.com",
//       address: "New Road, Kathmandu",
//       loyaltyPoints: 280,
//       totalOrders: 8,
//       totalSpent: 7200,
//       joinDate: "2024-03-20",
//       lastOrder: "2025-01-05",
//       status: "active",
//     },
//     {
//       id: "CL-003",
//       name: "John Doe",
//       phone: "+977-9861234567",
//       email: "john.doe@email.com",
//       address: "Lazimpat, Kathmandu",
//       loyaltyPoints: 120,
//       totalOrders: 5,
//       totalSpent: 3500,
//       joinDate: "2024-08-10",
//       lastOrder: "2024-12-15",
//       status: "inactive",
//     },
//   ]);

//   const filteredClients = clients.filter(client =>
//     client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     client.phone.includes(searchTerm) ||
//     client.email.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const totalClients = clients.length;
//   const activeClients = clients.filter(c => c.status === "active").length;
//   const totalLoyaltyPoints = clients.reduce((sum, c) => sum + c.loyaltyPoints, 0);
//   const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);

//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold">{t("clients.title")}</h1>
//         <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
//           <FaPlus /> {t("clients.addClient")}
//         </button>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         <div className="p-4 border rounded-lg shadow-sm bg-white">
//           <div className="flex justify-between items-center">
//             <p className="text-sm font-medium">Total Clients</p>
//             <FaUser className="text-blue-500" />
//           </div>
//           <p className="text-2xl font-bold mt-2">{totalClients}</p>
//           <p className="text-xs text-gray-500">{activeClients} active</p>
//         </div>

//         <div className="p-4 border rounded-lg shadow-sm bg-white">
//           <div className="flex justify-between items-center">
//             <p className="text-sm font-medium">Total Revenue</p>
//             <FaUser className="text-green-500" />
//           </div>
//           <p className="text-2xl font-bold mt-2">₨ {totalRevenue.toLocaleString()}</p>
//           <p className="text-xs text-gray-500">From all clients</p>
//         </div>

//         <div className="p-4 border rounded-lg shadow-sm bg-white">
//           <div className="flex justify-between items-center">
//             <p className="text-sm font-medium">{t("clients.loyaltyPoints")}</p>
//             <FaStar className="text-yellow-500" />
//           </div>
//           <p className="text-2xl font-bold mt-2">{totalLoyaltyPoints.toLocaleString()}</p>
//           <p className="text-xs text-gray-500">Total points issued</p>
//         </div>

//         <div className="p-4 border rounded-lg shadow-sm bg-white">
//           <div className="flex justify-between items-center">
//             <p className="text-sm font-medium">Average Orders</p>
//             <FaUser className="text-purple-500" />
//           </div>
//           <p className="text-2xl font-bold mt-2">{Math.round(clients.reduce((sum, c) => sum + c.totalOrders, 0) / clients.length)}</p>
//           <p className="text-xs text-gray-500">Per client</p>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="p-4 border rounded-lg shadow-sm bg-white">
//         <div className="flex items-center gap-4 mb-4">
//           <div className="relative flex-1">
//             <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search clients by name, phone, or email..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>

//         {/* Client List */}
//         <div className="space-y-4">
//           {filteredClients.map((client) => (
//             <div
//               key={client.id}
//               className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
//             >
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-3 mb-2">
//                     <h3 className="font-semibold text-lg">{client.name}</h3>
//                     <span
//                       className={`px-2 py-1 text-xs rounded-full ${
//                         client.status === "active"
//                           ? "bg-green-100 text-green-800"
//                           : "bg-gray-100 text-gray-800"
//                       }`}
//                     >
//                       {client.status}
//                     </span>
//                   </div>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
//                     <div className="space-y-1">
//                       <p className="flex items-center gap-2">
//                         <FaPhone className="text-gray-400" />
//                         {client.phone}
//                       </p>
//                       <p className="flex items-center gap-2">
//                         <FaEnvelope className="text-gray-400" />
//                         {client.email}
//                       </p>
//                       <p className="flex items-center gap-2">
//                         <FaMapMarkerAlt className="text-gray-400" />
//                         {client.address}
//                       </p>
//                     </div>
                    
//                     <div className="space-y-1">
//                       <p>
//                         <span className="font-medium">Total Orders:</span> {client.totalOrders}
//                       </p>
//                       <p>
//                         <span className="font-medium">Total Spent:</span> ₨ {client.totalSpent.toLocaleString()}
//                       </p>
//                       <p>
//                         <span className="font-medium">{t("clients.loyaltyPoints")}:</span> {client.loyaltyPoints}
//                       </p>
//                       <p>
//                         <span className="font-medium">Last Order:</span> {client.lastOrder || "Never"}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2 ml-4">
//                   <button
//                     className="p-2 border rounded hover:bg-gray-200"
//                     title="View Details"
//                   >
//                     <FaEye className="text-blue-600" />
//                   </button>
//                   <button
//                     className="p-2 border rounded hover:bg-gray-200"
//                     title="Edit Client"
//                   >
//                     <FaEdit className="text-green-600" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
          
//           {filteredClients.length === 0 && (
//             <div className="text-center py-8 text-gray-500">
//               No clients found matching your search.
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClientManagement;
