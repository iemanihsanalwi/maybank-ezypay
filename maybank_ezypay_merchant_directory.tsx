import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  CreditCard, 
  Calculator, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  Store, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  Info, 
  Tag, 
  ChevronRight, 
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Download,
  RotateCcw,
  Copy,
  Check,
  Building2,
  MapPin,
  Layers,
  FileSpreadsheet,
  X,
  Grid,
  List,
  ArrowRight,
  Percent,
  HelpCircle,
  Phone,
  Navigation,
  Share2,
  Smartphone,
  Clock,
  Trash2,
  Compass
} from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Import full 22,729 merchant dataset extracted from the 650-page Maybank EzyPay PDF
import { ALL_EZYPAY_MERCHANTS, RawMerchant } from './all_ezypay_merchants_data';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type MalaysianState =
  | 'All States'
  | 'Klang Valley'
  | 'Kuala Lumpur'
  | 'Selangor'
  | 'Johor'
  | 'Penang'
  | 'Perak'
  | 'Kedah'
  | 'Melaka'
  | 'Negeri Sembilan'
  | 'Pahang'
  | 'Kelantan'
  | 'Terengganu'
  | 'Sabah'
  | 'Sarawak'
  | 'Perlis';

export type CategoryCluster =
  | 'All Categories'
  | 'Tech & Electronics'
  | 'Home & Living'
  | 'Jewellery & Watches'
  | 'Healthcare & Wellness'
  | 'Automotive & Tyres'
  | 'Fashion & Department Stores'
  | 'Travel & Hotels'
  | 'Sports & Hobbies'
  | 'Education & Enrichment'
  | 'E-Commerce & Online';

export interface BranchLocation {
  name: string;
  mallOrArea: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
}

export interface Merchant {
  id: number;
  slug: string;
  name: string;
  legalName: string;
  category: CategoryCluster;
  subCategory: string;
  state: string;
  mcVisa: boolean;
  amex: boolean;
  tenures: number[];
  minSpend: number;
  isOnline: boolean;
  websiteUrl?: string;
  phoneNumber?: string;
  tags: string[];
  popularityScore: number;
  branchCount: number;
  highlightDeal?: string;
  branches: BranchLocation[];
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

export interface NearestBranchInfo {
  branch: BranchLocation;
  distanceKm: number;
}

// ============================================================================
// GEOLOCATION & DISTANCE UTILITY (Haversine Formula)
// ============================================================================

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getNearestBranchForMerchant(merchant: Merchant, userLocation: UserCoordinates | null): NearestBranchInfo | null {
  if (!userLocation || !merchant.branches || merchant.branches.length === 0) return null;
  
  let nearest: BranchLocation | null = null;
  let minDistance = Infinity;

  for (const b of merchant.branches) {
    if (b.latitude && b.longitude) {
      const dist = calculateDistanceKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = b;
      }
    }
  }

  if (nearest && minDistance !== Infinity) {
    return { branch: nearest, distanceKm: minDistance };
  }
  return null;
}

// ============================================================================
// CURATED PREMIUM METADATA REGISTRY (Enriching Nationwide Key Brands)
// ============================================================================

const CURATED_ENRICHED_REGISTRY: Record<string, Partial<Merchant>> = {
  'MACHINES': {
    name: 'Machines (Apple Authorised Reseller)',
    category: 'Tech & Electronics',
    subCategory: 'Apple Reseller & Premium Gadgets',
    websiteUrl: 'https://www.machines.com.my',
    phoneNumber: '+60 3-8322 8000',
    tags: ['apple', 'iphone', 'macbook', 'ipad', 'airpods', 'gadgets'],
    highlightDeal: 'Up to 36M 0% EzyPay on iPhone 16 Pro & MacBook Air',
    branches: [
      { name: 'Machines Mid Valley Megamall', mallOrArea: 'Mid Valley (Lot S-051, 2nd Floor)', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1178, longitude: 101.6774, phoneNumber: '+60 3-2287 4880' },
      { name: 'Machines Suria KLCC', mallOrArea: 'Suria KLCC (Concourse Level)', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1584, longitude: 101.7118, phoneNumber: '+60 3-2166 4880' },
      { name: 'Machines Pavilion KL', mallOrArea: 'Pavilion Kuala Lumpur (Level 4)', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1488, longitude: 101.7133, phoneNumber: '+60 3-2141 4880' },
      { name: 'Machines 1 Utama', mallOrArea: '1 Utama Shopping Centre', city: 'Petaling Jaya', state: 'Selangor', latitude: 3.1502, longitude: 101.6152, phoneNumber: '+60 3-7726 4880' },
      { name: 'Machines Gurney Plaza', mallOrArea: 'Gurney Plaza', city: 'George Town', state: 'Penang', latitude: 5.4377, longitude: 100.3097, phoneNumber: '+60 4-229 4880' }
    ]
  },
  'SWITCH': {
    name: 'Switch (Apple Authorised Premium Reseller)',
    category: 'Tech & Electronics',
    subCategory: 'Apple Reseller & Electronics',
    websiteUrl: 'https://switch.com.my',
    phoneNumber: '+60 4-644 6000',
    tags: ['apple', 'iphone', 'macbook', 'ipad', 'switch', 'gadgets'],
    highlightDeal: '0% EzyPay up to 36 months + complimentary screen protector voucher',
    branches: [
      { name: 'Switch Gurney Paragon', mallOrArea: 'Gurney Paragon Mall', city: 'George Town', state: 'Penang', latitude: 5.4355, longitude: 100.3115, phoneNumber: '+60 4-218 9660' },
      { name: 'Switch Queensbay Mall', mallOrArea: 'Queensbay Mall', city: 'Bayan Lepas', state: 'Penang', latitude: 5.3331, longitude: 100.3066, phoneNumber: '+60 4-646 6660' },
      { name: 'Switch The Starling', mallOrArea: 'The Starling Mall', city: 'Petaling Jaya', state: 'Selangor', latitude: 3.1352, longitude: 101.6231, phoneNumber: '+60 3-7662 5880' }
    ]
  },
  'SENHENG': {
    name: 'Senheng Electric & Grand Senheng',
    category: 'Tech & Electronics',
    subCategory: 'Home Electrical & Consumer Appliances',
    websiteUrl: 'https://www.senheng.com.my',
    phoneNumber: '+60 16-299 1398',
    tags: ['tv', 'fridge', 'aircond', 'samsung', 'lg', 'senheng', 'washer'],
    highlightDeal: '0% EzyPay up to 36M + Extra 1 Year PlusOne Warranty',
    branches: [
      { name: 'Grand Senheng Setapak', mallOrArea: 'Jalan Genting Kelang', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1950, longitude: 101.7125, phoneNumber: '+60 11-1088 8432' },
      { name: 'Senheng SS2', mallOrArea: 'SS2 Commercial Square', city: 'Petaling Jaya', state: 'Selangor', latitude: 3.1188, longitude: 101.6215, phoneNumber: '+60 11-1088 8412' }
    ]
  },
  'HARVEY NORMAN': {
    name: 'Harvey Norman Malaysia',
    category: 'Tech & Electronics',
    subCategory: 'Electrical, Computers, Furniture & Bedding',
    websiteUrl: 'https://www.harveynorman.com.my',
    phoneNumber: '+60 3-7841 8383',
    tags: ['harvey norman', 'tv', 'oled', 'laptops', 'sofa', 'mattress'],
    highlightDeal: 'Up to 36 Months 0% EzyPay on Electrical & Bedding with AMEX & Visa/MC',
    branches: [
      { name: 'Harvey Norman IPC', mallOrArea: 'IPC Shopping Centre', city: 'Petaling Jaya', state: 'Selangor', latitude: 3.1578, longitude: 101.6117, phoneNumber: '+60 3-7732 1688' },
      { name: 'Harvey Norman Mid Valley', mallOrArea: 'Mid Valley Megamall', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1178, longitude: 101.6774, phoneNumber: '+60 3-2282 2860' }
    ]
  },
  'IKEA': {
    name: 'IKEA Malaysia',
    category: 'Home & Living',
    subCategory: 'Swedish Furniture, Modular Kitchen & Home Deco',
    websiteUrl: 'https://www.ikea.com/my',
    tags: ['ikea', 'sofa', 'desk', 'wardrobe', 'bed', 'kitchen', 'dining table'],
    highlightDeal: 'Split purchases over RM500 into 0% 12 or 24 months instalment',
    branches: [
      { name: 'IKEA Damansara', mallOrArea: 'Mutiara Damansara', city: 'Petaling Jaya', state: 'Selangor', latitude: 3.1575, longitude: 101.6133, phoneNumber: '+60 3-7952 7575' },
      { name: 'IKEA Cheras', mallOrArea: 'Jalan Cochrane', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1340, longitude: 101.7258, phoneNumber: '+60 3-7952 7575' },
      { name: 'IKEA Batu Kawan', mallOrArea: 'Bandar Cassia', city: 'Simpang Ampat', state: 'Penang', latitude: 5.2343, longitude: 100.4357, phoneNumber: '+60 3-7952 7575' },
      { name: 'IKEA Tebrau', mallOrArea: 'Taman Desa Tebrau', city: 'Johor Bahru', state: 'Johor', latitude: 1.5540, longitude: 103.7930, phoneNumber: '+60 3-7952 7575' }
    ]
  },
  'POH KONG': {
    name: 'Poh Kong Jewellers',
    category: 'Jewellery & Watches',
    subCategory: '916 & 999 Gold, Solitaire Diamonds & Wedding Bands',
    websiteUrl: 'https://www.pohkong.com.my',
    phoneNumber: '+60 3-7940 3333',
    tags: ['gold', 'emas 916', 'poh kong', 'diamond ring', 'wedding band'],
    highlightDeal: '0% EzyPay up to 24M on Selected Gold Jewellery & Anggun Collections',
    branches: [
      { name: 'Poh Kong Suria KLCC', mallOrArea: 'Suria KLCC (Concourse)', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1584, longitude: 101.7118, phoneNumber: '+60 3-2166 2888' },
      { name: 'Poh Kong Mid Valley', mallOrArea: 'Mid Valley', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1178, longitude: 101.6774, phoneNumber: '+60 3-2284 2888' },
      { name: 'Poh Kong Gurney Plaza', mallOrArea: 'Gurney Plaza', city: 'George Town', state: 'Penang', latitude: 5.4377, longitude: 100.3097, phoneNumber: '+60 4-228 2888' }
    ]
  },
  'HABIB': {
    name: 'Habib Jewels',
    category: 'Jewellery & Watches',
    subCategory: 'Fine Gold, Certified Diamonds & Oro Italia 916',
    websiteUrl: 'https://www.habibjewels.com',
    phoneNumber: '+60 3-4252 7777',
    tags: ['habib', 'oro italia 916', 'diamond', 'emas', 'pendant'],
    highlightDeal: '0% EzyPay on Oro Italia 916 & Hearts on Fire Diamond collections',
    branches: [
      { name: 'Habib Pavilion KL', mallOrArea: 'Pavilion Kuala Lumpur', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1488, longitude: 101.7133, phoneNumber: '+60 3-2141 7777' },
      { name: 'Habib The Gardens Mall', mallOrArea: 'The Gardens Mall', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1185, longitude: 101.6750, phoneNumber: '+60 3-2287 7777' }
    ]
  },
  'INSTITUT JANTUNG NEGARA': {
    name: 'Institut Jantung Negara (IJN)',
    category: 'Healthcare & Wellness',
    subCategory: 'Cardiology, Heart Surgery & Health Screening',
    websiteUrl: 'https://www.ijn.com.my',
    phoneNumber: '+60 3-2617 8200',
    tags: ['ijn', 'heart screening', 'cardiology', 'hospital'],
    highlightDeal: '0% EzyPay on Executive Cardiac & Comprehensive Wellness Packages',
    branches: [
      { name: 'IJN Main Hospital', mallOrArea: '145 Jalan Tun Razak', city: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.1706, longitude: 101.7067, phoneNumber: '+60 3-2617 8200' }
    ]
  }
};

// ============================================================================
// CONSTANTS & TAXONOMY OPTIONS
// ============================================================================

const CATEGORIES: { label: CategoryCluster; icon: string }[] = [
  { label: 'All Categories', icon: '✨' },
  { label: 'Tech & Electronics', icon: '💻' },
  { label: 'Home & Living', icon: '🛋️' },
  { label: 'Jewellery & Watches', icon: '💍' },
  { label: 'Healthcare & Wellness', icon: '🏥' },
  { label: 'Automotive & Tyres', icon: '🚗' },
  { label: 'Fashion & Department Stores', icon: '🛍️' },
  { label: 'Travel & Hotels', icon: '✈️' },
  { label: 'Sports & Hobbies', icon: '🎸' },
  { label: 'Education & Enrichment', icon: '🎓' },
  { label: 'E-Commerce & Online', icon: '🌐' }
];

const REGIONAL_STATES: { label: string; value: string }[] = [
  { label: 'All States (Nationwide - 22,729 Merchants)', value: 'All States' },
  { label: 'Klang Valley (KL & Selangor)', value: 'Klang Valley' },
  { label: 'Selangor (7,032 Merchants)', value: 'Selangor' },
  { label: 'Kuala Lumpur (4,652 Merchants)', value: 'Kuala Lumpur' },
  { label: 'Johor (2,399 Merchants)', value: 'Johor' },
  { label: 'Perak (1,759 Merchants)', value: 'Perak' },
  { label: 'Sarawak (1,512 Merchants)', value: 'Sarawak' },
  { label: 'Penang (1,144 Merchants)', value: 'Penang' },
  { label: 'Sabah (784 Merchants)', value: 'Sabah' },
  { label: 'Melaka (774 Merchants)', value: 'Melaka' },
  { label: 'Pahang (713 Merchants)', value: 'Pahang' },
  { label: 'Negeri Sembilan (692 Merchants)', value: 'Negeri Sembilan' },
  { label: 'Kedah (425 Merchants)', value: 'Kedah' },
  { label: 'Terengganu (401 Merchants)', value: 'Terengganu' },
  { label: 'Kelantan (389 Merchants)', value: 'Kelantan' },
  { label: 'Perlis (53 Merchants)', value: 'Perlis' }
];

// Helper to convert raw scraped merchant into rich interactive entity
function normalizeMerchant(raw: RawMerchant): Merchant {
  const upper = raw.name.toUpperCase();
  let curatedMatch: Partial<Merchant> | undefined;

  for (const [key, meta] of Object.entries(CURATED_ENRICHED_REGISTRY)) {
    if (upper.includes(key)) {
      curatedMatch = meta;
      break;
    }
  }

  // Parse tenure string e.g. "6, 12, 24, 36M" -> [6, 12, 24, 36]
  const parsedTenures = raw.tenure
    ? raw.tenure.replace(/M/g, '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    : [6, 12, 24];

  const defaultBranch: BranchLocation = {
    name: raw.name,
    mallOrArea: `${raw.state} Commercial Area`,
    city: raw.state,
    state: raw.state
  };

  return {
    id: raw.id,
    slug: `merchant-${raw.id}-${raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: curatedMatch?.name || raw.name,
    legalName: raw.name,
    category: (raw.category as CategoryCluster) || 'Home & Living',
    subCategory: curatedMatch?.subCategory || raw.rawCategory,
    state: raw.state,
    mcVisa: raw.mcVisa,
    amex: raw.amex,
    tenures: curatedMatch?.tenures || (parsedTenures.length > 0 ? parsedTenures : [6, 12, 24]),
    minSpend: curatedMatch?.minSpend || raw.minSpend || 500,
    isOnline: curatedMatch?.isOnline || (raw.state === 'Online Store' || raw.category === 'E-Commerce & Online'),
    websiteUrl: curatedMatch?.websiteUrl,
    phoneNumber: curatedMatch?.phoneNumber,
    tags: curatedMatch?.tags || [raw.category.toLowerCase(), raw.rawCategory.toLowerCase()],
    popularityScore: curatedMatch?.popularityScore || (raw.amex ? 80 : 50),
    branchCount: curatedMatch?.branches?.length || 1,
    highlightDeal: curatedMatch?.highlightDeal,
    branches: curatedMatch?.branches || [defaultBranch]
  };
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function MaybankEzyPayDirectoryApp() {
  // --- Search & Filter States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryCluster>('All Categories');
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [cardFilter, setCardFilter] = useState<'All' | 'AMEX_ONLY' | 'VISA_MC_ONLY'>('All');
  const [selectedTenure, setSelectedTenure] = useState<number | 'All'>('All');
  
  // --- Pagination States ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // --- View & Layout States ---
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [activeTab, setActiveTab] = useState<'directory' | 'calculator'>('directory');
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'id' | 'nearest'>('popularity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // --- LocalStorage Persistent States ---
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // --- Geolocation States ---
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'enabled' | 'denied'>('idle');

  // --- Multi-Merchant Comparison States ---
  const [comparedSlugs, setComparedSlugs] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [simulatedCompareAmount, setSimulatedCompareAmount] = useState<number>(3600);

  // --- Modal / Sheet States ---
  const [inspectMerchant, setInspectMerchant] = useState<Merchant | null>(null);
  const [calcDrawerMerchant, setCalcDrawerMerchant] = useState<Merchant | null>(null);
  const [showCashierGuide, setShowCashierGuide] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // --- Contextual Calculator Inputs ---
  const [calcAmount, setCalcAmount] = useState<number>(3600);
  const [calcTenureMonths, setCalcTenureMonths] = useState<number>(24);
  const [calcCardRate, setCalcCardRate] = useState<number>(18);

  // Autocomplete ref & state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Rehydrate bookmarks & recently viewed from localStorage on mount
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem('maybank_ezypay_bookmarks');
      if (savedBookmarks) setBookmarkedSlugs(JSON.parse(savedBookmarks));
      const savedRecent = localStorage.getItem('maybank_ezypay_recent');
      if (savedRecent) setRecentSlugs(JSON.parse(savedRecent));
    } catch (e) {}
  }, []);

  // Sync bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('maybank_ezypay_bookmarks', JSON.stringify(bookmarkedSlugs));
    } catch (e) {}
  }, [bookmarkedSlugs]);

  // Sync recently viewed to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('maybank_ezypay_recent', JSON.stringify(recentSlugs));
    } catch (e) {}
  }, [recentSlugs]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedState, cardFilter, selectedTenure, showBookmarksOnly]);

  // Close search suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync contextual calculator when merchant drawer opens
  useEffect(() => {
    if (calcDrawerMerchant) {
      const highestTenure = Math.max(...calcDrawerMerchant.tenures);
      setCalcTenureMonths(highestTenure);
      if (calcAmount < calcDrawerMerchant.minSpend) {
        setCalcAmount(calcDrawerMerchant.minSpend * 2);
      }
    }
  }, [calcDrawerMerchant]);

  // Track recently viewed
  const trackViewedMerchant = (slug: string) => {
    setRecentSlugs(prev => {
      const filtered = prev.filter(s => s !== slug);
      return [slug, ...filtered].slice(0, 8);
    });
  };

  // Toggle Bookmark
  const toggleBookmark = (slug: string) => {
    setBookmarkedSlugs(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  // Toggle Comparison
  const toggleCompare = (slug: string) => {
    setComparedSlugs(prev => {
      if (prev.includes(slug)) {
        return prev.filter(s => s !== slug);
      }
      if (prev.length >= 3) {
        return [prev[1], prev[2], slug];
      }
      return [...prev, slug];
    });
  };

  // Request Browser Geolocation
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationStatus('enabled');
        setSortBy('nearest');
        setSortOrder('asc');
      },
      () => setLocationStatus('denied'),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setSelectedState('All States');
    setCardFilter('All');
    setSelectedTenure('All');
    setShowBookmarksOnly(false);
    setCurrentPage(1);
  };

  // WhatsApp Share Helper
  const handleShareWhatsApp = (m: Merchant) => {
    const text = `*Maybank 0% EzyPay Instalment Plan*\nStore: ${m.name}\nState: ${m.state}\nCategory: ${m.category}\nVisa / Mastercard: ${m.mcVisa ? 'YES' : 'NO'}\nAMEX 0%: ${m.amex ? 'YES' : 'NO'}\nTenure: ${m.tenures.join(', ')} Months\nMin Spend: RM${m.minSpend}\nWebsite: ${m.websiteUrl || 'In-store only'}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Helper to copy merchant info
  const handleCopyMerchant = (m: Merchant) => {
    const text = `Merchant: ${m.name}\nCategory: ${m.category} (${m.subCategory})\nState: ${m.state}\nMaybank 0% EzyPay: Visa/Mastercard: ${m.mcVisa ? 'YES' : 'NO'}, AMEX: ${m.amex ? 'YES' : 'NO'}\nEligible Tenures: ${m.tenures.join(', ')} Months\nMin Spend: RM${m.minSpend}`;
    navigator.clipboard.writeText(text);
    setCopyStatus(m.slug);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  // Master Filter across the full 22,729 items
  const filteredRawMerchants = useMemo(() => {
    return ALL_EZYPAY_MERCHANTS.filter(raw => {
      // Bookmarks Filter
      if (showBookmarksOnly) {
        const slug = `merchant-${raw.id}-${raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        if (!bookmarkedSlugs.includes(slug)) return false;
      }

      // Category Filter
      if (selectedCategory !== 'All Categories' && raw.category !== selectedCategory) return false;

      // State Filter (Supports regional cluster match)
      if (selectedState !== 'All States') {
        if (selectedState === 'Klang Valley') {
          if (raw.state !== 'Kuala Lumpur' && raw.state !== 'Selangor') return false;
        } else if (raw.state !== selectedState) {
          return false;
        }
      }

      // Card Network Filter
      if (cardFilter === 'AMEX_ONLY' && !raw.amex) return false;
      if (cardFilter === 'VISA_MC_ONLY' && !raw.mcVisa) return false;

      // Tenure Filter
      if (selectedTenure !== 'All') {
        if (selectedTenure === 36 && !raw.tenure.includes('36')) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tokens = q.split(/\s+/);
        const corpus = `${raw.name} ${raw.state} ${raw.category} ${raw.rawCategory} ${raw.id}`.toLowerCase();
        const matchesAll = tokens.every(token => corpus.includes(token));
        if (!matchesAll) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'id') {
        comparison = a.id - b.id;
      } else {
        // Popularity: amex supported + curated top
        const scoreA = (a.amex ? 50 : 0) + (a.mcVisa ? 10 : 0);
        const scoreB = (b.amex ? 50 : 0) + (b.mcVisa ? 10 : 0);
        comparison = scoreB - scoreA;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedState,
    cardFilter,
    selectedTenure,
    showBookmarksOnly,
    bookmarkedSlugs,
    sortBy,
    sortOrder
  ]);

  // Total pages
  const totalPages = Math.ceil(filteredRawMerchants.length / pageSize) || 1;

  // Paginated raw slice
  const paginatedRawMerchants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRawMerchants.slice(start, start + pageSize);
  }, [filteredRawMerchants, currentPage, pageSize]);

  // Convert current page items to normalized merchant entities
  const displayMerchants = useMemo(() => {
    return paginatedRawMerchants.map(normalizeMerchant);
  }, [paginatedRawMerchants]);

  // Autocomplete suggestions based on current search query
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return [
        { label: 'Machines (Apple)', type: 'Tech & Electronics', icon: '💻' },
        { label: 'Senheng Electric', type: 'Tech & Electronics', icon: '⚡' },
        { label: 'Poh Kong Jewellers', type: 'Jewellery & Watches', icon: '💍' },
        { label: 'IKEA Furniture', type: 'Home & Living', icon: '🛋️' },
        { label: 'Pantai Hospital', type: 'Healthcare & Wellness', icon: '🏥' }
      ];
    }
    const q = searchQuery.toLowerCase();
    const suggestions: { label: string; type: string; icon: string }[] = [];
    
    for (const raw of ALL_EZYPAY_MERCHANTS) {
      if (raw.name.toLowerCase().includes(q)) {
        suggestions.push({ label: raw.name, type: raw.category, icon: '🏪' });
        if (suggestions.length >= 6) break;
      }
    }
    return suggestions;
  }, [searchQuery]);

  // Export filtered items to CSV
  const exportToCSV = () => {
    const headers = ['Ref ID', 'Merchant Name', 'State', 'Category', 'Raw Category', 'Visa/Mastercard', 'AMEX 0%', 'Eligible Tenures', 'Min Spend (RM)'];
    const rows = filteredRawMerchants.slice(0, 1000).map(m => [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.state}"`,
      `"${m.category}"`,
      `"${m.rawCategory}"`,
      m.mcVisa ? 'YES' : 'NO',
      m.amex ? 'YES' : 'NO',
      `"${m.tenure}"`,
      m.minSpend
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Maybank_EzyPay_Merchants_${selectedState.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculated Repayments
  const monthlyRepayment = useMemo(() => {
    if (!calcAmount || calcAmount <= 0 || !calcTenureMonths) return '0.00';
    return (calcAmount / calcTenureMonths).toFixed(2);
  }, [calcAmount, calcTenureMonths]);

  const interestSaved = useMemo(() => {
    if (!calcAmount || calcAmount <= 0 || !calcTenureMonths) return '0.00';
    const rate = calcCardRate / 100;
    const est = calcAmount * rate * (calcTenureMonths / 12) * 0.55;
    return est.toFixed(2);
  }, [calcAmount, calcTenureMonths, calcCardRate]);

  // Compared merchant objects
  const comparedMerchantsList = useMemo(() => {
    return comparedSlugs
      .map(slug => {
        const match = slug.match(/merchant-(\d+)-/);
        if (match) {
          const id = parseInt(match[1], 10);
          const raw = ALL_EZYPAY_MERCHANTS.find(m => m.id === id);
          return raw ? normalizeMerchant(raw) : null;
        }
        return null;
      })
      .filter((m): m is Merchant => m !== null);
  }, [comparedSlugs]);

  // Recently viewed merchant objects
  const recentlyViewedList = useMemo(() => {
    return recentSlugs
      .map(slug => {
        const match = slug.match(/merchant-(\d+)-/);
        if (match) {
          const id = parseInt(match[1], 10);
          const raw = ALL_EZYPAY_MERCHANTS.find(m => m.id === id);
          return raw ? normalizeMerchant(raw) : null;
        }
        return null;
      })
      .filter((m): m is Merchant => m !== null);
  }, [recentSlugs]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans antialiased flex flex-col selection:bg-amber-400 selection:text-slate-950">
      
      {/* ==================================================================== */}
      {/* 1. TOP GLOBAL NAVIGATION HEADER                                       */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-[#0e1626]/95 backdrop-blur-md border-b border-amber-500/30 shadow-xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Maybank EzyPay Brand */}
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-xl sm:text-2xl shadow-lg shadow-amber-500/25 border border-yellow-200">
                M
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-extrabold text-lg sm:text-2xl text-white tracking-tight flex items-center gap-1.5">
                    Maybank <span className="text-amber-400">EzyPay</span>
                  </h1>
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-400/40 tracking-wide uppercase">
                    22,729 Merchants
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium hidden sm:block">
                  Complete Maybank 0% EzyPay Official Directory &bull; Visa &bull; Mastercard &bull; American Express
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setActiveTab('directory')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'directory'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Directory</span>
              </button>

              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'calculator'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">0% Calculator</span>
              </button>

              <button
                onClick={handleRequestLocation}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                  locationStatus === 'enabled'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:border-amber-400/50'
                }`}
                title="Detect Nearest Store via GPS"
              >
                <Navigation className={`w-3.5 h-3.5 ${locationStatus === 'enabled' ? 'text-emerald-400' : 'text-amber-400'} ${locationStatus === 'locating' ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">
                  {locationStatus === 'enabled' ? 'GPS Active' : 'Nearest Store'}
                </span>
              </button>

              <button
                onClick={() => setShowCashierGuide(true)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-all flex items-center space-x-1.5"
                title="How to pay in-store or online"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline">In-Store Guide</span>
              </button>

              <button
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-all relative border flex items-center space-x-1.5 ${
                  showBookmarksOnly
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
                }`}
                title="Saved Merchants"
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden md:inline">Saved</span>
                {bookmarkedSlugs.length > 0 && (
                  <span className="bg-amber-400 text-slate-950 font-black rounded-full h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center">
                    {bookmarkedSlugs.length}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. MAIN APPLICATION CONTENT                                          */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">

        {/* Informative Value Proposition Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-black/20">
          <div className="flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-400/30">
              <Percent className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm sm:text-base">
                  Search All 22,729 Maybank 0% EzyPay Merchants Across Malaysia
                </span>
                <span className="hidden sm:inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  100% Extracted from Official PDF
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Browse through all 650 pages of Maybank EzyPay merchant records. Find participating retail stores, hospital centres, car repair shops, electronics dealers, and furniture stores with exact AMEX and Visa/Mastercard eligibility.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => setCardFilter(prev => prev === 'AMEX_ONLY' ? 'All' : 'AMEX_ONLY')}
              className={`flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 border ${
                cardFilter === 'AMEX_ONLY'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-sky-400/50 hover:bg-slate-750'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-sky-400" />
              <span>AMEX Supported ({ALL_EZYPAY_MERCHANTS.filter(m => m.amex).length.toLocaleString()}) {cardFilter === 'AMEX_ONLY' ? '✓' : ''}</span>
            </button>
          </div>
        </div>

        {activeTab === 'directory' ? (
          <div className="space-y-6">

            {/* ================================================================ */}
            {/* 3. SEARCH & ADVANCED FILTER CONTROL HUB                          */}
            {/* ================================================================ */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-5">
              
              {/* Row 1: Unified Fuzzy Search Bar + Autocomplete */}
              <div className="relative" ref={searchContainerRef}>
                <div className="relative flex items-center">
                  <Search className="w-5 h-5 text-amber-400 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any of 22,729 merchants by name, brand, keyword, ID (#3473), or category..."
                    className="w-full pl-12 pr-10 py-3.5 text-sm sm:text-base bg-[#0b0f19] border border-slate-700 rounded-2xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/80 focus:border-amber-400 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 text-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {isSearchFocused && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#141d2f] border border-slate-700 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800">
                    <div className="p-2.5 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                      <span>{searchQuery ? 'Top Suggested Matches' : 'Popular EzyPay Merchants'}</span>
                      <span className="text-amber-400">Click to fill</span>
                    </div>
                    {searchSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(item.label.split(' (')[0]);
                          setIsSearchFocused(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm text-slate-200 hover:bg-slate-800/80 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-base">{item.icon}</span>
                          <span className="font-semibold group-hover:text-amber-300 transition-colors">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                          {item.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 2: Category Scrollable Quick Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>Browse by Category</span>
                  <span>{CATEGORIES.length - 1} Specialised Clusters</span>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCategory === cat.label;
                    return (
                      <button
                        key={cat.label}
                        onClick={() => setSelectedCategory(cat.label)}
                        className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border flex-shrink-0 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                            : 'bg-[#0b0f19] text-slate-300 border-slate-750 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recently Evaluated Merchants Quick Carousel Bar */}
              {recentlyViewedList.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-2">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Recently Evaluated Merchants</span>
                    </span>
                    <button
                      onClick={() => setRecentSlugs([])}
                      className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px]"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear History
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
                    {recentlyViewedList.map(m => (
                      <button
                        key={m.slug}
                        onClick={() => {
                          setInspectMerchant(m);
                          trackViewedMerchant(m.slug);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#0b0f19] hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-xs text-slate-200 transition-all flex items-center space-x-2 flex-shrink-0"
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold text-[10px] flex items-center justify-center">
                          {m.name.charAt(0)}
                        </span>
                        <span className="font-medium line-clamp-1">{m.name}</span>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1 rounded">
                          {Math.max(...m.tenures)}M
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 3: Faceted Filters (Location, Card Network, Tenure, Sort By) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3 border-t border-slate-800">
                
                {/* State / Region Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>State / Region ({REGIONAL_STATES.length} Options)</span>
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  >
                    {REGIONAL_STATES.map(st => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>

                {/* Card Network Acceptance */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Card Network Filter</span>
                  </label>
                  <select
                    value={cardFilter}
                    onChange={(e) => setCardFilter(e.target.value as any)}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  >
                    <option value="All">All Accepted Cards ({ALL_EZYPAY_MERCHANTS.length.toLocaleString()} total)</option>
                    <option value="AMEX_ONLY">American Express Supported Only ({ALL_EZYPAY_MERCHANTS.filter(m => m.amex).length.toLocaleString()})</option>
                    <option value="VISA_MC_ONLY">Visa & Mastercard Supported ({ALL_EZYPAY_MERCHANTS.filter(m => m.mcVisa).length.toLocaleString()})</option>
                  </select>
                </div>

                {/* Tenure Plan Duration */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Eligible Tenure</span>
                  </label>
                  <select
                    value={selectedTenure}
                    onChange={(e) => setSelectedTenure(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  >
                    <option value="All">Any Tenure Duration</option>
                    <option value={12}>12 Months or longer</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years Max)</option>
                  </select>
                </div>

                {/* Sorting Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sort Merchants By</span>
                  </label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [by, order] = e.target.value.split('-') as [any, any];
                      setSortBy(by);
                      setSortOrder(order);
                    }}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  >
                    <option value="popularity-desc">Popularity & Rating</option>
                    <option value="id-asc">PDF Ref ID (Lowest to Highest)</option>
                    <option value="name-asc">Merchant Name (A to Z)</option>
                    <option value="name-desc">Merchant Name (Z to A)</option>
                  </select>
                </div>

              </div>

              {/* Row 4: Active Filter Chips & View Mode Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
                
                {/* Active Result Count & Reset */}
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    Found <strong className="text-amber-400 font-bold">{filteredRawMerchants.length.toLocaleString()}</strong> merchants
                    (Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages.toLocaleString()}</strong>)
                  </span>

                  {cardFilter === 'AMEX_ONLY' && (
                    <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      AMEX Supported
                      <button onClick={() => setCardFilter('All')} className="hover:text-white">✕</button>
                    </span>
                  )}

                  {selectedCategory !== 'All Categories' && (
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory('All Categories')} className="hover:text-white">✕</button>
                    </span>
                  )}

                  {selectedState !== 'All States' && (
                    <span className="bg-slate-700 text-slate-200 border border-slate-600 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      {selectedState}
                      <button onClick={() => setSelectedState('All States')} className="hover:text-white">✕</button>
                    </span>
                  )}

                  {showBookmarksOnly && (
                    <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      Bookmarks Only
                      <button onClick={() => setShowBookmarksOnly(false)} className="hover:text-white">✕</button>
                    </span>
                  )}

                  {(searchQuery || selectedCategory !== 'All Categories' || selectedState !== 'All States' || cardFilter !== 'All' || selectedTenure !== 'All' || showBookmarksOnly) && (
                    <button
                      onClick={handleResetFilters}
                      className="text-amber-400 hover:text-amber-300 underline font-semibold ml-1 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset All
                    </button>
                  )}
                </div>

                {/* Page Size, View Mode & Export Buttons */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <span>Show:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-[#0b0f19] border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                    >
                      {[12, 24, 48, 96].map(sz => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-[#0b0f19] border border-slate-700 rounded-xl p-0.5 flex items-center">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                        viewMode === 'cards'
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Card Grid View"
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                        viewMode === 'table'
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Tabular Power View"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Table</span>
                    </button>
                  </div>

                  <button
                    onClick={exportToCSV}
                    className="px-3 py-1.5 rounded-xl bg-[#0b0f19] border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all flex items-center space-x-1.5"
                    title="Export Filtered CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>CSV</span>
                  </button>
                </div>

              </div>

            </div>

            {/* ================================================================ */}
            {/* 4. RESULTS DISPLAY (CARDS VS TABLE)                              */}
            {/* ================================================================ */}

            {viewMode === 'cards' ? (
              /* CARD VIEW: Responsive Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayMerchants.length > 0 ? (
                  displayMerchants.map(merchant => {
                    const isSaved = bookmarkedSlugs.includes(merchant.slug);
                    const isCompared = comparedSlugs.includes(merchant.slug);
                    const isCopied = copyStatus === merchant.slug;
                    const nearestInfo = getNearestBranchForMerchant(merchant, userLocation);

                    return (
                      <div
                        key={merchant.id}
                        className={`bg-[#111827] border rounded-3xl p-5 shadow-lg transition-all flex flex-col justify-between group relative ${
                          isCompared
                            ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/10'
                            : 'border-slate-800 hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/5'
                        }`}
                      >
                        {/* Top Badges, Bookmark & Compare Checkbox */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center space-x-3">
                              {/* Brand Avatar Icon */}
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-650 flex items-center justify-center font-black text-amber-400 text-xl group-hover:scale-105 transition-transform flex-shrink-0 shadow-md">
                                {merchant.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-bold text-slate-400">#{merchant.id}</span>
                                  <span className="text-[11px] font-semibold text-amber-400/90 tracking-wide uppercase">
                                    {merchant.category}
                                  </span>
                                </div>
                                <h3 
                                  onClick={() => {
                                    setInspectMerchant(merchant);
                                    trackViewedMerchant(merchant.slug);
                                  }}
                                  className="font-extrabold text-base text-white group-hover:text-amber-300 transition-colors line-clamp-1 cursor-pointer"
                                  title={merchant.name}
                                >
                                  {merchant.name}
                                </h3>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => toggleCompare(merchant.slug)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  isCompared
                                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                                }`}
                                title="Add to comparison"
                              >
                                {isCompared ? 'Compared' : '+ Compare'}
                              </button>

                              <button
                                onClick={() => toggleBookmark(merchant.slug)}
                                className={`p-1.5 rounded-xl transition-all ${
                                  isSaved
                                    ? 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                }`}
                                title={isSaved ? 'Remove from Saved' : 'Save Merchant'}
                              >
                                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Subcategory & State */}
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span className="line-clamp-1">{merchant.subCategory}</span>
                            <span className="font-semibold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {merchant.state}
                            </span>
                          </div>

                          {/* Geolocation Nearest Store Pill */}
                          {nearestInfo && (
                            <div className="bg-emerald-500/15 border border-emerald-500/35 rounded-xl px-2.5 py-1 mb-3 text-[11px] text-emerald-300 font-semibold flex items-center justify-between">
                              <span className="flex items-center gap-1.5 truncate">
                                <Navigation className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                <span className="truncate">
                                  <strong>{nearestInfo.distanceKm < 1 ? `${Math.round(nearestInfo.distanceKm * 1000)}m` : `${nearestInfo.distanceKm.toFixed(1)} km`}</strong> &bull; {nearestInfo.branch.name}
                                </span>
                              </span>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nearestInfo.branch.name + ' ' + nearestInfo.branch.mallOrArea)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-emerald-400 underline font-bold ml-1 hover:text-emerald-300"
                              >
                                Maps
                              </a>
                            </div>
                          )}

                          {/* Highlight Deal Pill */}
                          {merchant.highlightDeal && (
                            <div className="bg-amber-400/10 border border-amber-400/25 rounded-xl px-2.5 py-1.5 mb-3 text-[11px] text-amber-300 font-medium flex items-center space-x-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                              <span className="line-clamp-1">{merchant.highlightDeal}</span>
                            </div>
                          )}

                          {/* Card Network Acceptance Chips */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2 text-center">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Visa / Mastercard</span>
                              {merchant.mcVisa ? (
                                <span className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[3]" /> Supported
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-slate-500">Not Available</span>
                              )}
                            </div>

                            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2 text-center">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">American Express</span>
                              {merchant.amex ? (
                                <span className="text-xs font-black text-sky-400 flex items-center justify-center gap-1 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[3]" /> Supported
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-rose-400/70">Not Accepted</span>
                              )}
                            </div>
                          </div>

                          {/* Tenure Badges & Min Spend */}
                          <div className="space-y-1.5 bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-3 mb-4 text-xs">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="text-slate-400">Available Tenures:</span>
                              <div className="flex items-center gap-1">
                                {merchant.tenures.map(t => (
                                  <span key={t} className="bg-slate-800 text-amber-300 font-black px-1.5 py-0.5 rounded text-[11px] border border-slate-700">
                                    {t}M
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-slate-300">
                              <span className="text-slate-400">Min Spend:</span>
                              <span className="font-bold text-white">RM {merchant.minSpend.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions: 0% Calculator & Details */}
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setCalcDrawerMerchant(merchant);
                              trackViewedMerchant(merchant.slug);
                            }}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-amber-400/10 hover:bg-amber-400 hover:text-slate-950 text-amber-300 border border-amber-400/30 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Calc 0%</span>
                          </button>

                          <button
                            onClick={() => {
                              setInspectMerchant(merchant);
                              trackViewedMerchant(merchant.slug);
                            }}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                          >
                            <Building2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Details</span>
                          </button>

                          <button
                            onClick={() => handleShareWhatsApp(merchant)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 text-slate-400 transition-all"
                            title="Share via WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleCopyMerchant(merchant)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-all"
                            title="Copy details"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-16 text-center bg-[#111827] border border-slate-800 rounded-3xl p-8">
                    <Store className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    <h3 className="font-extrabold text-lg text-white">No matching merchants found</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                      No merchants matched your search. Try resetting the filters or switching to "All States".
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* TABLE VIEW: Power User Tabular Directory */
              <div className="bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px] font-bold">
                        <th className="py-4 px-3 w-12 text-center">Save</th>
                        <th className="py-4 px-3 w-14 text-center">Compare</th>
                        <th className="py-4 px-3 w-16">Ref ID</th>
                        <th className="py-4 px-4">Merchant Name</th>
                        <th className="py-4 px-4">State</th>
                        <th className="py-4 px-4">Category</th>
                        <th className="py-4 px-4 text-center">Visa / MC</th>
                        <th className="py-4 px-4 text-center">AMEX</th>
                        <th className="py-4 px-4">Tenure</th>
                        <th className="py-4 px-4">Min Spend</th>
                        <th className="py-4 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-medium">
                      {displayMerchants.length > 0 ? (
                        displayMerchants.map(merchant => {
                          const isSaved = bookmarkedSlugs.includes(merchant.slug);
                          const isCompared = comparedSlugs.includes(merchant.slug);

                          return (
                            <tr key={merchant.id} className="hover:bg-slate-800/50 transition-colors text-slate-200">
                              <td className="py-3.5 px-3 text-center">
                                <button
                                  onClick={() => toggleBookmark(merchant.slug)}
                                  className={`p-1 rounded transition-colors ${
                                    isSaved ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                                  }`}
                                >
                                  {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isCompared}
                                  onChange={() => toggleCompare(merchant.slug)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-400 focus:ring-amber-400"
                                />
                              </td>
                              <td className="py-3.5 px-3 font-mono text-slate-400 text-xs">
                                #{merchant.id}
                              </td>
                              <td className="py-3.5 px-4">
                                <div 
                                  className="font-bold text-white hover:text-amber-300 transition-colors cursor-pointer" 
                                  onClick={() => {
                                    setInspectMerchant(merchant);
                                    trackViewedMerchant(merchant.slug);
                                  }}
                                >
                                  {merchant.name}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-xs text-slate-300">
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                                  {merchant.state}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-xs border border-slate-800">
                                  {merchant.category}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {merchant.mcVisa ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                    YES
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-xs">NO</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {merchant.amex ? (
                                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                                    YES
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-xs">NO</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-amber-300 font-bold text-xs">
                                {merchant.tenures.map(t => `${t}M`).join(', ')}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-white">
                                RM {merchant.minSpend}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => {
                                      setCalcDrawerMerchant(merchant);
                                      trackViewedMerchant(merchant.slug);
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition-all text-xs"
                                    title="Calculate 0%"
                                  >
                                    <Calculator className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setInspectMerchant(merchant);
                                      trackViewedMerchant(merchant.slug);
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs"
                                    title="View Details"
                                  >
                                    <Building2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-slate-500">
                            No merchants matched the criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================================================================ */}
            {/* PAGINATION CONTROLS BAR (For 22,729 Merchants)                   */}
            {/* ================================================================ */}
            {totalPages > 1 && (
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 shadow-lg">
                <div className="flex items-center space-x-2">
                  <span>
                    Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredRawMerchants.length).toLocaleString()}</strong> of <strong>{filteredRawMerchants.length.toLocaleString()}</strong> merchants
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-700 bg-[#0b0f19] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-700 bg-[#0b0f19] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 font-extrabold text-white bg-[#0b0f19] border border-slate-700 rounded-xl">
                    Page {currentPage} of {totalPages.toLocaleString()}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-700 bg-[#0b0f19] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-700 bg-[#0b0f19] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct Jump to Page */}
                <div className="flex items-center space-x-2">
                  <span>Go to:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    placeholder="Page"
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    className="w-16 bg-[#0b0f19] border border-slate-700 rounded-lg px-2 py-1 text-center text-white"
                  />
                  <button
                    onClick={() => {
                      const p = parseInt(jumpPageInput, 10);
                      if (p >= 1 && p <= totalPages) {
                        setCurrentPage(p);
                        setJumpPageInput('');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors"
                  >
                    Go
                  </button>
                </div>

              </div>
            )}

          </div>
        ) : (
          /* ================================================================ */
          /* 5. DEDICATED 0% INSTALMENT CALCULATOR TAB                         */
          /* ================================================================ */
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-8">
              
              <div>
                <div className="inline-flex items-center space-x-2 bg-amber-400/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Financial Planning & Savings Engine</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Maybank 0% EzyPay Repayment Calculator
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Calculate your exact equal monthly instalment payments with zero interest, zero administrative fees, and discover your total savings compared to revolving credit card debt.
                </p>
              </div>

              {/* Calculator Parameters Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Purchase Amount (RM)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                      RM
                    </span>
                    <input
                      type="number"
                      min="500"
                      step="100"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 text-base font-bold bg-[#0b0f19] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div className="flex gap-1.5 pt-1 flex-wrap">
                    {[1200, 2400, 3600, 5000, 8000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setCalcAmount(amt)}
                        className="text-[11px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded font-medium text-slate-300 border border-slate-700"
                      >
                        RM{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tenure */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    EzyPay Tenure Duration
                  </label>
                  <select
                    value={calcTenureMonths}
                    onChange={(e) => setCalcTenureMonths(Number(e.target.value))}
                    className="w-full py-3 px-3.5 text-base font-bold bg-[#0b0f19] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {[6, 12, 18, 24, 36].map(t => (
                      <option key={t} value={t}>{t} Months (0% Interest)</option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-500 block pt-1">
                    Subject to merchant agreement
                  </span>
                </div>

                {/* Benchmark Revolving Rate */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Benchmark Card Interest (% p.a.)
                  </label>
                  <select
                    value={calcCardRate}
                    onChange={(e) => setCalcCardRate(Number(e.target.value))}
                    className="w-full py-3 px-3.5 text-base font-bold bg-[#0b0f19] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value={15}>15% p.a. (Tier 1 Prompt Cardholder)</option>
                    <option value={17}>17% p.a. (Tier 2)</option>
                    <option value={18}>18% p.a. (Standard Revolving Rate)</option>
                  </select>
                  <span className="text-[11px] text-slate-500 block pt-1">
                    Used to determine estimated savings
                  </span>
                </div>

              </div>

              {/* Output Display Card */}
              <div className="bg-gradient-to-br from-amber-500/20 via-[#0e1626] to-[#0b0f19] border border-amber-500/40 rounded-3xl p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left divide-y md:divide-y-0 md:divide-x divide-slate-800">
                  
                  <div className="pt-4 md:pt-0 md:pr-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 block mb-1">
                      Monthly Payment (0%)
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      RM {Number(monthlyRepayment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Across {calcTenureMonths} monthly billing statements
                    </span>
                  </div>

                  <div className="pt-4 md:pt-0 md:px-6">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
                      Total Interest Charged
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                      RM 0.00
                    </div>
                    <span className="text-xs text-emerald-300/80 mt-1 block font-medium">
                      ✓ 100% Zero Finance Fee
                    </span>
                  </div>

                  <div className="pt-4 md:pt-0 md:pl-6">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                      Estimated Interest Saved
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                      ~RM {Number(interestSaved).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Saved vs revolving card balance
                    </span>
                  </div>

                </div>
              </div>

              {/* Back to Merchants CTA */}
              <div className="flex justify-end">
                <button
                  onClick={() => setActiveTab('directory')}
                  className="px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold text-sm hover:bg-amber-300 transition-colors flex items-center space-x-2"
                >
                  <span>Browse Participating Merchants for {calcTenureMonths}M</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ==================================================================== */}
      {/* 6. FLOATING COMPARISON DOCK (BOTTOM OF SCREEN)                       */}
      {/* ==================================================================== */}
      {comparedSlugs.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto bg-[#141d2f]/95 backdrop-blur-md border border-amber-400/60 rounded-2xl p-3 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider hidden sm:inline">
              Compare ({comparedSlugs.length}/3):
            </span>
            <div className="flex items-center space-x-1.5">
              {comparedMerchantsList.map(m => (
                <div key={m.slug} className="flex items-center space-x-1 bg-slate-800 text-white text-xs px-2.5 py-1 rounded-xl border border-slate-700">
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                    {m.name.charAt(0)}
                  </span>
                  <span className="font-semibold max-w-[90px] sm:max-w-[120px] truncate">{m.name}</span>
                  <button
                    onClick={() => toggleCompare(m.slug)}
                    className="text-slate-400 hover:text-white ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 shadow-md shadow-amber-400/20 transition-all flex items-center space-x-1.5"
            >
              <span>Compare Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setComparedSlugs([])}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
              title="Clear comparison"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. SIDE-BY-SIDE MULTI-MERCHANT COMPARISON MODAL                      */}
      {/* ==================================================================== */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#111827] border border-amber-500/50 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Side-by-Side Comparison Matrix
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Comparing {comparedMerchantsList.length} Participating Merchants
                </h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Simulator Input */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-white block">Simulate Purchase Amount:</span>
                <span className="text-slate-400">Compare monthly repayments across each merchant's max tenure</span>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="font-bold text-slate-400">RM</span>
                <input
                  type="number"
                  min="500"
                  step="200"
                  value={simulatedCompareAmount}
                  onChange={(e) => setSimulatedCompareAmount(Number(e.target.value))}
                  className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Comparison Grid Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparedMerchantsList.map(m => {
                const maxTenure = Math.max(...m.tenures);
                const monthlySim = simulatedCompareAmount > 0 ? (simulatedCompareAmount / maxTenure).toFixed(2) : '0.00';

                return (
                  <div key={m.slug} className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 relative">
                    
                    <div>
                      {/* Brand Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-base border border-slate-700">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-400 font-bold uppercase block">{m.category}</span>
                            <h4 className="font-extrabold text-sm text-white line-clamp-1">{m.name}</h4>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCompare(m.slug)}
                          className="text-slate-500 hover:text-rose-400 text-xs"
                          title="Remove from comparison"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Repayment Simulation Callout */}
                      <div className="mt-4 bg-gradient-to-tr from-amber-500/10 to-slate-900 border border-amber-500/30 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Monthly on Max {maxTenure}M</span>
                        <div className="text-xl font-black text-amber-400">
                          RM {Number(monthlySim).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /mo
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium">0% Interest &bull; No Fees</span>
                      </div>

                      {/* Attribute Rows */}
                      <div className="mt-4 space-y-2.5 text-xs divide-y divide-slate-800/80">
                        <div className="pt-2 flex justify-between items-center">
                          <span className="text-slate-400">AMEX 0%:</span>
                          {m.amex ? (
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-[10px] border border-sky-500/30">
                              ✓ Accepted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30">
                              ✕ No
                            </span>
                          )}
                        </div>

                        <div className="pt-2 flex justify-between items-center">
                          <span className="text-slate-400">Visa / Mastercard:</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                            ✓ Accepted
                          </span>
                        </div>

                        <div className="pt-2 flex justify-between items-center">
                          <span className="text-slate-400">Eligible Tenures:</span>
                          <span className="font-bold text-amber-300 text-[11px]">
                            {m.tenures.map(t => `${t}M`).join(', ')}
                          </span>
                        </div>

                        <div className="pt-2 flex justify-between items-center">
                          <span className="text-slate-400">State:</span>
                          <span className="font-bold text-white">{m.state}</span>
                        </div>

                        <div className="pt-2 flex justify-between items-center">
                          <span className="text-slate-400">Min Spend:</span>
                          <span className="font-bold text-white">RM {m.minSpend}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-800 flex gap-2">
                      <button
                        onClick={() => {
                          setInspectMerchant(m);
                          setIsCompareModalOpen(false);
                          trackViewedMerchant(m.slug);
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => {
                          setCalcDrawerMerchant(m);
                          setIsCompareModalOpen(false);
                          trackViewedMerchant(m.slug);
                        }}
                        className="flex-1 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
                      >
                        Calculator
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. CONTEXTUAL 0% CALCULATOR MODAL                                    */}
      {/* ==================================================================== */}
      {calcDrawerMerchant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Instant 0% Calculator
                </span>
                <h3 className="font-extrabold text-lg text-white">
                  {calcDrawerMerchant.name}
                </h3>
              </div>
              <button
                onClick={() => setCalcDrawerMerchant(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">
                  Purchase Amount (Min Spend: RM{calcDrawerMerchant.minSpend})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">RM</span>
                  <input
                    type="number"
                    min={calcDrawerMerchant.minSpend}
                    step="100"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-2.5 text-base font-bold bg-[#0b0f19] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">
                  Select Supported Tenure Plan
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {calcDrawerMerchant.tenures.map(t => (
                    <button
                      key={t}
                      onClick={() => setCalcTenureMonths(t)}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all border ${
                        calcTenureMonths === t
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                          : 'bg-[#0b0f19] text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {t} Months
                    </button>
                  ))}
                </div>
              </div>

              {/* Repayment Breakdown */}
              <div className="bg-[#0b0f19] border border-amber-500/30 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Your Monthly Instalment (0% Interest)
                </span>
                <div className="text-3xl font-black text-amber-400">
                  RM {Number(monthlyRepayment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-emerald-400 font-medium block pt-1">
                  ✓ Saves ~RM {Number(interestSaved).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} vs standard credit card interest
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setInspectMerchant(calcDrawerMerchant);
                  setCalcDrawerMerchant(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => setCalcDrawerMerchant(null)}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. MERCHANT DETAIL & BRANCH LOCATIONS MODAL                          */}
      {/* ==================================================================== */}
      {inspectMerchant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  #{inspectMerchant.id} &bull; {inspectMerchant.category} &bull; {inspectMerchant.state}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  {inspectMerchant.name}
                </h2>
                <span className="text-xs text-slate-400">{inspectMerchant.legalName}</span>
              </div>
              <button
                onClick={() => setInspectMerchant(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Visa / MC</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {inspectMerchant.mcVisa ? 'Supported' : 'No'}
                </span>
              </div>

              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">AMEX 0%</span>
                <span className="font-bold text-sky-400 text-sm">
                  {inspectMerchant.amex ? 'Supported' : 'No'}
                </span>
              </div>

              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tenures</span>
                <span className="font-bold text-amber-300 text-sm">
                  {inspectMerchant.tenures.join(', ')} Months
                </span>
              </div>

              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Min Spend</span>
                <span className="font-bold text-white text-sm">
                  RM {inspectMerchant.minSpend}
                </span>
              </div>
            </div>

            {/* Branches List with Directions & Phone */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Branch Outlets & Locations</span>
                </h4>
                <span className="text-xs text-slate-400">
                  {inspectMerchant.branches.length} outlet(s) listed
                </span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {inspectMerchant.branches.map((b, idx) => (
                  <div key={idx} className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-bold text-white">{b.name}</div>
                      <div className="text-slate-400">{b.mallOrArea}, {b.city}</div>
                      {b.phoneNumber && (
                        <a href={`tel:${b.phoneNumber}`} className="text-amber-400 hover:underline flex items-center gap-1 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{b.phoneNumber}</span>
                        </a>
                      )}
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + b.mallOrArea + ' ' + b.city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-amber-400 hover:text-slate-950 font-bold transition-all flex items-center justify-center space-x-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Website & Action footer */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                {inspectMerchant.websiteUrl ? (
                  <a
                    href={inspectMerchant.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-500">In-Store Merchant</span>
                )}

                <button
                  onClick={() => handleShareWhatsApp(inspectMerchant)}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp Details</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCalcDrawerMerchant(inspectMerchant);
                    setInspectMerchant(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors flex items-center space-x-1"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Calculate 0% Repayment</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 10. IN-STORE CASHIER STEP-BY-STEP GUIDE MODAL                        */}
      {/* ==================================================================== */}
      {showCashierGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-base">
                <Store className="w-5 h-5" />
                <span>How to Pay with Maybank 0% EzyPay</span>
              </div>
              <button
                onClick={() => setShowCashierGuide(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-amber-400 text-sm block">
                  Step-by-Step In-Store EDC Terminal Steps:
                </span>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-300">
                  <li>
                    <strong>Inform the cashier before inserting your card</strong> that you wish to pay via <em>Maybank 0% EzyPay</em>.
                  </li>
                  <li>
                    State your requested instalment duration (e.g. 6, 12, 24, or 36 months).
                  </li>
                  <li>
                    The cashier will select the <strong>"INSTALMENT / EZYPAY"</strong> function on the Maybank EDC terminal (not standard sale).
                  </li>
                  <li>
                    <strong>Check the printed receipt slip</strong> before entering your PIN: Verify that the tenure is correct and interest is 0.00%.
                  </li>
                </ol>
              </div>

              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-sky-400 text-sm block">
                  Online Checkout (E-Commerce):
                </span>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-300">
                  <li>At checkout gateway, choose <strong>Credit Card Instalment (0%)</strong> (do not choose standard credit card).</li>
                  <li>Select <strong>Maybank</strong> from the list of participating banks.</li>
                  <li>Pick your desired tenure (e.g. 12 or 24 months).</li>
                  <li>Authorize securely via <strong>Maybank Secure2u</strong> in the MAE app.</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowCashierGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
            >
              Got it, Close Guide
            </button>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 11. GLOBAL FOOTER                                                    */}
      {/* ==================================================================== */}
      <footer className="bg-[#0a0d16] border-t border-slate-800 text-slate-400 py-6 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Complete verified directory of 22,729 participating merchants from Maybank EzyPay Official Directory.</span>
          </div>
          <p className="text-[11px] text-slate-500 text-center sm:text-right">
            Maybank 0% EzyPay is available for eligible Maybank & Maybank Islamic Mastercard, Visa & AMEX Cardmembers.
          </p>
        </div>
      </footer>

      <SpeedInsights />
    </div>
  );
}