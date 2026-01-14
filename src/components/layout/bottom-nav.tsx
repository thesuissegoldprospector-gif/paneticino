'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, MapPin, User, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import React from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/bakeries', label: 'Panettieri', icon: Store },
  { href: '/near-me', label: 'Vicino a te', icon: MapPin },
  { href: '/profile', label: 'Profilo', icon: User, auth: true },
];

function AdminNav() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const pathname = usePathname();

    const adminRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [firestore, user]);
    
    const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRef);

    if (isUserLoading || isAdminLoading || !adminDoc) return null;

    return (
        <li>
            <Link
                href="/admin/applications"
                className={cn(
                    'flex flex-col items-center gap-1 rounded-lg p-2 transition-colors duration-200',
                    pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
            >
                <Shield className="h-6 w-6" />
                <span className="text-xs font-medium">Admin</span>
            </Link>
        </li>
    );
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <ul className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          if (item.auth && !user) return null;

          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg p-2 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}

        {user && <AdminNav />}
        
        {!user && (
           <li >
              <Link
                href="/login"
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg p-2 transition-colors duration-200',
                  pathname.startsWith('/login') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <User className="h-6 w-6" />
                <span className="text-xs font-medium">Accedi</span>
              </Link>
            </li>
        )}
      </ul>
    </nav>
  );
}
