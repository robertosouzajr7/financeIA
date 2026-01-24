import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, CreditCard, Shield, Plus, Trash2, Building } from 'lucide-react';
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/api/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const OrganizationSettings = () => {
  const { currentOrganization, switchOrganization } = useAuth();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form states
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    // Check URL params for create mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setIsCreating(true);
      setLoading(false);
    } else if (currentOrganization) {
      loadOrgData();
    } else {
      setLoading(false);
    }
  }, [currentOrganization]);

  const loadOrgData = async () => {
    setLoading(true);
    try {
      // Load members
      const membersRes = await api.get(`/organizations/${currentOrganization.id}/members`);
      
      setOrg({
        ...currentOrganization,
        plan: "Free" // TODO: Fetch real plan from subscription
      });
      setMembers(membersRes.data);
    } catch (err) {
      console.error("Error loading org settings:", err);
      setError("Failed to load organization settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    
    try {
      const res = await api.post('/organizations', { name });
      const newOrg = res.data;
      alert('Organization created successfully!');
      
      // Reload the page to refresh user data and switch to new org
      localStorage.setItem('current_org_id', newOrg.id);
      window.location.href = '/OrganizationSettings';
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      alert('Failed to create organization: ' + errorMessage);
    }
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const slug = formData.get('slug');

    try {
      await api.put(`/organizations/${currentOrganization.id}`, { name, slug });
      alert('Organization updated successfully!');
      window.location.reload();
    } catch (err) {
      alert('Failed to update: ' + err.response?.data?.error);
    }
  };

  // ... (handleAddMember, handleRemoveMember remain same)

  if (loading) return <div className="p-8">Loading Settings...</div>;

  if (isCreating) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Organization</h1>
          <p className="text-gray-500">Set up a new workspace for your team.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-org-name">Organization Name</Label>
                <Input id="new-org-name" name="name" placeholder="e.g. My Company" required />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => {
                  setIsCreating(false);
                  window.history.replaceState({}, '', '/OrganizationSettings');
                }}>Cancel</Button>
                <Button type="submit">Create Organization</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!org) return (
    <div className="p-8 flex flex-col items-center justify-center space-y-4">
      <p>Select an organization to view settings or create a new one.</p>
      <Button onClick={() => setIsCreating(true)}>Create New Organization</Button>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-gray-500">Manage your organization profile, team, and billing.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> New Organization
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Update your organization's public information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateOrg} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" name="name" defaultValue={org.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-slug">URL Slug</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">financeia.com/org/</span>
                    <Input id="org-slug" name="slug" defaultValue={org.slug} />
                  </div>
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Management */}
        <TabsContent value="members" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage who has access to this organization.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input 
                  placeholder="Enter user phone number (e.g. 5511999999999)" 
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                />
                <Button onClick={handleAddMember} disabled={isAddingMember}>
                  <Plus className="mr-2 h-4 w-4" /> Add Member
                </Button>
              </div>

              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      {member.role !== 'OWNER' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are currently on the <strong>{org.plan}</strong> plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900">{org.plan} Plan</p>
                    <p className="text-sm text-blue-700">Manage via Stripe</p>
                  </div>
                </div>
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => window.location.href = '/Pricing'}>
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>Manage API keys for external integrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-lg font-mono text-sm break-all">
                  sk_live_... (Hidden)
                </div>
                <Button variant="outline"><Shield className="mr-2 h-4 w-4" /> Rotate Key</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default OrganizationSettings;
