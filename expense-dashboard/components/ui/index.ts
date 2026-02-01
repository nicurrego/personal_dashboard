/**
 * UI Components Barrel Export
 * 
 * Reusable UI primitives and shared components.
 * Import via: import { Button, Card, InfoModal } from '@/components/ui';
 */

// Primitives from shadcn/ui
export { Button, buttonVariants } from './button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Input } from './input';
export { Label } from './label';
export { Badge, badgeVariants } from './badge';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export { Separator } from './separator';
export { Skeleton } from './skeleton';

// Note: Toaster requires 'next-themes' package - uncomment when installed
// export { Toaster } from './sonner';

// Popovers and Overlays
export { Popover, PopoverTrigger, PopoverContent } from './popover';
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription
} from './sheet';
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';

// Select
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';

// Note: Form components require 'react-hook-form' package - uncomment when installed
// export {
//   Form,
//   FormItem,
//   FormLabel,
//   FormControl,
//   FormDescription,
//   FormMessage,
//   FormField,
//   useFormField
// } from './form';

// Custom Components
export { default as InfoModal } from './InfoModal';
export { default as FloatingFilterButton } from './FloatingFilterButton';
export { default as EmptyState } from './EmptyState';
export { BottomSheet } from './bottom-sheet';
export { MobileInputBar } from './mobile-input-bar';
export { SyncStatusIndicator } from './SyncStatusIndicator';

// Note: Sidebar requires '@/hooks/use-mobile' - uncomment when hook is created
// export {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarGroup,
//   SidebarGroupAction,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarHeader,
//   SidebarInput,
//   SidebarInset,
//   SidebarMenu,
//   SidebarMenuAction,
//   SidebarMenuBadge,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarMenuSkeleton,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
//   SidebarProvider,
//   SidebarRail,
//   SidebarSeparator,
//   SidebarTrigger,
//   useSidebar,
// } from './sidebar';
