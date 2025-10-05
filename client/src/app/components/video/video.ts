import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { PeerService } from "../../services/peer-service"
import { VideoService, PeerInfo } from "../../services/video-service" 
import { AuthService } from "../../services/auth-service"

interface VideoStream {
  peerId: string
  username: string
  stream: MediaStream
  element?: HTMLVideoElement
}

@Component({
  selector: "app-video",
  imports: [CommonModule],
  templateUrl: "./video.html",
  styleUrls: ["./video.css"],
})
export class Video implements OnInit, OnDestroy {
  @ViewChild("myVideo", { static: false }) myVideoRef!: ElementRef<HTMLVideoElement>

  private peerService = inject(PeerService)
  private videoSocketService = inject(VideoService)
  private authService = inject(AuthService)

  myPeerId = ""
  myStream: MediaStream | null = null
  availablePeers: PeerInfo[] = []
  videoStreams: VideoStream[] = []
  isVideoEnabled = true
  isAudioEnabled = true
  isScreenSharing = false

  ngOnInit(): void {
    console.log("[v0] Video component initialized")

    // Initialize peer connection
    this.peerService.initPeer().subscribe((peerId) => {
      if (peerId) {
        this.myPeerId = peerId
        const currentUser = this.authService.currentUser()
        const username = currentUser?.username || "Anonymous"

        // Register peer with socket
        this.videoSocketService.connect()
        this.videoSocketService.registerPeer(peerId, username)
      }
    })

    // Listen for peer list updates
    this.videoSocketService.getPeerList().subscribe((peers) => {
      this.availablePeers = peers.filter((peer) => peer.peerId !== this.myPeerId)
    })

    // Listen for new peers
    this.videoSocketService.getNewPeer().subscribe((peer) => {
      if (peer.peerId !== this.myPeerId) {
        this.availablePeers.push(peer)
      }
    })

    // Listen for peers leaving
    this.videoSocketService.getPeerLeft().subscribe((peerId) => {
      this.availablePeers = this.availablePeers.filter((p) => p.peerId !== peerId)
      this.removeVideoStream(peerId)
    })

    // Listen for incoming calls
    this.peerService.onCall((call) => {
      console.log("[v0] Receiving call from:", call.peer)

      if (this.myStream) {
        // Answer the call with our stream
        call.answer(this.myStream)

        // Listen for the remote stream
        call.on("stream", (remoteStream: MediaStream) => {
          console.log("[v0] Received remote stream from:", call.peer)
          this.addVideoStream(call.peer, "Remote User", remoteStream)
        })

        call.on("close", () => {
          console.log("[v0] Call closed with:", call.peer)
          this.removeVideoStream(call.peer)
        })
      }
    })

    // Start with camera by default
    this.startCamera()
  }

  ngOnDestroy(): void {
    console.log("[v0] Video component destroyed")

    // Stop all streams
    if (this.myStream) {
      this.myStream.getTracks().forEach((track) => track.stop())
    }

    this.videoStreams.forEach((vs) => {
      vs.stream.getTracks().forEach((track) => track.stop())
    })

    // Unregister peer
    if (this.myPeerId) {
      this.videoSocketService.unregisterPeer(this.myPeerId)
    }

    this.videoSocketService.disconnect()
    this.peerService.destroy()
  }

  // Start camera stream
  async startCamera(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      })

      this.myStream = stream
      this.isScreenSharing = false

      // Display my video
      if (this.myVideoRef) {
        this.myVideoRef.nativeElement.srcObject = stream
      }

      console.log("[v0] Camera started successfully")
    } catch (error) {
      console.error("[v0] Error accessing camera:", error)
      alert("Could not access camera. Please check permissions.")
    }
  }

  // Start screen sharing
  async startScreenShare(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080 },
        audio: false,
      })

      // Stop previous stream
      if (this.myStream) {
        this.myStream.getTracks().forEach((track) => track.stop())
      }

      this.myStream = stream
      this.isScreenSharing = true

      // Display my screen
      if (this.myVideoRef) {
        this.myVideoRef.nativeElement.srcObject = stream
      }

      // Listen for screen share stop
      stream.getVideoTracks()[0].onended = () => {
        console.log("[v0] Screen sharing stopped")
        this.startCamera()
      }

      console.log("[v0] Screen sharing started successfully")
    } catch (error) {
      console.error("[v0] Error accessing screen:", error)
      alert("Could not access screen. Please check permissions.")
    }
  }

  // Toggle video
  toggleVideo(): void {
    if (this.myStream) {
      const videoTrack = this.myStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        this.isVideoEnabled = videoTrack.enabled
      }
    }
  }

  // Toggle audio
  toggleAudio(): void {
    if (this.myStream) {
      const audioTrack = this.myStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        this.isAudioEnabled = audioTrack.enabled
      }
    }
  }

  // Call a peer
  callPeer(peer: PeerInfo): void {
    if (!this.myStream) {
      alert("Please start your camera first")
      return
    }

    console.log("[v0] Calling peer:", peer)
    const call = this.peerService.call(peer.peerId, this.myStream)

    if (call) {
      // Listen for the remote stream
      call.on("stream", (remoteStream: MediaStream) => {
        console.log("[v0] Received remote stream from:", peer.peerId)
        this.addVideoStream(peer.peerId, peer.username, remoteStream)
      })

      call.on("close", () => {
        console.log("[v0] Call closed with:", peer.peerId)
        this.removeVideoStream(peer.peerId)
      })

      call.on("error", (error: Error) => {
        console.error("[v0] Call error:", error)
        this.removeVideoStream(peer.peerId)
      })
    }
  }

  // Add a video stream to the list
  private addVideoStream(peerId: string, username: string, stream: MediaStream): void {
    // Check if stream already exists
    const existingStream = this.videoStreams.find((vs) => vs.peerId === peerId)
    if (existingStream) {
      console.log("[v0] Stream already exists for peer:", peerId)
      return
    }

    this.videoStreams.push({
      peerId,
      username,
      stream,
    })

    console.log("[v0] Added video stream for:", username)
  }

  // Remove a video stream
  private removeVideoStream(peerId: string): void {
    const index = this.videoStreams.findIndex((vs) => vs.peerId === peerId)
    if (index !== -1) {
      const videoStream = this.videoStreams[index]
      videoStream.stream.getTracks().forEach((track) => track.stop())
      this.videoStreams.splice(index, 1)
      console.log("[v0] Removed video stream for peer:", peerId)
    }
  }

  // Track by function for ngFor
  trackByPeerId(index: number, peer: PeerInfo): string {
    return peer.peerId
  }

  trackByStreamPeerId(index: number, stream: VideoStream): string {
    return stream.peerId
  }
}
