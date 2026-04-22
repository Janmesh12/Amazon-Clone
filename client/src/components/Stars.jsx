export default function Stars({ rating, count }) {
  const fullStars = Math.floor(rating);
  const remainder = rating % 1;
  const hasHalfStar = remainder >= 0.25 && remainder <= 0.75;
  const roundedUp = remainder > 0.75;
  
  const finalFull = roundedUp ? fullStars + 1 : fullStars;

  return (
    <div className="flex items-center gap-2 my-1.5">
      <div className="flex text-[#ffa41c] text-[18px] leading-none select-none">
        {[...Array(5)].map((_, i) => {
          if (i < finalFull) return <span key={i}>★</span>;
          if (i === finalFull && hasHalfStar) {
            return (
              <span key={i} className="bg-gradient-to-r from-[#ffa41c] from-50% to-[#e0e0e0] to-50% bg-clip-text text-transparent">
                ★
              </span>
            );
          }
          return <span key={i} className="text-[#e0e0e0]">★</span>;
        })}
      </div>
      {count !== undefined && (
        <span className="text-[13px] text-amazon-link font-medium hover:underline cursor-pointer">
          {count.toLocaleString()}
        </span>
      )}
    </div>
  );
}
