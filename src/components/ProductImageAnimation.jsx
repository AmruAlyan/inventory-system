import React, { useState, useEffect, useRef } from 'react';
import './ProductImageAnimation.css';

const ProductImageAnimation = ({ animationQueue, onAnimationComplete }) => {
  const [currentAnimation, setCurrentAnimation] = useState(null);

  useEffect(() => {
    // Only start a new animation if there's no current animation and there are items in the queue
    if (!currentAnimation && animationQueue.length > 0) {
      const newAnimation = animationQueue[0];
      const animationId = `anim-${Date.now()}-${Math.random()}`;
      
      setCurrentAnimation({ ...newAnimation, id: animationId });

      // Remove animation after completion
      setTimeout(() => {
        setCurrentAnimation(null);
        onAnimationComplete();
      }, 1500); // Animation duration
    }
  }, [animationQueue, currentAnimation, onAnimationComplete]);

  const getShoppingCartPosition = () => {
    const shoppingCartIcon = document.querySelector('[data-testid="shopping-cart-icon"]');
    if (shoppingCartIcon) {
      const rect = shoppingCartIcon.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    
    // Fallback to approximate sidebar position
    return {
      x: window.innerWidth - 80, // Approximate sidebar position
      y: 300 // Approximate shopping cart icon position
    };
  };

  return (
    <div className="product-image-animation-container">
      {currentAnimation && (() => {
        const cartPosition = getShoppingCartPosition();
        
        return (
          <div
            key={currentAnimation.id}
            className="animated-product-image"
            style={{
              left: `${currentAnimation.startX}px`,
              top: `${currentAnimation.startY}px`,
              '--end-x': `${cartPosition.x - currentAnimation.startX}px`,
              '--end-y': `${cartPosition.y - currentAnimation.startY}px`,
              backgroundImage: currentAnimation.imageUrl ? `url(${currentAnimation.imageUrl})` : 'none'
            }}
          >
            {!currentAnimation.imageUrl && (
              <div className="no-image-placeholder">
                📦
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default ProductImageAnimation;
