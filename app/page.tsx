"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";

export default function Page() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Animations variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const fadeInRight = {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const floatAnimation = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  // استخدام useInView من Framer Motion
  const missionRef = useRef(null);
  const featuresRef = useRef(null);
  const howRef = useRef(null);
  const collabRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);

  const isMissionInView = useInView(missionRef, { once: true });
  const isFeaturesInView = useInView(featuresRef, { once: true });
  const isHowInView = useInView(howRef, { once: true });
  const isCollabInView = useInView(collabRef, { once: true });
  const isTestimonialsInView = useInView(testimonialsRef, { once: true });
  const isCtaInView = useInView(ctaRef, { once: true });

  // Track active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'mission', 'features', 'how', 'collab', 'testimonials', 'cta'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-20 items-center justify-between">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-2xl font-bold text-indigo-600">Health<span className="text-gray-800">Sight</span></div>
            </motion.div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-700">
              {['hero', 'mission', 'features', 'how', 'collab'].map((section) => (
                <motion.button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`hover:text-indigo-600 transition-colors duration-200 relative py-2 ${
                    activeSection === section ? 'text-indigo-600' : ''
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {section === 'hero' ? 'Home' : 
                   section === 'mission' ? 'About' :
                   section === 'features' ? 'Features' :
                   section === 'how' ? 'How It Works' : 'Partners'}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-indigo-600 transition-all duration-200 ${
                    activeSection === section ? 'w-full' : 'w-0 hover:w-full'
                  }`}></span>
                </motion.button>
              ))}
              <motion.a 
                href="/articles" 
                className="hover:text-indigo-600 transition-colors duration-200 relative py-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Articles
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 hover:w-full"></span>
              </motion.a>
            </nav>
            
            {/* Desktop Buttons */}
            <motion.div 
              className="hidden lg:flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.button 
                className="rounded-md border border-indigo-300 px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
              <motion.button 
                className="rounded-full bg-pink-500 px-4 py-2 text-sm text-white hover:bg-pink-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign Up
              </motion.button>
            </motion.div>
            
            {/* Mobile Menu Button */}
            <motion.div 
              className="lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-md bg-gray-100 p-2 hover:bg-gray-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ☰
              </motion.button>
            </motion.div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                className="lg:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <nav className="flex flex-col p-6 space-y-4 items-center">
                  {['hero', 'mission', 'features', 'how', 'collab'].map((section, index) => (
                    <motion.button
                      key={section}
                      onClick={() => scrollToSection(section)}
                      className={`w-full text-center py-3 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-200 ${
                        activeSection === section ? 'text-indigo-600 bg-indigo-50' : ''
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {section === 'hero' ? 'Home' : 
                       section === 'mission' ? 'About' :
                       section === 'features' ? 'Features' :
                       section === 'how' ? 'How It Works' : 'Partners'}
                    </motion.button>
                  ))}
                  <motion.a 
                    href="/articles" 
                    className="w-full text-center py-3 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    Articles
                  </motion.a>
                  
                  <motion.div 
                    className="flex gap-3 pt-4 border-t w-full justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.button 
                      className="rounded-md border border-indigo-300 px-6 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Login
                    </motion.button>
                    <motion.button 
                      className="rounded-full bg-pink-500 px-6 py-2 text-sm text-white hover:bg-pink-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Sign Up
                    </motion.button>
                  </motion.div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-purple-50 to-white opacity-90"></div>
          <img 
            src="/Ellipse1.svg" 
            alt="background" 
            className="absolute left-[10%] -top-[50%] h-[270px] w-[470px] object-contain md:h-[400px] md:w-[600px]" 
          />

          <svg className="absolute left-0 right-0 top-8 mx-auto h-40 w-full max-w-6xl opacity-30" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden>
            <defs>
              <pattern id="dots2" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#e9d5ff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots2)" />
          </svg>

          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
              <motion.div
                initial="initial"
                animate="animate"
                variants={fadeInRight}
              >
                <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
                  Predicting Disease <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500">Outbreaks</span> with
                  <br /> the Power of <span className="text-indigo-600">AI</span> &amp; <span className="text-pink-500">Big Data</span>
                </h1>
                <motion.p 
                  className="mt-6 max-w-2xl text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  A smart health platform that monitors community health trends, predicts outbreaks, and supports early interventions.
                </motion.p>

                <motion.div 
                  className="mt-8 flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.button 
                    className="rounded-md bg-indigo-600 px-6 py-3 text-white shadow hover:bg-indigo-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started
                  </motion.button>
                  <motion.button 
                    onClick={() => scrollToSection('how')} 
                    className="rounded-md border border-indigo-200 px-6 py-3 text-indigo-700 hover:bg-indigo-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Learn How It Works
                  </motion.button>
                </motion.div>
              </motion.div>

              <motion.div 
                className="flex items-center justify-center"
                variants={floatAnimation}
                animate="animate"
              >
                <div className="h-64 w-64 md:h-80 md:w-80 lg:h-96 lg:w-96 flex items-center justify-center">
                  <img 
                    src="/robot.svg" 
                    alt="robot" 
                    className="h-55 w-55 md:h-100 md:w-100 object-contain" 
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <motion.section 
          id="mission" 
          ref={missionRef}
          className="relative mx-auto max-w-4xl px-6 py-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isMissionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <img 
            src="/Ellipse1.svg" 
            alt="background" 
            className="absolute left-1/2 -translate-x-1/2 -top-5 h-40 w-40 object-contain md:h-60 md:w-60 md:-top-15" 
          />
          <h2 className="text-2xl font-bold relative z-10">Our Mission</h2>
          <p className="mt-4 text-gray-600 relative z-10">We aim to revolutionize public health monitoring by combining AI, big data, and behavioral analytics. Our platform bridges personal health data with population-level insights to predict potential outbreaks and prevent the spread of diseases.</p>
          <div className="mt-8 inline-block relative z-10">
            <span className="p-4 rounded-full shadow bg-white text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500">
              Turning individual health signals into global awareness
            </span>
          </div>
        </motion.section>

        {/* Key Features */}
        <motion.section 
          id="features" 
          ref={featuresRef}
          className="relative py-12"
          initial={{ opacity: 0 }}
          animate={isFeaturesInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative mx-auto max-w-7xl px-6">
            <img 
              src="/Ellipse1.svg" 
              alt="background" 
              className="absolute left-1/2 -translate-x-1/2 -top-15 h-40 w-40 object-contain md:h-60 md:w-60 md:-top-25" 
            />
            <motion.h3 
              className="text-center text-2xl font-bold relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={isFeaturesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
            >
              Key Features
            </motion.h3>
            
            <motion.div 
              className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5"
              variants={staggerContainer}
              initial="initial"
              animate={isFeaturesInView ? "animate" : "initial"}
            >
              {[
                ["AI Health Companion", "robot.svg", "Get instant, personalized health insights powered by multi-agent AI."],
                ["Health Dashboard", "dashboard.svg", "Track activity, sleep, nutrition, and mental wellness."],
                ["Outbreak Map", "map.svg", "Visualize potential disease spread in real-time."],
                ["Health Articles & Community", "brain.svg", "Stay informed and connected with curated content."],
                ["Admin Dashboard", "settings.svg", "Manage models, view reports, and analytics."],
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  className="flex flex-col items-center text-center p-4"
                  variants={{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 }
                  }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className="h-16 w-16 rounded-md bg-white/90 shadow flex items-center justify-center hover:shadow-md transition-shadow duration-200">
                    <img 
                      src={`/${item[idx]}`} 
                      alt={item[0]} 
                      className="h-8 w-8 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.display = 'none';
                        if (target.nextSibling instanceof HTMLElement) {
                          target.nextSibling.style.display = 'block';
                        }
                      }}
                    />
                    <div className="h-8 w-8 flex items-center justify-center text-indigo-600 text-xl hidden">
                      {idx + 1}
                    </div>
                  </div>
                  <h4 className="mt-4 font-semibold hover:text-indigo-600 transition-colors duration-200">{item[0]}</h4>
                  <p className="mt-2 text-sm text-gray-500">{item[2]}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works */}
        <motion.section 
          id="how" 
          ref={howRef}
          className="relative mx-auto max-w-6xl px-6 py-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isHowInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <img 
            src="/Ellipse1.svg" 
            alt="background" 
            className="absolute left-1/2 -translate-x-1/2 -top-5 h-40 w-40 object-contain md:h-60 md:w-60 md:-top-15" 
          />
          <h3 className="text-center text-2xl font-bold relative z-10">How It Works</h3>
          <div className="mt-8 flex items-center justify-center">
            <div className="relative w-full">
              <div className="hidden md:block absolute left-6 right-6 top-6 h-1 rounded-full bg-gradient-to-r from-indigo-300 via-pink-200 to-indigo-300 opacity-60"></div>
              <motion.ul 
                className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:flex md:items-center md:justify-between"
                variants={staggerContainer}
                initial="initial"
                animate={isHowInView ? "animate" : "initial"}
              >
                {['Collect Data','AI Analysis','Predict & Visualize','Act & Prevent'].map((step, i)=> (
                  <motion.li 
                    key={i} 
                    className="flex flex-col items-center text-center"
                    variants={{
                      initial: { opacity: 0, y: 20 },
                      animate: { opacity: 1, y: 0 }
                    }}
                    transition={{ delay: i * 0.2 }}
                  >
                    <motion.div 
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${i===2? 'bg-indigo-600 text-white':'bg-white border'} shadow`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {i+1}
                    </motion.div>
                    <div className="text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200">{step}</div>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </div>
        </motion.section>

        {/* Collaborations */}
        <motion.section 
          id="collab" 
          ref={collabRef}
          className="relative mx-auto max-w-5xl px-6 py-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isCollabInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <img 
            src="/Ellipse1.svg" 
            alt="background" 
            className="absolute left-1/2 -translate-x-1/2 -top-5 h-40 w-40 object-contain md:h-60 md:w-60 md:-top-15" 
          />
          <h3 className="text-2xl font-bold relative z-10">Our Collaborations</h3>
          <p className="mt-4 text-gray-600 relative z-10">We integrate with universities, healthcare organizations, and research labs that share our vision.</p>
          <motion.div 
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6"
            variants={staggerContainer}
            initial="initial"
            animate={isCollabInView ? "animate" : "initial"}
          >
            {[1,2,3].map((partner, index) => (
              <motion.div 
                key={index} 
                className="h-16 w-36 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors duration-200"
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 }
                }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                Partner {partner}
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Testimonials */}
        <motion.section 
          ref={testimonialsRef}
          className="relative mx-auto max-w-6xl px-6 py-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isTestimonialsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <img 
            src="/Ellipse1.svg" 
            alt="background" 
            className="absolute left-1/2 -translate-x-1/2 -top-5 h-40 w-40 object-contain md:h-60 md:w-80 md:-top-15" 
          />
          <h3 className="text-center text-2xl font-bold relative z-10">What Our Users Are Saying</h3>
          <p className="mt-2 text-center text-gray-600 relative z-10">Real experiences from students, analysts, and health enthusiasts.</p>
          <motion.div 
            className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            animate={isTestimonialsInView ? "animate" : "initial"}
          >
            {[1,2,3].map((i, index) => (
              <motion.div 
                key={i} 
                className="rounded-xl border border-gray-100 bg-white p-6 shadow hover:shadow-md transition-shadow duration-200"
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 }
                }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <p className="text-sm text-gray-600">"This platform helped our team predict outbreaks earlier and allocate resources efficiently."</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div>
                      <div className="font-semibold hover:text-indigo-600 transition-colors duration-200">Name Here</div>
                      <div className="text-xs text-gray-500">Researcher</div>
                    </div>
                  </div>
                  <div className="text-sm text-indigo-600">★★★★★</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* CTA */}
        <motion.section 
          ref={ctaRef}
          className="mx-auto max-w-7xl px-6 py-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="rounded-2xl bg-gradient-to-r from-indigo-50 to-pink-50 p-8 text-center md:flex md:items-center md:justify-between hover:shadow-lg transition-shadow duration-200"
            whileHover={{ scale: 1.02 }}
          >
            <div>
              <h3 className="text-2xl font-bold">Join the Future of Smart Health Monitoring</h3>
              <p className="mt-2 text-gray-600">Be part of a smarter, safer, and more proactive healthcare ecosystem.</p>
            </div>
            <div className="mt-6 md:mt-0">
              <motion.button 
                className="inline-block rounded-full bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Now
              </motion.button>
            </div>
          </motion.div>
        </motion.section>

        <footer className="border-t bg-white">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div>
                <div className="text-xl font-bold text-indigo-600">Health<span className="text-gray-800">Sight</span></div>
                <p className="text-sm text-gray-500">Be part of a smarter, safer, and more proactive healthcare ecosystem.</p>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <button 
                  onClick={() => scrollToSection('hero')} 
                  className="hover:text-indigo-600 transition-colors duration-200"
                >
                  Home
                </button>
                <button 
                  onClick={() => scrollToSection('mission')} 
                  className="hover:text-indigo-600 transition-colors duration-200"
                >
                  About
                </button>
                <button 
                  onClick={() => scrollToSection('features')} 
                  className="hover:text-indigo-600 transition-colors duration-200"
                >
                  Features
                </button>
                <a 
                  href="/articles" 
                  className="hover:text-indigo-600 transition-colors duration-200"
                >
                  Articles
                </a>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-gray-400">© {new Date().getFullYear()} Predictive Disease Outbreak Platform. All Rights Reserved.</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
