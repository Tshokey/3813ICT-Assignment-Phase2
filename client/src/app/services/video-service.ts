import { Injectable } from "@angular/core"
import { io, Socket } from "socket.io-client"
import { Observable, Subject } from "rxjs"

export interface PeerInfo {
  peerId: string
  username: string
}

@Injectable({
  providedIn: "root",
})
export class VideoService {
  private socket: Socket
  private peerListSubject = new Subject<PeerInfo[]>()
  private newPeerSubject = new Subject<PeerInfo>()
  private peerLeftSubject = new Subject<string>()

  constructor() {
    this.socket = io("https://localhost:3000", {
      autoConnect: false,
      reconnection: true,
    })

    this.setupSocketListeners()
  }

  private setupSocketListeners(): void {
    this.socket.on("connect", () => {
      console.log("[v0] Video socket connected:", this.socket.id)
    })

    this.socket.on("disconnect", () => {
      console.log("[v0] Video socket disconnected")
    })

    // Listen for peer list updates
    this.socket.on("peer-list", (peers: PeerInfo[]) => {
      console.log("[v0] Received peer list:", peers)
      this.peerListSubject.next(peers)
    })

    // Listen for new peer joining
    this.socket.on("new-peer", (peer: PeerInfo) => {
      console.log("[v0] New peer joined:", peer)
      this.newPeerSubject.next(peer)
    })

    // Listen for peer leaving
    this.socket.on("peer-left", (peerId: string) => {
      console.log("[v0] Peer left:", peerId)
      this.peerLeftSubject.next(peerId)
    })
  }

  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect()
    }
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect()
    }
  }

  // Register peer ID with socket
  registerPeer(peerId: string, username: string): void {
    console.log("[v0] Registering peer:", { peerId, username })
    this.socket.emit("register-peer", { peerId, username })
  }

  // Unregister peer ID
  unregisterPeer(peerId: string): void {
    console.log("[v0] Unregistering peer:", peerId)
    this.socket.emit("unregister-peer", peerId)
  }

  // Get peer list updates
  getPeerList(): Observable<PeerInfo[]> {
    return this.peerListSubject.asObservable()
  }

  // Get new peer notifications
  getNewPeer(): Observable<PeerInfo> {
    return this.newPeerSubject.asObservable()
  }

  // Get peer left notifications
  getPeerLeft(): Observable<string> {
    return this.peerLeftSubject.asObservable()
  }
}
