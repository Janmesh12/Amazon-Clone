import { useCart }     from '../context/CartContext';
import { useUI }       from '../context/UIContext';
import { useWishlist } from '../context/WishlistContext';
import Stars from './Stars';

const IMAGE_BASE = 'http://localhost:5000/images';

function formatPrice(p) {
  return `₹${Number(p).toLocaleString('en-IN')}`;
}

function ProductCard({ product }) {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { setSelectedProduct } = useUI();

    const isFav = isInWishlist(product.id);

  return (
    <div 
      className="bg-white rounded-amazon-card shadow-amazon-card p-4 flex flex-col gap-2.5 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group relative" 
      onClick={() => setSelectedProduct(product)}
      id={`product-card-${product.id}`}
    >
      {/* Wishlist Heart */}
      <button 
        className={`absolute top-3 right-3 z-30 p-2 rounded-full bg-white/80 shadow-sm border border-gray-100 hover:scale-110 active:scale-95 transition-all
          ${isFav ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
      >
        <span className="text-[18px]">{isFav ? '❤️' : '🤍'}</span>
      </button>

      <div className="w-full h-[180px] overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
        <img
          className="w-full h-full max-h-[160px] object-contain transition-transform duration-300 group-hover:scale-105"
          src={product.image_url.startsWith('http') ? product.image_url : IMAGE_BASE + product.image_url}
          alt={product.name}
          onError={(e) => { 
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect fill="%23e5e7eb" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>
      <div className="text-[15px] font-bold text-amazon-text leading-tight line-clamp-2">{product.name}</div>
      <Stars rating={product.rating} count={product.numReviews} />
      <div className="text-[12px] text-amazon-text-muted uppercase tracking-wide">{product.category}</div>
      
      {product.price > 0 && (
        <div className="text-[16px] font-bold text-[#b12704]">{formatPrice(product.price)}</div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <button 
          className="text-[13px] text-amazon-link font-semibold bg-none border-none text-left p-0 hover:underline" 
          id={`see-more-btn-${product.id}`}
          onClick={() => setSelectedProduct(product)}
        >
          See more →
        </button>
        <button
          className="bg-amazon-orange hover:bg-amazon-orange-hover text-amazon-dark text-[13px] font-bold py-2 rounded-full shadow-sm active:scale-95 transition-all"
          id={`add-to-cart-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product.id);
          }}
        >
          🛒 Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading, error, onProductDeleted }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-amazon-orange rounded-full animate-spin"></div>
        <p className="mt-4 text-amazon-text">Loading products...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-8 text-center">
        <p className="text-red-700 text-lg font-bold">⚠️ {error}</p>
        <p className="text-red-600">Please check that the server is running.</p>
      </div>
    );
  }
  return (
    <section className="p-4 px-6 md:px-8 max-w-[1500px] mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-amazon-text mb-6">Shop by Category</h2>
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
        id="products-grid"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
