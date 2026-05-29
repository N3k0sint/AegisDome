export interface TyposquattingResult {
  detected: boolean;
  brandName?: string;
  matchedPart?: string;
  similarity?: number;
}

interface Brand {
  name: string;
  displayName: string;
  whitelist: string[];
}

const PROTECTED_BRANDS: Brand[] = [
  // --- Malaysian Banks ---
  { name: 'maybank', displayName: 'Maybank', whitelist: ['maybank.com.my', 'maybank2u.com.my', 'maybank.com', 'maybank2u.com'] },
  { name: 'maybank2u', displayName: 'Maybank2u', whitelist: ['maybank2u.com.my', 'maybank2u.com'] },
  { name: 'cimb', displayName: 'CIMB Bank', whitelist: ['cimb.com.my', 'cimbclicks.com.my', 'cimb.com', 'cimbclicks.com'] },
  { name: 'cimbclicks', displayName: 'CIMB Clicks', whitelist: ['cimbclicks.com.my', 'cimbclicks.com'] },
  { name: 'publicbank', displayName: 'Public Bank', whitelist: ['publicbank.com.my', 'pbebank.com'] },
  { name: 'pbebank', displayName: 'PBe Bank', whitelist: ['pbebank.com'] },
  { name: 'rhb', displayName: 'RHB Bank', whitelist: ['rhbgroup.com', 'rhbclicks.com.my', 'rhbclicks.com'] },
  { name: 'rhbclicks', displayName: 'RHB Clicks', whitelist: ['rhbclicks.com.my', 'rhbclicks.com'] },
  { name: 'hlb', displayName: 'Hong Leong Bank', whitelist: ['hlb.com.my', 'hongleongconnect.my', 'hlb.com'] },
  { name: 'hongleong', displayName: 'Hong Leong Bank', whitelist: ['hlb.com.my', 'hongleongconnect.my'] },
  { name: 'ambank', displayName: 'AmBank', whitelist: ['ambank.com.my', 'ambankgroup.com', 'amebank.com.my'] },
  { name: 'affin', displayName: 'Affin Bank', whitelist: ['affinbank.com.my', 'affinalways.com', 'affinbank.com'] },
  { name: 'alliance', displayName: 'Alliance Bank', whitelist: ['alliancebank.com.my'] },
  { name: 'bankislam', displayName: 'Bank Islam', whitelist: ['bankislam.com.my', 'bankislam.biz'] },
  { name: 'mybsn', displayName: 'BSN (MyBSN)', whitelist: ['mybsn.com.my'] },
  { name: 'bankmuamalat', displayName: 'Bank Muamalat', whitelist: ['muamalat.com.my'] },
  { name: 'agrobank', displayName: 'Agrobank', whitelist: ['agrobank.com.my'] },

  // --- Malaysian E-Wallets & Digital Services ---
  { name: 'touchngo', displayName: "Touch 'n Go", whitelist: ['touchngo.com.my', 'tngdigital.com.my'] },
  { name: 'tng', displayName: "Touch 'n Go (TNG)", whitelist: ['touchngo.com.my', 'tngdigital.com.my'] },
  { name: 'tngdigital', displayName: "TNG Digital", whitelist: ['tngdigital.com.my', 'touchngo.com.my'] },
  { name: 'boost', displayName: 'Boost E-Wallet', whitelist: ['myboost.com.my', 'myboost.com'] },
  { name: 'grab', displayName: 'Grab', whitelist: ['grab.com', 'grab.com.my', 'grab.com.sg'] },
  { name: 'shopee', displayName: 'Shopee', whitelist: ['shopee.com.my', 'shopee.com', 'shopee.sg', 'shopee.co.id'] },
  { name: 'lazada', displayName: 'Lazada', whitelist: ['lazada.com.my', 'lazada.com', 'lazada.sg'] },
  { name: 'unifi', displayName: 'Unifi (TM)', whitelist: ['unifi.com.my', 'tm.com.my'] },
  { name: 'maxis', displayName: 'Maxis', whitelist: ['maxis.com.my', 'maxis.com'] },
  { name: 'celcom', displayName: 'Celcom', whitelist: ['celcom.com.my'] },
  { name: 'digi', displayName: 'Digi', whitelist: ['digi.com.my'] },
  { name: 'umobile', displayName: 'U Mobile', whitelist: ['u.com.my', 'umobile.com.my'] },
  { name: 'posmalaysia', displayName: 'Pos Malaysia', whitelist: ['pos.com.my'] },

  // --- Malaysian Government ---
  { name: 'kwsp', displayName: 'KWSP (EPF)', whitelist: ['kwsp.gov.my'] },
  { name: 'hasil', displayName: 'LHDN (Hasil)', whitelist: ['hasil.gov.my'] },
  { name: 'lhdn', displayName: 'LHDN (Hasil)', whitelist: ['hasil.gov.my'] },
  { name: 'mysejahtera', displayName: 'MySejahtera', whitelist: ['mysejahtera.gov.my'] },

  // --- Global / International Brands ---
  { name: 'paypal', displayName: 'PayPal', whitelist: ['paypal.com', 'paypal.me'] },
  { name: 'netflix', displayName: 'Netflix', whitelist: ['netflix.com', 'netflix.net', 'netflix.live'] },
  { name: 'google', displayName: 'Google', whitelist: ['google.com', 'google.com.my', 'gmail.com', 'youtube.com'] },
  { name: 'microsoft', displayName: 'Microsoft', whitelist: ['microsoft.com', 'live.com', 'outlook.com', 'office.com', 'msn.com'] },
  { name: 'facebook', displayName: 'Facebook', whitelist: ['facebook.com', 'fb.com', 'messenger.com'] },
  { name: 'instagram', displayName: 'Instagram', whitelist: ['instagram.com', 'instagr.am'] },
  { name: 'apple', displayName: 'Apple', whitelist: ['apple.com', 'icloud.com'] },
  { name: 'amazon', displayName: 'Amazon', whitelist: ['amazon.com', 'aws.amazon.com', 'media-amazon.com'] },
  { name: 'chase', displayName: 'Chase Bank', whitelist: ['chase.com'] },
  { name: 'bankofamerica', displayName: 'Bank of America', whitelist: ['bankofamerica.com'] },
  { name: 'twitter', displayName: 'Twitter / X', whitelist: ['twitter.com', 'x.com'] },
  { name: 'tiktok', displayName: 'TikTok', whitelist: ['tiktok.com'] },
  { name: 'spotify', displayName: 'Spotify', whitelist: ['spotify.com'] },
  { name: 'steam', displayName: 'Steam', whitelist: ['steampowered.com', 'steamcommunity.com'] },
  { name: 'binance', displayName: 'Binance', whitelist: ['binance.com'] },
  { name: 'coinbase', displayName: 'Coinbase', whitelist: ['coinbase.com'] },
  { name: 'meta', displayName: 'Meta', whitelist: ['meta.com'] },
  { name: 'disney', displayName: 'Disney', whitelist: ['disneyplus.com', 'disney.com'] },
  { name: 'linkedin', displayName: 'LinkedIn', whitelist: ['linkedin.com'] },
  { name: 'zoom', displayName: 'Zoom', whitelist: ['zoom.us', 'zoom.com'] },
  { name: 'dropbox', displayName: 'Dropbox', whitelist: ['dropbox.com'] },
  { name: 'github', displayName: 'GitHub', whitelist: ['github.com'] },
];

function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  
  const mapping: Record<string, string> = {
    '@': 'a',
    '4': 'a',
    '3': 'e',
    '1': 'l',
    'i': 'l',
    '!': 'l',
    '0': 'o',
    '9': 'g',
    '$': 's',
    '5': 's',
    '8': 'b',
    'v': 'u',
    'w': 'uu',
    'z': 's',
  };

  for (const [char, replacement] of Object.entries(mapping)) {
    normalized = normalized.replaceAll(char, replacement);
  }

  return normalized.replace(/[^a-z0-9]/g, '');
}

function getDomainParts(urlStr: string): { hostname: string; parts: string[] } {
  let hostname = urlStr;
  try {
    let parseUrl = urlStr;
    if (parseUrl.includes('@')) {
      parseUrl = parseUrl.replace(/@/g, 'a');
    }
    if (!/^https?:\/\//i.test(parseUrl)) {
      parseUrl = 'http://' + parseUrl;
    }
    const parsed = new URL(parseUrl);
    hostname = parsed.hostname;
  } catch (e) {
    let fallbackUrl = urlStr;
    if (fallbackUrl.includes('@')) {
      fallbackUrl = fallbackUrl.replace(/@/g, 'a');
    }
    const match = fallbackUrl.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\?#:]+)/i);
    if (match) {
      hostname = match[1];
    }
  }

  hostname = hostname.toLowerCase();
  if (hostname.startsWith('www.')) {
    hostname = hostname.substring(4);
  }

  const parts = hostname.split('.');
  return { hostname, parts };
}

export function detectTyposquatting(urlStr: string): TyposquattingResult {
  const { hostname, parts } = getDomainParts(urlStr);
  if (!hostname) return { detected: false };

  for (const brand of PROTECTED_BRANDS) {
    const isWhitelisted = brand.whitelist.some(domain => {
      return hostname === domain || hostname.endsWith('.' + domain);
    });

    if (isWhitelisted) {
      continue;
    }

    for (const part of parts) {
      if (['com', 'my', 'net', 'org', 'gov', 'edu', 'biz', 'info', 'xyz', 'app', 'online', 'me', 'sg', 'cc', 'us', 'uk'].includes(part)) {
        continue;
      }

      const normalizedPart = normalizeText(part);
      const normalizedBrand = normalizeText(brand.name);

      const hasSubstring = normalizedPart.includes(normalizedBrand) || normalizedBrand.includes(normalizedPart);
      
      let similarity = 0;
      if (hasSubstring) {
        similarity = 1.0;
      } else {
        const distance = getLevenshteinDistance(normalizedPart, normalizedBrand);
        const maxLength = Math.max(normalizedPart.length, normalizedBrand.length);
        similarity = maxLength > 0 ? 1 - distance / maxLength : 0;
      }

      // Check if similarity meets our 80% threshold
      // We also enforce that the matched part should be at least 3 characters to avoid false positives on short labels
      if (similarity >= 0.8 && normalizedPart.length >= 3) {
        return {
          detected: true,
          brandName: brand.displayName,
          matchedPart: part,
          similarity: Math.round(similarity * 100)
        };
      }
    }
  }

  return { detected: false };
}
