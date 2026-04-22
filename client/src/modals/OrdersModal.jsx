import { useState, useEffect } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// HELPER: Resolves the local or external image URL
const resolveImg = (url) => url?.startsWith('http') ? url : `http://localhost:5000/images${url}`;

/**
 * ORDERS MODAL COMPONENT
 * Slides in from the right to show the user's past purchase history.
 */
export default function OrdersModal() {
  const { showOrdersModal, setShowOrdersModal } = useUI();
  const { token } = useAuth();
  
  // STATE: Stores the list of orders and the loading spinner status
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * DATA FETCHING: 
   * Runs whenever the modal is opened and the user is authenticated.
   */
  useEffect(() => {
    if (!showOrdersModal || !token) return;
    setLoading(true);
    api.get('/api/orders')
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [showOrdersModal, token]);

  return (
    <>
      {/* SEMI-TRANSPARENT BACKDROP */}
      <div
        className={`fixed inset-0 bg-black/50 z-[1000] transition-opacity duration-300 ${showOrdersModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowOrdersModal(false)}
      />
      
      {/* SLIDE-IN SIDEBAR CONTAINER */}
      <div 
        className={`fixed top-0 right-0 h-full w-[500px] max-w-[95vw] bg-white z-[1001] flex flex-col shadow-[-5px_0_15px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out ${showOrdersModal ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* HEADER: Modal Title & Close Button */}
        <div className="bg-[#f0f2f2] p-4 px-5 flex justify-between items-center border-b border-[#d5d9d9] shrink-0">
          <h2 className="text-[18px] font-bold text-[#111]">📦 Your Orders ({orders.length})</h2>
          <button className="text-2xl font-light text-gray-500 hover:text-black cursor-pointer p-1" onClick={() => setShowOrdersModal(false)}>✕</button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-5 bg-white no-scrollbar">
          {loading ? (
            // Loading State: Shows a spinning Amazon-orange circle
            <div className="text-center p-10 flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-gray-100 border-t-amazon-orange rounded-full animate-spin mb-3"></div>
              <p className="text-amazon-text-muted">Loading...</p>
            </div>
          ) : orders.length === 0 ? (
            // Empty State: Prompt user to start shopping
            <div className="text-center p-10 text-amazon-text-muted flex flex-col items-center gap-3">
              <div className="text-[60px] opacity-50">📦</div>
              <p className="text-[15px] font-medium">No orders yet. Add items to cart!</p>
            </div>
          ) : (
            // ORDERS LIST: Renders every past order found in the DB
            <div className="flex flex-col gap-5">
              {orders.map((order) => (
                <div key={order.id} className="border border-[#d5d9d9] rounded-lg overflow-hidden shadow-sm">
                  
                  {/* ORDER SUMMARY STRIP: Includes Date (formatted via toLocaleDateString) and Total (formatted as currency) */}
                  <div className="bg-[#f0f2f2] p-3 px-4 flex flex-wrap gap-5 border-b border-[#d5d9d9] text-[13px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-[#565959] font-bold uppercase">ORDER PLACED</span>
                      <span className="font-semibold text-amazon-text">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-[#565959] font-bold uppercase">TOTAL</span>
                      <span className="font-semibold text-amazon-text">₹{parseFloat(order.total).toLocaleString()}</span>
                    </div>
                    <div className="flex-1 text-right flex flex-col gap-1 min-w-[100px]">
                      <span className="text-[11px] text-[#565959] font-bold uppercase text-right">ORDER #</span>
                      <span className="font-semibold text-amazon-text text-right">{order.id}</span>
                      {order.razorpay_order_id && (
                        <span className="text-[10px] text-gray-400 font-mono text-right">{order.razorpay_order_id}</span>
                      )}
                    </div>
                  </div>

                  {/* VISUAL PROGRESS TRACKER: Uses conditional logic to highlight steps based on order.status */}
                  <div className="p-4 bg-white border-b border-gray-50">
                    <div className="text-[14px] mb-3 text-amazon-text">
                      Status: <strong className="text-[#007600]">{order.status}</strong> 
                      <span className="font-medium text-[#565959] ml-1.5">— Arriving by {new Date(new Date(order.createdAt).setDate(new Date(order.createdAt).getDate() + 3)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    
                    {/* PROGRESS BAR UI: Nodes change color if the order status includes the specific milestone */}
                    <div className="flex items-center justify-between px-2 pt-2.5 pb-8 relative">
                      <div className={`w-3 h-3 rounded-full relative z-10 transition-colors ${['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(order.status) ? 'bg-[#007600] shadow-[0_0_5px_rgba(0,118,0,0.3)]' : 'bg-gray-200'}`}>
                        <span className={`absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold ${['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(order.status) ? 'text-[#007600]' : 'text-gray-400'}`}>Ordered</span>
                      </div>
                      <div className={`flex-1 h-1 mx-[-1px] z-0 transition-colors ${['Processing', 'Shipped', 'Delivered'].includes(order.status) ? 'bg-[#007600]' : 'bg-gray-200'}`}></div>
                      <div className={`w-3 h-3 rounded-full relative z-10 transition-colors ${['Shipped', 'Delivered'].includes(order.status) ? 'bg-[#007600] shadow-[0_0_5px_rgba(0,118,0,0.3)]' : 'bg-gray-200'}`}>
                        <span className={`absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold ${['Shipped', 'Delivered'].includes(order.status) ? 'text-[#007600]' : 'text-gray-400'}`}>Shipped</span>
                      </div>
                      <div className={`flex-1 h-1 mx-[-1px] z-0 transition-colors ${['Delivered'].includes(order.status) ? 'bg-[#007600]' : 'bg-gray-200'}`}></div>
                      <div className={`w-3 h-3 rounded-full relative z-10 transition-colors ${['Delivered'].includes(order.status) ? 'bg-[#007600] shadow-[0_0_5px_rgba(0,118,0,0.3)]' : 'bg-gray-200'}`}>
                        <span className={`absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold ${['Delivered'].includes(order.status) ? 'text-[#007600]' : 'text-gray-400'}`}>Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* ORDER ITEMS: Displays every product within this specific order */}
                  <div className="p-4 flex flex-col gap-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-start">
                        <img className="w-[60px] h-[60px] object-contain flex-shrink-0" src={resolveImg(item.product.image_url)} alt={item.product.name} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium text-amazon-link hover:underline hover:text-red-700 cursor-pointer line-clamp-2">{item.product.name}</div>
                          <div className="text-[12px] text-amazon-text-muted mt-1">Qty: {item.quantity} | ₹{parseFloat(item.price).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
