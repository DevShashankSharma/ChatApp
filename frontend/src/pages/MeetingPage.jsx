import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

const MeetingPage = () => {
  const [roomId, setRoomId] = useState('')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-base-100 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Start or Join Meeting</h2>
        <div className="flex gap-2">
          <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Enter room id" className="input flex-1" />
          <button className="btn" onClick={() => navigate(`/meeting/${roomId}`)} disabled={!roomId}>Join</button>
        </div>
        <div className="divider">or</div>
        <button className="btn btn-primary w-full" onClick={() => navigate(`/meeting/${uuidv4()}`)}>Create Meeting</button>
      </div>
    </div>
  )
}

export default MeetingPage
