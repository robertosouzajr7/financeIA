// Type definitions for sidebar components
// This file suppresses TypeScript errors for the sidebar UI components

import * as React from 'react';

export interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
  children?: React.ReactNode;
}

export interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
}

export interface SidebarGroupActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface SidebarGroupContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  children?: React.ReactNode;
}

export interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode;
}

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isActive?: boolean;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  tooltip?: string | { children: React.ReactNode };
}

export interface SidebarMenuActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  showOnHover?: boolean;
}

export interface SidebarMenuBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface SidebarMenuSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  showIcon?: boolean;
}

export interface SidebarMenuSubProps extends React.HTMLAttributes<HTMLUListElement> {
  children?: React.ReactNode;
}

export interface SidebarMenuSubButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
  size?: 'sm' | 'md';
  isActive?: boolean;
}

export const SidebarProvider: React.ForwardRefExoticComponent<SidebarProviderProps & React.RefAttributes<HTMLDivElement>>;
export const Sidebar: React.ForwardRefExoticComponent<SidebarProps & React.RefAttributes<HTMLDivElement>>;
export const SidebarTrigger: React.ForwardRefExoticComponent<SidebarTriggerProps & React.RefAttributes<HTMLButtonElement>>;
export const SidebarHeader: React.ForwardRefExoticComponent<SidebarHeaderProps & React.RefAttributes<HTMLDivElement>>;
export const SidebarFooter: React.ForwardRefExoticComponent<SidebarFooterProps & React.RefAttributes<HTMLDivElement>>;
export const SidebarContent: React.ForwardRefExoticComponent<SidebarContentProps & React.RefAttributes<HTMLDivElement>>;
export const SidebarGroup: React.ForwardRefExoticComponent<SidebarGroupProps & React.RefAttributes<HTMLDivElement>>;
export const SidebarGroupLabel: React.ForwardRefExoticComponent<SidebarGroupLabelProps & React.RefAttributes<HTMLDivElement>>;
export const SidebarGroupAction: React.ForwardRefExoticComponent<SidebarGroupActionProps & React.RefAttributes<HTMLButtonElement>>;
export const SidebarGroupContent: React.ForwardRefExoticComponent<SidebarGroupContentProps & React.RefAttributes<HTMLDivElement>>;
export const SidebarMenu: React.ForwardRefExoticComponent<SidebarMenuProps & React.RefAttributes<HTMLUListElement>>;
export const SidebarMenuItem: React.ForwardRefExoticComponent<SidebarMenuItemProps & React.RefAttributes<HTMLLIElement>>;
export const SidebarMenuButton: React.ForwardRefExoticComponent<SidebarMenuButtonProps & React.RefAttributes<HTMLButtonElement>>;
export const SidebarMenuAction: React.ForwardRefExoticComponent<SidebarMenuActionProps & React.RefAttributes<HTMLButtonElement>>;
export const SidebarMenuBadge: React.ForwardRefExoticComponent<SidebarMenuBadgeProps & React.RefAttributes<HTMLDivElement>>;
export const SidebarMenuSkeleton: React.ForwardRefExoticComponent<SidebarMenuSkeletonProps & React.RefAttributes<HTMLDivElement>>;
export const SidebarMenuSub: React.ForwardRefExoticComponent<SidebarMenuSubProps & React.RefAttributes<HTMLUListElement>>;
export const SidebarMenuSubButton: React.ForwardRefExoticComponent<SidebarMenuSubButtonProps & React.RefAttributes<HTMLAnchorElement>>;

export function useSidebar(): {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean | ((open: boolean) => boolean)) => void;
  toggleSidebar: () => void;
};
