'use client';

import { useWebRTC } from "@/hooks/useWebRTC";
import { useState } from "react";

interface MeetProps {
  room: string,
  name: string
}

export default function Meet({ room, name }: MeetProps) {

  const [message, setMessage] = useState("");

  const {
    localVideoRef,
    messages,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    sendMessage,
  } = useWebRTC(room, name);

  const handleSendMessage = () => {
    sendMessage(message);
    setMessage("");
  };

  return (
    <>
      <h1 className="text-4xl font-bold">New Xoom</h1>
      <p>Name: {name}</p>
      <p>Room Name: {room}</p>

      <div className="w-full h-full flex justify-between items-start bg-red-400 rounded-lg">

        <div className="flex items-start gap-2 justify-center flex-wrap p-4" id='videos'>
          <video ref={localVideoRef} autoPlay muted className="w-[300px] h-auto rounded-md"></video>
        </div>

        <div className="flex flex-col items-center w-[400px] bg-gray-400 h-full p-1 rounded-r-lg">
          <div className="flex flex-col items-center h-[600px] w-full overflow-auto">
            {messages.map((message, index) => (
              <div key={index} className="border border-gray-300 rounded p-2 w-full">
                <p><span className="font-bold">{message.user}: </span> {message?.message} </p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-5 w-full">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border border-gray-300 text-black rounded p-2 w-full"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded h-full"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mt-4">
        <button onClick={toggleVideo} className={`bg-${isVideoEnabled ? 'red' : 'green'}-500 hover:bg-${isVideoEnabled ? 'red' : 'green'}-700 text-white font-bold py-2 px-4 rounded`}>
          {isVideoEnabled ? 'Stop Video' : 'Start Video'}
        </button>
        <button onClick={toggleAudio} className={`bg-${isAudioEnabled ? 'red' : 'green'}-500 hover:bg-${isAudioEnabled ? 'red' : 'green'}-700 text-white font-bold py-2 px-4 rounded`}>
          {isAudioEnabled ? 'Mute' : 'Unmute'}
        </button>
      </div>

    </>
  );
}
