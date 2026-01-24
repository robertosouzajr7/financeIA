import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building, CreditCard, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalUsers: 0,
    activeSubs: 0,
    revenue: 0
  });
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Mock data for now - replace with real API calls
      // const orgsRes = await fetch('/api/organizations', { headers: { Authorization: `Bearer ${token}` } });
      
      // Simulating API response
      setTimeout(() => {
        setStats({
          totalOrgs: 12,
          totalUsers: 45,
          activeSubs: 8,
          revenue: 2450.00
        });
        
        setOrganizations([
          { id: 1, name: "Acme Corp", plan: "Enterprise", status: "active", users: 15, created_at: "2023-10-01" },
          { id: 2, name: "Smith Family", plan: "Pro", status: "active", users: 4, created_at: "2023-10-05" },
          { id: 3, name: "John Doe", plan: "Free", status: "active", users: 1, created_at: "2023-11-12" },
          // ... more data
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <Button>System Settings</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrgs}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubs}</div>
            <p className="text-xs text-muted-foreground">+1 new this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={org.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                      {org.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{org.users}</TableCell>
                  <TableCell>{org.created_at}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Manage</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;