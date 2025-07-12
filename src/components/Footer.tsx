import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
const Footer = () => {
  const footerLinks = {
    programs: [{
      name: 'Kids Programs',
      href: '/collections?category=kids'
    }, {
      name: 'Teen Workshops',
      href: '/collections?category=teens'
    }, {
      name: 'Parent Resources',
      href: '/collections?category=parents'
    }, {
      name: 'Professional Courses',
      href: '/collections?category=professionals'
    }],
    support: [{
      name: 'Help Center',
      href: '/help'
    }, {
      name: 'Contact Us',
      href: '/contact'
    }, {
      name: 'Terms of Service',
      href: '/terms'
    }, {
      name: 'Privacy Policy',
      href: '/privacy'
    }],
    company: [{
      name: 'About Us',
      href: '/about'
    }, {
      name: 'Blog',
      href: '/blog'
    }, {
      name: 'Careers',
      href: '/careers'
    }, {
      name: 'Partner with Us',
      href: '/partnership'
    }]
  };
  return <footer className="bg-gray-900 text-white">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-kiki-purple-500 to-kiki-blue-500"></div>
              <span className="text-xl font-bold">KIKI's Learning Hub</span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Empowering learners of all ages to discover their potential and achieve their dreams through personalized education and career guidance.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Programs</h3>
            <ul className="space-y-3">
              {footerLinks.programs.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Stay Updated</h3>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter for the latest programs and updates.</p>
            <div className="space-y-3">
              <Input placeholder="Enter your email" className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
              <Button className="w-full bg-kiki-purple-600 hover:bg-kiki-purple-700">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-kiki-purple-400" />
              <span className="text-gray-400">support@kikislearninghub.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-kiki-purple-400" />
              <span className="text-gray-400">+91 8220879805</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-kiki-purple-400" />
              <span className="text-gray-400">Madurai ,TamilNadu, India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 KIKI's Learning Hub. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;