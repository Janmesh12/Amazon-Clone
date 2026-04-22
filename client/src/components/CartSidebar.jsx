import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const resolveImg = (url) => url?.startsWith('http') ? url : `http://localhost:5000/images${url}`;
const CATEGORY_EMOJI = {
  Fashion:'👗', Health:'💊', Home:'🪑',
  Electronics:'📱', Beauty:'💄', Lifestyle:'🐾', Kids:'🧸',
};

function formatPrice(p) {
  return `₹${Number(p).toLocaleString('en-IN')}`;
}

function CartItem({ item }) {
  const { updateQty, removeItem } = useCart();
  const product = item.product || {};
  const emoji   = CATEGORY_EMOJI[product.category] || '📦';

  return (
    <div className="flex gap-3 p-3 px-5 border-b border-gray-100 items-start animate-in slide-in-from-right-5 duration-200" id={`cart-item-${product.id}`}>
      <div className="w-[72px] h-[72px] shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
        <img
          className="w-full h-full object-contain p-1"
          src={resolveImg(product.image_url)}
          alt={product.name}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-[30px]">${emoji}</div>`;
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-amazon-text leading-tight mb-1 line-clamp-2">{product.name}</div>
        <div className="text-[11px] text-amazon-text-muted uppercase tracking-wider mb-2">{product.category}</div>
        {product.price > 0 && (
          <div className="text-[14px] font-bold text-[#b12704] mb-1.5">{formatPrice(product.price)}</div>
        )}
        <div className="flex items-center gap-2">
          <button 
            className="w-[26px] h-[26px] border border-gray-300 rounded bg-gray-100 font-bold flex items-center justify-center hover:bg-gray-200 text-amazon-dark"
            onClick={() => updateQty(product.id, item.quantity - 1)}
          >−</button>
          <span className="text-[14px] font-bold min-w-[20px] text-center">{item.quantity}</span>
          <button 
            className="w-[26px] h-[26px] border border-gray-300 rounded bg-gray-100 font-bold flex items-center justify-center hover:bg-gray-200 text-amazon-dark"
            onClick={() => updateQty(product.id, item.quantity + 1)}
          >+</button>
          <button 
            className="ml-auto bg-none border-none text-red-700 text-[13px] hover:underline hover:text-red-900"
            onClick={() => removeItem(product.id)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartSidebar() {
  const { cartItems, isOpen, setIsOpen, clearCart, totalItems, totalPrice, fetchCart } = useCart();
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess]       = useState(null);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setCheckoutLoading(true);

    try {
      // 0. Get Razorpay Key
      const { data: keyRes } = await api.get('/api/payments/key');
      console.log("Razorpay Key from server:", keyRes.key);
      
      // 1. Create order on backend (which creates it on Razorpay)
      const { data: order } = await api.post('/api/payments/create-order');

      const options = {
        key: keyRes.key, 
        amount: order.amount,
        currency: order.currency,
        name: "Amazon Clone",
        description: "Test Transaction",
        image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
        order_id: order.id,
        handler: async (response) => {
          try {
            // 2. Verify payment on backend
            const verifyRes = await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.order) {
              setOrderSuccess(verifyRes.data.order);
              await fetchCart();
            }
          } catch (err) {
            alert(err.response?.data?.error || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name || "Test User",
          email: user?.email || "test@example.com",
          contact: user?.mobile || "9999999999",
        },
        theme: {
          color: "#232f3e",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
              alert("Payment Failed: " + response.error.description);
      });
      rzp1.open();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => { setIsOpen(false); setOrderSuccess(null); }}
        id="cart-overlay"
      />
      <div 
        className={`fixed top-0 right-0 h-full w-[400px] max-w-[95vw] bg-white z-[2100] flex flex-col shadow-[-4px_0_20px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} 
        id="cart-sidebar"
      >
        <div className="flex items-center justify-between p-4 px-5 bg-amazon-dark text-white shrink-0">
          <h2 className="text-[18px] font-bold">🛒 Your Cart ({totalItems})</h2>
          <button 
            className="bg-none border-none text-white text-2xl cursor-pointer p-1 opacity-80 hover:opacity-100" 
            id="cart-close-btn"
            onClick={() => { setIsOpen(false); setOrderSuccess(null); }}
          >
            ✕
          </button>
        </div>

        {orderSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3.5 p-8 text-center bg-gray-50">
            <div className="text-[64px] animate-bounce">🎉</div>
            <h3 className="text-[22px] font-extrabold text-amazon-dark">Order Placed!</h3>
            <p className="text-[15px] text-amazon-text-muted">Order <strong className="font-bold">#{orderSuccess.id}</strong> is confirmed.</p>
            <p className="text-[13px] text-[#007600] font-medium">View it in <strong>Returns &amp; Orders</strong> in the navbar.</p>
            <button 
              className="w-full bg-amazon-orange text-amazon-dark text-[15px] font-bold p-3 rounded-md hover:bg-amazon-orange-hover hover:-translate-y-0.5 transition-all mt-4" 
              id="success-continue-btn"
              onClick={() => { setOrderSuccess(null); setIsOpen(false); }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-3 no-scrollbar">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-10 text-center text-gray-400">
                  <div className="text-[56px] opacity-40">🛒</div>
                  <p className="text-[15px] font-bold text-gray-500">Your cart is empty</p>
                  <p className="text-[14px]">Click "Add to Cart" on any product.</p>
                </div>
              ) : (
                cartItems.map((item) => <CartItem key={item.id} item={item} />)
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="shrink-0 border-t-2 border-gray-100 p-4 px-5 flex flex-col gap-3 bg-[#fafafa]">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-amazon-text-muted">
                    Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})
                  </span>
                  <span className="text-[16px] font-bold text-amazon-dark">
                    {totalPrice > 0 ? formatPrice(totalPrice) : 'Price TBD'}
                  </span>
                </div>
                <div className="text-[12px] text-[#007600] font-medium text-center">✅ FREE delivery on this order</div>
                <button
                  className="w-full bg-amazon-orange hover:bg-amazon-orange-hover text-amazon-dark text-[15px] font-bold p-3 rounded-md transition-all hover:-translate-y-0.5 shadow-sm disabled:opacity-50"
                  id="checkout-btn"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Placing Order...' : 'Proceed to Checkout →'}
                </button>
                <button 
                  className="w-full bg-none border border-gray-300 text-amazon-text-muted text-[13px] p-2 rounded-md hover:border-red-600 hover:text-red-600 transition-colors" 
                  id="clear-cart-btn" 
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
