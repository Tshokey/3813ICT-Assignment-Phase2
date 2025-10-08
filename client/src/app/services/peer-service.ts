import { Injectable } from "@angular/core"
import Peer, { MediaConnection } from "peerjs"
import { BehaviorSubject, Observable } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class PeerService {
  private peer: Peer | null = null
  private myPeerIdSubject = new BehaviorSubject<string>("")
  private connectedPeersSubject = new BehaviorSubject<string[]>([])

  constructor() {}

  // Initialize peer connection
  initPeer(): Observable<string> {
    if (!this.peer) {
      // Generate a unique peer ID
      const peerId = this.generatePeerId()

      // Connect to PeerServer
      this.peer = new Peer(peerId, {
        host: "localhost",
        port: 3000,
        path: "/peerjs",
        secure: false, // Set to true if using HTTPS
        debug: 3,
      })

      this.peer.on("open", (id: string) => {
        console.log("[v0] My peer ID is:", id)
        this.myPeerIdSubject.next(id) //update current peer ID
      })

      this.peer.on("error", (error: Error) => {
        console.error("[v0] Peer error:", error)
      })

      this.peer.on("disconnected", () => {
        console.log("[v0] Peer disconnected")
      })

      this.peer.on("close", () => {
        console.log("[v0] Peer connection closed")
      })
    }

    return this.myPeerIdSubject.asObservable()
  }

  // Generate a unique peer ID
  private generatePeerId(): string {
    return `peer-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
  }

  // Get my peer ID
  getMyPeerId(): Observable<string> {
    return this.myPeerIdSubject.asObservable() //other parts of app can subs it
  }

  // Get current peer ID value
  getCurrentPeerId(): string {
    return this.myPeerIdSubject.value
  }

  // Call a peer with video stream
  call(peerId: string, stream: MediaStream): MediaConnection | null {
    if (!this.peer) {
      console.error("[v0] Peer not initialized")
      return null
    }

    console.log("[v0] Calling peer:", peerId)
    const call = this.peer.call(peerId, stream)
    return call
  }

  // Listen for incoming calls
  onCall(callback: (call: MediaConnection) => void): void {
    if (!this.peer) {
      console.error("[v0] Peer not initialized")
      return
    }

    this.peer.on("call", callback)
  }

  // Destroy peer connection
  destroy(): void {
    if (this.peer) {
      this.peer.destroy()
      this.peer = null
      this.myPeerIdSubject.next("")
    }
  }

  // Get connected peers
  getConnectedPeers(): Observable<string[]> {
    return this.connectedPeersSubject.asObservable()
  }

  // Add a connected peer
  addConnectedPeer(peerId: string): void {
    const currentPeers = this.connectedPeersSubject.value
    if (!currentPeers.includes(peerId)) {
      this.connectedPeersSubject.next([...currentPeers, peerId])
    }
  }

  // Remove a connected peer
  removeConnectedPeer(peerId: string): void {
    const currentPeers = this.connectedPeersSubject.value
    this.connectedPeersSubject.next(currentPeers.filter((id) => id !== peerId))
  }
}
