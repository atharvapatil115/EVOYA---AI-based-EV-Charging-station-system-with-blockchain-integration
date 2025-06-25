import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Zap, Car, Plug } from 'lucide-react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

// Define props interface
interface LandingPageProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

// Sample carousel images
const carouselImages = [
  { src: 'https://images.unsplash.com/photo-1625758850481-4b827c5e7d4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', alt: 'EV Charging Station' },
  { src: 'https://images.unsplash.com/photo-1612902376491-7b7b42414276?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', alt: 'Electric Vehicle' },
  { src: 'https://images.unsplash.com/photo-1620241608680-5f7a9a9b1e1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', alt: 'Charging Port' },
];

// Feature data
const features = [
  {
    title: 'Find Nearby Stations',
    description: 'Locate EV charging stations near your location or a dropped pin using an interactive map.',
    icon: <Zap className="w-8 h-8 text-green-600" />,
  },
  {
    title: 'Real-Time Navigation',
    description: 'Navigate to your chosen charging station with real-time routing and weather-aware recommendations.',
    icon: <Car className="w-8 h-8 text-green-600" />,
  },
  {
    title: 'Monitor EV Status',
    description: 'Track your electric vehicle’s battery status, mileage, and report issues directly from the dashboard.',
    icon: <Plug className="w-8 h-8 text-green-600" />,
  },
];

// Floating Objects Component
const FloatingObjects: React.FC<{ count: number }> = ({ count }) => {
  const icons = [Zap, Car, Plug];
  return (
    <>
      {Array.from({ length: count }).map((_, index) => {
        const Icon = icons[index % icons.length];
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const randomDelay = Math.random() * 5;
        return (
          <motion.div
            key={index}
            className="absolute z-10"
            style={{ left: `${randomX}%`, top: `${randomY}%` }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              repeatType: 'loop',
              delay: randomDelay,
            }}
          >
            <Icon className="w-6 h-6 text-green-500 opacity-50" />
          </motion.div>
        );
      })}
    </>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const [isPaused, setIsPaused] = useState(false);
  const heroRef = useRef(null);

  const handleLogin = () => {
    navigate('/sign-in');
  };

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Typewriter effect for hero headline
  const [headlineText, setHeadlineText] = useState('');
  const fullHeadline = 'Welcome to EV Connect';
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setHeadlineText(fullHeadline.slice(0, index + 1));
      index++;
      if (index === fullHeadline.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen overflow-x-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-[2000] shadow-md ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            className="text-xl font-bold"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            EV Connect
          </motion.div>
          <motion.button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-r from-green-600 to-green-500 text-white"
      >
        <motion.div
          style={{ y: parallaxY }}
          className="absolute inset-0 bg-gradient-to-b from-transparent to-green-700 opacity-50"
        />
        <FloatingObjects count={10} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="text-center px-4 z-10"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{headlineText}</h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl max-w-2xl mx-auto"
          >
            Your ultimate solution for finding, navigating, and managing electric vehicle charging stations with ease.
          </motion.p>
          <motion.button
            onClick={() => scrollToSection(heroRef)} // Scroll to project info (update ref as needed)
            className="mt-6 px-6 py-3 bg-white text-green-600 rounded-md text-lg font-semibold hover:bg-green-100 transition-colors"
            whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(255,255,255,0.5)' }}
            whileTap={{ scale: 0.9 }}
            animate={{ scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } }}
          >
            Learn More
          </motion.button>
        </motion.div>
      </section>

      {/* Project Information Section */}
      <section className="py-16 container mx-auto px-4 relative">
        <motion.div
          style={{ y: parallaxY }}
          className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 opacity-30"
        />
        <FloatingObjects count={5} />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 z-10 relative"
        >
          <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            About EV Connect
          </h2>
          <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            EV Connect is a cutting-edge platform designed to simplify the electric vehicle charging experience. Whether
            you're searching for nearby charging stations, navigating to a safe and available charger, or monitoring your
            EV's status, EV Connect has you covered.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 z-10 relative">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{ scale: 1.05, rotate: 2, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
              className={`p-6 rounded-lg shadow-md ${
                isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Carousel Section */}
      <section className="py-16 relative overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700">
        <motion.div
          style={{ y: parallaxY }}
          className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-400 dark:to-gray-900 opacity-30"
        />
        <FloatingObjects count={8} />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-4 sm:px-6 lg:px-8 z-10 relative"
        >
          <h2 className={`text-3xl font-bold mb-8 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            Explore EV Connect
          </h2>
          <Carousel
            showThumbs={false}
            autoPlay={!isPaused}
            interval={5000}
            infiniteLoop
            showStatus={false}
            className="max-w-4xl mx-auto"
            onChange={() => {
              // Trigger floating object scatter on slide change
            }}
            renderArrowPrev={(onClickHandler, hasPrev, label) =>
              hasPrev && (
                <motion.button
                  onClick={onClickHandler}
                  title={label}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-600 text-white p-2 rounded-full z-20"
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
              )
            }
            renderArrowNext={(onClickHandler, hasNext, label) =>
              hasNext && (
                <motion.button
                  onClick={onClickHandler}
                  title={label}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-green-600 text-white p-2 rounded-full z-20"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              )
            }
          >
            {carouselImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                onHoverStart={() => setIsPaused(true)}
                onHoverEnd={() => setIsPaused(false)}
                className="relative"
              >
                <motion.img
                  src={image.src}
                  alt={image.alt}
                  className="rounded-lg shadow-md h-96 object-cover"
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}
                />
                <AnimatePresence>
                  {isPaused && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-green-600 rounded-lg"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </Carousel>
        </motion.div>
      </section>

      {/* Login CTA Section */}
      <section className="py-16 container mx-auto px-4 text-center relative">
        <FloatingObjects count={6} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="z-10 relative"
        >
          <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            Ready to Charge?
          </h2>
          <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Log in to access your personalized EV Connect dashboard and start exploring charging stations now.
          </p>
          <motion.button
            onClick={handleLogin}
            className="px-6 py-3 bg-green-600 text-white rounded-md text-lg font-semibold relative overflow-hidden"
            whileHover={{
              scale: 1.1,
              boxShadow: '0 0 20px rgba(34,197,94,0.5)',
            }}
            whileTap={{ scale: 0.9 }}
            animate={{
              boxShadow: [
                '0 0 0 rgba(34,197,94,0)',
                '0 0 20px rgba(34,197,94,0.5)',
                '0 0 0 rgba(34,197,94,0)',
              ],
              transition: { repeat: Infinity, duration: 2 },
            }}
          >
            <span className="relative z-10">Log In</span>
            <motion.div
              className="absolute inset-0 bg-green-700 opacity-0"
              whileHover={{ opacity: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer Section */}
      <footer className={`py-8 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-700'} relative`}>
        <motion.div
          style={{ y: parallaxY }}
          className="absolute inset-0 bg-gradient-to-t from-gray-300 to-transparent dark:from-gray-900 opacity-30"
        />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-4 text-center z-10 relative"
        >
          <p className="mb-4">© 2025 EV Connect. Empowering electric vehicle journeys.</p>
          <div className="flex justify-center space-x-4">
            {['Twitter', 'LinkedIn', 'GitHub'].map((platform) => (
              <motion.a
                key={platform}
                href="#"
                className={`text-sm ${isDarkMode ? 'hover:text-green-400' : 'hover:text-green-600'}`}
                whileHover={{ y: -5, scale: 1.2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {platform}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </footer>
    </div>
  );
};

export default LandingPage;