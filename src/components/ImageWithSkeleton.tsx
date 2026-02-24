import { useState } from 'react';
import { generateSrcSet, getOptimizedImageUrl, imageSizePresets, ImageSize } from '../lib/imageOptimization';

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  preset?: 'productCard' | 'featuredProduct' | 'cartThumbnail' | 'productDetail';
  sizes?: string;
}

export function ImageWithSkeleton({
  src,
  alt,
  className = '',
  priority = false,
  preset = 'productCard',
  sizes,
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeConfig = imageSizePresets[preset];
  const isSingleSize = !Array.isArray(sizeConfig);

  const imageSrc = isSingleSize
    ? getOptimizedImageUrl(src, sizeConfig as ImageSize)
    : getOptimizedImageUrl(src, (sizeConfig as ImageSize[])[0]);

  const srcSet = !isSingleSize
    ? generateSrcSet(src, sizeConfig as ImageSize[])
    : undefined;

  const defaultSizes = sizes || (() => {
    switch (preset) {
      case 'productCard':
        return '(max-width: 640px) 160px, (max-width: 1024px) 240px, 280px';
      case 'featuredProduct':
        return '(max-width: 640px) 160px, (max-width: 1024px) 240px, 280px';
      case 'cartThumbnail':
        return '80px';
      case 'productDetail':
        return '(max-width: 768px) 100vw, 50vw';
      default:
        return '100vw';
    }
  })();

  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-800/50 animate-pulse" />
      )}
      <img
        src={imageSrc}
        srcSet={srcSet}
        sizes={defaultSizes}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
