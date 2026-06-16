'use client';
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TE, W, RD } from "@/lib/theme";

const ff = "'Inter',sans-serif", ffH = "'Syne',sans-serif";

export default function MeetingRoom({ isJudge, nextPath, sessionId = "demo-session-1" }) {
  const router = useRouter();
  const role = isJudge ? "judge" : "candidate";

  const [secs, setSecs] = useState(1800);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Connecting…");
  const [recording, setRecording] = useState(false);
  const [screenshotFlash, setScreenshotFlash] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endedByOther, setEndedByOther] = useState(null); // null | "judge" | "candidate"

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const channelRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const screenshotTimersRef = useRef([]);
  const retryTimerRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let remoteDescSet = false;
    let pendingCandidates = [];

    async function start() {
      // 1. Camera + mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!mounted) return;
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // 2. Peer connection (direct browser-to-browser, no media server involved)
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      let mediaStarted = false;
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        // Safari doesn't reliably fire "connected" on connectionstatechange,
        // so we trigger here instead, the moment remote media actually arrives.
        if (!mediaStarted) {
          mediaStarted = true;
          setStatus("Connected");
          if (retryTimerRef.current) clearInterval(retryTimerRef.current);
          setRecording(true); // shown on both sides for consent transparency
          if (!isJudge) {
            // Only the candidate's browser actually records + captures screenshots.
            // This avoids two duplicate copies of the same conversation, and the
            // candidate's own mic gives the cleanest capture of their room audio.
            startRecording(stream, event.streams[0]);
            scheduleScreenshots();
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          setStatus("Connection lost");
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({ type: "broadcast", event: "ice-candidate", payload: { candidate: event.candidate, from: role } });
        }
      };

      // 3. Signaling over Supabase Realtime — text messages only, no media passes through this
      const channel = supabase.channel(`session-${sessionId}`);
      channelRef.current = channel;

      channel.on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (payload.from === role || pc.signalingState !== "stable") return;
        await pc.setRemoteDescription(payload.sdp);
        remoteDescSet = true;
        for (const c of pendingCandidates) { try { await pc.addIceCandidate(c); } catch (e) {} }
        pendingCandidates = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({ type: "broadcast", event: "answer", payload: { sdp: answer, from: role } });
      });

      channel.on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (payload.from === role || pc.signalingState !== "have-local-offer") return;
        await pc.setRemoteDescription(payload.sdp);
        remoteDescSet = true;
        for (const c of pendingCandidates) { try { await pc.addIceCandidate(c); } catch (e) {} }
        pendingCandidates = [];
      });

      channel.on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (payload.from === role) return;
        if (remoteDescSet) { try { await pc.addIceCandidate(payload.candidate); } catch (e) {} }
        else pendingCandidates.push(payload.candidate);
      });

      // Candidate's browser captured a screenshot — let the judge's screen know
      channel.on("broadcast", { event: "screenshot-taken" }, ({ payload }) => {
        if (payload.from === role) return;
        setScreenshotFlash(true);
        setTimeout(() => setScreenshotFlash(false), 2500);
      });

      // Either side ended the call — notify the other
      channel.on("broadcast", { event: "ended" }, ({ payload }) => {
        if (payload.from === role) return;
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setEndedByOther(payload.from);
      });

      channel.subscribe(async (subStatus) => {
        if (subStatus === "SUBSCRIBED" && isJudge) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          const payload = { sdp: offer, from: "judge" };
          channel.send({ type: "broadcast", event: "offer", payload });
          retryTimerRef.current = setInterval(() => {
            if (pc.connectionState === "connected") { clearInterval(retryTimerRef.current); return; }
            channel.send({ type: "broadcast", event: "offer", payload });
          }, 3000);
        }
      });
    }

    start();

    return () => {
      mounted = false;
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
      screenshotTimersRef.current.forEach(clearTimeout);
      pcRef.current?.close();
      channelRef.current?.unsubscribe();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [sessionId, isJudge]);

  // Countdown timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, []);

  async function startRecording(localStream, remoteStream) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      const dest = audioCtx.createMediaStreamDestination();
      if (localStream?.getAudioTracks().length) {
        audioCtx.createMediaStreamSource(new MediaStream(localStream.getAudioTracks())).connect(dest);
      }
      if (remoteStream?.getAudioTracks().length) {
        audioCtx.createMediaStreamSource(new MediaStream(remoteStream.getAudioTracks())).connect(dest);
      }
      // Safari doesn't support audio/webm — let the browser pick a format it actually supports
      const candidates = ["audio/webm", "audio/mp4", "audio/aac", ""];
      const mimeType = candidates.find(t => t === "" || MediaRecorder.isTypeSupported(t)) || "";
      const recorder = mimeType ? new MediaRecorder(dest.stream, { mimeType }) : new MediaRecorder(dest.stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      recorderRef.current = recorder;
    } catch (e) {
      console.error("Recording could not start:", e);
    }
  }

  function scheduleScreenshots() {
    const fastMode = typeof window !== "undefined" && window.location.search.includes("fast=1");
    const minGap = fastMode ? 2000 : 10000;      // minimum spacing — 10s in real mode
    const windowMs = fastMode ? 20000 : 25 * 60 * 1000;
    const count = 5 + Math.floor(Math.random() * 4); // 5–8 total

    let cursor = minGap; // first screenshot always lands exactly at minGap (10s in real mode)
    for (let i = 0; i < count && cursor <= windowMs; i++) {
      screenshotTimersRef.current.push(setTimeout(captureScreenshot, cursor));
      const room = windowMs - cursor;
      const extra = room > minGap ? Math.random() * (room - minGap) : 0;
      cursor = cursor + minGap + extra;
    }
  }

  async function captureScreenshot() {
    const videoEl = localVideoRef.current; // only the candidate's browser runs this — always its own feed
    if (!videoEl || videoEl.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth || 320;
    canvas.height = videoEl.videoHeight || 240;
    canvas.getContext("2d").drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const path = `${sessionId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("screenshots").upload(path, blob, { contentType: "image/jpeg" });
      if (error) {
        console.error("Screenshot upload failed:", error);
      } else {
        channelRef.current?.send({ type: "broadcast", event: "screenshot-taken", payload: { from: role } });
      }
    }, "image/jpeg", 0.8);
  }

  async function finalizeAndLeave() {
    setEnding(true);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      const stopped = new Promise(resolve => { recorderRef.current.onstop = resolve; });
      recorderRef.current.stop();
      await stopped;
      setRecording(false);
      const mimeType = recorderRef.current.mimeType || "audio/webm";
      const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("aac") ? "aac" : "webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (blob.size > 0) {
        const path = `${sessionId}/audio-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("recordings").upload(path, blob, { contentType: mimeType });
        if (error) console.error("Audio upload failed:", error);
      }
    }
    screenshotTimersRef.current.forEach(clearTimeout);
    pcRef.current?.close();
    channelRef.current?.unsubscribe();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    router.push(nextPath);
  }

  async function endSession() {
    channelRef.current?.send({ type: "broadcast", event: "ended", payload: { from: role } });
    await finalizeAndLeave();
  }

  function toggleMute() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    const next = !muted;
    if (track) track.enabled = !next;
    setMuted(next);
  }

  function toggleCam() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    const next = !camOff;
    if (track) track.enabled = !next;
    setCamOff(next);
  }

  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (endedByOther) {
    return (
      <div style={{ background: "#0f172a", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: ff, color: W, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 30 }}>📞</div>
        <h2 style={{ fontFamily: ffH, fontSize: 22, fontWeight: 700, margin: 0 }}>
          {endedByOther === "judge" ? "The judge ended the interview" : "The candidate ended the interview"}
        </h2>
        <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 360, lineHeight: 1.6 }}>
          {isJudge
            ? "You can continue to scoring whenever you're ready."
            : "Thank you for your time. Your results will be sent to the company HR within 24 hours."}
        </p>
        <button onClick={finalizeAndLeave} style={{ marginTop: 8, padding: "12px 28px", borderRadius: 24, background: TE, border: "none", cursor: "pointer", color: W, fontWeight: 600, fontSize: 14, fontFamily: ff }}>
          {isJudge ? "Continue to scoring" : "Continue"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", display: "flex", flexDirection: "column", padding: 16, gap: 12, fontFamily: ff }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: ffH, fontWeight: 800, fontSize: 16, color: TE }}>Δ PeerProof session</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: status === "Connected" ? "#4ade80" : "#fbbf24" }}>{status}</span>
          {recording && (
            <span style={{ background: RD + "22", color: "#fca5a5", border: `1px solid ${RD}44`, borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>● Audio recording</span>
          )}
          {isJudge && screenshotFlash && (
            <span style={{ background: TE + "22", color: TE, border: `1px solid ${TE}44`, borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>📸 Screenshot captured</span>
          )}
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "5px 14px", color: W, fontSize: 15, fontFamily: ffH, fontWeight: 700 }}>{fmt(secs)}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: isJudge ? "1fr 1fr 240px" : "1fr 1fr", gap: 10, minHeight: 300 }}>
        <div style={{ background: "#1e293b", borderRadius: 14, overflow: "hidden", position: "relative" }}>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "#00000066", borderRadius: 5, padding: "2px 7px", fontSize: 11, color: "#e2e8f0" }}>{isJudge ? "Candidate" : "Anonymous peer reviewer"}</div>
        </div>
        <div style={{ background: "#1a3554", borderRadius: 14, overflow: "hidden", position: "relative", border: `2px solid ${TE}` }}>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "#00000066", borderRadius: 5, padding: "2px 7px", fontSize: 11, color: "#e2e8f0" }}>You</div>
        </div>
        {isJudge && (
          <div style={{ background: "#1e293b", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 11, color: TE, fontWeight: 600, margin: 0 }}>SESSION NOTES</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note key observations during the session..." style={{ flex: 1, background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 8, padding: 10, color: "#e2e8f0", fontSize: 12, fontFamily: ff, resize: "none", minHeight: 220 }} />
            <p style={{ fontSize: 10, color: "#475569", margin: 0 }}>Notes are private and expire after scoring</p>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        <button onClick={toggleMute} style={{ width: 48, height: 48, borderRadius: "50%", background: muted ? RD : "#1e293b", border: "none", cursor: "pointer", fontSize: 18 }}>{muted ? "🔇" : "🎤"}</button>
        <button onClick={toggleCam} style={{ width: 48, height: 48, borderRadius: "50%", background: camOff ? RD : "#1e293b", border: "none", cursor: "pointer", fontSize: 18 }}>{camOff ? "🚫" : "📷"}</button>
        <button onClick={endSession} disabled={ending} style={{ padding: "0 24px", height: 48, borderRadius: 24, background: RD, border: "none", cursor: ending ? "default" : "pointer", color: W, fontWeight: 600, fontSize: 14, fontFamily: ff, opacity: ending ? 0.6 : 1 }}>{ending ? "Saving…" : "End session"}</button>
      </div>
    </div>
  );
}
