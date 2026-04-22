const IMAGE_BASE = 'http://localhost:5000/images';

export default function Hero() {
  return (
    <div className="relative w-full h-[150px] md:h-[420px] overflow-hidden group">
      {/* Real Background Image with Responsive Alignment */}
      <img 
        className="absolute top-0 left-0 w-full h-full object-cover object-[15%_35%] md:object-top transition-transform duration-1000 group-hover:scale-105"
        src={`${IMAGE_BASE}/hero_image.jpg`}
        alt="Hero Banner"
      />
      
      {/* Classical Amazon Bottom Fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-amazon-gray-bg pointer-events-none" />
    </div>
  );
}
