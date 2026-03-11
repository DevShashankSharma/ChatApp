import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SimplePeer from 'simple-peer'
import { useAuthStore } from '../store/useAuthStore'
import { Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, LogOut } from 'lucide-react'

const Video = ({ stream, muted = false }) => {
  const ref = useRef()
  useEffect(() => {
    if (!ref.current) return
    try {
      ref.current.srcObject = stream || null
      // attempt to play (some browsers require user gesture; handle promise)
      const p = ref.current.play && ref.current.play()
      if (p && p.catch) p.catch(() => {})
    } catch (e) {
      console.warn('Video attach/play failed', e)
    }
  }, [stream])
  return <video ref={ref} autoPlay playsInline muted={muted} className="w-full h-48 object-cover rounded" />
}

const MeetingRoom = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const socket = useAuthStore((s) => s.socket)
  const authUser = useAuthStore((s) => s.authUser)

  const localStreamRef = useRef(null)
  const [peers, setPeers] = useState({}) // { socketId: { peer, stream } }
  const peersRef = useRef({})
  const audioElsRef = useRef([])
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const screenStreamRef = useRef(null)

  useEffect(() => {
    if (!authUser) {
      navigate('/login')
      return
    }

    let mounted = true

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localStreamRef.current = stream
        // register handlers BEFORE emitting join to avoid race
        socket.on('allParticipants', ({ participants }) => {
          console.debug('[meeting] allParticipants', participants)
          // create peers as initiator for each existing participant
          participants.forEach((socketId) => {
            const peer = new SimplePeer({ initiator: true, trickle: false, stream })
            peer.on('signal', (signal) => {
              console.debug('[meeting] sending signal to', socketId)
              socket.emit('signal', { to: socketId, signal })
            })
            peer.on('stream', (remoteStream) => {
              console.debug('[meeting] got remote stream from', socketId)
              addPeer(socketId, peer, remoteStream)
            })
            peersRef.current[socketId] = { peer }
            setPeers((p) => ({ ...p, [socketId]: { peer, stream: null } }))
          })
        })

        socket.on('newParticipant', ({ socketId }) => {
          // new participant joined; we will wait for their signal and respond when received
        })

        socket.on('signal', ({ from, signal }) => {
          console.debug('[meeting] signal from', from)
          // if peer exists, signal it, else create as non-initiator
          if (peersRef.current[from]?.peer) {
            peersRef.current[from].peer.signal(signal)
          } else {
            const peer = new SimplePeer({ initiator: false, trickle: false, stream })
            peer.on('signal', (sig) => {
              console.debug('[meeting] replying signal to', from)
              socket.emit('signal', { to: from, signal: sig })
            })
            peer.on('stream', (remoteStream) => {
              console.debug('[meeting] got remote stream (non-initiator) from', from)
              addPeer(from, peer, remoteStream)
            })
            peer.signal(signal)
            peersRef.current[from] = { peer }
            setPeers((p) => ({ ...p, [from]: { peer, stream: null } }))
          }
        })

        socket.on('participantLeft', ({ socketId }) => {
          removePeer(socketId)
        })

        // now join
        socket.emit('joinMeeting', { roomId: id })

      } catch (error) {
        console.error('getUserMedia error', error)
        alert('Could not access camera/microphone')
        navigate('/')
      }
    }

    start()

    return () => {
      mounted = false
      // leave meeting
      if (socket) socket.emit('leaveMeeting', { roomId: id })
      // cleanup peers
      Object.values(peersRef.current).forEach(({ peer }) => peer.destroy && peer.destroy())
      peersRef.current = {}
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (screenStreamRef.current) {
        try { screenStreamRef.current.getTracks().forEach(t => t.stop()) } catch(e) {}
        screenStreamRef.current = null
      }
      // cleanup audio elements
      audioElsRef.current.forEach(a => { try { a.pause(); a.srcObject = null; a.remove() } catch(e) {} })
      audioElsRef.current = []
    }
  }, [id, socket, authUser, navigate])

  const addPeer = (socketId, peer, stream) => {
    peersRef.current[socketId] = { peer, stream }
    setPeers((p) => ({ ...p, [socketId]: { peer, stream } }))
    if (stream) {
      try {
        const audio = document.createElement('audio')
        audio.autoplay = true
        audio.playsInline = true
        audio.srcObject = stream
        audio.style.display = 'none'
        document.body.appendChild(audio)
        audioElsRef.current.push(audio)
        const p = audio.play && audio.play()
        if (p && p.catch) p.catch(() => {})
      } catch (e) {
        console.warn('failed to create audio element', e)
      }
    }
  }

  const removePeer = (socketId) => {
    const entry = peersRef.current[socketId]
    if (entry?.peer) entry.peer.destroy && entry.peer.destroy()
    delete peersRef.current[socketId]
    setPeers((p) => {
      const copy = { ...p }
      delete copy[socketId]
      return copy
    })
  }

    const toggleAudio = () => {
      const stream = localStreamRef.current
      if (!stream) return
      stream.getAudioTracks().forEach(t => t.enabled = !audioEnabled)
      setAudioEnabled(!audioEnabled)
    }

    const toggleVideo = () => {
      const stream = localStreamRef.current
      if (!stream) return
      stream.getVideoTracks().forEach(t => t.enabled = !videoEnabled)
      setVideoEnabled(!videoEnabled)
    }

    const startScreenShare = async () => {
      try {
        const s = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = s.getVideoTracks()[0]
        // replace track on peers
        const oldTrack = localStreamRef.current?.getVideoTracks()[0]
        Object.values(peersRef.current).forEach(({ peer }) => {
          try { peer.replaceTrack && peer.replaceTrack(oldTrack, screenTrack, localStreamRef.current) } catch(e) { /* ignore */ }
        })
        // stop local video track and set local stream to include screen
        screenStreamRef.current = s
        setScreenSharing(true)
        // when screen share stops, revert
        screenTrack.onended = async () => {
          await stopScreenShare()
        }
      } catch (error) {
        console.error('screen share failed', error)
      }
    }

    const stopScreenShare = async () => {
      const screen = screenStreamRef.current
      if (!screen) return
      const screenTrack = screen.getVideoTracks()[0]
      screenTrack.stop()
      screenStreamRef.current = null
      // attempt to restore camera video
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const newTrack = camStream.getVideoTracks()[0]
        const oldTrack = localStreamRef.current?.getVideoTracks()[0]
        Object.values(peersRef.current).forEach(({ peer }) => {
          try { peer.replaceTrack && peer.replaceTrack(oldTrack, newTrack, localStreamRef.current) } catch(e) { /* ignore */ }
        })
        // replace localStreamRef current tracks
        localStreamRef.current.getVideoTracks().forEach(t => t.stop())
        localStreamRef.current.addTrack(newTrack)
      } catch (err) {
        console.error('restore camera failed', err)
      }
      setScreenSharing(false)
    }

    const leaveMeeting = () => {
      if (socket) socket.emit('leaveMeeting', { roomId: id })
      Object.values(peersRef.current).forEach(({ peer }) => peer.destroy && peer.destroy())
      peersRef.current = {}
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
        localStreamRef.current = null
      }
      if (screenStreamRef.current) {
        try { screenStreamRef.current.getTracks().forEach(t => t.stop()) } catch(e) {}
        screenStreamRef.current = null
        setScreenSharing(false)
      }
      // cleanup audio elements created for remote streams
      audioElsRef.current.forEach(a => { try { a.pause(); a.srcObject = null; a.remove() } catch(e) {} })
      audioElsRef.current = []
      setPeers({})
      navigate('/meeting')
    }

    const tiles = []
    if (localStreamRef.current) {
      tiles.push({ id: 'me', stream: localStreamRef.current, local: true })
    }
    Object.entries(peers).forEach(([k, v]) => tiles.push({ id: k, stream: v.stream, local: false }))

    return (
      <div className="min-h-screen p-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="flex gap-2">
              <button className="btn btn-sm" onClick={toggleAudio} aria-pressed={!audioEnabled}>
                {audioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
              <button className="btn btn-sm" onClick={toggleVideo} aria-pressed={!videoEnabled}>
                {videoEnabled ? <VideoIcon size={16} /> : <VideoOff size={16} />}
              </button>
              {!screenSharing ? (
                <button className="btn btn-sm" onClick={startScreenShare}><Monitor size={16} /></button>
              ) : (
                <button className="btn btn-sm" onClick={stopScreenShare}>Stop Share</button>
              )}
            </div>
            <div className="ml-auto">
              <button className="btn btn-sm btn-error" onClick={leaveMeeting}><LogOut size={16} /> Leave</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tiles.map((t) => (
              <div key={t.id} className="relative bg-base-100 rounded overflow-hidden">
                <Video stream={t.stream} muted={t.local} />
                <div className="absolute left-2 bottom-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
                  <span className="font-medium">{t.local ? (authUser?.name || authUser?.username || 'You') : t.id}</span>
                  {t.local && (
                    <>
                      {audioEnabled ? <Mic size={12} /> : <MicOff size={12} />}
                      {videoEnabled ? <VideoIcon size={12} /> : <VideoOff size={12} />}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
}

export default MeetingRoom
