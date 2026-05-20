'use client';

import { useState } from 'react';
import { Share2, Check, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ShareButtonsProps {
  url: string;
  title: string;
  text?: string;
}

export function ShareButtons({ url, title, text }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const fullText = text ?? title;

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: fullText, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    copy();
  }

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const encoded = encodeURIComponent(fullText + ' ' + url);
  const links = {
    whatsapp: `https://wa.me/?text=${encoded}`,
    twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={nativeShare}>
        {copied ? (
          <Check className="h-3.5 w-3.5 mr-1.5" />
        ) : (
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
        )}
        {copied ? 'Copied' : 'Share'}
      </Button>
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <a href={links.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp">
          <MessageCircle className="h-4 w-4 text-emerald-600" />
        </a>
      </Button>
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <a href={links.twitter} target="_blank" rel="noreferrer" aria-label="Twitter">
          <Twitter className="h-4 w-4 text-sky-500" />
        </a>
      </Button>
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <a href={links.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
          <Facebook className="h-4 w-4 text-blue-600" />
        </a>
      </Button>
    </div>
  );
}
