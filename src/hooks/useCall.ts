"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getPusherClient, CHANNELS, EVENTS } from "@/lib/pusher";
import type { CallType, CallState, CallOffer, CallAnswer, CallIcePayload, IUser } from "@/types";
import { v4 as uuidv4 } from "uuid";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export interface ActiveCall {
  callId: string;
  peerId: string;
  peerUser: IUser;
  type: CallType;
  state: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCamOff: boolean;
}

export function useCall(currentUserId: string, token: string) {
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallOffer | null>(null);

  const pcRef        = useRef<RTCPeerConnection | null>(null);
  const localRef     = useRef<MediaStream | null>(null);
  const remoteRef    = useRef<MediaStream | null>(null);
  const pendingIce   = useRef<RTCIceCandidateInit[]>([]);
  const currentCallId = useRef<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const signal = useCallback(
    async (userId: string, event: string, payload: object) => {
      await fetch(`/api/calls/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event, payload }),
      });
    },
    [token]
  );

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    remoteRef.current = null;
    pendingIce.current = [];
    currentCallId.current = null;
    setCall(null);
    setIncomingCall(null);
  }, []);

  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && currentCallId.current) {
        const peerId = call?.peerId;
        if (peerId) {
          signal(peerId, "ice", {
            callId: currentCallId.current,
            candidate: e.candidate.toJSON(),
          });
        }
      }
    };

    pc.ontrack = (e) => {
      remoteRef.current = e.streams[0];
      setCall((prev) => prev ? { ...prev, remoteStream: e.streams[0] } : prev);
    };

    pcRef.current = pc;
    return pc;
  }, [call?.peerId, signal]);

  // ── Initiate a call ────────────────────────────────────────────────────────
  const startCall = useCallback(
    async (peerUser: IUser, type: CallType) => {
      if (call) return; // already in call

      const callId = uuidv4();
      currentCallId.current = callId;

      const constraints = { audio: true, video: type === "video" };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localRef.current = stream;

      const pc = createPC();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const newCall: ActiveCall = {
        callId,
        peerId: peerUser._id,
        peerUser,
        type,
        state: "calling",
        localStream: stream,
        remoteStream: null,
        isMuted: false,
        isCamOff: false,
      };
      setCall(newCall);

      await signal(peerUser._id, "offer", {
        callId,
        type,
        sdp: offer,
        from: { _id: currentUserId },
      });
    },
    [call, createPC, currentUserId, signal]
  );

  // ── Answer an incoming call ────────────────────────────────────────────────
  const answerCall = useCallback(
    async (incoming: CallOffer) => {
      currentCallId.current = incoming.callId;

      const constraints = { audio: true, video: incoming.type === "video" };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localRef.current = stream;

      const pc = createPC();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incoming.sdp));

      // Flush pending ICE
      for (const c of pendingIce.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingIce.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setCall({
        callId: incoming.callId,
        peerId: incoming.from._id,
        peerUser: incoming.from,
        type: incoming.type,
        state: "active",
        localStream: stream,
        remoteStream: null,
        isMuted: false,
        isCamOff: false,
      });
      setIncomingCall(null);

      await signal(incoming.from._id, "answer", {
        callId: incoming.callId,
        sdp: answer,
      });
    },
    [createPC, signal]
  );

  // ── Reject incoming ────────────────────────────────────────────────────────
  const rejectCall = useCallback(
    async (incoming: CallOffer) => {
      await signal(incoming.from._id, "rejected", { callId: incoming.callId });
      setIncomingCall(null);
    },
    [signal]
  );

  // ── End / hang up ──────────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    if (call) {
      await signal(call.peerId, "ended", { callId: call.callId });
    }
    cleanup();
  }, [call, cleanup, signal]);

  // ── Toggle mute / cam ─────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    localRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCall((prev) => prev ? { ...prev, isMuted: !prev.isMuted } : prev);
  }, []);

  const toggleCam = useCallback(() => {
    localRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCall((prev) => prev ? { ...prev, isCamOff: !prev.isCamOff } : prev);
  }, []);

  // ── Pusher listener for incoming signals ──────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    const pusher = getPusherClient();
    const ch = pusher.subscribe(CHANNELS.user(currentUserId));

    // Incoming call offer
    ch.bind(EVENTS.CALL_OFFER, (data: CallOffer) => {
      if (call) {
        // Already in a call — send busy
        signal(data.from._id, "busy", { callId: data.callId });
        return;
      }
      setIncomingCall(data);
    });

    // Peer answered our offer
    ch.bind(EVENTS.CALL_ANSWER, async (data: CallAnswer) => {
      if (!pcRef.current || data.callId !== currentCallId.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      for (const c of pendingIce.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingIce.current = [];
      setCall((prev) => prev ? { ...prev, state: "active" } : prev);
    });

    // ICE candidate from peer
    ch.bind(EVENTS.CALL_ICE, async (data: CallIcePayload) => {
      if (!pcRef.current || data.callId !== currentCallId.current) return;
      if (pcRef.current.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } else {
        pendingIce.current.push(data.candidate);
      }
    });

    // Peer ended the call
    ch.bind(EVENTS.CALL_ENDED, () => {
      cleanup();
    });

    // Peer rejected our call
    ch.bind(EVENTS.CALL_REJECTED, () => {
      cleanup();
    });

    // Peer is busy
    ch.bind(EVENTS.CALL_BUSY, () => {
      cleanup();
    });

    return () => {
      ch.unbind_all();
      pusher.unsubscribe(CHANNELS.user(currentUserId));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  return {
    call,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCam,
  };
}
