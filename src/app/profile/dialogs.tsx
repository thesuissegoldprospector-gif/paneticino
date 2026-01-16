'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Camera, Upload, ImageIcon, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebase } from '@/firebase';
import { uploadImage } from '@/app/actions/upload-actions';

const placeholderImages = [
    'https://picsum.photos/seed/bread1/400/300',
    'https://picsum.photos/seed/bread2/400/300',
    'https://picsum.photos/seed/bread3/400/300',
    'https://picsum.photos/seed/bread4/400/300',
];


const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    if (!dataurl || !dataurl.includes(',')) return null;
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    try {
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    } catch (e) {
        console.error("Error converting data URL to file:", e);
        return null;
    }
}

export function UpdateImageDialog({ onUpdate, currentUrl, children, pathPrefix }: { onUpdate: (url: string) => void; currentUrl?: string; children: React.ReactNode; pathPrefix: string; }) {
    const [open, setOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [sourceForUpload, setSourceForUpload] = useState<'file' | 'camera' | 'gallery' | 'link' | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { toast } = useToast();
    const { user } = useFirebase();

    useEffect(() => {
        if (open) {
            const initialUrl = currentUrl || '';
            setPreviewUrl(initialUrl);
            setLinkUrl(initialUrl);
            setImageFile(null);
            setSourceForUpload(null);
        }
        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [open, currentUrl]);
    
    const handleCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            toast({ variant: 'destructive', title: 'Camera non accessibile', description: 'Permesso negato o camera non trovata.' });
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setSourceForUpload('file');
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setPreviewUrl(dataUrl);
                setSourceForUpload('camera');
                const file = dataURLtoFile(dataUrl, 'capture.jpg');
                if (file) setImageFile(file);
                
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
    };

    const handleSubmit = async () => {
        setIsUploading(true);
        try {
            let finalUrl = '';

            if (imageFile) {
                if (!user) throw new Error('Utente non autenticato.');
                if (!pathPrefix) throw new Error('Percorso di caricamento non specificato.');

                const formData = new FormData();
                formData.append('file', imageFile);
                formData.append('pathPrefix', pathPrefix);

                const result = await uploadImage(formData);

                if (result.error) throw new Error(result.error);
                if (!result.url) throw new Error('Caricamento fallito, nessun URL restituito.');
                
                finalUrl = result.url;
            } else if (sourceForUpload === 'link' && linkUrl) {
                finalUrl = linkUrl;
            } else if (previewUrl === currentUrl) {
                // No change, just close.
                setOpen(false);
                setIsUploading(false);
                return;
            } else {
                throw new Error('Nessuna nuova immagine da salvare.');
            }
            
            onUpdate(finalUrl);
            toast({ title: 'Immagine aggiornata!' });
            setOpen(false);
        } catch (error: any) {
            console.error("Error handling image: ", error);
            toast({ variant: 'destructive', title: 'Errore', description: error.message || 'Impossibile salvare l\'immagine.' });
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleSetUrlFromGallery = (url: string) => {
        setPreviewUrl(url);
        setLinkUrl(url);
        setImageFile(null);
        setSourceForUpload('link');
    }
    
    const handleSetUrlFromLink = (url: string) => {
        setPreviewUrl(url);
        setLinkUrl(url);
        setImageFile(null);
        setSourceForUpload('link');
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Aggiorna immagine</DialogTitle>
                  <DialogDescription>
                    Scegli un'immagine caricandola dal tuo dispositivo, usando un link, scattando una foto o selezionandola dalla galleria.
                  </DialogDescription>
                </DialogHeader>
                <div>
                  <Tabs defaultValue="upload">
                      <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="upload"><Upload />Carica</TabsTrigger>
                          <TabsTrigger value="url"><LinkIcon />URL</TabsTrigger>
                          <TabsTrigger value="gallery"><ImageIcon />Galleria</TabsTrigger>
                          <TabsTrigger value="camera" onClick={handleCamera}><Camera />Camera</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="py-4 space-y-4">
                          <Input type="file" onChange={handleFileChange} accept="image/*" />
                      </TabsContent>
                      <TabsContent value="url" className="py-4 space-y-4">
                          <Input placeholder="https://esempio.com/immagine.jpg" value={linkUrl} onChange={(e) => handleSetUrlFromLink(e.target.value)} />
                      </TabsContent>
                      <TabsContent value="gallery" className="py-4">
                          <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                              {placeholderImages.map(imgUrl => (
                                  <div key={imgUrl} className="relative aspect-video cursor-pointer" onClick={() => handleSetUrlFromGallery(imgUrl)}>
                                      <Image src={imgUrl} alt="Placeholder" fill sizes="200px" style={{objectFit: "cover"}} className={cn("rounded-md", previewUrl === imgUrl && (sourceForUpload === 'gallery' || sourceForUpload === 'link') && "ring-2 ring-primary ring-offset-2")}/>
                                  </div>
                              ))}
                          </div>
                      </TabsContent>
                      <TabsContent value="camera" className="py-4 space-y-4">
                          <video ref={videoRef} className="w-full aspect-video bg-muted rounded-md" autoPlay playsInline muted />
                          <canvas ref={canvasRef} className="hidden"/>
                          <Button onClick={handleCapture} disabled={!videoRef.current?.srcObject}>Scatta Foto</Button>
                      </TabsContent>
                  </Tabs>
                  {previewUrl && (
                      <div className='py-4'>
                          <p className='text-sm font-medium mb-2'>Anteprima:</p>
                          <Image src={previewUrl} alt="Anteprima" width={200} height={200} className="rounded-md object-cover mx-auto" />
                      </div>
                  )}
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleSubmit} disabled={isUploading || !previewUrl}>
                        {isUploading ? <Loader2 className="animate-spin" /> : 'Salva'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
