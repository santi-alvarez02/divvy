import { useState, useEffect, useRef } from 'react';

const useOverscrollEffect = () => {
  const [showTopGradient, setShowTopGradient] = useState(false);
  const [showBottomGradient, setShowBottomGradient] = useState(false);
  const lastScrollY = useRef(0);
  const isOverscrolling = useRef(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const maxScroll = documentHeight - windowHeight;

          // Detect overscroll at top (negative scroll or at very top)
          if (scrollY <= 0) {
            setShowTopGradient(true);
            isOverscrolling.current = true;
          } else {
            setShowTopGradient(false);
          }

          // Detect overscroll at bottom
          if (scrollY >= maxScroll - 1) {
            setShowBottomGradient(true);
            isOverscrolling.current = true;
          } else {
            setShowBottomGradient(false);
          }

          // Reset overscroll flag when back to normal
          if (scrollY > 0 && scrollY < maxScroll - 1) {
            isOverscrolling.current = false;
          }

          lastScrollY.current = scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Also listen for touchmove to better detect iOS rubber-banding
    const handleTouchMove = (e) => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const maxScroll = documentHeight - windowHeight;

      if (scrollY <= 0) {
        setShowTopGradient(true);
      }
      if (scrollY >= maxScroll - 1) {
        setShowBottomGradient(true);
      }
    };

    const handleTouchEnd = () => {
      // Fade out gradients after touch ends
      setTimeout(() => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const maxScroll = documentHeight - windowHeight;

        if (scrollY > 5) {
          setShowTopGradient(false);
        }
        if (scrollY < maxScroll - 5) {
          setShowBottomGradient(false);
        }
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return { showTopGradient, showBottomGradient };
};

export default useOverscrollEffect;
