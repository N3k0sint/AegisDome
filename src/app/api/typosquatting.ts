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
  // --- Banking & Finance ---
  { name: 'maybank', displayName: 'Maybank', whitelist: ['maybank.com.my', 'maybank2u.com.my', 'maybank.com', 'maybank2u.com'] },
  { name: 'maybank2u', displayName: 'Maybank2u', whitelist: ['maybank2u.com.my', 'maybank2u.com'] },
  { name: 'cimb', displayName: 'CIMB Bank', whitelist: ['cimb.com.my', 'cimbclicks.com.my', 'cimb.com', 'cimbclicks.com'] },
  { name: 'cimbclicks', displayName: 'CIMB Clicks', whitelist: ['cimbclicks.com.my', 'cimbclicks.com'] },
  { name: 'publicbank', displayName: 'Public Bank', whitelist: ['publicbank.com.my', 'publicbank.com', 'pbebank.com'] },
  { name: 'pbebank', displayName: 'PBe Bank', whitelist: ['pbebank.com', 'publicbank.com.my'] },
  { name: 'rhb', displayName: 'RHB Bank', whitelist: ['rhbgroup.com', 'rhbclicks.com.my', 'rhbclicks.com', 'rhb.com.my'] },
  { name: 'rhbclicks', displayName: 'RHB Clicks', whitelist: ['rhbclicks.com.my', 'rhbclicks.com', 'rhbgroup.com'] },
  { name: 'ambank', displayName: 'AmBank', whitelist: ['ambank.com.my', 'ambankgroup.com', 'ambank.com', 'amebank.com.my'] },
  { name: 'hlb', displayName: 'Hong Leong Bank', whitelist: ['hlb.com.my', 'hongleongconnect.my', 'hlb.com', 'hlebroking.com'] },
  { name: 'hongleong', displayName: 'Hong Leong Bank', whitelist: ['hlb.com.my', 'hongleongconnect.my', 'hlb.com'] },
  { name: 'bankislam', displayName: 'Bank Islam', whitelist: ['bankislam.com.my', 'bankislam.com', 'bankislam.biz'] },
  { name: 'affin', displayName: 'Affin Bank', whitelist: ['affinbank.com.my', 'affinalways.com', 'affinbank.com', 'affingroup.com'] },
  { name: 'alliance', displayName: 'Alliance Bank', whitelist: ['alliancebank.com.my', 'alliancebank.com'] },
  { name: 'standardchartered', displayName: 'Standard Chartered', whitelist: ['sc.com', 'standardchartered.com', 'standardchartered.com.my'] },
  { name: 'hsbc', displayName: 'HSBC Bank', whitelist: ['hsbc.com.my', 'hsbc.com'] },
  { name: 'ocbc', displayName: 'OCBC Bank', whitelist: ['ocbc.com.my', 'ocbc.com'] },
  { name: 'uob', displayName: 'UOB Bank', whitelist: ['uob.com.my', 'uob.com'] },
  { name: 'bankrakyat', displayName: 'Bank Rakyat', whitelist: ['bankrakyat.com.my', 'bankrakyat.com'] },
  { name: 'mybsn', displayName: 'BSN (MyBSN)', whitelist: ['mybsn.com.my'] },
  { name: 'bsn', displayName: 'BSN (MyBSN)', whitelist: ['mybsn.com.my'] },
  { name: 'agrobank', displayName: 'Agrobank', whitelist: ['agrobank.com.my'] },
  { name: 'mbsb', displayName: 'MBSB Bank', whitelist: ['mbsbbank.com', 'mbsb.com.my'] },
  { name: 'muamalat', displayName: 'Bank Muamalat', whitelist: ['muamalat.com.my'] },
  { name: 'kenanga', displayName: 'Kenanga Investment', whitelist: ['kenanga.com.my', 'kenanga.com'] },
  { name: 'hlebroking', displayName: 'Hong Leong e-Broking', whitelist: ['hlebroking.com', 'hlb.com.my'] },

  // --- Logistics & E-Commerce ---
  { name: 'posmalaysia', displayName: 'Pos Malaysia', whitelist: ['pos.com.my'] },
  { name: 'pos', displayName: 'Pos Malaysia', whitelist: ['pos.com.my'] },
  { name: 'jtexpress', displayName: 'J&T Express', whitelist: ['jtexpress.my', 'jtexpress.com.my'] },
  { name: 'ninjavan', displayName: 'Ninja Van', whitelist: ['ninjavan.co', 'ninjavan.my'] },
  { name: 'dhl', displayName: 'DHL', whitelist: ['dhl.com', 'dhl.com.my'] },
  { name: 'fedex', displayName: 'FedEx', whitelist: ['fedex.com'] },
  { name: 'gdexpress', displayName: 'GDEX', whitelist: ['gdexpress.com'] },
  { name: 'gdex', displayName: 'GDEX', whitelist: ['gdexpress.com'] },
  { name: 'shopee', displayName: 'Shopee', whitelist: ['shopee.com.my', 'shopee.com', 'shopee.sg', 'shopee.co.id'] },
  { name: 'lazada', displayName: 'Lazada', whitelist: ['lazada.com.my', 'lazada.com', 'lazada.sg'] },
  { name: 'flashexpress', displayName: 'Flash Express', whitelist: ['flashexpress.my'] },
  { name: 'carousell', displayName: 'Carousell', whitelist: ['carousell.com.my', 'carousell.com'] },
  { name: 'mudah', displayName: 'Mudah.my', whitelist: ['mudah.my', 'mudah.com.my'] },
  { name: 'tiktok', displayName: 'TikTok', whitelist: ['tiktok.com'] },
  { name: 'grab', displayName: 'Grab', whitelist: ['grab.com', 'grab.com.my', 'grab.com.sg'] },
  { name: 'foodpanda', displayName: 'Foodpanda', whitelist: ['foodpanda.my', 'foodpanda.com'] },
  { name: 'zalora', displayName: 'Zalora', whitelist: ['zalora.com.my', 'zalora.com'] },
  { name: 'lalamove', displayName: 'Lalamove', whitelist: ['lalamove.com'] },
  { name: 'bungkusit', displayName: 'Bungkusit', whitelist: ['bungkusit.com.my'] },
  { name: 'taobao', displayName: 'Taobao', whitelist: ['taobao.com'] },
  { name: 'aliexpress', displayName: 'AliExpress', whitelist: ['aliexpress.com'] },
  { name: 'amazon', displayName: 'Amazon', whitelist: ['amazon.com', 'aws.amazon.com', 'media-amazon.com'] },

  // --- Education & Government Portals ---
  { name: 'moe', displayName: 'Ministry of Education (MOE)', whitelist: ['moe.gov.my'] },
  { name: 'universitimalaya', displayName: 'Universiti Malaya (UM)', whitelist: ['um.edu.my'] },
  { name: 'uitm', displayName: 'UiTM', whitelist: ['uitm.edu.my'] },
  { name: 'ukm', displayName: 'UKM', whitelist: ['ukm.edu.my'] },
  { name: 'usm', displayName: 'USM', whitelist: ['usm.edu.my'] },
  { name: 'upm', displayName: 'UPM', whitelist: ['upm.edu.my'] },
  { name: 'utm', displayName: 'UTM', whitelist: ['utm.edu.my'] },
  { name: 'uum', displayName: 'UUM', whitelist: ['uum.edu.my'] },
  { name: 'iium', displayName: 'IIUM', whitelist: ['iium.edu.my'] },
  { name: 'unikl', displayName: 'UniKL', whitelist: ['unikl.edu.my'] },
  { name: 'ptptn', displayName: 'PTPTN', whitelist: ['ptptn.gov.my'] },
  { name: 'hasil', displayName: 'LHDN (Hasil)', whitelist: ['hasil.gov.my'] },
  { name: 'lhdn', displayName: 'LHDN (Hasil)', whitelist: ['hasil.gov.my'] },
  { name: 'kwsp', displayName: 'KWSP (EPF)', whitelist: ['kwsp.gov.my'] },
  { name: 'perkeso', displayName: 'PERKESO (Socso)', whitelist: ['perkeso.gov.my'] },
  { name: 'jpj', displayName: 'JPJ', whitelist: ['jpj.gov.my'] },
  { name: 'pdrm', displayName: 'PDRM', whitelist: ['rmp.gov.my'] },
  { name: 'mysejahtera', displayName: 'MySejahtera', whitelist: ['mysejahtera.gov.my'] },
  { name: 'padu', displayName: 'PADU Portal', whitelist: ['padu.gov.my'] },
  { name: 'spa', displayName: 'SPA Portal', whitelist: ['spa.gov.my'] },
  { name: 'sumbangantunairahmah', displayName: 'Sumbangan Tunai Rahmah (STR)', whitelist: ['hasil.gov.my'] },

  // --- Entertainment & Media Streaming ---
  { name: 'netflix', displayName: 'Netflix', whitelist: ['netflix.com', 'netflix.net', 'netflix.live'] },
  { name: 'astro', displayName: 'Astro', whitelist: ['astro.com.my', 'astro.com'] },
  { name: 'hotstar', displayName: 'Disney+ Hotstar', whitelist: ['hotstar.com'] },
  { name: 'spotify', displayName: 'Spotify', whitelist: ['spotify.com'] },
  { name: 'youtube', displayName: 'YouTube', whitelist: ['youtube.com'] },
  { name: 'gsc', displayName: 'GSC Cinemas', whitelist: ['gsc.com.my'] },
  { name: 'tgv', displayName: 'TGV Cinemas', whitelist: ['tgv.com.my'] },
  { name: 'steam', displayName: 'Steam', whitelist: ['steampowered.com', 'steamcommunity.com'] },
  { name: 'playstation', displayName: 'PlayStation', whitelist: ['playstation.com'] },
  { name: 'moonton', displayName: 'Moonton', whitelist: ['moonton.com'] },
  { name: 'garena', displayName: 'Garena', whitelist: ['garena.my', 'garena.com'] },
  { name: 'roblox', displayName: 'Roblox', whitelist: ['roblox.com'] },
  { name: 'epicgames', displayName: 'Epic Games', whitelist: ['epicgames.com'] },
  { name: 'twitch', displayName: 'Twitch', whitelist: ['twitch.tv'] },
  { name: 'iqiyi', displayName: 'iQIYI', whitelist: ['iq.com', 'iqiyi.com'] },
  { name: 'viu', displayName: 'Viu', whitelist: ['viu.com'] },
  { name: 'nintendo', displayName: 'Nintendo', whitelist: ['nintendo.com'] },
  { name: 'ea', displayName: 'EA', whitelist: ['ea.com'] },
  { name: 'discord', displayName: 'Discord', whitelist: ['discord.com', 'discord.gg'] },

  // --- International Technology & Telco ---
  { name: 'microsoft', displayName: 'Microsoft', whitelist: ['microsoft.com', 'live.com', 'outlook.com', 'office.com', 'msn.com'] },
  { name: 'google', displayName: 'Google', whitelist: ['google.com', 'google.com.my', 'gmail.com', 'youtube.com'] },
  { name: 'apple', displayName: 'Apple', whitelist: ['apple.com', 'icloud.com'] },
  { name: 'maxis', displayName: 'Maxis', whitelist: ['maxis.com.my', 'maxis.com'] },
  { name: 'hotlink', displayName: 'Hotlink', whitelist: ['hotlink.com.my', 'maxis.com.my'] },
  { name: 'celcomdigi', displayName: 'CelcomDigi', whitelist: ['celcomdigi.com', 'celcom.com.my', 'digi.com.my'] },
  { name: 'celcom', displayName: 'Celcom', whitelist: ['celcom.com.my', 'celcomdigi.com'] },
  { name: 'digi', displayName: 'Digi', whitelist: ['digi.com.my', 'celcomdigi.com'] },
  { name: 'umobile', displayName: 'U Mobile', whitelist: ['u.com.my', 'umobile.com.my'] },
  { name: 'unifi', displayName: 'Unifi (TM)', whitelist: ['unifi.com.my', 'tm.com.my'] },
  { name: 'yes5g', displayName: 'Yes 5G', whitelist: ['yes.my'] },
  { name: 'timeinternet', displayName: 'Time Internet', whitelist: ['time.com.my'] },
  { name: 'facebook', displayName: 'Facebook', whitelist: ['facebook.com', 'fb.com', 'messenger.com'] },
  { name: 'instagram', displayName: 'Instagram', whitelist: ['instagram.com', 'instagr.am'] },
  { name: 'twitter', displayName: 'Twitter / X', whitelist: ['twitter.com', 'x.com'] },
  { name: 'linkedin', displayName: 'LinkedIn', whitelist: ['linkedin.com'] },
  { name: 'openai', displayName: 'OpenAI', whitelist: ['openai.com', 'chatgpt.com'] },
  { name: 'adobe', displayName: 'Adobe', whitelist: ['adobe.com'] },
  { name: 'dropbox', displayName: 'Dropbox', whitelist: ['dropbox.com'] },
  { name: 'icloud', displayName: 'iCloud', whitelist: ['icloud.com', 'apple.com'] },
  { name: 'github', displayName: 'GitHub', whitelist: ['github.com'] },
  { name: 'zoom', displayName: 'Zoom', whitelist: ['zoom.us', 'zoom.com'] },
  { name: 'canva', displayName: 'Canva', whitelist: ['canva.com'] },

  // --- E-Wallets & Payment Systems ---
  { name: 'touchngo', displayName: "Touch 'n Go", whitelist: ['touchngo.com.my', 'tngdigital.com.my'] },
  { name: 'tng', displayName: "Touch 'n Go (TNG)", whitelist: ['touchngo.com.my', 'tngdigital.com.my'] },
  { name: 'tngdigital', displayName: "TNG Digital", whitelist: ['tngdigital.com.my', 'touchngo.com.my'] },
  { name: 'boost', displayName: 'Boost E-Wallet', whitelist: ['myboost.com.my', 'myboost.com'] },
  { name: 'bigpay', displayName: 'BigPay', whitelist: ['bigpayme.com', 'bigpay.com'] },
  { name: 'setel', displayName: 'Setel', whitelist: ['setel.com', 'setel.my'] },
  { name: 'paynet', displayName: 'PayNet', whitelist: ['paynet.my', 'fpx.com.my'] },
  { name: 'fpx', displayName: 'FPX (PayNet)', whitelist: ['fpx.com.my', 'paynet.my'] },
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
