'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation'

export default function Home() {
  const [room, setRoom] = useState("teste");
  const [disabled, setDisabled] = useState(true)
  const { push } = useRouter()

  const joinCall = () => {
    push(`/${room}`);
  };

  useEffect(() => {

    if (room) {
      setDisabled(false)
    } else {
      setDisabled(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])

  return (
    <main className="flex min-h-screen items-center justify-center p-10 gap-4">

      <div className="flex flex-col p-10 gap-4">
        <div className="flex flex-col gap-2">
          <label>Room Name:  </label>
          <input
            type="text"
            placeholder="Enter room name"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="border border-gray-300 text-black rounded p-2"
          />
        </div>

        <button disabled={disabled} onClick={joinCall} className={`hover:bg-green-700 bg-green-500 text-white font-bold py-2 px-4 rounded disabled:opacity-75`}>
          Join Call
        </button>
      </div>

    </main>
  );
}
