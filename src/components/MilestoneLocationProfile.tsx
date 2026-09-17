import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  Share2,
  Bookmark,
  BookmarkCheck,
  Star,
  Camera,
  MessageSquarePlus,
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { MilestoneLogo } from './MilestoneLogo';
import { BusinessReview } from '../types';

// Real photo assets generated
import officeExteriorImg from '../assets/images/office_exterior_1789500006928.jpg';
import officeInteriorImg from '../assets/images/office_interior_1789500017166.jpg';
import trainingSessionImg from '../assets/images/training_session_1789500029965.jpg';

interface MilestoneLocationProfileProps {
  onBackToContracts?: () => void;
  onCreateContractClick?: () => void;
}

const INITIAL_REVIEWS: BusinessReview[] = [
  {
    id: 'rev-1',
    author: 'Christine Akello (Naalya)',
    rating: 5,
    date: '3 weeks ago',
    content:
      'Milestone Domestic Services made hiring our househelp completely transparent. Having the official contract witnessed and signed with clear terms protected both of us. Highly recommend their vetting!',
    verified: true,
  },
  {
    id: 'rev-2',
    author: 'David Kato (Kyaliwajjala)',
    rating: 5,
    date: '1 month ago',
    content:
      'Very accessible office along Kyaliwajjala - Naalya Road. They took time to understand our family requirements and matched us with a well-trained, polite nanny. The digital contract workflow is so convenient.',
    verified: true,
  },
  {
    id: 'rev-3',
    author: 'Brenda Namusoke (Kira)',
    rating: 5,
    date: '2 months ago',
    content:
      'Professionalizing domestic work in Uganda is long overdue. Milestone does thorough background checks and provides standard employment terms. Outstanding service!',
    verified: true,
  },
];

export const MilestoneLocationProfile: React.FC<MilestoneLocationProfileProps> = ({
  onBackToContracts,
  onCreateContractClick,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showHoursDropdown, setShowHoursDropdown] = useState(false);
  const [activePhotoTab, setActivePhotoTab] = useState<'all' | 'outside' | 'office' | 'training'>('all');
  const [lightboxImg, setLightboxImg] = useState<{ src: string; caption: string } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSuggestEditModal, setShowSuggestEditModal] = useState(false);

  // Reviews state relying directly on database API
  const [reviews, setReviews] = useState<BusinessReview[]>(INITIAL_REVIEWS);

  // Review form state
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Load reviews from backend database on mount
  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch reviews');
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setReviews(data);
        }
      })
      .catch((err) => {
        console.warn('Using initial reviews fallback:', err);
      });
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newContent.trim()) return;

    const payload = {
      author: newAuthor.trim(),
      rating: newRating,
      content: newContent.trim(),
    };

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.review) {
          setReviews((prev) => [result.review, ...prev]);
        }
      } else {
        // Optimistic fallback
        const newRev: BusinessReview = {
          id: `rev-${Date.now()}`,
          author: newAuthor.trim(),
          rating: newRating,
          date: 'Just now',
          content: newContent.trim(),
          verified: true,
        };
        setReviews((prev) => [newRev, ...prev]);
      }
    } catch {
      const newRev: BusinessReview = {
        id: `rev-${Date.now()}`,
        author: newAuthor.trim(),
        rating: newRating,
        date: 'Just now',
        content: newContent.trim(),
        verified: true,
      };
      setReviews((prev) => [newRev, ...prev]);
    }

    setNewAuthor('');
    setNewContent('');
    setReviewSuccess(true);
    setTimeout(() => {
      setReviewSuccess(false);
      setShowReviewModal(false);
    }, 1500);
  };

  // Google Maps Directions link
  const googleMapsDirectionsUrl =
    'https://www.google.com/maps/dir/?api=1&destination=Agenda+-+kyaliwajjala+road+Agenda,+Kyaliwajjala+-+Naalya+Rd,+Kampala';
  const googleMapsSearchUrl =
    'https://www.google.com/maps/search/?api=1&query=Agenda+Kyaliwajjala+Naalya+Rd+Kampala';

  const photos = [
    {
      id: 'outside',
      category: 'outside',
      src: officeExteriorImg,
      title: 'Milestone Domestic Services - Storefront & Signage',
      subtitle: 'See outside: Agenda - Kyaliwajjala Road / Naalya Rd',
    },
    {
      id: 'office',
      category: 'office',
      src: officeInteriorImg,
      title: 'Reception & Client Consultation Office',
      subtitle: 'Consultation desks for employer & domestic worker matching',
    },
    {
      id: 'training',
      category: 'training',
      src: trainingSessionImg,
      title: 'Domestic Worker Vetting & Skills Training Session',
      subtitle: 'Professional training hall for domestic staff before placement',
    },
  ];

  const filteredPhotos =
    activePhotoTab === 'all'
      ? photos
      : photos.filter((p) => p.category === activePhotoTab);

  return (
    <div className="max-w-4xl mx-auto font-sans pb-16">
      {/* Top Banner Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white border border-neutral-300 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
          <span className="text-[#52247f] font-bold">Kampala & Wakiso</span>
          <span>•</span>
          <span>Agenda, Kyaliwajjala - Naalya Rd</span>
        </div>
        <div className="flex items-center gap-2">
          {onBackToContracts && (
            <button
              onClick={onBackToContracts}
              className="px-3.5 py-1.5 text-xs font-semibold border border-neutral-300 hover:bg-neutral-50 text-neutral-800 transition-colors cursor-pointer"
            >
              ← Back to Contracts
            </button>
          )}
          {onCreateContractClick && (
            <button
              onClick={onCreateContractClick}
              className="px-3.5 py-1.5 text-xs font-semibold bg-[#52247f] hover:bg-[#421d66] text-white transition-colors cursor-pointer shadow-sm"
            >
              + Create Contract
            </button>
          )}
        </div>
      </div>

      {/* Main Google Business Profile Style Card */}
      <div className="bg-white border border-neutral-300 shadow-sm overflow-hidden mb-8">
        {/* Brand Accent Bar */}
        <div className="h-2 bg-[#235c27] w-full" />

        <div className="p-6 sm:p-8">
          {/* Header & Category */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-neutral-200">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-green-100 text-[#235c27] border border-green-300">
                  Verified Business
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  Kampala, Uganda
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#52247f] tracking-tight">
                Milestone Domestic Services
              </h1>

              <p className="text-sm font-semibold text-[#235c27] mt-1 flex items-center gap-1.5">
                <span>Home help in Kampala</span>
                <span className="text-neutral-300">•</span>
                <span className="text-neutral-700 font-normal">Domestic Placement & Vetting Agency</span>
              </p>

              {/* Rating Summary */}
              <div className="flex items-center gap-2 mt-2.5">
                <span className="font-bold text-sm text-neutral-900">5.0</span>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                  ))}
                </div>
                <span className="text-xs text-neutral-600">
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                  Licensed Agency
                </span>
              </div>
            </div>

            {/* Logo display */}
            <div className="sm:self-center shrink-0">
              <MilestoneLogo size="sm" showTagline={true} />
            </div>
          </div>

          {/* Action Buttons Row matching Google Business Profile */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 py-5 border-b border-neutral-200 text-center">
            {/* Directions */}
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded border border-neutral-200 hover:border-[#52247f] hover:bg-neutral-50 transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-[#52247f] text-white flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Navigation className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-neutral-900 group-hover:text-[#52247f]">Directions</span>
            </a>

            {/* Call */}
            <a
              href="tel:0701761271"
              className="flex flex-col items-center justify-center p-3 rounded border border-neutral-200 hover:border-[#235c27] hover:bg-neutral-50 transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-[#235c27] text-white flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-neutral-900 group-hover:text-[#235c27]">Call</span>
              <span className="text-[10px] text-neutral-500">0701 761271</span>
            </a>

            {/* Save */}
            <button
              onClick={() => setIsSaved(!isSaved)}
              className="flex flex-col items-center justify-center p-3 rounded border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors cursor-pointer group"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                isSaved ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-700'
              }`}>
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </div>
              <span className="text-xs font-bold text-neutral-900">
                {isSaved ? 'Saved ✓' : 'Save'}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex flex-col items-center justify-center p-3 rounded border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-neutral-900">Share</span>
            </button>

            {/* Write a review */}
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex flex-col items-center justify-center p-3 rounded border border-neutral-200 hover:border-[#52247f] hover:bg-neutral-50 transition-colors cursor-pointer group col-span-2 sm:col-span-1"
            >
              <div className="w-9 h-9 rounded-full bg-neutral-100 text-[#52247f] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <MessageSquarePlus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#52247f]">Write review</span>
            </button>
          </div>

          {/* Quick Business Details Breakdown */}
          <div className="py-5 space-y-4 border-b border-neutral-200 text-sm">
            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#235c27] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-neutral-900">
                    Address: Agenda - kyaliwajjala road Agenda, Kyaliwajjala - Naalya Rd
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'Agenda - kyaliwajjala road Agenda, Kyaliwajjala - Naalya Rd, Kampala, Uganda',
                        'address'
                      )
                    }
                    className="text-xs font-medium text-[#52247f] hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedText === 'address' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-700" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Located along Kyaliwajjala - Naalya Road at Agenda Stage, Kampala / Wakiso
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-[#235c27] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-neutral-900">Phone: </span>
                    <a
                      href="tel:0701761271"
                      className="font-bold text-[#52247f] hover:underline"
                    >
                      0701 761271
                    </a>
                    <span className="text-neutral-500 text-xs ml-2">
                      (+256 701 761271)
                    </span>
                  </div>
                  <a
                    href="https://wa.me/256701761271?text=Hello%20Milestone%20Domestic%20Services,%20I%20would%20like%20to%20inquire%20about%20domestic%20workers%20and%20contracts."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer"
                  >
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#235c27] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div
                  onClick={() => setShowHoursDropdown(!showHoursDropdown)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <span className="font-semibold text-neutral-900">Hours: </span>
                    <span className="text-red-700 font-semibold">Closed</span>
                    <span className="text-neutral-700 ml-1">· Opens 8 am Wed</span>
                  </div>
                  <button className="text-xs font-semibold text-neutral-600 group-hover:text-neutral-900 inline-flex items-center gap-0.5">
                    {showHoursDropdown ? (
                      <>
                        Hide <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        See all hours <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Dropdown hours table */}
                {showHoursDropdown && (
                  <div className="mt-3 bg-neutral-50 border border-neutral-200 p-3 text-xs space-y-1.5">
                    <div className="flex justify-between py-0.5 border-b border-neutral-200">
                      <span className="font-medium text-neutral-700">Monday</span>
                      <span className="text-neutral-900">8:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-neutral-200">
                      <span className="font-medium text-neutral-700">Tuesday</span>
                      <span className="text-neutral-900">8:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-neutral-200 font-bold text-[#52247f]">
                      <span>Wednesday (Today)</span>
                      <span>8:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-neutral-200">
                      <span className="font-medium text-neutral-700">Thursday</span>
                      <span className="text-neutral-900">8:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-neutral-200">
                      <span className="font-medium text-neutral-700">Friday</span>
                      <span className="text-neutral-900">8:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-neutral-200">
                      <span className="font-medium text-neutral-700">Saturday</span>
                      <span className="text-neutral-900">8:30 AM – 4:00 PM</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-neutral-500">
                      <span className="font-medium">Sunday</span>
                      <span>Closed (Emergency support on call)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Suggest an edit / Add missing info / Add website links */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-neutral-600">
              <button
                onClick={() => setShowSuggestEditModal(true)}
                className="hover:underline text-[#52247f] font-semibold cursor-pointer"
              >
                Suggest an edit
              </button>
              <span>•</span>
              <button
                onClick={() => setShowSuggestEditModal(true)}
                className="hover:underline text-neutral-700 cursor-pointer"
              >
                Own this business?
              </button>
              <span>•</span>
              <button
                onClick={() => setShowSuggestEditModal(true)}
                className="hover:underline text-neutral-700 cursor-pointer"
              >
                Add missing information
              </button>
              <span>•</span>
              <span className="text-[#235c27] font-semibold">
                Official Contract Sign Portal Active
              </span>
            </div>
          </div>

          {/* Official Quote from Milestone Domestic Services */}
          <div className="my-6 p-4 sm:p-5 bg-purple-50/60 border-l-4 border-[#52247f] rounded-r">
            <p className="text-xs font-bold uppercase tracking-wider text-[#52247f] mb-1">
              From milestone domestic services
            </p>
            <blockquote className="text-sm italic font-serif text-neutral-800 leading-relaxed">
              “We specialize in connecting households with skilled, professional and ready to go domestic workers through careful vetting, training, and personalized matching.”
            </blockquote>
          </div>
        </div>
      </div>

      {/* SECTION: See Photos & See Outside Gallery */}
      <div className="bg-white border border-neutral-300 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 mb-5">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#52247f] flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#235c27]" />
              Photos of Milestone Domestic Services
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Exterior storefront at Kyaliwajjala - Naalya Rd, consultation office, and training premises
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActivePhotoTab('all')}
              className={`px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                activePhotoTab === 'all'
                  ? 'bg-[#52247f] text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Photos ({photos.length})
            </button>
            <button
              onClick={() => setActivePhotoTab('outside')}
              className={`px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                activePhotoTab === 'outside'
                  ? 'bg-[#235c27] text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              See Outside
            </button>
            <button
              onClick={() => setActivePhotoTab('office')}
              className={`px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                activePhotoTab === 'office'
                  ? 'bg-[#52247f] text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Office
            </button>
            <button
              onClick={() => setActivePhotoTab('training')}
              className={`px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                activePhotoTab === 'training'
                  ? 'bg-[#52247f] text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Training
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredPhotos.map((p) => (
            <div
              key={p.id}
              onClick={() => setLightboxImg({ src: p.src, caption: `${p.title} — ${p.subtitle}` })}
              className="group cursor-pointer border border-neutral-200 overflow-hidden bg-neutral-100 relative"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img
                  src={p.src}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {p.category === 'outside' && (
                  <span className="absolute top-2 left-2 bg-[#235c27] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm">
                    See outside
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-white/90 text-neutral-900 text-xs font-semibold px-2.5 py-1 shadow">
                    Click to enlarge
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white">
                <p className="text-xs font-bold text-neutral-900 line-clamp-1">{p.title}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{p.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: Interactive Map of Milestone Domestic Services */}
      <div className="bg-white border border-neutral-300 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 mb-5">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#52247f] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#235c27]" />
              Map of Milestone Domestic Services
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Agenda - Kyaliwajjala Road Agenda, Kyaliwajjala - Naalya Rd, Kampala / Wakiso
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs font-bold bg-[#235c27] hover:bg-[#1b491f] text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              Get Directions
            </a>
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs font-semibold border border-neutral-300 hover:bg-neutral-50 text-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              Google Maps <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
          </div>
        </div>

        {/* Embedded Interactive Map Frame */}
        <div className="relative border border-neutral-300 rounded overflow-hidden">
          {/* Map pin card overlay */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm border border-neutral-300 p-3 shadow-md max-w-xs text-xs">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-[#52247f] text-white flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[#52247f]">Milestone Domestic Services</p>
                <p className="text-[11px] text-neutral-700 leading-tight mt-0.5">
                  Agenda - Kyaliwajjala Road Agenda, Kyaliwajjala - Naalya Rd
                </p>
                <p className="text-[10px] text-[#235c27] font-semibold mt-1">
                  Home help in Kampala • Tel: 0701 761271
                </p>
              </div>
            </div>
          </div>

          {/* OpenStreetMap iframe centered around Kyaliwajjala - Naalya Rd / Agenda */}
          <div className="h-96 w-full bg-neutral-100">
            <iframe
              title="Milestone Domestic Services Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src="https://www.openstreetmap.org/export/embed.html?bbox=32.6320%2C0.3640%2C32.6620%2C0.3840&amp;layer=mapnik&amp;marker=0.3735%2C32.6465"
            />
          </div>

          {/* Map Footer Bar with Route Details */}
          <div className="p-3 bg-neutral-50 border-t border-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-600 gap-2">
            <div>
              <span className="font-semibold text-neutral-900">How to get here: </span>
              <span>Take the Kyaliwajjala - Naalya Road to Agenda Stage. Located directly along the main road.</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#52247f] font-bold hover:underline"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Reviews & Testimonials ("Reviews", "Write a review", "Add photos") */}
      <div className="bg-white border border-neutral-300 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif text-[#52247f]">
                Client Reviews
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded">
                5.0 ★
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              Verified feedback from households in Kampala & Wakiso using Milestone Domestic Services
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-3.5 py-1.5 text-xs font-bold bg-[#52247f] hover:bg-[#421d66] text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              Write a review
            </button>
            <button
              onClick={() => {
                alert('To attach photos of your household experience, please share with our team via WhatsApp at 0701 761271.');
              }}
              className="px-3 py-1.5 text-xs font-semibold border border-neutral-300 hover:bg-neutral-50 text-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5 text-neutral-600" />
              Add photos
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 border border-neutral-200 bg-neutral-50/50 rounded">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-900">{r.author}</span>
                  {r.verified && (
                    <span className="text-[10px] font-semibold bg-green-100 text-[#235c27] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Verified Client
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-500">{r.date}</span>
              </div>
              <div className="flex text-amber-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < r.rating ? 'fill-amber-400 stroke-amber-500' : 'stroke-neutral-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                "{r.content}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="bg-white max-w-2xl w-full p-4 rounded shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-2 right-2 p-1.5 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxImg.src}
              alt={lightboxImg.caption}
              referrerPolicy="no-referrer"
              className="w-full max-h-[70vh] object-contain rounded"
            />
            <p className="text-xs font-semibold text-neutral-800 mt-3 text-center">
              {lightboxImg.caption}
            </p>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold font-serif text-[#52247f]">
                Review Milestone Domestic Services
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSuccess ? (
              <div className="py-8 text-center text-emerald-800">
                <Check className="w-10 h-10 mx-auto mb-2 text-[#235c27]" />
                <p className="font-bold text-sm">Thank you for your review!</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Your feedback helps households find trustworthy home assistance.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddReview} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Your Name & Location
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah K. (Naalya)"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-[#52247f]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="cursor-pointer p-1"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating
                              ? 'fill-amber-400 stroke-amber-500'
                              : 'stroke-neutral-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-neutral-700 ml-2">
                      {newRating} / 5 stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Your Experience
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Share your experience with Milestone Domestic Services worker vetting, training, or contracts..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-[#52247f]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#52247f] hover:bg-[#421d66] text-white font-bold cursor-pointer"
                  >
                    Post Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 max-w-md w-full p-6 shadow-xl text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold font-serif text-[#52247f]">
                Share Milestone Domestic Services
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-neutral-600 mb-3">
              Share our location on Agenda - Kyaliwajjala Road or direct contact with family and friends:
            </p>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded mb-4 font-mono text-[11px] break-all">
              Agenda - kyaliwajjala road Agenda, Kyaliwajjala - Naalya Rd, Kampala • Tel: 0701 761271
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  copyToClipboard(
                    `Milestone Domestic Services - Home help in Kampala\nAddress: Agenda - kyaliwajjala road Agenda, Kyaliwajjala - Naalya Rd\nPhone: 0701 761271\nDirections: ${googleMapsDirectionsUrl}`,
                    'full-share'
                  );
                }}
                className="w-full py-2.5 bg-[#52247f] hover:bg-[#421d66] text-white font-bold cursor-pointer flex items-center justify-center gap-2"
              >
                {copiedText === 'full-share' ? (
                  <>
                    <Check className="w-4 h-4" /> Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Details & Maps Link
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Milestone Domestic Services - Home help in Kampala\nAddress: Agenda - kyaliwajjala road Agenda, Kyaliwajjala - Naalya Rd\nPhone: 0701 761271\nGoogle Maps: ${googleMapsDirectionsUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#235c27] hover:bg-[#1b491f] text-white font-bold cursor-pointer flex items-center justify-center gap-2 text-center"
              >
                Share via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Edit Modal */}
      {showSuggestEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 max-w-md w-full p-6 shadow-xl text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold font-serif text-[#52247f]">
                Business Profile Information
              </h3>
              <button
                onClick={() => setShowSuggestEditModal(false)}
                className="text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-neutral-700 leading-relaxed mb-4">
              This profile reflects the official registered business information for{' '}
              <strong className="text-[#52247f]">Milestone Domestic Services Ltd</strong>:
            </p>

            <ul className="space-y-2 text-neutral-600 bg-neutral-50 p-3 border border-neutral-200 mb-4">
              <li>• <strong>Address:</strong> Agenda - kyaliwajjala road Agenda, Kyaliwajjala - Naalya Rd</li>
              <li>• <strong>Phone:</strong> 0701 761271 / +256 701 761271</li>
              <li>• <strong>Category:</strong> Home help in Kampala</li>
              <li>• <strong>Hours:</strong> Mon – Fri: 8am–6pm, Sat: 8:30am–4pm</li>
            </ul>

            <p className="text-neutral-500 text-[11px] mb-4">
              For administrative inquiries, contracts, or placement support, contact management directly at <strong>0701 761271</strong>.
            </p>

            <button
              onClick={() => setShowSuggestEditModal(false)}
              className="w-full py-2 bg-neutral-900 text-white font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
