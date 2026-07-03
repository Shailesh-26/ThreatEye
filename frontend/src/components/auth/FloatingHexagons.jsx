const hexagons = [
  {
    size: 220,
    top: "8%",
    left: "12%",
    delay: "0s",
  },
  {
    size: 150,
    top: "60%",
    left: "8%",
    delay: "2s",
  },
  {
    size: 170,
    top: "20%",
    right: "8%",
    delay: "1s",
  },
  {
    size: 260,
    bottom: "5%",
    right: "18%",
    delay: "3s",
  },
];

export default function FloatingHexagons() {
  return (
    <>
      {hexagons.map((hex, index) => (
        <div
          key={index}
          style={hex}
          className="
          absolute
          aspect-square
          border
          border-green-500/10
          opacity-40
          animate-float
          backdrop-blur-sm
          "
        />
      ))}
    </>
  );
}