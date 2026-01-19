'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Camera, Upload, ImageIcon, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { uploadImageBase64 } from '@/app/actions/upload-actions';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const placeholderImages = [
    'https://picsum.photos/seed/bread1/400/300',
    'https://picsum.photos/seed/bread2/400/300',
    'https://picsum.photos/seed/bread3/400/300',
    'https://picsum.photos/seed/bread4/400/300',
];

// Converti DataURL in File
const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    if (!dataurl.includes(',')) return null;
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], filename, { type: mime });
};

// Converte un File (o Blob) in una stringa base64 (data URL)
const fileToBase64 = (file: File): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


export function UpdateImageDialog({
  onUpdate,
  currentUrl,
  children,
  pathPrefix
}: {
  onUpdate: (url: string) => void;
  currentUrl?: string;
  children: React.ReactNode;
  pathPrefix: string;
}) {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceForUpload, setSourceForUpload] = useState<'file' | 'camera' | 'gallery' | 'link' | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setPreviewUrl(currentUrl || '');
      setLinkUrl(currentUrl || '');
      setImageFile(null);
      setSourceForUpload(null);
    }
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [open, currentUrl]);

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast({ variant: 'destructive', title: 'Camera non accessibile', description: 'Permesso negato o camera non trovata.' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setSourceForUpload('file');
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    setPreviewUrl(dataUrl);
    setSourceForUpload('camera');
    const file = dataURLtoFile(dataUrl, 'capture.jpg');
    if (file) setImageFile(file);
    (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    videoRef.current.srcObject = null;
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      // Case 1: Un file è stato caricato o catturato dalla camera.
      if (imageFile) {
        // Converte il file in base64
        const base64String = await fileToBase64(imageFile);
        
        // Crea un nome univoco per il file
        const extension = imageFile.name.split('.').pop() || 'bin';
        const uniqueFileName = `${pathPrefix}/${crypto.randomUUID()}.${extension}`;
        
        // Chiama la server action per l'upload
        const publicUrl = await uploadImageBase64(base64String, uniqueFileName, imageFile.type);
        
        onUpdate(publicUrl);
        toast({ title: 'Immagine caricata con successo!' });
        setOpen(false);

      } 
      // Case 2: Un URL è stato incollato o scelto dalla galleria.
      else if ((sourceForUpload === 'link' || sourceForUpload === 'gallery') && previewUrl && previewUrl !== currentUrl) {
        onUpdate(previewUrl);
        toast({ title: 'Immagine aggiornata!' });
        setOpen(false);
      } 
      // Case 3: Nessuna modifica, chiudi la dialog.
      else {
        setOpen(false);
      }
    } catch (err: any) {
      console.error('Error handling image submission:', err);
      toast({ 
        variant: 'destructive', 
        title: 'Errore di caricamento', 
        description: err.message || 'Si è verificato un errore sconosciuto.' 
      });
    } finally {
      setIsUploading(false);
    }
  };


  const handleSetUrlFromGallery = (url: string) => {
    setPreviewUrl(url);
    setLinkUrl(url);
    setImageFile(null);
    setSourceForUpload('gallery');
  };

  const handleSetUrlFromLink = (url: string) => {
    setPreviewUrl(url);
    setLinkUrl(url);
    setImageFile(null);
    setSourceForUpload('link');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Aggiorna immagine</DialogTitle>
          <DialogDescription>
            Carica dal dispositivo, scatta una foto, usa un link o seleziona dalla galleria.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload"><Upload />Carica</TabsTrigger>
            <TabsTrigger value="url"><LinkIcon />URL</TabsTrigger>
            <TabsTrigger value="gallery"><ImageIcon />Galleria</TabsTrigger>
            <TabsTrigger value="camera" onClick={handleCamera}><Camera />Camera</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="py-4 space-y-4">
            <Input type="file" accept="image/*" onChange={handleFileChange} />
          </TabsContent>
          <TabsContent value="url" className="py-4 space-y-4">
            <Input placeholder="https://esempio.com/immagine.jpg" value={linkUrl} onChange={e => handleSetUrlFromLink(e.target.value)} />
          </TabsContent>
          <TabsContent value="gallery" className="py-4">
            <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
              {placeholderImages.map(url => (
                <div key={url} className="relative aspect-video cursor-pointer" onClick={() => handleSetUrlFromGallery(url)}>
                  <Image
                    src={url}
                    alt="Placeholder"
                    fill
                    sizes="200px"
                    style={{ objectFit: "cover" }}
                    className={cn("rounded-md", previewUrl === url && (sourceForUpload === 'gallery' || sourceForUpload === 'link') && "ring-2 ring-primary ring-offset-2")}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="camera" className="py-4 space-y-4">
            <video ref={videoRef} className="w-full aspect-video bg-muted rounded-md" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <Button onClick={handleCapture} disabled={!videoRef.current?.srcObject}>Scatta Foto</Button>
          </TabsContent>
        </Tabs>

        {previewUrl && (
          <div className="py-4">
            <p className="text-sm font-medium mb-2">Anteprima:</p>
            <Image src={previewUrl} alt="Anteprima" width={200} height={200} className="rounded-md object-cover mx-auto" />
          </div>
        )}

        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={isUploading || (!imageFile && previewUrl === currentUrl)}>
            {isUploading ? <Loader2 className="animate-spin" /> : 'Salva'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
