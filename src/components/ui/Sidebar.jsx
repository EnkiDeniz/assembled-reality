import useMediaQuery from "../../hooks/useMediaQuery";

export default function Sidebar({ side = "left", width = 260, children, onClose }) {
  const isDesktop = useMediaQuery("(min-width: 769px)");
  const isLeft = side === "left";

  return (
    <>
      {!isDesktop && (
        <div onClick={onClose} className="fixed inset-0 z-85 bg-black/8" />
      )}
      <div
        className={`fixed top-10 bottom-0 bg-surface overflow-y-auto overscroll-contain
          ${isLeft ? "left-0" : "right-0"}
          ${isLeft ? "border-r-0 md:border-r" : "border-l-0 md:border-l"} md:border-border
          w-full p-3 px-4 md:px-3.5
          ${!isDesktop ? (isLeft ? "animate-slide-left" : "animate-slide-right") : ""}
          ${isDesktop ? "z-50" : "z-90"}`}
        style={{ width: isDesktop ? width : undefined }}
      >
        {!isDesktop && (
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="bg-transparent border border-border rounded-[3px] px-3.5 py-1.5 text-base font-medium text-ink-tertiary cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
