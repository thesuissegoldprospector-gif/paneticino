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

export const products: Product[] = [];

export const bakeries: Bakery[] = [];

export const getBakeryBySlug = (slug: string) => bakeries.find((b) => b.slug === slug);
export const getProductsByBakeryId = (bakeryId: string) => products.filter((p) => p.bakeryId === bakeryId);
export const getSponsoredProducts = () => [];
