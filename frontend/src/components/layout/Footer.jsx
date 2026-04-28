import React from 'react'
import { Link } from 'react-router-dom'
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'

const Footer = () => {
  const footerSections = [
    {
      title: 'About',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Our Experts', href: '/experts' },
        { name: 'Careers', href: '/careers' },
        { name: 'Press', href: '/press' },
      ],
    },
    {
      title: 'Buy',
      links: [
        { name: 'How to Buy', href: '/how-to-buy' },
        { name: 'Buyer Protection', href: '/buyer-protection' },
        { name: 'Buyer Terms', href: '/terms/buyer' },
        { name: 'Shipping Info', href: '/shipping' },
      ],
    },
    {
      title: 'Sell',
      links: [
        { name: 'How to Sell', href: '/how-to-sell' },
        { name: 'Seller Tips', href: '/seller-tips' },
        { name: 'Submission Guidelines', href: '/guidelines' },
        { name: 'Seller Terms', href: '/terms/seller' },
      ],
    },
    {
      title: 'Help',
      links: [
        { name: 'Help Center', href: '/help' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'FAQs', href: '/faqs' },
        { name: 'Returns', href: '/returns' },
      ],
    },
  ]

  return (
    <footer className="bg-neutral-secondary pt-12 pb-6 mt-auto">
      <div className="container-custom">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-lg mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-neutral-dark-gray hover:text-brand-primary transition text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-neutral-tertiary pt-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-lg">Subscribe to our newsletter</h3>
              <p className="text-neutral-dark-gray text-sm">Get the latest updates on new auctions and exclusive offers.</p>
            </div>
            <form className="flex w-full md:w-auto gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 md:w-64 px-4 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <button 
                type="submit" 
                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Social Links & Legal */}
        <div className="border-t border-neutral-tertiary pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-neutral-mid-gray hover:text-brand-primary transition"
                aria-label="Facebook"
              >
                <FaFacebook className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-neutral-mid-gray hover:text-brand-primary transition"
                aria-label="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-neutral-mid-gray hover:text-brand-primary transition"
                aria-label="Twitter"
              >
                <FaTwitter className="w-5 h-5" />
              </a>
              <a 
                href="mailto:info@auction.com" 
                className="text-neutral-mid-gray hover:text-brand-primary transition"
                aria-label="Email"
              >
                <MdEmail className="w-5 h-5" />
              </a>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-neutral-dark-gray">
              <Link to="/terms" className="hover:text-brand-primary">Terms of Use</Link>
              <Link to="/privacy" className="hover:text-brand-primary">Privacy Policy</Link>
              <Link to="/cookies" className="hover:text-brand-primary">Cookie Notice</Link>
              <span>© 2024 Auction Platform. All rights reserved.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer