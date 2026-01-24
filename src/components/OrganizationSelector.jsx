import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building, ChevronDown, PlusCircle } from 'lucide-react';

const OrganizationSelector = () => {
  const { user, currentOrganization, switchOrganization } = useAuth();

  if (!user || !user.organizations || user.organizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <div className="flex items-center truncate">
            <Building className="mr-2 h-4 w-4" />
            <span className="truncate">{currentOrganization?.name || 'Select Org'}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        <DropdownMenuLabel>My Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.organizations.map((member) => (
          <DropdownMenuItem 
            key={member.id} 
            onSelect={() => switchOrganization(member.organization.id)}
            className={currentOrganization?.id === member.organization.id ? "bg-slate-100 font-medium" : ""}
          >
            {member.organization.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => window.location.href = '/OrganizationSettings'}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create / Manage
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrganizationSelector;
