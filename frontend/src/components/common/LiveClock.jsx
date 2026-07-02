import { useEffect, useState } from "react";

export default function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-right">
      {/* <p className="text-xs uppercase tracking-widest text-green-400">
        Online
      </p> */}

      <p className="text-sm text-zinc-500">
        {time.toLocaleTimeString()}
      </p>
    </div>
  );
}