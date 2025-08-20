// WebRTC Video Calling for Emergency Consultations
export interface VideoCallConfig {
  video: boolean;
  audio: boolean;
  screen?: boolean;
}

export interface CallParticipant {
  id: string;
  name: string;
  role: 'patient' | 'family' | 'responder' | 'doctor';
  stream?: MediaStream;
  connected: boolean;
}

export interface CallSession {
  id: string;
  type: 'emergency' | 'consultation' | 'family_check';
  participants: CallParticipant[];
  startTime: Date;
  endTime?: Date;
  status: 'connecting' | 'active' | 'ended' | 'failed';
}

class VideoCallManager {
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private currentCall: CallSession | null = null;
  private onCallCallback?: (call: CallSession) => void;
  private onStreamCallback?: (participantId: string, stream: MediaStream) => void;
  private onErrorCallback?: (error: string) => void;

  // WebRTC configuration
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // In production, you would add TURN servers for NAT traversal
    ]
  };

  // Check if WebRTC is supported
  isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    );
  }

  // Initialize local media stream
  async initializeMedia(config: VideoCallConfig): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('WebRTC is not supported in this browser');
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: config.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: config.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error: any) {
      let errorMessage = 'Failed to access camera/microphone';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone access denied. Please allow permissions.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is already in use.';
      }
      
      this.onErrorCallback?.(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Start emergency video call
  async startEmergencyCall(patientId: string, responderId: string): Promise<CallSession> {
    try {
      const callSession: CallSession = {
        id: this.generateCallId(),
        type: 'emergency',
        participants: [
          {
            id: patientId,
            name: 'Patient',
            role: 'patient',
            connected: false
          },
          {
            id: responderId,
            name: 'Emergency Responder',
            role: 'responder',
            connected: false
          }
        ],
        startTime: new Date(),
        status: 'connecting'
      };

      this.currentCall = callSession;

      // Initialize media
      await this.initializeMedia({ video: true, audio: true });

      // Set up peer connection
      await this.setupPeerConnection(responderId);

      callSession.status = 'active';
      this.onCallCallback?.(callSession);

      return callSession;
    } catch (error) {
      console.error('Error starting emergency call:', error);
      throw error;
    }
  }

  // Join existing call
  async joinCall(callId: string, participantId: string): Promise<void> {
    try {
      if (!this.currentCall || this.currentCall.id !== callId) {
        throw new Error('Call not found');
      }

      // Initialize media
      await this.initializeMedia({ video: true, audio: true });

      // Update participant status
      const participant = this.currentCall.participants.find(p => p.id === participantId);
      if (participant) {
        participant.connected = true;
        participant.stream = this.localStream || undefined;
      }

      // Set up peer connections with other participants
      for (const otherParticipant of this.currentCall.participants) {
        if (otherParticipant.id !== participantId && otherParticipant.connected) {
          await this.setupPeerConnection(otherParticipant.id);
        }
      }

      this.onCallCallback?.(this.currentCall);
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  }

  // Set up peer connection with another participant
  private async setupPeerConnection(participantId: string): Promise<void> {
    const peerConnection = new RTCPeerConnection(this.rtcConfig);
    this.peerConnections.set(participantId, peerConnection);

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      this.remoteStreams.set(participantId, remoteStream);
      this.onStreamCallback?.(participantId, remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this candidate to the remote peer
        this.sendSignalingMessage(participantId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${participantId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'failed') {
        this.onErrorCallback?.(`Connection failed with participant ${participantId}`);
      }
    };
  }

  // Create and send offer
  async createOffer(participantId: string): Promise<void> {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send offer to remote peer
      this.sendSignalingMessage(participantId, {
        type: 'offer',
        offer: offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  // Handle received offer
  async handleOffer(participantId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send answer to remote peer
      this.sendSignalingMessage(participantId, {
        type: 'answer',
        answer: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  // Handle received answer
  async handleAnswer(participantId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    try {
      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  // Handle received ICE candidate
  async handleIceCandidate(participantId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      throw error;
    }
  }

  // Toggle video
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  // Toggle audio
  toggleAudio(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  // End call
  async endCall(): Promise<void> {
    try {
      // Close all peer connections
      this.peerConnections.forEach(pc => pc.close());
      this.peerConnections.clear();

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Clear remote streams
      this.remoteStreams.clear();

      // Update call status
      if (this.currentCall) {
        this.currentCall.status = 'ended';
        this.currentCall.endTime = new Date();
        this.onCallCallback?.(this.currentCall);
        this.currentCall = null;
      }
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  // Set callbacks
  setCallCallback(callback: (call: CallSession) => void): void {
    this.onCallCallback = callback;
  }

  setStreamCallback(callback: (participantId: string, stream: MediaStream) => void): void {
    this.onStreamCallback = callback;
  }

  setErrorCallback(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  // Get current call
  getCurrentCall(): CallSession | null {
    return this.currentCall;
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get remote stream
  getRemoteStream(participantId: string): MediaStream | null {
    return this.remoteStreams.get(participantId) || null;
  }

  // Private helper methods
  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendSignalingMessage(participantId: string, message: any): void {
    // In a real implementation, this would send the message through a signaling server
    // For now, we'll just log it
    console.log(`Sending signaling message to ${participantId}:`, message);
  }
}

// Export singleton instance
export const videoCallManager = new VideoCallManager();
