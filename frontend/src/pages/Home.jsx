import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import LotCard from '../components/auction/LotCard'
import AuctionCard from '../components/auction/AuctionCard'
import CategoryNav from '../components/auction/CategoryNav'
import Loader from '../components/common/Loader'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/effect-fade'

// SVG Icons
const Icons = {
  // Expert Icons
  AsianArt: () => (
    <svg className="w-16 h-16 text-[#0033ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  ClassicalArt: () => (
    <svg className="w-16 h-16 text-[#0033ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Minerals: () => (
    <svg className="w-16 h-16 text-[#0033ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  Design: () => (
    <svg className="w-16 h-16 text-[#0033ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),

  // Brand Icons
  Rolex: () => (
    <svg className="w-8 h-8 text-gray-600 group-hover:text-[#0033ff] transition" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
    </svg>
  ),
  Cartier: () => (
    <svg className="w-8 h-8 text-gray-600 group-hover:text-[#0033ff] transition" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 13c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />
    </svg>
  ),
  Hermes: () => (
    <svg className="w-8 h-8 text-gray-600 group-hover:text-[#0033ff] transition" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 13c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />
    </svg>
  ),
  LouisVuitton: () => (
    <svg className="w-8 h-8 text-gray-600 group-hover:text-[#0033ff] transition" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 13c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />
    </svg>
  ),
  Porsche: () => (
    <svg className="w-8 h-8 text-gray-600 group-hover:text-[#0033ff] transition" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 13c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />
    </svg>
  ),
  Lego: () => (
    <svg className="w-8 h-8 text-gray-600 group-hover:text-[#0033ff] transition" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 13c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />
    </svg>
  ),

  // Trust Icons
  FindSpecial: () => (
    <svg className="w-8 h-8 text-[#0033ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  SelectedByExperts: () => (
    <svg className="w-8 h-8 text-[#0033ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  BuyerProtection: () => (
    <svg className="w-8 h-8 text-[#0033ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  TrustedByMillions: () => (
    <svg className="w-8 h-8 text-[#0033ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
}

const HeroBanner = () => {
  const slides = [
    {
      id: 1,
      title: "Special objects,",
      highlight: "selected by experts",
      description: "Discover unique treasures curated by our in-house specialists",
      image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=1920&h=800&fit=crop",
      mobileImage: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&h=600&fit=crop",
      ctaLink: "/auctions",
      ctaText: "Discover more",
    },
    {
      id: 2,
      title: "Live Auctions",
      highlight: "Real-time bidding",
      description: "Experience the thrill of live auctions from the comfort of your home",
      image: "https://images.unsplash.com/photo-1536240474400-5d3b3d4b2f2f?w=1920&h=800&fit=crop",
      mobileImage: "https://images.unsplash.com/photo-1536240474400-5d3b3d4b2f2f?w=800&h=600&fit=crop",
      ctaLink: "/live-auctions",
      ctaText: "Watch Live",
    },
    {
      id: 3,
      title: "75,000+",
      highlight: "Weekly Auctions",
      description: "From art and jewelry to collectibles and fashion - find your treasure",
      image: "https://images.unsplash.com/photo-1523170335218-732f0e4b2de7?w=1920&h=800&fit=crop",
      mobileImage: "https://images.unsplash.com/photo-1523170335218-732f0e4b2de7?w=800&h=600&fit=crop",
      ctaLink: "/categories",
      ctaText: "Explore Categories",
    },
  ]

  return (
    <div className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={true}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        speed={1000}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        pagination={{
          el: '.hero-pagination',
          clickable: true,
          bulletClass: 'custom-bullet',
          bulletActiveClass: 'custom-bullet-active',
        }}
        className="hero-swiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full min-h-[500px] md:min-h-[600px] lg:min-h-[650px] flex items-center">
              <picture className="absolute inset-0 w-full h-full">
                <source media="(max-width: 768px)" srcSet={slide.mobileImage} />
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </picture>
              
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/40" />
              
              <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-12">
                <div className="max-w-3xl mx-auto lg:mx-0 lg:max-w-2xl text-center lg:text-left">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight">
                    {slide.title}{' '}
                    <span className="text-[#0033ff] block md:inline">{slide.highlight}</span>
                  </h1>
                  <p className="text-base sm:text-lg text-gray-200 mt-4 md:mt-6 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    {slide.description}
                  </p>
                  <Link
                    to={slide.ctaLink}
                    className="inline-block mt-6 md:mt-8 bg-[#0033ff] text-white px-6 md:px-8 py-3 md:py-3.5 rounded-lg font-semibold hover:bg-[#0026cc] transition-all duration-300 hover:scale-105"
                  >
                    {slide.ctaText} →
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button className="swiper-button-prev-custom" aria-label="Previous slide">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button className="swiper-button-next-custom" aria-label="Next slide">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="hero-pagination"></div>
    </div>
  )
}

const FeaturedBrands = () => {
  const brands = [
    { id: 1, name: "Rolex", icon: <Icons.Rolex />, link: "/brands/rolex" },
    { id: 2, name: "Cartier", icon: <Icons.Cartier />, link: "/brands/cartier" },
    { id: 3, name: "Hermès", icon: <Icons.Hermes />, link: "/brands/hermes" },
    { id: 4, name: "Louis Vuitton", icon: <Icons.LouisVuitton />, link: "/brands/louis-vuitton" },
    { id: 5, name: "Porsche", icon: <Icons.Porsche />, link: "/brands/porsche" },
    { id: 6, name: "LEGO", icon: <Icons.Lego />, link: "/brands/lego" },
  ]

  return (
    <div className="py-12 bg-white">
      <div className="container-custom">
        <h2 className="text-2xl font-semibold mb-6">Iconic brands</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={brand.link}
              className="bg-gray-50 rounded-lg p-4 flex items-center justify-center hover:shadow-md transition group"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#0033ff]/10 transition">
                {brand.icon}
              </div>
              <span className="sr-only">{brand.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

const Home = () => {
  const [activeCategory, setActiveCategory] = useState(null)
  const { user } = useAuth()
  const { isConnected } = useSocket()
  const [watchlist, setWatchlist] = useState(new Set())

  const { data: auctionsData, isLoading: auctionsLoading } = useQuery({
    queryKey: ['featured-auctions', activeCategory],
    queryFn: async () => {
      const url = activeCategory 
        ? `/auctions?category=${activeCategory}&status=live&limit=8`
        : '/auctions?status=live&limit=8'
      const response = await api.get(url)
      return response.data
    },
  })

  const { data: endingSoonData, isLoading: endingSoonLoading } = useQuery({
    queryKey: ['ending-soon-auctions'],
    queryFn: async () => {
      const response = await api.get('/auctions/ending-soon?limit=4')
      return response.data
    },
  })

  const { data: featuredLotsData, isLoading: featuredLotsLoading } = useQuery({
    queryKey: ['featured-lots'],
    queryFn: async () => {
      const response = await api.get('/auctions/featured-lots?limit=8')
      return response.data
    },
  })

  useEffect(() => {
    if (user) {
      const fetchWatchlist = async () => {
        try {
          const response = await api.get('/users/watchlist')
          setWatchlist(new Set(response.data.watchlist?.map(w => w.lot_id) || []))
        } catch (error) {
          console.error('Failed to fetch watchlist:', error)
        }
      }
      fetchWatchlist()
    }
  }, [user])

  const handleWatchlistToggle = async (lotId) => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    try {
      if (watchlist.has(lotId)) {
        await api.delete(`/users/watchlist/${lotId}`)
        setWatchlist(prev => {
          const newSet = new Set(prev)
          newSet.delete(lotId)
          return newSet
        })
      } else {
        await api.post(`/users/watchlist/${lotId}`)
        setWatchlist(prev => new Set([...prev, lotId]))
      }
    } catch (error) {
      console.error('Failed to toggle watchlist:', error)
    }
  }

  if (auctionsLoading || endingSoonLoading || featuredLotsLoading) {
    return <Loader fullScreen />
  }

  const auctions = auctionsData?.auctions || []
  const endingSoon = endingSoonData?.auctions || []
  const featuredLots = featuredLotsData?.lots || []

  const experts = [
    { id: 1, name: "Surya Rutten", category: "Asian Art", objects: 234, icon: <Icons.AsianArt /> },
    { id: 2, name: "Aude Fonlupt", category: "Classical Art", objects: 189, icon: <Icons.ClassicalArt /> },
    { id: 3, name: "Luca Esposito", category: "Minerals & Natural History", objects: 456, icon: <Icons.Minerals /> },
    { id: 4, name: "Fiammetta Fulchiati", category: "Design", objects: 312, icon: <Icons.Design /> },
  ]

  return (
    <div>
      <HeroBanner />

      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {endingSoon.length > 0 && (
        <div className="py-12">
          <div className="container-custom">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-semibold">Auctions ending soon</h2>
              <Link to="/auctions?sort=ending" className="text-[#0033ff] hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {endingSoon.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </div>
        </div>
      )}

      {featuredLots.length > 0 && (
        <div className="py-12 bg-gray-50">
          <div className="container-custom">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-semibold">Featured objects</h2>
              <Link to="/featured" className="text-[#0033ff] hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredLots.map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  auctionId={lot.auction_id}
                  onWatchlistToggle={handleWatchlistToggle}
                  isWatched={watchlist.has(lot.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {auctions.length > 0 && (
        <div className="py-12">
          <div className="container-custom">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-semibold">
                {activeCategory ? `${activeCategory} Auctions` : 'Live Auctions'}
              </h2>
              <Link to="/auctions" className="text-[#0033ff] hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {auctions.slice(0, 4).map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expert Section */}
      <div className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl">
              Bid on over{' '}
              <span className="text-[#0033ff]">75,000 special objects</span>
              {' '}every week, selected by{' '}
              <span className="text-[#0033ff]">hundreds of in-house experts</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {experts.map((expert) => (
              <Link key={expert.id} to={`/experts/${expert.id}`} className="group">
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-[#0033ff]/10 to-[#0033ff]/5 flex items-center justify-center">
                    {expert.icon}
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-semibold text-lg group-hover:text-[#0033ff] transition">
                      {expert.name}
                    </h3>
                    <p className="text-sm text-gray-500">{expert.category}</p>
                    <p className="text-xs text-[#0033ff] mt-2">{expert.objects} objects this week</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/experts" className="inline-block text-[#0033ff] hover:text-[#0026cc] font-medium">
              Meet all our experts →
            </Link>
          </div>
        </div>
      </div>

      <FeaturedBrands />

      {/* Trust Elements */}
      <div className="py-16 border-t border-gray-100">
        <div className="container-custom">
          <h2 className="text-3xl font-serif text-center mb-12">
            Why <span className="text-[#0033ff]">Auction Platform</span>?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0033ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.FindSpecial />
              </div>
              <h3 className="font-semibold text-lg mb-2">Find something special</h3>
              <p className="text-gray-500 text-sm">Discover unique objects you won't find anywhere else.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0033ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.SelectedByExperts />
              </div>
              <h3 className="font-semibold text-lg mb-2">Selected by experts</h3>
              <p className="text-gray-500 text-sm">Our in-house experts review and appraise every object.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0033ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.BuyerProtection />
              </div>
              <h3 className="font-semibold text-lg mb-2">Buyer Protection</h3>
              <p className="text-gray-500 text-sm">We make sure your payments are safe and sellers are verified.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0033ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.TrustedByMillions />
              </div>
              <h3 className="font-semibold text-lg mb-2">Trusted by millions</h3>
              <p className="text-gray-500 text-sm">Join a worldwide community of satisfied buyers and sellers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* WebSocket connection indicator */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm z-40 shadow-lg">
          <svg className="inline-block w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting to live updates...
        </div>
      )}
    </div>
  )
}

export default Home