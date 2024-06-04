import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("ws://localhost:4000");

type MessageType = {
  message: string;
  user: string;
};

export const useWebRTC = (room: string, name: string) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [id: string]: HTMLVideoElement }>({});
  const [remoteVideoElements, setRemoteVideoElements] = useState<string[]>([]);
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startStream = async () => {
      try {
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
        }
        socket.emit("join-room", room, name);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };

    const setupPeerConnection = (socketId: string) => {
      if (peerConnections.current[socketId]) {
        return peerConnections.current[socketId];
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("candidate", room, event.candidate, socketId);
        }
      };

      pc.ontrack = (event) => {
        if (!remoteVideoRefs.current[socketId]) {
          const videoElement = document.createElement('video');
          videoElement.srcObject = event.streams[0];
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          videoElement.className = "w-[300px] h-auto rounded-md";

          remoteVideoRefs.current[socketId] = videoElement;
          setRemoteVideoElements((prev) => [...prev, socketId]);

          const videosContainer = document.getElementById('videos');
          if (videosContainer) {
            videosContainer.appendChild(videoElement);
          }
        }
      };

      if (localStream.current) {
        localStream.current.getTracks().forEach(track => {
          pc.addTrack(track, localStream.current!);
        });
      }

      peerConnections.current[socketId] = pc;
      return pc;
    };

    socket.on("user-connected", async (socketId) => {
      const pc = setupPeerConnection(socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", room, offer, socketId);
    });

    socket.on("offer", async (socketId, description) => {
      const pc = setupPeerConnection(socketId);
      await pc.setRemoteDescription(description);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", room, answer, socketId);
    });

    socket.on("answer", async (socketId, description) => {
      const pc = peerConnections.current[socketId];
      if (pc) {
        await pc.setRemoteDescription(description);
      }
    });

    socket.on("candidate", async (socketId, candidate) => {
      const pc = peerConnections.current[socketId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("user-disconnected", (socketId) => {
      const pc = peerConnections.current[socketId];
      if (pc) {
        pc.close();
        delete peerConnections.current[socketId];
        const videoElement = remoteVideoRefs.current[socketId];
        if (videoElement) {
          videoElement.remove();
        }
        delete remoteVideoRefs.current[socketId];
        setRemoteVideoElements((prev) => prev.filter(id => id !== socketId));
      }
    });

    startStream();

    return () => {
      socket.off("receiveMessage");
      socket.off("user-connected");
      socket.off("offer");
      socket.off("answer");
      socket.off("candidate");
      socket.off("user-disconnected");
    };
  }, [room]);

  const toggleAudio = () => {
    setIsAudioEnabled((prev) => {
      const enabled = !prev;
      if (localStream.current) {
        console.log("Toggling audio. Current state:", localStream.current.getAudioTracks().map(track => track.enabled));
        localStream.current.getAudioTracks().forEach((track) => {
          track.enabled = enabled;
          console.log(`Audio track ${track.id} enabled: ${track.enabled}`);
        });
      }
      return enabled;
    });
  };

  const toggleVideo = () => {
    setIsVideoEnabled((prev) => {
      const enabled = !prev;
      if (localStream.current) {
        localStream.current.getVideoTracks().forEach((track) => (track.enabled = enabled));
      }
      return enabled;
    });
  };

  const sendMessage = (message: string) => {
    socket.emit("sendMessage", room, message);
  };

  return {
    localVideoRef,
    remoteVideoRefs,
    remoteVideoElements,
    messages,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    sendMessage,
  };
};
