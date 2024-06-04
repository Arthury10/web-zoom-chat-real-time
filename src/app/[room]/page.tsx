'use client';

import Meet from "@/components/Meet";
import storage from "@/helpers/localStorage";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useEffect, useState } from "react";

interface PageProps {
  params: {
    room: string
  }
}

export default function Page({ params: { room } }: PageProps) {

  const [name, setName] = useState<string>('');

  const [disabled, setDisabled] = useState(true)


  const createName = () => {
    setDisabled(false)
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-10">
      {!disabled ? (
        <Meet name={name} room={room} />
      ) : (
        <div className="flex items-end justify-center gap-4">
          <div className="flex flex-col gap-2">
            <label>Name:  </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 text-black rounded p-2"
            />
          </div>
          <button onClick={createName} className={`hover:bg-green-700 bg-green-500 text-white font-bold py-2 px-4 rounded disabled:opacity-75`}>
            Join
          </button>
        </div>
      )}
    </main>
  );
}
