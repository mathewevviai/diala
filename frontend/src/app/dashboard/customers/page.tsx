'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UilSearch,
  UilFilter,
  UilExport,
  UilPlus,
  UilEnvelope,
  UilPhone,
  UilCalendarAlt,
  UilEllipsisV,
  UilCheck
} from '@tooni/iconscout-unicons-react';

// Sample customer data
const customers = [
  { 
    id: 1, 
    name: 'John Smith', 
    email: 'john.smith@example.com', 
    phone: '+1 555-0123',
    status: 'active',
    orders: 45,
    spent: 12500,
    lastOrder: '2024-01-15',
    avatar: 'JS'
  },
  { 
    id: 2, 
    name: 'Sarah Johnson', 
    email: 'sarah.j@example.com', 
    phone: '+1 555-0124',
    status: 'active',
    orders: 23,
    spent: 8750,
    lastOrder: '2024-01-14',
    avatar: 'SJ'
  },
  { 
    id: 3, 
    name: 'Michael Chen', 
    email: 'mchen@example.com', 
    phone: '+1 555-0125',
    status: 'inactive',
    orders: 12,
    spent: 3200,
    lastOrder: '2023-12-20',
    avatar: 'MC'
  },
  { 
    id: 4, 
    name: 'Emma Davis', 
    email: 'emma.davis@example.com', 
    phone: '+1 555-0126',
    status: 'active',
    orders: 67,
    spent: 24300,
    lastOrder: '2024-01-16',
    avatar: 'ED'
  },
  { 
    id: 5, 
    name: 'Robert Wilson', 
    email: 'rwilson@example.com', 
    phone: '+1 555-0127',
    status: 'pending',
    orders: 5,
    spent: 1200,
    lastOrder: '2024-01-10',
    avatar: 'RW'
  },
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCustomers, setSelectedCustomers] = React.useState<number[]>([]);
  const [filterStatus, setFilterStatus] = React.useState('all');

  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterStatus]);

  const toggleCustomerSelection = (id: number) => {
    setSelectedCustomers(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>
        <Button variant="default" className="font-bold uppercase">
          <UilPlus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <UilSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-2 border-black focus:outline-none focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-black font-bold focus:outline-none focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <Button variant="neutral" className="font-bold uppercase">
              <UilFilter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
            <Button variant="neutral" className="font-bold uppercase">
              <UilExport className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b-4 border-black bg-gray-100">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === filteredCustomers.length}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-2 border-black accent-[rgb(0,82,255)] focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
                  />
                </th>
                <th className="p-4 text-left font-black text-black uppercase">Contact</th>
                <th className="p-4 text-left font-black text-black uppercase">Details</th>
                <th className="p-4 text-left font-black text-black uppercase">Status</th>
                <th className="p-4 text-left font-black text-black uppercase">Calls</th>
                <th className="p-4 text-left font-black text-black uppercase">Total Value</th>
                <th className="p-4 text-left font-black text-black uppercase">Last Call</th>
                <th className="p-4 text-left font-black text-black uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 flex items-center justify-center font-semibold text-sm">
                        {customer.avatar}
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <UilEnvelope className="h-3 w-3 text-gray-400" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <UilPhone className="h-3 w-3 text-gray-400" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge 
                      variant={customer.status === 'active' ? 'default' : 'secondary'}
                      className={`rounded-[8px] ${
                        customer.status === 'active' ? 'bg-green-100 text-green-700' :
                        customer.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {customer.status}
                    </Badge>
                  </td>
                  <td className="p-4">{customer.orders}</td>
                  <td className="p-4 font-medium">${customer.spent.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UilCalendarAlt className="h-3 w-3" />
                      {customer.lastOrder}
                    </div>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <UilEllipsisV className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Selection Info */}
      {selectedCustomers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 shadow-[4px_4px_0_rgba(255,255,255,0.3)] border-2 border-white flex items-center gap-4">
          <span>{selectedCustomers.length} customers selected</span>
          <Button size="sm" variant="secondary" className="font-bold uppercase">
            Send Email
          </Button>
          <Button size="sm" variant="secondary" className="font-bold uppercase">
            Export
          </Button>
          <button
            onClick={() => setSelectedCustomers([])}
            className="ml-4 hover:text-gray-300"
          >
            <UilCheck className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}