import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';

const VideoCall = ({ socket, roomId, userName, participants, setParticipants }) => {
    const [peers, setPeers] = useState([]);
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [sharingUserId, setSharingUserId] = useState(null);
    const userVideo = useRef();
    const peersRef = useRef([]);
    const streamRef = useRef();

    useEffect(() => {
        if (!socket) return;
        let isMounted = true;

        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!isMounted) return;
                streamRef.current = stream;
                if (userVideo.current) userVideo.current.srcObject = stream;

                socket.on("all-users", usersData => {
                    const newPeers = [];
                    usersData.forEach(user => {
                        const peer = createPeer(user.id, socket.id, stream);
                        peersRef.current.push({ peerID: user.id, peer });
                        newPeers.push({ peerID: user.id, peer });
                        setParticipants(prev => ({ ...prev, [user.id]: user.name }));
                    });
                    setPeers(newPeers);
                });

                socket.on("user-joined", payload => {
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    peersRef.current.push({ peerID: payload.callerID, peer });
                    setPeers(users => [...users, { peerID: payload.callerID, peer }]);
                    // Name is handled by Room.jsx socket listener for 'user-connected'
                });

                socket.on("receiving-returned-signal", payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    if (item) item.peer.signal(payload.signal);
                });

                socket.on("user-disconnected", userId => {
                    const item = peersRef.current.find(p => p.peerID === userId);
                    if (item) item.peer.destroy();
                    peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
                    setPeers(prevPeers => prevPeers.filter(p => p.peerID !== userId));
                });

                socket.on("user-started-sharing", userId => {
                    setSharingUserId(userId);
                    console.log(`[VideoCall] User ${userId} started sharing screen`);
                });

                socket.on("user-stopped-sharing", userId => {
                    setSharingUserId(null);
                    console.log(`[VideoCall] User ${userId} stopped sharing`);
                });

                socket.emit('request-all-users', roomId);

            } catch (err) {
                console.error("Camera access failed:", err);
            }
        };

        init();

        return () => {
            isMounted = false;
            peersRef.current.forEach(p => p.peer.destroy());
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            socket.off("all-users");
            socket.off("user-joined");
            socket.off("receiving-returned-signal");
            socket.off("user-disconnected");
            socket.off("user-started-sharing");
            socket.off("user-stopped-sharing");
        };
    }, [socket, roomId]);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({ initiator: true, trickle: false, stream });
        peer.on("signal", signal => {
            socket.emit("signal", { userToSignal, callerID, signal });
        });
        peer.on("stream", remoteStream => {
            const peerObj = peersRef.current.find(p => p.peer === peer);
            if (peerObj) peerObj.stream = remoteStream;
        });
        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({ initiator: false, trickle: false, stream });
        peer.on("signal", signal => {
            socket.emit("returning-signal", { signal, callerID });
        });
        peer.on("stream", remoteStream => {
            const peerObj = peersRef.current.find(p => p.peer === peer);
            if (peerObj) peerObj.stream = remoteStream;
        });
        peer.signal(incomingSignal);
        return peer;
    }

    const toggleAudio = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setVideoOff(!videoTrack.enabled);
            }
        }
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            if (streamRef.current) {
                const videoTrack = streamRef.current.getVideoTracks()[0];
                peersRef.current.forEach(({ peer }) => {
                    peer.replaceTrack(videoTrack, screenTrack, streamRef.current);
                });
                videoTrack.stop();
                streamRef.current.removeTrack(videoTrack);
                streamRef.current.addTrack(screenTrack);

                if (userVideo.current) userVideo.current.srcObject = screenStream;

                setIsScreenSharing(true);
                setSharingUserId(socket.id);
                socket.emit('start-sharing', { roomId });

                screenTrack.onended = () => {
                    stopScreenShare();
                };
            }
        } catch (err) {
            console.error("Failed to share screen:", err);
        }
    };

    const stopScreenShare = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const newVideoTrack = newStream.getVideoTracks()[0];
            const currentScreenTrack = streamRef.current.getVideoTracks()[0];

            if (streamRef.current) {
                peersRef.current.forEach(({ peer }) => {
                    peer.replaceTrack(currentScreenTrack, newVideoTrack, streamRef.current);
                });
                currentScreenTrack.stop();
                streamRef.current.removeTrack(currentScreenTrack);
                streamRef.current.addTrack(newVideoTrack);

                if (userVideo.current) userVideo.current.srcObject = newStream;

                setIsScreenSharing(false);
                setSharingUserId(null);
                socket.emit('stop-sharing', { roomId });
            }
        } catch (err) {
            console.error("Failed to stop screen share:", err);
        }
    };

    // Re-apply local stream whenever the sharing state changes (since elements might remount)
    useEffect(() => {
        if (streamRef.current && userVideo.current) {
            userVideo.current.srcObject = streamRef.current;
        }
    }, [sharingUserId, isScreenSharing]);

    // Calculate grid layout based on number of participants
    const totalUsers = peers.length + 1;
    // Simple dynamic grid logic or flex wrap

    return (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Controls Bar */}
            <div style={{
                padding: '15px 25px',
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                marginBottom: '20px',
                border: '1px solid var(--border-color)',
                width: 'fit-content',
                alignSelf: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
                <button
                    onClick={toggleAudio}
                    className="video-control-btn"
                    style={{
                        padding: '12px',
                        borderRadius: '50%',
                        border: 'none',
                        background: muted ? '#ef4444' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        width: '56px',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s'
                    }}
                    title={muted ? "Unmute" : "Mute"}
                >
                    <i className={`fas ${muted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                </button>
                <button
                    onClick={toggleVideo}
                    className="video-control-btn"
                    style={{
                        padding: '12px',
                        borderRadius: '50%',
                        border: 'none',
                        background: videoOff ? '#ef4444' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        width: '56px',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s'
                    }}
                    title={videoOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                    <i className={`fas ${videoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
                </button>
                <div style={{ width: '2px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />
                <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className="video-control-btn"
                    style={{
                        padding: '12px 24px',
                        borderRadius: '16px',
                        border: 'none',
                        background: isScreenSharing ? '#ef4444' : 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                >
                    <i className={`fas ${isScreenSharing ? 'fa-stop-circle' : 'fa-desktop'}`}></i>
                    {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                </button>
            </div>

            {/* Video Layout */}
            <div style={{
                flex: 1,
                display: 'flex',
                gap: '20px',
                padding: '10px',
                flexDirection: sharingUserId ? 'column' : 'row',
                overflow: 'hidden'
            }}>
                {/* Hero View (Main Screen Share) */}
                {sharingUserId && (
                    <div style={{ flex: 1, position: 'relative', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#000', border: '2px solid var(--primary-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        {sharingUserId === socket.id ? (
                            <video muted ref={userVideo} autoPlay playsInline style={{ width: "100%", height: '100%', objectFit: 'contain' }} />
                        ) : (
                            peers.find(p => p.peerID === sharingUserId) && (
                                <Video peer={peers.find(p => p.peerID === sharingUserId).peer} isShare={true} />
                            )
                        )}
                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '12px', color: 'white', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-desktop" style={{ color: 'var(--primary-color)' }}></i>
                            {sharingUserId === socket.id ? 'You are sharing' : `${participants[sharingUserId] || 'Someone'} is sharing`}
                        </div>
                    </div>
                )}

                {/* Participant Strip/Grid - Hidden during screen share */}
                {!sharingUserId && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: totalUsers === 1 ? '1fr' : totalUsers <= 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '20px',
                        width: '100%',
                        height: '100%',
                        alignContent: 'center'
                    }}>
                        {/* Me */}
                        <div className="video-tile" style={{ position: 'relative', width: '100%', minHeight: '350px', backgroundColor: '#0f172a', borderRadius: '24px', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
                            <video muted ref={userVideo} autoPlay playsInline style={{ width: "100%", height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '10px', color: 'white', fontSize: '0.8rem', fontWeight: '600' }}>{userName}</div>
                        </div>

                        {/* Peers */}
                        {peers.map(peer => (
                            <div key={peer.peerID} className="video-tile" style={{ position: 'relative', width: '100%', minHeight: '350px', backgroundColor: '#0f172a', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                <Video peer={peer.peer} />
                                <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '10px', color: 'white', fontSize: '0.8rem', fontWeight: '600' }}>{participants[peer.peerID] || 'Anonymous'}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .video-control-btn:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.2);
                }
                .video-tile {
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .video-tile:hover {
                    border-color: var(--primary-color) !important;
                }
            `}</style>
        </div>
    );
};

const Video = ({ peer, isShare = false }) => {
    const ref = useRef();
    useEffect(() => {
        const handleStream = stream => {
            if (ref.current) ref.current.srcObject = stream;
        };

        // If peer already has a stream, assign it immediately
        if (peer._remoteStreams && peer._remoteStreams[0] && ref.current) {
            ref.current.srcObject = peer._remoteStreams[0];
        } else if (peer.streams && peer.streams[0] && ref.current) {
            ref.current.srcObject = peer.streams[0];
        }

        peer.on("stream", handleStream);
        return () => {
            peer.off("stream", handleStream);
        };
    }, [peer]);

    return <video playsInline autoPlay ref={ref} style={{ width: "100%", height: '100%', objectFit: isShare ? 'contain' : 'cover' }} />;
};

export default VideoCall;
