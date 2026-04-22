export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="w-full">
      <div 
        className="bg-[#37475a] text-white text-center p-3.5 text-[13px] cursor-pointer transition-colors hover:bg-[#485769]" 
        onClick={scrollToTop} 
        id="footer-back-top"
      >
        ▲ Back to top
      </div>

      <div className="bg-amazon-navy flex justify-center gap-12 p-10 px-6 flex-wrap">
        <div className="flex flex-col gap-2.5 min-w-[140px]">
          <h4 className="text-white text-[15px] font-bold mb-1">Get to Know Us</h4>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Careers</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Blog</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">About Amazon</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Investor Relations</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Amazon Devices</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Amazon Science</a>
        </div>
        <div className="flex flex-col gap-2.5 min-w-[140px]">
          <h4 className="text-white text-[15px] font-bold mb-1">Make Money with Us</h4>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Sell on Amazon</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Sell under Amazon Accelerator</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Protect and Build Your Brand</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Amazon Global Selling</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Fulfillment by Amazon</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Advertise Your Products</a>
        </div>
        <div className="flex flex-col gap-2.5 min-w-[140px]">
          <h4 className="text-white text-[15px] font-bold mb-1">Amazon Payment Products</h4>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Amazon Business Card</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Shop with Points</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Amazon Currency Converter</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Amazon and COVID-19</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Your Account</a>
        </div>
        <div className="flex flex-col gap-2.5 min-w-[140px]">
          <h4 className="text-white text-[15px] font-bold mb-1">Let Us Help You</h4>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">COVID-19 and Amazon</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Your Account</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Your Orders</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Shipping Rates &amp; Policies</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Returns &amp; Replacements</a>
          <a href="#" style={{ color: 'white' }} className="text-[13px] transition-colors hover:text-white hover:underline">Help</a>
        </div>
      </div>

      <div className="bg-amazon-dark flex flex-col items-center gap-3 p-6 px-4">
        <div className="text-white text-2xl font-extrabold tracking-tight">
          amazon<span className="text-amazon-orange">.in</span>
        </div>
        <p style={{ color: '#dddddd' }} className="text-xs text-center">© 2024–2026, Amazon.com, Inc. or its affiliates. All rights reserved.</p>
      </div>
    </footer>
  );
}
