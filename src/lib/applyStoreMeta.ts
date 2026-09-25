import { storeConfig } from '../config/store.config';

/**
 * Aplica la identidad de la tienda (título, descripción, favicon, Open Graph)
 * al documento en tiempo de ejecución, a partir de store.config.
 * Se llama una vez al arrancar la app, manteniendo el index.html genérico.
 */
export function applyStoreMeta(): void {
  const { name, tagline, description, branding } = storeConfig;

  document.title = tagline ? `${name} · ${tagline}` : name;

  setMetaByName('description', description);
  setMetaByProperty('og:title', name);
  setMetaByProperty('og:description', description);
  setMetaByProperty('og:image', branding.ogImage);
  setMetaByName('twitter:title', name);
  setMetaByName('twitter:description', description);
  setMetaByName('twitter:image', branding.ogImage);

  setFavicon(branding.favicon);
}

function setMetaByName(name: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setFavicon(href: string): void {
  let el = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'icon');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}
