import { PlaceHolderImages } from './placeholder-images';

const findImage = (id: string) => {
  const image = PlaceHolderImages.find((img) => img.id === id);
  if (!image) {
    // Fallback for user profile image which is not in placeholder-images.json
    if (id === 'user-profile') {
        return {
            id: 'user-profile',
            description: 'User profile picture',
            imageUrl: 'https://picsum.photos/seed/userprofile/200/200',
            imageHint: 'profile person',
            width: 200,
            height: 200,
        }
    }
     // Return a default image if not found, instead of throwing an error
    return {
      id: 'default',
      description: 'Default placeholder image',
      imageUrl: 'https://picsum.photos/seed/default/1080/720',
      imageHint: 'placeholder',
      width: 1080,
      height: 720,
    };
  }

  // Extract width and height from unsplash URL
  const url = new URL(image.imageUrl);
  const widthStr = url.searchParams.get("w");
  const heightStr = url.searchParams.get("h");

  return { 
    ...image, 
    width: widthStr ? parseInt(widthStr, 10) : 1080, // Default or parsed width
    height: heightStr ? parseInt(heightStr, 10) : 720 // Default or parsed height
  };
};

export type Product = {
  id: string;
  name: string;
  price: string;
  image: ReturnType<typeof findImage>;
  description: string;
  bakeryId: string;
};

export type Bakery = {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  coverImage: ReturnType<typeof findImage>;
  profileImage: ReturnType<typeof findImage>;
  isFeatured?: boolean;
};

export const products: Product[] = [
  { id: 'p1', name: 'Pagnotta Artigianale', price: '€4.50', image: findImage('product-bread-1'), description: 'Pane a lievitazione naturale con crosta croccante.', bakeryId: 'b1' },
  { id: 'p2', name: 'Cornetto Classico', price: '€1.20', image: findImage('product-croissant-1'), description: 'Soffice e burroso, perfetto per la colazione.', bakeryId: 'b1' },
  { id: 'p3', name: 'Focaccia al Rosmarino', price: '€3.00', image: findImage('product-focaccia-1'), description: 'Morbida focaccia con olio extra vergine e rosmarino fresco.', bakeryId: 'b1' },
  { id: 'p4', name: 'Ciabatta Tradizionale', price: '€2.50', image: findImage('product-ciabatta-1'), description: 'Pane leggero con una mollica alveolata.', bakeryId: 'b2' },
  { id: 'p5', name: 'Baguette Francese', price: '€2.00', image: findImage('product-baguette-1'), description: 'Crosta dorata e mollica soffice, come a Parigi.', bakeryId: 'b2' },
  { id: 'p6', name: 'Brioche Dolce', price: '€5.00', image: findImage('product-brioche-1'), description: 'Un pane dolce e ricco, ottimo tostato.', bakeryId: 'b3' },
];

export const bakeries: Bakery[] = [
  { 
    id: 'b1', 
    slug: 'il-forno-incantato',
    name: 'Il Forno Incantato',
    description: 'Un panificio magico dove la tradizione incontra l\'innovazione. Usiamo solo ingredienti biologici e a km 0.',
    address: 'Via della Magia, 1, 00100 Roma',
    coverImage: findImage('bakery-cover-1'),
    profileImage: findImage('bakery-profile-1'),
    isFeatured: true,
  },
  { 
    id: 'b2', 
    slug: 'panificio-nonna-rosa',
    name: 'Panificio Nonna Rosa',
    description: 'Le ricette della nonna, il sapore di una volta. Pane cotto in forno a legna ogni mattina.',
    address: 'Corso Garibaldi, 50, 20121 Milano',
    coverImage: findImage('bakery-cover-2'),
    profileImage: findImage('bakery-profile-2'),
    isFeatured: true,
  },
  { 
    id: 'b3', 
    slug: 'antica-forneria',
    name: 'Antica Forneria',
    description: 'Dal 1920, portiamo il pane più buono sulle vostre tavole. Specialità regionali e dolci da forno.',
    address: 'Via dei Fornai, 12, 50123 Firenze',
    coverImage: findImage('bakery-cover-3'),
    profileImage: findImage('bakery-profile-3'),
  },
];

export const getBakeryBySlug = (slug: string) => bakeries.find((b) => b.slug === slug);
export const getProductsByBakeryId = (bakeryId: string) => products.filter((p) => p.bakeryId === bakeryId);
export const getSponsoredProducts = () => [products[0], products[2], products[4], products[5]];
