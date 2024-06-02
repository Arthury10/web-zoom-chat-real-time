'use client';

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("ws://154.56.41.117:4000");

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected");
    });

    socket.on("disconnect", () => {
      console.log("disconnected");
    });

    socket.on("offer", async (id, description) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(description);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", id, peerConnection.current.localDescription);
      }
    });

    socket.on("answer", (description) => {
      if (peerConnection.current) {
        peerConnection.current.setRemoteDescription(description);
      }
    });

    socket.on("candidate", (id, candidate) => {
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      socket.off("receiveMessage");
      socket.off("offer");
      socket.off("answer");
      socket.off("candidate");
    };
  }, []);

  const setupWebRTC = async () => {
    peerConnection.current = new RTCPeerConnection();

    peerConnection.current.onicecandidate = event => {
      if (event.candidate) {
        socket.emit("candidate", event.candidate);
      }
    };

    peerConnection.current.ontrack = event => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    localStream.current = await navigator.mediaDevices.getUserMedia({ video: isVideoEnabled, audio: isAudioEnabled });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream.current;
    }

    localStream.current.getTracks().forEach(track => {
      if (peerConnection.current && localStream.current) {
        peerConnection.current.addTrack(track, localStream.current);
      }
    });

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit("offer", offer);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => {
      const enabled = !prev;
      if (localStream.current) {
        localStream.current.getAudioTracks().forEach(track => track.enabled = enabled);
      }
      return enabled;
    });
  };

  const toggleVideo = () => {
    setIsVideoEnabled(prev => {
      const enabled = !prev;
      if (localStream.current) {
        localStream.current.getVideoTracks().forEach(track => track.enabled = enabled);
      }
      return enabled;
    });
  };

  const startCall = () => {
    setupWebRTC();
  };

  const sendMessage = () => {
    socket.emit("sendMessage", message);
    setMessage("");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-10">
      <h1 className="text-4xl font-bold">New Xoom</h1>

      <div className="w-full h-full flex justify-between items-start bg-red-400 rounded-lg">
        <div className="flex items-start gap-2 justify-center flex-wrap">
          <video ref={remoteVideoRef} autoPlay className="w-[600px] h-auto rounded-md"></video>
          <video ref={localVideoRef} autoPlay muted className="w-[200px] h-auto rounded-md"></video>
        </div>

        <div className="flex flex-col items-center w-[400px] bg-gray-400 h-full p-1 rounded-r-lg">
          <div className="flex flex-col items-center h-[600px] w-full overflow-auto">
            {messages.map((msg, index) => (
              <div key={index} className="border border-gray-300 rounded p-2 w-full">
                {msg}
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
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded h-full"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mt-4">
        <button onClick={startCall} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Start Call
        </button>
        <button onClick={toggleVideo} className={`bg-${isVideoEnabled ? 'red' : 'green'}-500 hover:bg-${isVideoEnabled ? 'red' : 'green'}-700 text-white font-bold py-2 px-4 rounded`}>
          {isVideoEnabled ? 'Stop Video' : 'Start Video'}
        </button>
        <button onClick={toggleAudio} className={`bg-${isAudioEnabled ? 'red' : 'green'}-500 hover:bg-${isAudioEnabled ? 'red' : 'green'}-700 text-white font-bold py-2 px-4 rounded`}>
          {isAudioEnabled ? 'Mute' : 'Unmute'}
        </button>
      </div>
    </main>
  );
}
