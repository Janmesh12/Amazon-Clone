import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

// HELPER: Resolves the local or external image URL
const resolveImg = (url) => url?.startsWith('http') ? url : `http://localhost:5000/images${url}`;

/**
 * WISHLIST MODAL COMPONENT
 * Displays all products the user has 'hearted' or saved for later.
 */
export default function WishlistModal() {
  // CONTEXT HOOKS: Get wishlist data and cart functions
  const { wishlistItems, isOpen, setIsOpen, toggleWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  // If the modal isn't toggled 'open' by the UIContext, don't render it
  if (!isOpen) return null;

  return (
    // MODAL OVERLAY: Full-screen container with centered alignment
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* SEMI-TRANSPARENT BACKDROP WITH BLUR */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* MODAL CARD: Includes Slide/Zoom animation */}
      <div className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER: Amazon-Dark background with title and close X */}
        <div className="bg-amazon-dark text-white p-4 px-6 flex items-center justify-between">
          <h2 className="text-[20px] font-bold flex items-center gap-2">
            ❤️ Your Wishlist ({wishlistItems.length})
          </h2>
          <button 
            className="text-white text-2xl hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            onClick={() => setIsOpen(false)}
          >
            ✕  
          </button>
        </div>

        {/* WISHLIST CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {loading ? (
            // LOADING STATE
            <div className="h-40 flex items-center justify-center text-amazon-text-muted">
              Loading wishlist...
            </div>
          ) : wishlistItems.length === 0 ? (
            // EMPTY STATE: Shown when the user has no saved items
            <div className="h-60 flex flex-col items-center justify-center text-gray-400 gap-4">
              <div className="text-[64px] opacity-30">❤️</div>
              <p className="text-[16px] font-medium">Your wishlist is empty</p>
              <button 
                className="text-amazon-link hover:underline text-[14px]"
                onClick={() => setIsOpen(false)}
              >
                Continue shopping
              </button>
            </div>
          ) : (
            // WISHLIST GRID: Renders each saved product
            <div className="grid gap-4">
              {wishlistItems.map((item) => {
                const product = item.product;
                return (
                  // ITEM CARD
                  <div key={item.id} className="flex gap-4 p-3 border rounded-lg hover:border-amazon-orange/30 transition-colors group">
                    {/* PRODUCT IMAGE CONTAINER */}
                    <div className="w-24 h-24 shrink-0 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center border border-gray-100">
                      <img 
                        src={resolveImg(product.image_url)} 
                        alt={product.name}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    {/* PRODUCT DETAILS CARD */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-amazon-text line-clamp-1 group-hover:text-amazon-link transition-colors cursor-pointer">
                        {product.name}
                      </h3>
                      <div className="text-[13px] text-amazon-text-muted mb-2">{product.category}</div>
                      {/* PRICE TAG (Formatted for Indian Rupees) */}
                      <div className="text-[17px] font-bold text-[#b12704] mb-3">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </div>
                      
                      {/* ACTION BUTTONS (Add to Cart / Remove) */}
                      <div className="flex items-center gap-3">
                        <button 
                          className="bg-amazon-orange hover:bg-amazon-orange-hover text-amazon-dark text-[13px] font-bold px-4 py-1.5 rounded-full shadow-sm transition-all active:translate-y-px"
                          onClick={() => {
                            addToCart(product.id); // Add item to cart session
                          }}
                        >
                          Add to Cart
                        </button>
                        <button 
                          className="text-[13px] text-red-600 hover:underline"
                          onClick={() => toggleWishlist(product.id)} // Remove item from wishlist DB
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* MODAL FOOTER */}
        <div className="p-4 bg-gray-50 border-t text-center">
            <button 
                className="text-amazon-text-muted text-[13px] hover:text-amazon-dark"
                onClick={() => setIsOpen(false)}
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}
