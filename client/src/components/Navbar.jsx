import { useCart }     from '../context/CartContext';
import { useUI }       from '../context/UIContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth }     from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar() {
  const { totalItems, setIsOpen: setIsCartOpen } = useCart();
  const { setIsOpen: setIsWishlistOpen, wishlistItems } = useWishlist();
  const { setShowOrdersModal, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useUI();
  const { user, setIsAuthModalOpen, token } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <nav className="bg-amazon-dark flex flex-wrap items-center p-2 px-4 gap-x-4 gap-y-2 sticky top-0 z-[1000]">
        
        {/* Top Row for Mobile (Logo & Icons) */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4 flex-1 md:flex-initial">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0 p-1 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer group no-underline decoration-none outline-none">
            <span className="text-white text-[24px] md:text-[28px] font-extrabold tracking-tighter">
              amazon<span className="text-amazon-orange">.in</span>
            </span>
          </Link>

          {/* Deliver to - Hidden on Mobile */}
          <div className="hidden md:flex flex-col text-white cursor-pointer p-1 px-2 rounded hover:outline hover:outline-1 hover:outline-white shrink-0">
            <span className="text-[11px] text-gray-300">Deliver to</span>
            <span className="text-[13px] font-bold flex items-center gap-1">
              <span>📍</span> India
            </span>
          </div>

          {/* Cart/Wishlist - Mobile right side */}
          <div className="flex md:hidden items-center gap-4 text-white">
            <div 
                className="relative cursor-pointer p-1 px-2 rounded hover:outline hover:outline-1 hover:outline-white"
                onClick={() => setIsWishlistOpen(true)}
            >
                <div className="text-[22px]">❤️</div>
                {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-0.5 bg-amazon-orange text-amazon-dark rounded-full text-[10px] font-bold w-[16px] h-[16px] flex items-center justify-center">
                        {wishlistItems.length}
                    </span>
                )}
            </div>
            <div 
                className="relative cursor-pointer p-1 px-2 rounded hover:outline hover:outline-1 hover:outline-white"
                onClick={() => setIsCartOpen(true)}
            >
                <div className="text-[24px] relative flex items-center">
                🛒
                {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amazon-orange text-amazon-dark rounded-full text-[10px] font-bold w-[16px] h-[16px] flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                    </span>
                )}
                </div>
            </div>
          </div>
        </div>

        {/* Search - Full width on mobile, flexible on desktop */}
        <div className="order-last md:order-none w-full md:flex-1 flex items-center rounded-md overflow-hidden min-w-[200px] h-10 shadow-sm focus-within:ring-2 focus-within:ring-amazon-orange">
          <select 
            className="hidden sm:block bg-[#f3f3f3] border-none px-2 h-full text-[12px] cursor-pointer border-r border-[#cdcdcd] text-amazon-dark outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option>All</option>
            <option>Electronics</option>
            <option>Fashion</option>
            <option>Health</option>
            <option>Home</option>
            <option>Beauty</option>
            <option>Kids</option>
            <option>Lifestyle</option>
          </select>
          <input 
            id="navbar-search-input" 
            type="text" 
            placeholder="Search Amazon.in" 
            className="flex-1 h-full px-3 text-[14px] border-none outline-none text-amazon-dark bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            id="navbar-search-btn" 
            className="bg-amazon-orange hover:bg-amazon-orange-hover border-none h-full w-[46px] cursor-pointer flex items-center justify-center text-[18px] transition-colors"
            aria-label="Search"
          >
            🔍
          </button>
        </div>

        {/* Account & Orders - Responsive visibility */}
        <div className="hidden md:flex items-center gap-1">
          {/* Wishlist */}
          <div 
            className="flex flex-col text-white p-1 px-2 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer whitespace-nowrap shadow-none relative" 
            onClick={() => setIsWishlistOpen(true)}
          >
            <span className="text-[11px] text-gray-300">Your</span>
            <span className="text-[13px] font-bold flex items-center gap-1">
                Wishlist
                {wishlistItems.length > 0 && <span className="bg-amazon-orange text-amazon-dark rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold px-1.5">{wishlistItems.length}</span>}
            </span>
          </div>

          {/* Returns & Orders */}
          <div 
            className="flex flex-col text-white p-1 px-2 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer whitespace-nowrap shadow-none" 
            onClick={() => token ? setShowOrdersModal(true) : setIsAuthModalOpen(true)}
          >
            <span className="text-[11px] text-gray-300">Returns</span>
            <span className="text-[13px] font-bold">&amp; Orders</span> 
          </div>

          {/* User / Sign In */}
          <div 
            className="flex flex-col text-white p-1 px-2 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer whitespace-nowrap shadow-none" 
            onClick={() => token ? navigate('/profile') : setIsAuthModalOpen(true)}
          >
            <span className="text-[11px] text-gray-300">Hello, {user ? user.name.split(' ')[0] : 'sign in'}</span>
            <span className="text-[13px] font-bold">Account &amp; Lists</span>
          </div>

          {/* Desktop Cart */}
          <div 
            className="flex items-center gap-1.5 text-white p-1 px-2 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer relative" 
            onClick={() => setIsCartOpen(true)}
          >
            <div className="text-[26px] relative flex items-center">
              🛒
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amazon-orange text-amazon-dark rounded-full text-[11px] font-bold w-[18px] h-[18px] flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
            <span className="text-[14px] font-bold self-end mb-1">Cart</span>
          </div>
        </div>
      </nav>

      {/* Sub-navbar with horizontal scroll */}
      <div className="bg-amazon-navy flex items-center px-4 gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        <span className="text-white p-2 px-3 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap shrink-0">
          ☰ All
        </span>
        <span className="text-white p-2 px-2 md:px-3 text-[13px] font-medium cursor-pointer rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap shrink-0" onClick={() => setIsWishlistOpen(true)}>Wishlist</span>
        <span className="text-white p-2 px-2 md:px-3 text-[13px] font-medium cursor-pointer rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap shrink-0">Today's Deals</span>
        <span className="text-white p-2 px-2 md:px-3 text-[13px] font-medium cursor-pointer rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap shrink-0">Amazon miniTV</span>
        <span className="text-white p-2 px-2 md:px-3 text-[13px] font-medium cursor-pointer rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap shrink-0">Gift Cards</span>
        <span className="text-white p-2 px-2 md:px-3 text-[13px] font-medium cursor-pointer rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap shrink-0">Cell Phones</span>
        <Link to="/profile" className="!text-white p-2 px-2 md:px-3 text-[13px] font-medium cursor-pointer rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap shrink-0 no-underline">Account</Link>
        <span className="text-amazon-light-orange ml-auto text-[13px] font-semibold p-2 px-3 cursor-pointer whitespace-nowrap hidden lg:inline">
          Shop deals in Electronics →
        </span>
      </div>
    </>
  );
}
