'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'firebase/auth';
import { DocumentReference, DocumentData } from 'firebase/firestore';
import { Camera, Pencil } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateUserProfileAndAuth } from '@/firebase';
import { UpdateImageDialog } from './dialogs';


const profileFormSchema = z.object({
  firstName: z.string().min(1, 'Il nome è obbligatorio.'),
  lastName: z.string().min(1, 'Il cognome è obbligatorio.'),
});

export default function UserProfileCard({ user, userDoc, userDocRef }: { user: User, userDoc: DocumentData, userDocRef: DocumentReference | null }) {
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        values: { firstName: userDoc?.firstName || '', lastName: userDoc?.lastName || '' }
    });

    const handleEditSubmit = async (values: z.infer<typeof profileFormSchema>) => {
        if (!userDocRef || !user) return;
        await updateUserProfileAndAuth(user, userDocRef, values);
        toast({ title: 'Profilo aggiornato!' });
        setIsEditing(false);
    };

    const handleAvatarUpdate = (url: string) => {
        if (!user || !userDocRef) return;
        updateUserProfileAndAuth(user, userDocRef, { photoURL: url });
        toast({ title: 'Avatar aggiornato!' });
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <UpdateImageDialog 
                        onUpdate={handleAvatarUpdate} 
                        currentUrl={user.photoURL || ''}
                        pathPrefix={`avatars/${user.uid}`}
                    >
                        <div className="relative group cursor-pointer">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200`} data-ai-hint="profile person" />
                                <AvatarFallback>{userDoc?.firstName?.[0]}{userDoc?.lastName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white h-8 w-8" />
                            </div>
                        </div>
                    </UpdateImageDialog>
                    <div className="flex-1 text-center sm:text-left">
                        {!isEditing ? (
                            <>
                                <h1 className="text-3xl font-bold">{userDoc?.firstName} {userDoc?.lastName}</h1>
                                <p className="text-muted-foreground">{user.email}</p>
                            </>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
                                    <div className="flex flex-col gap-4 sm:flex-row">
                                        <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Cognome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Annulla</Button>
                                        <Button type="submit">Salva</Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </div>
                    {!isEditing && (
                        <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Modifica Profilo</span>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
