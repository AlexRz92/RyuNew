export interface ImageSize {
  width: number;
  height: number;
  quality?: number;
}

export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public/');
}

export function getOptimizedImageUrl(url: string, size: ImageSize): string {
  if (!url) return '';

  if (isSupabaseStorageUrl(url)) {
    const params = new URLSearchParams();
    params.append('width', size.width.toString());
    params.append('height', size.height.toString());
    params.append('resize', 'cover');
    if (size.quality) {
      params.append('quality', size.quality.toString());
    }

    return `${url}?${params.toString()}`;
  }

  return url;
}

export function generateSrcSet(url: string, sizes: ImageSize[]): string {
  if (!url) return '';

  if (isSupabaseStorageUrl(url)) {
    return sizes
      .map(size => `${getOptimizedImageUrl(url, size)} ${size.width}w`)
      .join(', ');
  }

  return url;
}

export const imageSizePresets = {
  thumbnail: { width: 200, height: 200, quality: 80 },
  small: { width: 400, height: 400, quality: 85 },
  medium: { width: 800, height: 800, quality: 85 },
  large: { width: 1200, height: 1200, quality: 90 },
  productCard: [
    { width: 280, height: 280, quality: 80 },
    { width: 400, height: 400, quality: 85 },
    { width: 600, height: 600, quality: 85 },
    { width: 800, height: 800, quality: 85 },
  ],
  featuredProduct: [
    { width: 280, height: 280, quality: 80 },
    { width: 400, height: 400, quality: 85 },
    { width: 600, height: 600, quality: 85 },
  ],
  cartThumbnail: { width: 80, height: 80, quality: 75 },
  productDetail: [
    { width: 400, height: 400, quality: 85 },
    { width: 600, height: 600, quality: 85 },
    { width: 800, height: 800, quality: 90 },
    { width: 1200, height: 1200, quality: 90 },
  ],
};
