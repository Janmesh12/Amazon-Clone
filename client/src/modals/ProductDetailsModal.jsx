import React, { useState } from 'react';
import { useUI }       from '../context/UIContext';
import { useCart }     from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Stars from '../components/Stars';

// IMAGE BASE URL: Used for resolving relative product image paths
const IMAGE_BASE = 'http://localhost:5000/images';

/**
 * PRODUCT DETAILS MODAL COMPONENT
 * Displays a full-screen detailed view of a selected product with a magnification effect.
 */
export default function ProductDetailsModal() {
  // CONTEXT HOOKS: Get state and functions for UI, Cart, and Wishlist
  const { selectedProduct, setSelectedProduct } = useUI();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  // LOCAL STATE: Controls the position and visibility of the 'Magnifying Glass' zoom
  const [zoomStyle, setZoomStyle] = useState({ display: 'none' });

  // If no product is selected, the modal is hidden
  if (!selectedProduct) return null;

  /**
   * MAGNIFYING GLASS LOGIC:
   * Calculates mouse coordinates relative to the image container to create the zoom effect.
   */
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`, // Moves the high-res background to match cursor
      backgroundImage: `url(${selectedProduct.image_url.startsWith('http') ? selectedProduct.image_url : IMAGE_BASE + selectedProduct.image_url})`
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' }); // Hides zoom when mouse leaves the image
  };

  return (
    // FULL-SCREEN OVERLAY: Includes Backdrop Blur and Fade-In Animation
    <div 
      className="fixed inset-0 bg-black/85 flex justify-center items-center z-[10000] p-5 backdrop-blur-sm animate-in fade-in duration-300" 
      onClick={() => setSelectedProduct(null)}
    >
      {/* MODAL CARD: Prevents clicks from 'bubbling' up to the overlay */}
      <div 
        className="bg-white w-full h-full md:w-[90%] md:max-w-[1000px] md:h-auto md:max-h-[85vh] md:rounded-xl relative overflow-y-auto p-5 md:p-10 shadow-2xl scale-in-95 animate-in" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON (X) */}
        <button 
          className="absolute top-4 right-4 text-3xl font-light text-gray-400 hover:text-amazon-dark cursor-pointer z-20 bg-white/50 rounded-full w-10 h-10 flex items-center justify-center p-0" 
          onClick={() => setSelectedProduct(null)}
        >
          ×
        </button>
        
        {/* GRID LAYOUT: Splits view into Image (Left) and Details (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,1.2fr] gap-6 md:gap-10 mt-4 md:mt-0">
          
          {/* LEFT COLUMN: PRODUCT IMAGE & ZOOM */}
          <div className="flex flex-col">
            <div 
              className="relative w-full cursor-crosshair bg-white rounded-lg overflow-hidden border border-gray-100 group"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img 
                className="w-full block object-contain max-h-[300px] md:max-h-[450px]" 
                src={selectedProduct.image_url.startsWith('http') ? selectedProduct.image_url : `${IMAGE_BASE}${selectedProduct.image_url}`} 
                alt={selectedProduct.name} 
              />
              {/* MAGNIFIER OVERLAY: Shows when user hovers over image */}
              <div 
                className="absolute inset-0 pointer-events-none bg-no-repeat bg-[length:180%] z-10 rounded-inherit shadow-inner hidden md:group-hover:block bg-white" 
                style={zoomStyle}
              ></div>
            </div>
            <p className="hidden md:block text-center text-[12px] text-gray-500 mt-2.5 font-medium">🔍 Hover to zoom</p>
          </div>
          
          {/* RIGHT COLUMN: INFO, PRICE & ACTIONS */}
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-[28px] font-bold text-amazon-dark leading-tight mb-2">
              {selectedProduct.name}
            </h1>
            <p className="text-amazon-text-muted text-[14px] uppercase tracking-wider mb-2">
              Category: {selectedProduct.category}
            </p>
            {/* RATINGS COMPONENT */}
            <div className="flex items-center gap-3 my-2.5">
              <Stars rating={selectedProduct.rating} count={selectedProduct.numReviews} />
              <span className="text-[14px] text-[#565959] font-semibold">
                {selectedProduct.rating} out of 5 stars
              </span>
            </div>
            {/* PRICE DISPLAY */}
            <div className="text-[28px] font-bold text-amazon-dark my-4">
              ₹{Number(selectedProduct.price).toLocaleString('en-IN')}
            </div>
            
            {/* BADGE: Amazon's Choice Style */}
            <div className="bg-[#232f3e] text-white text-[12px] font-bold py-1 px-3 w-fit mb-6">
              Amazon's Choice
            </div>
            
            {/* PRODUCT DESCRIPTION SECTION */}
            <div className="mb-6">
              <h3 className="text-[18px] font-bold mb-2">About this item</h3>
              <p className="text-amazon-text leading-relaxed mb-4">
                {selectedProduct.description || 'This is a premium product selected for your convenience. Experience the quality and detail that makes it stand out.'}
              </p>
              
              {/* DYNAMIC FEATURES LIST: Renders from DB features or category fallback */}
              <ul className="list-disc ml-5 space-y-1 text-amazon-text">
                {selectedProduct.features ? (
                  selectedProduct.features.split(',').map((f, i) => (
                    <li key={i}>{f.trim()}</li>
                  ))
                ) : (
                  <>
                    <li>Amazon-certified for reliability and performance.</li>
                    <li>Highly rated selection in the <strong className="font-bold">{selectedProduct.category}</strong> category.</li>
                    <li>Experience the quality and detail that makes this stand out.</li>
                  </>
                )}
              </ul>
            </div>

            {/* ACTION BUTTONS (Cart & Wishlist) */}
            <div className="flex flex-wrap items-center gap-3">
              <button 
                className="bg-amazon-orange hover:bg-amazon-orange-hover text-amazon-dark font-bold py-3.5 px-8 rounded-full transition-all active:scale-95 shadow-md w-full md:w-fit"
                onClick={() => {
                  addToCart(selectedProduct.id);
                  setSelectedProduct(null); // Close modal after adding to cart
                }}
              >
                🛒 Add to Cart
              </button>
              
              <button 
                className={`flex items-center gap-2 py-3 px-6 rounded-full border border-gray-300 font-bold transition-all active:scale-95 w-full md:w-fit
                  ${isInWishlist(selectedProduct.id) ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-amazon-dark hover:bg-gray-50'}`}
                onClick={() => toggleWishlist(selectedProduct.id)}
              >
                <span className="text-[20px]">{isInWishlist(selectedProduct.id) ? '❤️' : '🤍'}</span>
                {isInWishlist(selectedProduct.id) ? 'Saved' : 'Wishlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
