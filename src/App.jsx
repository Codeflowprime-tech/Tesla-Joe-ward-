import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Check, ChevronLeft, ChevronRight, Clipboard, LogIn, LogOut, Mail, Menu, MessageCircle, Moon, Plus, Send, Share2, ShieldCheck, Star, Sun, X } from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { captureReferralCode, createReferralInvite, loadAdminData, recordReferralShare, saveAdminReply, saveChatbotInquiry, saveSubmission, saveTestimonialVerification, supabase, trackAnalyticsEvent } from './supabase';
import { vehicleMedia } from './vehicleMedia';

const contactEmail = 'teslajoeward@gmail.com';
const teslaLogoUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/62/Tesla_Motors_Logo.svg';
const adminRequestTimeoutMs = 15000;
const propertyAreas = ['Cyprus', 'United States', 'United Kingdom'];

function withTimeout(promise) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error('Admin request timed out.')), adminRequestTimeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

const vehicles = [
  {
    slug: 'model-s',
    name: 'Model S',
    category: 'Luxury sedan',
    note: 'The original goes further.',
    range: '410 mi',
    zeroToSixty: '1.99 sec',
    topSpeed: '200 mph',
    price: 'From $84,990',
    status: 'Available',
    image: 'Model-S-Main-Hero-Desktop',
    description: 'Long-range performance and a quiet, considered cabin. Model S brings the all-electric grand tourer into its next chapter.',
  },
  {
    slug: 'model-3',
    name: 'Model 3',
    category: 'Electric sedan',
    note: 'Less, made exceptional.',
    range: '363 mi',
    zeroToSixty: '2.9 sec',
    topSpeed: '163 mph',
    price: 'From $38,990',
    status: 'Available',
    image: 'Model-3-Main-Hero-Desktop',
    description: 'A refined, all-electric daily driver with a low profile, responsive handling, and room for the whole week.',
  },
  {
    slug: 'model-x',
    name: 'Model X',
    category: 'Electric SUV',
    note: 'Room to change your plans.',
    range: '335 mi',
    zeroToSixty: '2.5 sec',
    topSpeed: '163 mph',
    price: 'From $99,990',
    status: 'Available',
    image: 'Model-X-Main-Hero-Desktop',
    description: 'Big views, generous space, and all-electric capability come together in a distinctly versatile SUV.',
  },
  {
    slug: 'model-y',
    name: 'Model Y',
    category: 'Electric SUV',
    note: 'Ready for the everyday extraordinary.',
    range: '337 mi',
    zeroToSixty: '3.5 sec',
    topSpeed: '155 mph',
    price: 'From $44,990',
    status: 'Available',
    image: 'Model-Y-Main-Hero-Desktop',
    description: 'A compact SUV with space for people, gear, and the unplanned detour. The versatile choice for electric life.',
  },
  {
    slug: 'cybertruck',
    name: 'Cybertruck',
    category: 'Electric pickup',
    note: 'Built for whatever is next.',
    range: '340 mi',
    zeroToSixty: '2.6 sec',
    topSpeed: '130 mph',
    price: 'From $79,990',
    status: 'Available',
    image: 'Cybertruck-Main-Hero-Desktop',
    description: 'A stainless-steel exoskeleton and adaptable bed bring a new point of view to work, weekends, and everything between.',
  },
  {
    slug: 'semi',
    name: 'Semi',
    category: 'Heavy-duty truck',
    note: 'A new way to move more.',
    range: '500 mi',
    zeroToSixty: '20 sec',
    topSpeed: '—',
    price: 'Fleet inquiries',
    status: 'Fleet program',
    image: 'Semi-Main-Hero-Desktop',
    description: 'Designed to move freight with fewer compromises: all-electric power, a driver-focused cabin, and long-haul ambition.',
  },
  {
    slug: 'roadster',
    name: 'Roadster',
    category: 'Electric supercar',
    note: 'The next chapter is on the horizon.',
    range: '620 mi*',
    zeroToSixty: '1.9 sec*',
    topSpeed: '250+ mph*',
    price: 'Future release',
    status: 'Coming soon',
    image: 'Roadster-Main-Hero-Desktop',
    description: 'A next-generation electric sports car designed around speed, range, and an open road. Specifications are projected.',
  },
];

const regions = [
  {
    name: 'Cyprus',
    propertyType: 'Coastal home inspiration',
    detail: 'An illustrative island-home showcase for exploring properties in Cyprus.',
    images: [
      { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85', alt: 'Contemporary home exterior', caption: 'Exterior' },
      { src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80', alt: 'Bright open-plan living room', caption: 'Living room' },
      { src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80', alt: 'Modern home interior detail', caption: 'Interior' },
    ],
  },
  {
    name: 'United States',
    propertyType: 'Modern home inspiration',
    detail: 'An illustrative modern-home showcase for exploring properties in the United States.',
    images: [
      { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', alt: 'Modern home exterior', caption: 'Exterior' },
      { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80', alt: 'Contemporary open-plan living space', caption: 'Living room' },
      { src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80', alt: 'Bright modern interior', caption: 'Interior' },
    ],
  },
  {
    name: 'United Kingdom',
    propertyType: 'Country home inspiration',
    detail: 'An illustrative country-home showcase for exploring properties in the United Kingdom.',
    images: [
      { src: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85', alt: 'Traditional-style home exterior', caption: 'Exterior' },
      { src: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80', alt: 'Warm, light-filled living room', caption: 'Living room' },
      { src: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=900&q=80', alt: 'Refined contemporary home interior', caption: 'Interior' },
    ],
  },
];

function VehicleImage({ vehicle, className = '' }) {
  const image = vehicleMedia[vehicle.slug]?.[0];

  return (
    <div className={`vehicle-image ${className}`}>
      {image && <img src={image.src} alt={image.alt} loading="lazy" />}
    </div>
  );
}

function VehicleGallery({ vehicle, compact = false }) {
  const images = vehicleMedia[vehicle.slug] || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef(null);
  const thumbnailRefs = useRef([]);
  const activeImage = images[activeIndex];

  useEffect(() => {
    if (compact) return;
    thumbnailRefs.current[activeIndex]?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeIndex, compact]);

  if (!activeImage) {
    return <div className="vehicle-gallery gallery-empty" role="status">No photos available for this vehicle.</div>;
  }

  function moveGallery(direction) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  function handleTouchStart(event) {
    touchStart.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event) {
    if (touchStart.current === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) return;
    const distance = endX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) < 40) return;
    moveGallery(distance < 0 ? 1 : -1);
  }

  function handleKeyDown(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveGallery(event.key === 'ArrowLeft' ? -1 : 1);
  }

  return (
    <div className={`vehicle-gallery${compact ? ' compact-vehicle-gallery' : ''}`} role="group" aria-label={`${vehicle.name} photo gallery`} tabIndex={0} onKeyDown={handleKeyDown}>
      <img className="gallery-image" src={activeImage.src} alt={activeImage.alt} loading={compact ? 'lazy' : undefined} fetchPriority={compact ? 'auto' : 'high'} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />
      <div className="gallery-controls">
        <button type="button" aria-label="Previous photo" onClick={() => moveGallery(-1)} disabled={images.length < 2}><ChevronLeft size={18} /></button>
        <span aria-live="polite">{String(activeIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
        <button type="button" aria-label="Next photo" onClick={() => moveGallery(1)} disabled={images.length < 2}><ChevronRight size={18} /></button>
      </div>
      <a className="gallery-credit" href={activeImage.source} target="_blank" rel="noreferrer">{activeImage.credit} · Source &amp; license</a>
      <div className="gallery-thumbnails" aria-label="Choose a photo">
        {images.map((image, index) => (
          <button type="button" key={image.src} ref={(element) => { thumbnailRefs.current[index] = element; }} className={index === activeIndex ? 'is-active' : ''} aria-label={`Show photo ${index + 1}`} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)}>
            <img src={image.src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Header({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const vehicle = vehicles.find((item) => location.startsWith(`/models/${item.slug}`));
  const isModel = Boolean(vehicle);

  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="Tesla lineup home"><img src={teslaLogoUrl} alt="Tesla" /></Link>
      <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
        <a href={isModel ? '/#lineup' : '#lineup'} onClick={() => setMenuOpen(false)}>Vehicles</a>
        <Link href="/compare" onClick={() => setMenuOpen(false)}>Compare</Link>
        <a href={isModel ? '/#story' : '#story'} onClick={() => setMenuOpen(false)}>Our point of view</a>
        <a href={isModel ? '/#giveaway' : '#giveaway'} onClick={() => setMenuOpen(false)}>Giveaway</a>
        <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
      </nav>
      <a className="header-cta" href={isModel ? '#giveaway' : '/#giveaway'}>Enter giveaway <ArrowUpRight size={15} /></a>
      <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      <button className="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
    </header>
  );
}

function ArrowLink({ href, children }) {
  return <Link href={href} className="arrow-link">{children}<ArrowRight size={16} /></Link>;
}

function PropertyAreaOptions() {
  return (
    <>
      <option value="">Choose an area</option>
      {propertyAreas.map((area) => <option value={area} key={area}>{area}</option>)}
    </>
  );
}

function getRequestedPropertyArea() {
  const requestedArea = new URLSearchParams(window.location.search).get('area');
  return propertyAreas.includes(requestedArea) ? requestedArea : '';
}

function ModelCard({ vehicle, index }) {
  return (
    <Link href={`/models/${vehicle.slug}`} className="model-card" style={{ '--card-index': index }}>
      <VehicleImage vehicle={vehicle} className="card-image" />
      <div className="card-overlay">
        <div className="card-topline"><span>{vehicle.category}</span><span>{vehicle.status}</span></div>
        <div className="card-bottomline"><div><h3>{vehicle.name}</h3><p>{vehicle.note}</p></div><span className="circle-arrow"><ArrowUpRight size={18} /></span></div>
      </div>
    </Link>
  );
}

function RegionCard({ region }) {
  return (
    <article className="region-card">
      <div className="region-card-gallery" aria-label={`${region.name} property inspiration photos`}>
        {region.images.map((image, index) => (
          <figure className={`region-card-photo region-card-photo-${index + 1}`} key={image.src}>
            <img src={image.src} alt={image.alt} loading="lazy" />
            <figcaption>{image.caption}</figcaption>
          </figure>
        ))}
      </div>
      <div className="region-card-copy">
        <p className="eyebrow red">Property showcase</p>
        <p className="region-card-type">{region.propertyType}</p>
        <h3>{region.name}</h3>
        <p>{region.detail}</p>
        <nav className="region-card-links" aria-label={`${region.name} inquiry links`}>
          <a href={`/?area=${encodeURIComponent(region.name)}#giveaway`}>Giveaway inquiry <ArrowUpRight size={14} /></a>
          <a href={`/?area=${encodeURIComponent(region.name)}#contact`}>Contact us <ArrowUpRight size={14} /></a>
        </nav>
      </div>
    </article>
  );
}

function ProfileSection() {
  return (
    <section className="profile-section section-wrap" id="profile" aria-labelledby="profile-title">
      <div className="profile-feature">
        <figure className="profile-portrait" aria-label="Portrait of Joe Ward">
          <img
            src="https://i.imgur.com/we5YPvt.png"
            alt="Portrait of Joe Ward"
            fetchPriority="high"
          />
          <figcaption>Portrait of Joe Ward · Independent EV analyst &amp; consultant</figcaption>
        </figure>
        <div className="profile-copy">
          <p className="eyebrow red">Executive profile · Electric mobility</p>
          <h2 id="profile-title">Meet Joe<br /><em>Ward.</em></h2>
          <p className="profile-role">Independent electric vehicle analyst &amp; consultant</p>
          <p className="profile-bio">
            With more than a decade of experience, Joe Ward specializes in electric-vehicle market trends,
            vehicle performance metrics, and sustainable transportation strategy. His work brings together
            clear, practical analysis to help people understand a rapidly evolving EV landscape and make
            informed decisions about the road ahead.
          </p>
          <div className="profile-expertise" aria-label="Areas of expertise">
            <span>EV market trends</span>
            <span>Vehicle performance</span>
            <span>Sustainable transportation</span>
          </div>
          <p className="profile-disclaimer">Independent analyst and consultant; not affiliated with or endorsed by Tesla, Inc.</p>
        </div>
      </div>
    </section>
  );
}

function ReferralShare() {
  const [status, setStatus] = useState('idle');

  async function shareInvite() {
    setStatus('sharing');
    try {
      const invite = await createReferralInvite();
      if (navigator.share) {
        await navigator.share({
          title: 'Explore the Tesla lineup',
          text: 'Compare the Tesla models and find the one that fits you.',
          url: invite.url,
        });
        await recordReferralShare(invite.code);
        setStatus('shared');
        return;
      }

      await navigator.clipboard.writeText(invite.url);
      await recordReferralShare(invite.code);
      setStatus('copied');
    } catch (error) {
      if (error?.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setStatus('error');
    }
  }

  return (
    <section className="referral-section section-wrap" aria-labelledby="referral-title">
      <div className="referral-copy">
        <p className="eyebrow red">Good drives travel</p>
        <h2 id="referral-title">Pass the<br /><em>spark along.</em></h2>
        <p>Share a personal lineup link with someone who is exploring electric. No messages are sent for you; choose where and with whom to share.</p>
      </div>
      <div className="referral-action">
        <button className="share-button" type="button" onClick={shareInvite} disabled={status === 'sharing'}>
          {status === 'sharing' ? <Share2 size={17} /> : <Clipboard size={17} />}
          {status === 'sharing' ? 'Preparing link…' : 'Share your invite link'}
          <ArrowUpRight size={17} />
        </button>
        <p className="referral-feedback" role="status">
          {status === 'copied' ? 'Invite link copied. Share it anywhere.' : status === 'shared' ? 'Thanks for sharing the lineup.' : status === 'error' ? 'Could not create or share a link. Check the connection and try again.' : 'A private, anonymous referral code is attached to your link.'}
        </p>
      </div>
    </section>
  );
}

function TestimonialCard({ item }) {
  const initials = item.display_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <blockquote className="testimonial-card">
      <div className="review-rating" aria-label={`${item.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < item.rating ? 'currentColor' : 'none'} />)}
      </div>
      <p>“{item.review_text}”</p>
      <footer>
        {item.avatar_url ? <img className="review-avatar" src={item.avatar_url} alt="" loading="lazy" /> : <span className="review-avatar initials" aria-hidden="true">{initials}</span>}
        <span className="review-person"><strong>{item.display_name}</strong><span>{[item.vehicle_model, item.region].filter(Boolean).join(' · ')}</span></span>
        <span className="verified-badge"><BadgeCheck size={14} /> Verified {item.review_type === 'buyer' ? 'buyer' : 'recipient'}</span>
      </footer>
    </blockquote>
  );
}

function VerifiedTestimonials() {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      if (!supabase) {
        setStatus('unconfigured');
        return;
      }

      const { data, error } = await supabase.from('testimonials')
        .select('id, display_name, region, vehicle_model, review_text, rating, review_type, avatar_url')
        .eq('is_verified', true)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!active) return;
      if (error) {
        console.error('Unable to load verified testimonials from Supabase.', error);
        setStatus('error');
        return;
      }
      setReviews(data || []);
      setStatus('ready');
    }

    loadReviews();
    return () => { active = false; };
  }, []);

  if (status !== 'ready' || reviews.length === 0) {
    const message = status === 'loading'
      ? 'Loading verified reviews…'
      : status === 'unconfigured'
        ? 'Connect Supabase to publish verified buyer and giveaway reviews.'
        : status === 'error'
          ? 'Verified reviews cannot be loaded right now. Please try again later.'
          : 'No verified reviews have been published yet.';
    return <p className="review-empty" role="status">{message}</p>;
  }

  return reviews.map((item) => <TestimonialCard item={item} key={item.id} />);
}

function Lineup() {
  return (
    <main>
      <section className="home-hero" aria-labelledby="hero-title">
        <VehicleImage vehicle={vehicles[3]} className="hero-image" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">Executive profile · Electric mobility</p>
          <h1 id="hero-title">Joe Ward<br /><em>in motion.</em></h1>
          <p className="hero-intro">An independent perspective on Tesla vehicles, owner experience, and the next generation of electric mobility.</p>
          <a className="light-button" href="#profile">View profile <ArrowDown size={16} /></a>
        </div>
        <div className="hero-caption"><span>01 / 07</span><span>Model Y · All electric, all yours</span></div>
      </section>

      <ProfileSection />

      <section className="lineup-section section-wrap" id="lineup">
        <div className="section-heading">
          <div><p className="eyebrow red">The lineup</p><h2>Find your<br /><em>next move.</em></h2></div>
          <p className="section-aside">From daily drives to long-haul miles, meet the full Tesla vehicle lineup.</p>
        </div>
        <div className="model-grid">
          {vehicles.map((vehicle, index) => <ModelCard vehicle={vehicle} index={index} key={vehicle.slug} />)}
        </div>
      </section>

      <section className="manifesto" id="story">
        <p className="eyebrow">A better kind of momentum</p>
        <h2>Make room<br />for <em>what’s next.</em></h2>
        <p>Thoughtful design. Electric performance. A little more possibility in every mile.</p>
        <ArrowLink href="/models/model-3">Meet Model 3</ArrowLink>
      </section>

      <section className="regional-section section-wrap" aria-labelledby="regional-title">
        <div className="section-heading narrow">
          <div>
            <p className="eyebrow red">Property locations</p>
            <h2 id="regional-title">Explore<br /><em>your area.</em></h2>
          </div>
        </div>
        <p className="property-disclaimer">Illustrative property imagery, not live listings.</p>
        <div className="region-grid">
          {regions.map((region) => <RegionCard region={region} key={region.name} />)}
        </div>
      </section>

      <ReferralShare />

      <section className="testimonial-section section-wrap" aria-labelledby="testimonial-title">
        <div className="section-heading narrow">
          <div>
            <p className="eyebrow red">Drivers say</p>
            <h2 id="testimonial-title">The switch<br /><em>feels easy.</em></h2>
          </div>
        </div>
        <div className="testimonial-grid">
          <VerifiedTestimonials />
        </div>
      </section>

      <section className="home-giveaway section-wrap" id="giveaway-vehicles" aria-labelledby="giveaway-title">
        <div className="giveaway-heading">
          <div><p className="eyebrow red">A little extra charge</p><h2 id="giveaway-title">Your next drive<br />could be <em>on us.</em></h2></div>
          <p className="giveaway-copy">Browse every vehicle entry and its available photos. Choose a model to learn more and send a giveaway inquiry.</p>
        </div>
        <div className="giveaway-vehicle-grid">
          {vehicles.map((vehicle) => (
            <article className="giveaway-vehicle-card" key={vehicle.slug}>
              <div className="giveaway-gallery-frame">
                <VehicleGallery vehicle={vehicle} compact />
              </div>
              <div className="giveaway-vehicle-info">
                <div>
                  <p className="eyebrow red">{vehicle.category}</p>
                  <h3>{vehicle.name}</h3>
                  <p className="giveaway-vehicle-note">{vehicle.note}</p>
                </div>
                <a className="giveaway-entry-link" href={`/models/${vehicle.slug}#giveaway`} aria-label={`Enter the ${vehicle.name} giveaway`}>
                  Enter with {vehicle.name} <ArrowUpRight size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <InquiryForm vehicle={vehicles[0]} />
    </main>
  );
}

function InquiryForm({ vehicle }) {
  const [selectedModel, setSelectedModel] = useState(vehicle.name);
  const [status, setStatus] = useState('idle');
  const selectedVehicle = vehicles.find((item) => item.name === selectedModel) || vehicle;

  async function submitGiveaway(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus('submitting');

    try {
      await saveSubmission({
        type: 'giveaway',
        name: formData.get('giveaway-name'),
        email: formData.get('giveaway-email'),
        vehicleModel: selectedModel,
        propertyArea: formData.get('giveaway-area'),
        message: 'Giveaway inquiry',
        consented: formData.get('giveaway-consent') === 'on',
      });
      setStatus('success');
    } catch (error) {
      console.error('Unable to save giveaway submission to Supabase.', error);
      setStatus('error');
    }
  }

  return (
    <section className="inquiry-section" id="giveaway">
      <div className="inquiry-intro">
        <p className="eyebrow">The giveaway</p>
        <h2>A new kind<br />of <em>good luck.</em></h2>
        <p>Curious about the giveaway? Tell us a little about yourself, where you’re based, and the vehicle you have in mind.</p>
        <span className="fine-print">*Projected figures for Roadster. Specifications and availability vary by model. This site is an independent vehicle guide and is not affiliated with Tesla, Inc.</span>
      </div>
      <div className="form-panel">
        {status === 'success' ? (
          <div className="contact-form-result" role="status">
            <Check size={18} />
            <p>Your giveaway entry has been received. We’ll be in touch.</p>
            <button className="text-button" type="button" onClick={() => setStatus('idle')}>Send another entry <ArrowRight size={15} /></button>
          </div>
        ) : (
          <form onSubmit={submitGiveaway}>
            <p className="form-kicker">Giveaway entry</p>
            {status === 'error' && <p className="form-error" role="alert">We couldn’t save your entry. Please try again or email us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>}
            <label htmlFor="giveaway-name">Full name</label>
            <input id="giveaway-name" name="giveaway-name" autoComplete="name" maxLength="120" required />
            <label htmlFor="giveaway-email">Email address</label>
            <input id="giveaway-email" name="giveaway-email" type="email" autoComplete="email" maxLength="320" required />
            <label htmlFor="giveaway-area">Property area</label>
            <select id="giveaway-area" name="giveaway-area" defaultValue={getRequestedPropertyArea()} required><PropertyAreaOptions /></select>
            <label htmlFor="giveaway-model">Model of interest</label>
            <select id="giveaway-model" value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)}>
              {vehicles.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}
            </select>
            <label className="consent"><input type="checkbox" name="giveaway-consent" required /><span>I agree to be contacted about this giveaway entry.</span></label>
            <button type="submit" className="submit-button" disabled={status === 'submitting'}>{status === 'submitting' ? 'Sending…' : 'Submit giveaway entry'} <ArrowUpRight size={17} /></button>
            <p className="privacy-note">Your details are securely saved for this inquiry.</p>
          </form>
        )}
      </div>
    </section>
  );
}

function ModelPage({ vehicle }) {
  const index = vehicles.findIndex((item) => item.slug === vehicle.slug);
  const previous = vehicles[(index + vehicles.length - 1) % vehicles.length];
  const next = vehicles[(index + 1) % vehicles.length];

  return (
    <main className="model-page">
      <section className="model-hero">
        <VehicleGallery key={vehicle.slug} vehicle={vehicle} />
        <div className="model-hero-shade" />
        <div className="model-hero-copy">
          <Link href="/" className="back-link"><ArrowLeft size={15} /> All vehicles</Link>
          <p className="eyebrow">{vehicle.category} <span className="status-dot" /> {vehicle.status}</p>
          <h1>{vehicle.name}</h1>
          <p className="model-tagline">{vehicle.note}</p>
          <a className="light-button" href="#giveaway">Enter the giveaway <ArrowUpRight size={16} /></a>
        </div>
        <div className="hero-caption"><span>{String(index + 1).padStart(2, '0')} / 07</span><span>{vehicle.price}</span></div>
      </section>

      <section className="model-details section-wrap">
        <div className="model-description"><p className="eyebrow red">Meet {vehicle.name}</p><h2>Made for<br /><em>your next.</em></h2><p>{vehicle.description}</p></div>
        <div className="spec-grid">
          <div><span>Est. range</span><strong>{vehicle.range}</strong></div>
          <div><span>0–60 mph</span><strong>{vehicle.zeroToSixty}</strong></div>
          <div><span>Top speed</span><strong>{vehicle.topSpeed}</strong></div>
          <div><span>Starting at</span><strong>{vehicle.price}</strong></div>
        </div>
      </section>

      <InquiryForm vehicle={vehicle} />

      <nav className="model-pagination" aria-label="Browse vehicle models">
        <Link href={`/models/${previous.slug}`}><span><ArrowLeft size={16} /> Previous</span><strong>{previous.name}</strong></Link>
        <Link href="/" className="all-models-link">All vehicles <span className="dot-grid" aria-hidden="true">••<br />••</span></Link>
        <Link href={`/models/${next.slug}`} className="next-model"><span>Next <ArrowRight size={16} /></span><strong>{next.name}</strong></Link>
      </nav>
    </main>
  );
}

function ComparePage() {
  const [selectedSlugs, setSelectedSlugs] = useState(['model-3', 'model-y']);
  const selectedVehicles = selectedSlugs.map((slug) => vehicles.find((vehicle) => vehicle.slug === slug));
  const rows = [
    ['Category', (vehicle) => vehicle.category],
    ['Estimated range', (vehicle) => vehicle.range],
    ['0–60 mph', (vehicle) => vehicle.zeroToSixty],
    ['Top speed', (vehicle) => vehicle.topSpeed],
    ['Starting price', (vehicle) => vehicle.price],
    ['Availability', (vehicle) => vehicle.status],
  ];

  function updateModel(index, slug) {
    setSelectedSlugs((current) => current.map((item, currentIndex) => currentIndex === index ? slug : item));
  }

  return (
    <main className="compare-page section-wrap">
      <div className="compare-heading">
        <div><p className="eyebrow red">Side by side</p><h1>Find your<br /><em>best fit.</em></h1></div>
        <p>Compare the details that matter, then explore each vehicle in more depth.</p>
      </div>
      <div className="compare-controls" aria-label="Choose vehicles to compare">
        {selectedVehicles.map((vehicle, index) => (
          <label className="compare-select" key={index}>
            <span>Vehicle {String(index + 1).padStart(2, '0')}</span>
            <select value={selectedSlugs[index]} onChange={(event) => updateModel(index, event.target.value)} aria-label={`Choose vehicle ${index + 1}`}>
              {vehicles.map((option) => <option key={option.slug} value={option.slug} disabled={selectedSlugs.includes(option.slug) && selectedSlugs[index] !== option.slug}>{option.name}</option>)}
            </select>
          </label>
        ))}
        {selectedSlugs.length < 3 && <button className="add-vehicle" type="button" onClick={() => setSelectedSlugs((current) => [...current, vehicles.find((vehicle) => !current.includes(vehicle.slug)).slug])}><Plus size={16} /> Add vehicle</button>}
        {selectedSlugs.length > 2 && <button className="remove-vehicle" type="button" onClick={() => setSelectedSlugs((current) => current.slice(0, -1))}>Remove third</button>}
      </div>
      <div className={`comparison-table columns-${selectedVehicles.length}`} role="table" aria-label="Vehicle specifications comparison">
        <div className="comparison-header" role="row">
          <span role="columnheader">Specifications</span>
          {selectedVehicles.map((vehicle) => <Link role="columnheader" href={`/models/${vehicle.slug}`} key={vehicle.slug}>{vehicle.name}<ArrowUpRight size={15} /></Link>)}
        </div>
        {rows.map(([label, value]) => (
          <div className="comparison-row" role="row" key={label}>
            <span className="comparison-label" role="rowheader">{label}</span>
            {selectedVehicles.map((vehicle) => <span className="comparison-value" role="cell" key={vehicle.slug}>{value(vehicle)}</span>)}
          </div>
        ))}
      </div>
      <p className="compare-disclaimer">Specifications are estimates and may vary by configuration, market, and model year. Roadster figures are projected.</p>
    </main>
  );
}

function NotFound() {
  return <main className="not-found"><p className="eyebrow red">No road here</p><h1>Model not found.</h1><ArrowLink href="/">Back to the lineup</ArrowLink></main>;
}

function ContactForm() {
  const [status, setStatus] = useState('idle');

  async function submitContact(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus('submitting');

    try {
      await saveSubmission({
        type: 'contact',
        name: formData.get('contact-name'),
        email: formData.get('contact-email'),
        propertyArea: formData.get('contact-area'),
        message: formData.get('contact-message'),
        consented: formData.get('contact-consent') === 'on',
      });
      setStatus('success');
    } catch (error) {
      console.error('Unable to save contact submission to Supabase.', error);
      setStatus('error');
    }
  }

  if (status === 'success') {
    return <div className="contact-form-result" role="status"><Check size={18} /><p>Your message has been received. We’ll be in touch.</p><button className="text-button" onClick={() => setStatus('idle')}>Send another message <ArrowRight size={15} /></button></div>;
  }

  return (
    <form className="contact-form" onSubmit={submitContact}>
      {status === 'error' && <p className="form-error" role="alert">We couldn’t send your message. Try again or email us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>}
      <label htmlFor="contact-name">Full name</label>
      <input id="contact-name" name="contact-name" autoComplete="name" maxLength="120" required />
      <label htmlFor="contact-email">Email address</label>
      <input id="contact-email" name="contact-email" type="email" autoComplete="email" maxLength="320" required />
      <label htmlFor="contact-area">Property area</label>
      <select id="contact-area" name="contact-area" defaultValue={getRequestedPropertyArea()} required><PropertyAreaOptions /></select>
      <label htmlFor="contact-message">Message</label>
      <textarea id="contact-message" name="contact-message" rows="4" maxLength="5000" required />
      <label className="consent"><input type="checkbox" name="contact-consent" required /><span>I agree to be contacted about this message.</span></label>
      <button type="submit" className="submit-button" disabled={status === 'submitting'}>{status === 'submitting' ? 'Sending…' : 'Send message'} <ArrowUpRight size={17} /></button>
    </form>
  );
}

function AdminInquiryCard({ inquiry, onSaved }) {
  const [reply, setReply] = useState(inquiry.reply_text || '');
  const [kind, setKind] = useState(inquiry.reply_kind || 'manual');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function draftWithAi() {
    setStatus('drafting');
    setError('');
    const { data, error: invokeError } = await supabase.functions.invoke('draft-inquiry-reply', {
      body: { message: inquiry.message, vehicle_model: inquiry.vehicle_model || '' },
    });
    if (invokeError || !data?.draft) {
      setError('AI drafting is unavailable. Deploy the protected Supabase function and configure its provider key.');
      setStatus('idle');
      return;
    }
    setReply(data.draft);
    setKind('ai');
    setStatus('idle');
  }

  async function approveReply(event) {
    event.preventDefault();
    if (!window.confirm('Approve this response and prepare it for delivery? AI-generated text will not be sent without this confirmation.')) return;

    setStatus('saving');
    setError('');
    try {
      await saveAdminReply({ table: inquiry.adminTable, id: inquiry.id, reply, kind });
      setStatus('saved');
      onSaved();
    } catch {
      setError('Could not save this response. Check your admin access and retry.');
      setStatus('idle');
    }
  }

  const subject = encodeURIComponent(`Re: ${inquiry.type === 'giveaway' ? 'Giveaway inquiry' : 'Your inquiry'}`);
  const body = encodeURIComponent(reply);

  return (
    <article className="admin-inquiry">
      <div className="admin-inquiry-meta"><span>{inquiry.type}</span><time>{new Date(inquiry.created_at).toLocaleString()}</time></div>
      <h3>{inquiry.name || 'Chatbot inquiry'} · {inquiry.email}</h3>
      {inquiry.vehicle_model && <p className="admin-model">Interested in {inquiry.vehicle_model}</p>}
      {inquiry.property_area && <p className="admin-model">Property area: {inquiry.property_area}</p>}
      <p className="admin-message">{inquiry.message}</p>
      <form onSubmit={approveReply}>
        <label htmlFor={`reply-${inquiry.id}`}>Response {kind === 'ai' && <span className="draft-label">AI draft · review before approval</span>}</label>
        <textarea id={`reply-${inquiry.id}`} rows="4" maxLength="5000" value={reply} onChange={(event) => setReply(event.target.value)} required />
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="admin-actions">
          <button type="button" className="admin-secondary" onClick={draftWithAi} disabled={status === 'drafting' || status === 'saving'}>{status === 'drafting' ? 'Drafting…' : 'Draft with AI'}</button>
          <button type="submit" className="submit-button" disabled={!reply.trim() || status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Approve response'} <ShieldCheck size={16} /></button>
        </div>
        {inquiry.reply_status === 'approved' && <a className="approved-mail-link" href={`mailto:${inquiry.email}?subject=${subject}&body=${body}`}>Approved · Open email draft for delivery <ArrowUpRight size={14} /></a>}
      </form>
    </article>
  );
}

function AdminPanel() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ submissions: [], chatbot: [], testimonials: [] });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  async function refreshData() {
    const nextData = await loadAdminData();
    setData(nextData);
  }

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      if (!supabase) {
        setStatus('unconfigured');
        return;
      }
      try {
        const { data: sessionData, error: sessionError } = await withTimeout(supabase.auth.getSession());
        if (sessionError) throw sessionError;
        const currentUser = sessionData.session?.user;
        if (!active) return;
        if (currentUser?.app_metadata?.role === 'admin') {
          setUser(currentUser);
          try {
            const nextData = await withTimeout(loadAdminData());
            if (active) {
              setData(nextData);
              setStatus('ready');
            }
          } catch {
            if (active) {
              setError('Could not load admin data. Confirm the database migration and admin role are applied.');
              setStatus('error');
            }
          }
        } else {
          setStatus('ready');
        }
      } catch {
        if (active) {
          setError('Could not restore your admin session. Try signing in again.');
          setStatus('error');
        }
      }
    }
    restoreSession();
    return () => { active = false; };
  }, []);

  async function signIn(event) {
    event.preventDefault();
    if (!supabase) return;
    setStatus('loading');
    setError('');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setPassword('');
    if (signInError) {
      setError('Sign-in failed. Check your Supabase Auth account and try again.');
      setStatus('ready');
      return;
    }
    if (signInData.user?.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('This account does not have the required administrator role.');
      setStatus('ready');
      return;
    }
    setUser(signInData.user);
    try {
      await refreshData();
      setStatus('ready');
    } catch {
      setError('Admin login succeeded, but data access failed. Apply the database migration and verify RLS policies.');
      setStatus('error');
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setUser(null);
    setStatus('ready');
  }

  async function toggleTestimonial(item) {
    const nextVerified = !item.is_verified;
    await saveTestimonialVerification({
      id: item.id,
      isVerified: nextVerified,
      isPublished: nextVerified && item.is_published,
    });
    await refreshData();
  }

  async function togglePublished(item) {
    await saveTestimonialVerification({ id: item.id, isVerified: item.is_verified, isPublished: !item.is_published });
    await refreshData();
  }

  const inquiries = [
    ...data.submissions.map((item) => ({ ...item, adminTable: 'site_submissions', type: item.submission_type })),
    ...data.chatbot.map((item) => ({ ...item, adminTable: 'chatbot_inquiries', type: 'chatbot', name: 'Chatbot inquiry' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <main className="admin-page section-wrap">
      <div className="admin-page-heading"><div><p className="eyebrow red">Restricted workspace</p><h1>Admin<br /><em>console.</em></h1></div><p>Review incoming messages, approve responses, and moderate verified owner feedback.</p></div>
      {!user ? (
        <form className="admin-login" onSubmit={signIn}>
          <p className="form-kicker">Supabase administrator sign-in</p>
          {status === 'unconfigured' && <p className="form-error" role="alert">Add the Supabase project URL and public anon key to enable sign-in.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <label htmlFor="admin-email">Email</label><input id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="admin-password">Password</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button className="submit-button" disabled={status === 'loading' || status === 'unconfigured'}>Sign in securely <LogIn size={16} /></button>
          <p className="privacy-note">Admin accounts and roles are managed in Supabase Auth. Credentials are not stored in this app.</p>
        </form>
      ) : (
        <>
          <div className="admin-toolbar"><span>Signed in as {user.email}</span><button type="button" className="admin-secondary" onClick={signOut}>Sign out <LogOut size={15} /></button></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <section className="admin-section"><div className="admin-section-title"><h2>Inquiry inbox</h2><span>{inquiries.length} total</span></div>
            {inquiries.length ? <div className="admin-inquiry-list">{inquiries.map((item) => <AdminInquiryCard key={`${item.adminTable}-${item.id}`} inquiry={item} onSaved={refreshData} />)}</div> : <p className="admin-empty">No inquiries yet.</p>}
          </section>
          <section className="admin-section"><div className="admin-section-title"><h2>Testimonials</h2><span>Verify evidence before publishing</span></div>
            {data.testimonials.length ? <div className="admin-review-list">{data.testimonials.map((item) => <article className="admin-review" key={item.id}><div><strong>{item.display_name} · {item.review_type}</strong><p>{item.review_text}</p><span>{item.rating}/5 · {item.vehicle_model} · {item.region}</span></div><div className="admin-review-actions"><button type="button" className="admin-secondary" onClick={() => toggleTestimonial(item)}>{item.is_verified ? 'Revoke verification' : 'Mark verified'}</button><button type="button" className="admin-secondary" disabled={!item.is_verified} onClick={() => togglePublished(item)}>{item.is_published ? 'Unpublish' : 'Publish'}</button></div></article>)}</div> : <p className="admin-empty">No review records yet.</p>}
          </section>
        </>
      )}
    </main>
  );
}

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle');

  async function submitChatbotInquiry(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus('submitting');
    try {
      await saveChatbotInquiry({ email: formData.get('chat-email'), message: formData.get('chat-message') });
      setStatus('success');
      event.currentTarget.reset();
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="chatbot-widget">
      {open && <section className="chatbot-panel" aria-labelledby="chatbot-title"><div className="chatbot-heading"><div><p className="eyebrow red">Private inbox</p><h2 id="chatbot-title">Ask a question</h2></div><button type="button" aria-label="Close inquiry panel" onClick={() => setOpen(false)}><X size={18} /></button></div>
        {status === 'success' ? <p className="chatbot-result" role="status">Your question is in the secure review queue. We’ll follow up at the email you provided.</p> : <form onSubmit={submitChatbotInquiry}><label htmlFor="chat-email">Email</label><input id="chat-email" name="chat-email" type="email" autoComplete="email" required /><label htmlFor="chat-message">Question</label><textarea id="chat-message" name="chat-message" rows="4" maxLength="5000" required />{status === 'error' && <p className="form-error" role="alert">Could not submit. Please try again later.</p>}<button className="submit-button" disabled={status === 'submitting'}>{status === 'submitting' ? 'Sending…' : 'Send question'} <Send size={15} /></button></form>}
      </section>}
      <button className="chatbot-trigger" type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? 'Close inquiry form' : 'Open inquiry form'}><MessageCircle size={19} /><span>Questions</span></button>
    </div>
  );
}

function Footer() {
  return (
    <>
      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <div><p className="eyebrow red">Contact</p><h2 id="contact-title">Let’s talk<br /><em>electric.</em></h2></div>
        <div className="contact-form-wrap">
          <ContactForm />
          <a className="contact-email" href={`mailto:${contactEmail}`}><Mail size={18} />{contactEmail}<ArrowUpRight size={16} /></a>
        </div>
      </section>
      <footer className="site-footer">
        <Link href="/" className="footer-wordmark" aria-label="Tesla lineup home"><img src={teslaLogoUrl} alt="Tesla" /></Link>
        <div className="footer-legal">
          <span>© 2026 Tesla-Joe-Ward. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => window.localStorage.getItem('site-theme') || 'dark');
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('site-theme', theme);
  }, [theme]);

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (targetId) document.getElementById(targetId)?.scrollIntoView();
  }, [location]);

  useEffect(() => {
    const referralCode = captureReferralCode();
    trackAnalyticsEvent('page_view', { referralCode }).catch(() => {});
  }, [location]);

  return (
    <>
      <Header theme={theme} onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} />
      <div className="page-transition" key={location}>
        <Switch>
          <Route path="/" component={Lineup} />
          <Route path="/compare" component={ComparePage} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/models/:slug">{(params) => {
            const vehicle = vehicles.find((item) => item.slug === params.slug);
            return vehicle ? <ModelPage vehicle={vehicle} /> : <NotFound />;
          }}</Route>
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
      <ChatbotWidget />
    </>
  );
}