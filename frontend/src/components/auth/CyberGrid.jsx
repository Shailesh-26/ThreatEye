export default function CyberGrid() {
  return (
    <>
      <div
        className="
        absolute inset-0
        opacity-[0.08]
        pointer-events-none
        [background-image:
        linear-gradient(rgba(34,197,94,.35)_1px,transparent_1px),
        linear-gradient(90deg,rgba(34,197,94,.35)_1px,transparent_1px)]
        [background-size:45px_45px]
        animate-grid
      "
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,.08),transparent_65%)]" />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
    </>
  );
}